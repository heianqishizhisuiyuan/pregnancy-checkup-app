import express from 'express';
import { body } from 'express-validator';
import {
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  uploadAttachments,
  deleteAttachment,
  updateAttachment,
} from '../controllers/recordController.js';
import { authenticate } from '../middlewares/auth.js';
import { requireCanEdit } from '../middlewares/roleCheck.js';
import { recordExists } from '../middlewares/recordExists.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { uploadRateLimiter } from '../middlewares/rateLimit.js';
import { upload } from '../config/multer.js';

const router = express.Router();

// 所有记录路由都需要认证
router.use(authenticate);

/**
 * @route   GET /api/records
 * @desc    获取当前家庭的所有记录
 * @access  Private
 */
router.get('/', getRecords);

/**
 * @route   GET /api/records/:id
 * @desc    获取单条记录
 * @access  Private
 */
router.get('/:id', getRecordById);

/**
 * @route   POST /api/records
 * @desc    创建新记录
 * @access  Private (Owner only)
 */
router.post(
  '/',
  requireCanEdit,
  [
    body('checkupDate').isISO8601().withMessage('请输入有效的日期'),
    body('gestationalWeek').isInt({ min: 0, max: 45 }).withMessage('孕周必须在0-45之间'),
    body('gestationalDay').isInt({ min: 0, max: 6 }).withMessage('天数必须在0-6之间'),
    body('hospital').trim().notEmpty().withMessage('医院名称不能为空'),
    body('doctor').trim().notEmpty().withMessage('医生姓名不能为空'),
  ],
  validateRequest,
  createRecord
);

/**
 * @route   PUT /api/records/:id
 * @desc    更新记录
 * @access  Private (Owner only)
 */
router.put('/:id', requireCanEdit, updateRecord);

/**
 * @route   DELETE /api/records/:id
 * @desc    删除记录
 * @access  Private (Owner only)
 */
router.delete('/:id', requireCanEdit, deleteRecord);

/**
 * @route   POST /api/records/:recordId/attachments
 * @desc    上传附件
 * @access  Private (Owner only)
 */
router.post(
  '/:recordId/attachments',
  uploadRateLimiter,
  requireCanEdit,
  recordExists,
  upload.array('files', 10),
  uploadAttachments
);

/**
 * @route   DELETE /api/records/:recordId/attachments/:attachmentId
 * @desc    删除附件
 * @access  Private (Owner only)
 */
router.delete('/:recordId/attachments/:attachmentId', requireCanEdit, deleteAttachment);

/**
 * @route   PUT /api/records/:recordId/attachments/:attachmentId
 * @desc    更新附件信息
 * @access  Private (Owner only)
 */
router.put('/:recordId/attachments/:attachmentId', requireCanEdit, updateAttachment);

export default router;
