/**
 * 权限检查中间件
 * 检查用户是否为 owner 角色
 */
export const requireOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '未认证',
      },
    });
  }

  if (req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '权限不足，需要主账号权限',
      },
    });
  }

  next();
};
