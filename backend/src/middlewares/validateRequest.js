import { validationResult } from 'express-validator';

/**
 * 统一处理 express-validator 校验结果。
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const messages = errors.array().map(error => error.msg);

  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: messages.join(', '),
    },
  });
};
