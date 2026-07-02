import jwt from 'jsonwebtoken';

/**
 * 生成 JWT Token
 * @param {Object} payload - Token 载荷
 * @returns {String} JWT Token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * 验证 JWT Token
 * @param {String} token - JWT Token
 * @returns {Object} 解析后的载荷
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token 无效或已过期');
  }
};
