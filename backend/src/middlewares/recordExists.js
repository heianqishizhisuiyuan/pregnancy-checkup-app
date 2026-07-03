import Record from '../models/Record.js';

export function createRecordExistsMiddleware({ findRecord = defaultFindRecord } = {}) {
  return async function recordExists(req, res, next) {
    const { recordId } = req.params;
    const familyId = req.user.familyId;

    try {
      const record = await findRecord({ recordId, familyId });
      if (!record) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '记录不存在'
          }
        });
      }

      next();
    } catch (error) {
      if (error?.name === 'CastError') {
        return res.status(500).json({
          success: false,
          error: {
            code: 'UPLOAD_FAILED',
            message: '上传附件失败'
          }
        });
      }

      next(error);
    }
  };
}

async function defaultFindRecord({ recordId, familyId }) {
  return Record.findOne({
    _id: recordId,
    familyId
  }).select('_id');
}

export const recordExists = createRecordExistsMiddleware();
