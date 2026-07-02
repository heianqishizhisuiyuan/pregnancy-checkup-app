import express from 'express';
import { getFamily, updateFamily } from '../controllers/familyController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// 所有家庭路由都需要认证
router.use(authenticate);

/**
 * @route   GET /api/family
 * @desc    获取当前用户的家庭信息
 * @access  Private
 */
router.get('/', getFamily);

/**
 * @route   PUT /api/family
 * @desc    更新家庭信息
 * @access  Private (Owner only)
 */
router.put('/', updateFamily);

export default router;
