import Family from '../models/Family.js';
import User from '../models/User.js';
import { ensureFamilyInviteCode, generateInviteCode } from '../utils/inviteCode.js';

/**
 * 获取当前用户的家庭信息
 * GET /api/family
 */
export const getFamily = async (req, res, next) => {
  try {
    const family = await Family.findById(req.user.familyId)
      .populate('members.userId', 'username email profile.nickname');

    if (!family) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '家庭不存在',
        },
      });
    }

    await ensureFamilyInviteCode(family);

    res.json({
      success: true,
      data: family,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新家庭信息
 * PUT /api/family
 */
export const updateFamily = async (req, res, next) => {
  try {
    const family = await Family.findById(req.user.familyId);

    if (!family) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '家庭不存在',
        },
      });
    }

    // 只允许 owner 更新家庭信息
    if (family.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '只有创建者可以更新家庭信息',
        },
      });
    }

    // 更新字段
    if (req.body.name) family.name = req.body.name;
    if (req.body.pregnancyInfo) {
      family.pregnancyInfo = {
        ...family.pregnancyInfo,
        ...req.body.pregnancyInfo,
      };
    }

    await family.save();

    res.json({
      success: true,
      data: family,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取家庭邀请码
 * GET /api/family/invite
 */
export const getInviteCode = async (req, res, next) => {
  try {
    const family = await Family.findById(req.user.familyId);

    if (!family) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '家庭不存在',
        },
      });
    }

    if (family.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '只有主账号可以查看邀请码',
        },
      });
    }

    const inviteCode = await ensureFamilyInviteCode(family);

    res.json({
      success: true,
      data: { inviteCode },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 重新生成邀请码
 * POST /api/family/invite/regenerate
 */
export const regenerateInviteCode = async (req, res, next) => {
  try {
    const family = await Family.findById(req.user.familyId);

    if (!family) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '家庭不存在',
        },
      });
    }

    if (family.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '只有主账号可以重新生成邀请码',
        },
      });
    }

    let code;
    let attempts = 0;

    do {
      code = generateInviteCode();
      const exists = await Family.findOne({
        inviteCode: code,
        _id: { $ne: family._id },
      });
      if (!exists) break;
      attempts += 1;
    } while (attempts < 10);

    family.inviteCode = code;
    await family.save();

    res.json({
      success: true,
      data: { inviteCode: code },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取家庭成员列表
 * GET /api/family/members
 */
export const getMembers = async (req, res, next) => {
  try {
    const family = await Family.findById(req.user.familyId)
      .populate('members.userId', 'username email profile.nickname role');

    if (!family) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '家庭不存在',
        },
      });
    }

    res.json({
      success: true,
      data: family.members,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 移除家庭成员
 * DELETE /api/family/members/:userId
 */
export const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const family = await Family.findById(req.user.familyId);

    if (!family) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '家庭不存在' },
      });
    }

    if (family.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: '只有主账号可以移除成员' },
      });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: '不能移除自己' },
      });
    }

    const member = family.members.find((m) => m.userId.toString() === userId);
    if (!member) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '成员不存在' },
      });
    }

    if (member.role === 'owner') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: '不能移除主账号' },
      });
    }

    family.members = family.members.filter((m) => m.userId.toString() !== userId);
    await family.save();
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      data: { removedUserId: userId },
    });
  } catch (error) {
    next(error);
  }
};
