/**
 * 为指定用户插入示例产检记录（含网络图片附件）
 * 用法: node scripts/seedRecords.js [username] [--force] [--count=50]
 * 示例: node scripts/seedRecords.js AA --force --count=50
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import User from '../src/models/User.js';
import Family from '../src/models/Family.js';
import Record from '../src/models/Record.js';
import { deleteAttachmentFiles } from '../src/utils/fileCleanup.js';
import { ATTACHMENT_CATEGORIES } from '../src/config/multer.js';

dotenv.config();

const DEFAULT_COUNT = 50;
const HOSPITALS = ['市妇幼保健院', '市第一人民医院', '省妇产医院', '区中心医院'];
const DOCTORS = ['张医生', '李医生', '王医生', '陈医生', '刘医生'];
const REPORT_NAMES = {
  B超: 'B超报告.jpg',
  血常规: '血常规报告.jpg',
  尿常规: '尿常规报告.jpg',
  唐筛: '唐筛报告.jpg',
  糖耐: '糖耐报告.jpg',
  肝功能: '肝功能报告.jpg',
  肾功能: '肾功能报告.jpg',
  NT检查: 'NT检查报告.jpg',
  四维彩超: '四维彩超报告.jpg',
  其他: '产检报告.jpg',
};

const NOTE_TEMPLATES = [
  '常规产检，各项指标正常。',
  '胎儿发育符合孕周，建议均衡饮食。',
  '血压、体重在正常范围，继续观察。',
  '胎心率稳定，胎动良好。',
  '化验结果未见明显异常。',
  '医生提醒注意补铁和钙剂。',
  '下次产检请空腹前来。',
];

/** 根据末次月经推算某孕周的产检日期 */
function dateForGestationalWeek(lastPeriod, week, day = 0) {
  const d = new Date(lastPeriod);
  d.setDate(d.getDate() + week * 7 + day);
  return d;
}

function pick(arr, index) {
  return arr[index % arr.length];
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** 生成指定数量的产检记录（孕 8～40 周均匀分布） */
function buildSampleRecords(familyId, userId, lastPeriod, count) {
  const records = [];

  for (let i = 0; i < count; i += 1) {
    const week = Math.min(40, 8 + Math.round((i * 32) / Math.max(count - 1, 1)));
    const day = i % 7 === 0 ? 0 : randomInt(0, 6);
    const hasFundal = week >= 16;

    records.push({
      familyId,
      createdBy: userId,
      checkupDate: dateForGestationalWeek(lastPeriod, week, day),
      gestationalWeek: week,
      gestationalDay: day,
      hospital: pick(HOSPITALS, i),
      doctor: pick(DOCTORS, i + week),
      vitals: {
        weight: Math.round((52 + week * 0.35 + (i % 5) * 0.2) * 10) / 10,
        bloodPressure: {
          systolic: 108 + Math.floor(week / 4) + (i % 3),
          diastolic: 68 + Math.floor(week / 6) + (i % 2),
        },
        ...(hasFundal
          ? {
              fundalHeight: week + (i % 3) - 1,
              abdominalCircumference: 70 + week + (i % 4),
            }
          : {}),
        fetalHeartRate: 148 - Math.floor(week / 8) + (i % 5),
      },
      notes: `${week}+${day} 周 ${pick(NOTE_TEMPLATES, i)}`,
      attachments: [],
    });
  }

  return records;
}

/** 为记录挑选 1～2 个附件分类 */
function pickAttachmentCategories(record, index) {
  const week = record.gestationalWeek;
  const categories = [];

  if (week === 12) categories.push('NT检查');
  else if (week === 20) categories.push('四维彩超');
  else if (week === 24) categories.push('糖耐');
  else if (index % 5 === 0) categories.push('B超');
  else if (index % 7 === 0) categories.push('血常规');
  else categories.push(pick(ATTACHMENT_CATEGORIES, index));

  // 约 30% 的记录再加一张报告
  if (index % 3 === 0 && categories.length < 2) {
    categories.push(pick(['尿常规', '肝功能', '其他'], index + week));
  }

  return categories.slice(0, 2);
}

/** 从网络下载随机图片（模拟产检报告扫描件） */
async function downloadReportImage(seed) {
  const sources = [
    `https://picsum.photos/seed/${encodeURIComponent(seed)}/900/1200`,
    `https://picsum.photos/900/1200?random=${encodeURIComponent(seed)}`,
  ];

  let lastError;
  for (const url of sources) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const res = await fetch(url, { redirect: 'follow' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length < 1024) throw new Error('图片过小');

        const contentType = (res.headers.get('content-type') || 'image/jpeg').split(';')[0];
        const ext = contentType.includes('png')
          ? '.png'
          : contentType.includes('webp')
            ? '.webp'
            : '.jpg';

        return { buffer, contentType, ext };
      } catch (err) {
        lastError = err;
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }
  }

  throw new Error(`图片下载失败: ${lastError?.message || '未知错误'}`);
}

/** 保存附件到 uploads 目录并返回数据库字段 */
async function createAttachment(record, familyId, userId, category, attachmentIndex) {
  const seed = `${record._id}-${category}-${attachmentIndex}`;
  const { buffer, contentType, ext } = await downloadReportImage(seed);

  const storedName = `${uuidv4()}${ext}`;
  const uploadDir = path.join(
    'uploads',
    'families',
    familyId.toString(),
    'records',
    record._id.toString()
  );
  await fs.mkdir(uploadDir, { recursive: true });

  const absolutePath = path.join(uploadDir, storedName);
  await fs.writeFile(absolutePath, buffer);

  return {
    filename: REPORT_NAMES[category] || '产检报告.jpg',
    storedName,
    path: absolutePath.replace(/\\/g, '/'),
    size: buffer.length,
    mimetype: contentType,
    category,
    tags: [],
    uploadedAt: record.checkupDate,
    uploadedBy: userId,
  };
}

async function clearFamilyRecords(familyId) {
  const oldRecords = await Record.find({ familyId });
  for (const record of oldRecords) {
    await deleteAttachmentFiles(record.attachments);
  }
  await Record.deleteMany({ familyId });
  return oldRecords.length;
}

function parseCountArg(args) {
  const countArg = args.find((a) => a.startsWith('--count='));
  if (!countArg) return DEFAULT_COUNT;
  const n = parseInt(countArg.split('=')[1], 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_COUNT;
}

async function seedRecords() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const count = parseCountArg(args);
  const username = (args.find((a) => !a.startsWith('--')) || 'AA').trim();

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB 连接成功');

    const user = await User.findOne({
      username: new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    });
    if (!user) {
      console.error(`用户不存在: ${username}`);
      process.exit(1);
    }

    const family = await Family.findById(user.familyId);
    if (!family) {
      console.error('未找到关联家庭');
      process.exit(1);
    }

    if (!family.pregnancyInfo?.lastPeriod || !family.pregnancyInfo?.dueDate) {
      const lastPeriod = new Date('2025-11-15');
      const dueDate = new Date(lastPeriod);
      dueDate.setDate(dueDate.getDate() + 280);

      family.pregnancyInfo = { lastPeriod, dueDate };
      await family.save();
      console.log('已补全家庭孕期信息（末次月经 / 预产期）');
    }

    const lastPeriod = family.pregnancyInfo.lastPeriod;
    const existingCount = await Record.countDocuments({ familyId: family._id });

    if (existingCount > 0 && !force) {
      console.log(`该家庭已有 ${existingCount} 条记录，跳过插入（避免重复）`);
      console.log(`如需重新生成，请运行: node scripts/seedRecords.js ${username} --force --count=${count}`);
      process.exit(0);
    }

    if (existingCount > 0 && force) {
      const removed = await clearFamilyRecords(family._id);
      console.log(`已清除 ${removed} 条旧记录及附件`);
    }

    console.log(`正在生成 ${count} 条产检记录…`);
    const recordPayloads = buildSampleRecords(family._id, user._id, lastPeriod, count);
    const inserted = await Record.insertMany(recordPayloads);

    console.log('正在下载网络图片作为产检报告附件（可能需要 1～2 分钟）…');
    let attachmentTotal = 0;

    for (let i = 0; i < inserted.length; i += 1) {
      const record = inserted[i];
      const categories = pickAttachmentCategories(record, i);
      const attachments = [];

      for (let j = 0; j < categories.length; j += 1) {
        try {
          const attachment = await createAttachment(record, family._id, user._id, categories[j], j);
          attachments.push(attachment);
          attachmentTotal += 1;
        } catch (err) {
          console.warn(`  记录 ${i + 1}/${count} 附件下载失败: ${err.message}`);
        }
      }

      if (attachments.length > 0) {
        record.attachments = attachments;
        await record.save();
      }

      if ((i + 1) % 10 === 0 || i === inserted.length - 1) {
        console.log(`  进度: ${i + 1}/${count} 条记录，${attachmentTotal} 张附件`);
      }
    }

    console.log(`\n✅ 已为「${username}」插入 ${inserted.length} 条示例产检记录`);
    console.log(`   附件: ${attachmentTotal} 张（来自网络随机图片）`);
    console.log('家庭:', family.name);
    console.log('末次月经:', lastPeriod.toISOString().slice(0, 10));
    console.log('预产期:', family.pregnancyInfo.dueDate.toISOString().slice(0, 10));

    process.exit(0);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

seedRecords();
