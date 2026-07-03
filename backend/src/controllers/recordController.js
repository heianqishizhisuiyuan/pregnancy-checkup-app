import Record from '../models/Record.js';
import { ATTACHMENT_CATEGORIES } from '../config/multer.js';
import { deleteFile, deleteAttachmentFiles, deleteRecordDir } from '../utils/fileCleanup.js';
import { normalizeUploadedFilename, normalizeRecordAttachments } from '../utils/decodeFilename.js';
import { buildRecordFilter, slimRecordForList } from '../utils/recordFilter.js';
import path from 'path';

const mapRecordsForList = (records) =>
  records.map((record) => {
    const normalized = normalizeRecordAttachments(record);
    return slimRecordForList(normalized);
  });

/**
 * 获取当前家庭的所有记录（支持筛选与分页）
 * GET /api/records?keyword=&hospital=&startDate=&endDate=&minWeek=&maxWeek=&page=&limit=
 * 传入 page 或 limit 时启用分页（默认 page=1, limit=20）；不传则返回全部（供趋势/时间轴等使用）
 */
export const getRecords = async (req, res, next) => {
  try {
    const filter = buildRecordFilter(req.user.familyId, req.query);
    const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

    const query = Record.find(filter)
      .sort({ checkupDate: -1 })
      .populate('createdBy', 'username profile.nickname');

    if (isPaginated) {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const skip = (page - 1) * limit;

      const [records, total] = await Promise.all([
        query.skip(skip).limit(limit),
        Record.countDocuments(filter),
      ]);

      return res.json({
        success: true,
        data: mapRecordsForList(records),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 0,
        },
      });
    }

    const records = await query;

    res.json({
      success: true,
      data: mapRecordsForList(records),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取单条记录
 * GET /api/records/:id
 */
export const getRecordById = async (req, res, next) => {
  try {
    const record = await Record.findOne({
      _id: req.params.id,
      familyId: req.user.familyId,
    }).populate('createdBy', 'username profile.nickname');

    if (!record) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '记录不存在',
        },
      });
    }

    res.json({
      success: true,
      data: normalizeRecordAttachments(record),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 创建新记录
 * POST /api/records
 */
export const createRecord = async (req, res, next) => {
  try {
    const recordData = {
      ...req.body,
      familyId: req.user.familyId,
      createdBy: req.user._id,
    };

    const record = new Record(recordData);
    await record.save();

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新记录
 * PUT /api/records/:id
 */
export const updateRecord = async (req, res, next) => {
  try {
    const record = await Record.findOne({
      _id: req.params.id,
      familyId: req.user.familyId,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '记录不存在',
        },
      });
    }

    // 更新字段
    Object.keys(req.body).forEach(key => {
      if (key !== 'familyId' && key !== 'createdBy') {
        record[key] = req.body[key];
      }
    });

    await record.save();

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除记录
 * DELETE /api/records/:id
 */
export const deleteRecord = async (req, res, next) => {
  try {
    const record = await Record.findOne({
      _id: req.params.id,
      familyId: req.user.familyId,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '记录不存在',
        },
      });
    }

    // 删除所有附件文件
    if (record.attachments && record.attachments.length > 0) {
      await deleteAttachmentFiles(record.attachments);

      // 删除记录目录（如果为空）
      await deleteRecordDir(req.user.familyId, req.params.id);
    }

    // 删除记录
    await record.deleteOne();

    res.json({
      success: true,
      data: { message: '删除成功' },
    });
  } catch (error) {
    next(error);
  }
};

// 上传附件
export const uploadAttachments = async (req, res) => {
  try {
    const { recordId } = req.params;

    // 查找记录
    const record = await Record.findOne({
      _id: recordId,
      familyId: req.user.familyId
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '记录不存在'
        }
      });
    }

    // 检查附件数量限制
    const currentCount = record.attachments ? record.attachments.length : 0;
    const newCount = req.files ? req.files.length : 0;

    if (currentCount + newCount > 20) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LIMIT_EXCEEDED',
          message: `附件总数不能超过 20 个（当前: ${currentCount}，尝试添加: ${newCount}）`
        }
      });
    }

    // 处理上传的文件
    const { category = '其他', tags } = req.body;
    const parsedTags = tags ? JSON.parse(tags) : [];

    const newAttachments = req.files.map(file => ({
      filename: normalizeUploadedFilename(file.originalname),
      storedName: file.filename,
      path: file.path.replace(/\\/g, '/'), // 统一使用正斜杠
      size: file.size,
      mimetype: file.mimetype,
      category,
      tags: parsedTags,
      uploadedAt: new Date(),
      uploadedBy: req.user._id
    }));

    // 添加到记录
    record.attachments.push(...newAttachments);
    await record.save();

    // 返回新上传的附件
    const uploadedAttachments = newAttachments.map((att, index) => ({
      _id: record.attachments[record.attachments.length - newAttachments.length + index]._id,
      filename: att.filename,
      url: `/${att.path}`,
      category: att.category,
      tags: att.tags,
      size: att.size,
      uploadedAt: att.uploadedAt
    }));

    res.json({
      success: true,
      data: {
        attachments: uploadedAttachments
      }
    });
  } catch (error) {
    console.error('上传附件失败:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: '上传附件失败'
      }
    });
  }
};

// 删除附件
export const deleteAttachment = async (req, res) => {
  try {
    const { recordId, attachmentId } = req.params;

    // 查找记录
    const record = await Record.findOne({
      _id: recordId,
      familyId: req.user.familyId
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '记录不存在'
        }
      });
    }

    // 查找附件
    const attachment = record.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '附件不存在'
        }
      });
    }

    // 删除物理文件
    const filePath = path.join(process.cwd(), attachment.path);
    await deleteFile(filePath);

    // 从数据库删除
    attachment.deleteOne();
    await record.save();

    res.json({
      success: true,
      data: {
        message: '附件删除成功'
      }
    });
  } catch (error) {
    console.error('删除附件失败:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: '删除附件失败'
      }
    });
  }
};

// 更新附件信息
export const updateAttachment = async (req, res) => {
  try {
    const { recordId, attachmentId } = req.params;
    const { category, tags } = req.body;

    // 查找记录
    const record = await Record.findOne({
      _id: recordId,
      familyId: req.user.familyId
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '记录不存在'
        }
      });
    }

    // 查找并更新附件
    const attachment = record.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '附件不存在'
        }
      });
    }

    if (category !== undefined) {
      attachment.category = category;
    }
    if (tags !== undefined) {
      attachment.tags = tags;
    }

    await record.save();

    res.json({
      success: true,
      data: {
        attachment: {
          _id: attachment._id,
          category: attachment.category,
          tags: attachment.tags
        }
      }
    });
  } catch (error) {
    console.error('更新附件失败:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: '更新附件失败'
      }
    });
  }
};
