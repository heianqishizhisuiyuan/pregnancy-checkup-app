import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import { normalizeUploadedFilename } from '../utils/decodeFilename.js';

// 文件存储配置
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { familyId } = req.user;
    const { recordId } = req.params;
    const uploadDir = path.join('uploads', 'families', familyId.toString(), 'records', recordId);

    // 确保目录存在
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const originalName = normalizeUploadedFilename(file.originalname);
    const ext = path.extname(originalName);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 jpg、png、webp 格式的图片'), false);
  }
};

// 创建 multer 实例
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,  // 10MB
    files: 10                     // 单次最多10个文件
  }
});

// 附件分类常量
export const ATTACHMENT_CATEGORIES = [
  'B超',
  '血常规',
  '尿常规',
  '唐筛',
  '糖耐',
  '肝功能',
  '肾功能',
  'NT检查',
  '四维彩超',
  '其他'
];
