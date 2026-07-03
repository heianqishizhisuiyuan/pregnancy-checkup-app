import rateLimit from 'express-rate-limit';

const rateLimitResponse = (_req, res) => {
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试',
    },
  });
};

/**
 * 测试环境默认跳过限流，避免集成测试被误伤。
 * 设置 RATE_LIMIT_TEST=1 可启用限流用于专项测试。
 */
export const createRateLimiter = (options) => {
  if (process.env.NODE_ENV === 'test' && process.env.RATE_LIMIT_TEST !== '1') {
    return (_req, _res, next) => next();
  }

  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitResponse,
    ...options,
  });
};

/** 登录 / 注册：15 分钟内最多 20 次 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

/** 附件上传：1 小时内最多 60 次 */
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 60,
});
