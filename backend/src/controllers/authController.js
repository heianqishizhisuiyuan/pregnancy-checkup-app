import User from '../models/User.js';
import Family from '../models/Family.js';
import { generateToken } from '../utils/jwt.js';
import { generateInviteCode } from '../utils/inviteCode.js';

/**
 * 用户注册
 * POST /api/auth/register
 * - 无 inviteCode：创建新家庭（owner）
 * - 有 inviteCode：加入已有家庭（family）
 */
export const register = async (req, res, next) => {
  try {
    const { username, email, password, nickname, lastPeriod, dueDate, inviteCode } = req.body;

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

    // 通过邀请码加入家庭
    if (inviteCode) {
      const normalizedCode = inviteCode.trim().toUpperCase();
      const family = await Family.findOne({ inviteCode: normalizedCode });

      if (!family) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INVITE_CODE',
            message: '邀请码无效，请检查后重试',
          },
        });
      }

      const user = new User({
        username,
        email,
        password,
        role: 'family',
        familyId: family._id,
        profile: {
          nickname: nickname || username,
        },
      });

      await user.save();

      family.members.push({
        userId: user._id,
        role: 'family',
      });
      await family.save();

      const token = generateToken({ userId: user._id });

      return res.status(201).json({
        success: true,
        data: {
          token,
          user: user.toJSON(),
        },
      });
    }

    // 创建新家庭
    const family = new Family({
      name: `${username}的家庭`,
      inviteCode: generateInviteCode(),
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

/**
 * 更新个人资料（昵称）
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { nickname } = req.body;
    const user = req.user;

    if (!nickname || !nickname.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '昵称不能为空',
        },
      });
    }

    user.profile = user.profile || {};
    user.profile.nickname = nickname.trim();
    await user.save();

    res.json({
      success: true,
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 修改密码
 * PUT /api/auth/password
 */
export const updatePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: '原密码不正确',
        },
      });
    }

    user.password = newPassword;
    await user.save();

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
