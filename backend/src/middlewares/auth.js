import { verifyToken, generateToken } from '../utils/jwt.js';
import User from '../models/User.js';

/**
 * JWT 认证中间件
 * 验证请求头中的 Token,将用户信息附加到 req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    // 从请求头获取 token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未提供认证 Token',
        },
      });
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    // 验证 token
    const decoded = verifyToken(token);

    // 查询用户
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '用户不存在',
        },
      });
    }

    // 将用户信息附加到请求对象
    req.user = user;

    // 滑动续期：每次有效请求签发新 token
    const newToken = generateToken({ userId: user._id });
    res.setHeader('X-New-Token', newToken);

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error.message || 'Token 验证失败',
      },
    });
  }
};
