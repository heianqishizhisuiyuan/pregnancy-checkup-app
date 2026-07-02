import Family from '../models/Family.js';

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
