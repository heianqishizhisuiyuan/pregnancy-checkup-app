import Record from '../models/Record.js';

/**
 * 获取当前家庭的所有记录
 * GET /api/records
 */
export const getRecords = async (req, res, next) => {
  try {
    const records = await Record.find({ familyId: req.user.familyId })
      .sort({ checkupDate: -1 })
      .populate('createdBy', 'username profile.nickname');

    res.json({
      success: true,
      data: records,
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
      data: record,
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
    const record = await Record.findOneAndDelete({
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

    res.json({
      success: true,
      data: { message: '删除成功' },
    });
  } catch (error) {
    next(error);
  }
};
