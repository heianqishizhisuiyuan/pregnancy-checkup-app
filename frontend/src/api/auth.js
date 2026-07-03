import request from './request';

/**
 * 用户注册
 */
export function register(data) {
  return request({
    url: '/auth/register',
    method: 'post',
    data,
  });
}

/**
 * 用户登录
 */
export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data,
  });
}

/**
 * 获取当前用户信息
 */
export function getCurrentUser() {
  return request({
    url: '/auth/me',
    method: 'get',
  });
}

/**
 * 更新昵称
 */
export function updateProfile(data) {
  return request({
    url: '/auth/profile',
    method: 'put',
    data,
  });
}

/**
 * 修改密码
 */
export function updatePassword(data) {
  return request({
    url: '/auth/password',
    method: 'put',
    data,
  });
}
