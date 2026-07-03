/**
 * 校验登录后回跳路径，防止开放重定向
 * @param {string} redirect
 * @returns {string|null}
 */
export function resolveSafeRedirect(redirect) {
  if (!redirect || typeof redirect !== 'string') return null;

  const path = redirect.trim();
  if (!path.startsWith('/') || path.startsWith('//')) return null;

  const pathname = path.split('?')[0].split('#')[0];
  if (pathname === '/login' || pathname === '/register') return null;

  return path;
}

/** 构造带 redirect 的登录 query */
export function buildLoginQuery(currentPath) {
  const safe = resolveSafeRedirect(currentPath);
  return safe ? { redirect: safe } : {};
}
