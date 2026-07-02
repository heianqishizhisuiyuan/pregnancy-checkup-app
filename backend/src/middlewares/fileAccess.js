/**
 * 文件访问权限中间件
 * 验证用户是否有权访问指定家庭的文件
 */
export const checkFileAccess = async (req, res, next) => {
  try {
    // 从 URL 路径中提取 familyId
    const pathParts = req.path.split('/');
    const familyIdIndex = pathParts.indexOf('families') + 1;
    const familyId = pathParts[familyIdIndex];

    // 验证用户是否属于该家庭
    if (!req.user || req.user.familyId.toString() !== familyId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权访问该资源'
        }
      });
    }

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '访问被拒绝'
      }
    });
  }
};
