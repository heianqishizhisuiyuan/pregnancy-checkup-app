import express from 'express';
import { body } from 'express-validator';
import { register, login, getCurrentUser, updateProfile, updatePassword } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { authRateLimiter } from '../middlewares/rateLimit.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post(
  '/register',
  authRateLimiter,
  [
    body('username').trim().isLength({ min: 2, max: 50 }).withMessage('用户名必须在2-50个字符之间'),
    body('email').isEmail().withMessage('请输入有效的邮箱'),
    body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
    body('nickname').optional().trim().isLength({ max: 50 }).withMessage('昵称最多50个字符'),
    body('inviteCode').optional().trim().isLength({ min: 6, max: 12 }).withMessage('邀请码格式无效'),
  ],
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post(
  '/login',
  authRateLimiter,
  [
    body('email').isEmail().withMessage('请输入有效的邮箱'),
    body('password').notEmpty().withMessage('密码不能为空'),
  ],
  login
);

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   PUT /api/auth/profile
 * @desc    更新昵称
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  [
    body('nickname').trim().isLength({ min: 1, max: 50 }).withMessage('昵称必须在1-50个字符之间'),
  ],
  validateRequest,
  updateProfile
);

/**
 * @route   PUT /api/auth/password
 * @desc    修改密码
 * @access  Private
 */
router.put(
  '/password',
  authenticate,
  [
    body('oldPassword').notEmpty().withMessage('请输入原密码'),
    body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6个字符'),
  ],
  validateRequest,
  updatePassword
);

export default router;
