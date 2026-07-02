import User from '../models/User.js';
import Family from '../models/Family.js';
import { generateToken } from '../utils/jwt.js';

/**
 * 用户注册
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { username, email, password, nickname, lastPeriod, dueDate } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: '用户名或邮箱已存在',
        },
      });
    }

    // 创建家庭
    const family = new Family({
      name: `${username}的家庭`,
      pregnancyInfo: {
        lastPeriod: lastPeriod ? new Date(lastPeriod) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
    });

    // 创建用户
    const user = new User({
      username,
      email,
      password,
      role: 'owner',
      familyId: family._id,
      profile: {
        nickname: nickname || username,
      },
    });

    // 设置家庭的创建者
    family.ownerId = user._id;
    family.members = [
      {
        userId: user._id,
        role: 'owner',
      },
    ];

    // 保存
    await family.save();
    await user.save();

    // 生成 token
    const token = generateToken({ userId: user._id });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 用户登录
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '邮箱或密码错误',
        },
      });
    }

    // 验证密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '邮箱或密码错误',
        },
      });
    }

    // 生成 token
    const token = generateToken({ userId: user._id });

    res.json({
      success: true,
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};
