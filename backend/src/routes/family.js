import express from 'express';
import {
  getFamily,
  updateFamily,
  getInviteCode,
  regenerateInviteCode,
  getMembers,
  removeMember,
  updateMemberPermissions,
} from '../controllers/familyController.js';
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
 * @route   GET /api/family/invite
 * @desc    获取家庭邀请码
 * @access  Private (Owner only)
 */
router.get('/invite', getInviteCode);

/**
 * @route   POST /api/family/invite/regenerate
 * @desc    重新生成邀请码
 * @access  Private (Owner only)
 */
router.post('/invite/regenerate', regenerateInviteCode);

/**
 * @route   GET /api/family/members
 * @desc    获取家庭成员列表
 * @access  Private
 */
router.get('/members', getMembers);

/**
 * @route   PUT /api/family
 * @desc    更新家庭信息
 * @access  Private (Owner only)
 */
router.put('/', updateFamily);

/**
 * @route   PUT /api/family/members/:userId/permissions
 * @desc    更新家庭成员编辑权限
 * @access  Private (Owner only)
 */
router.put('/members/:userId/permissions', updateMemberPermissions);

/**
 * @route   DELETE /api/family/members/:userId
 * @desc    移除家庭成员
 * @access  Private (Owner only)
 */
router.delete('/members/:userId', removeMember);

export default router;
