import request from './request';

/**
 * 获取家庭信息
 */
export function getFamily() {
  return request({
    url: '/family',
    method: 'get',
  });
}

/**
 * 更新家庭信息
 */
export function updateFamily(data) {
  return request({
    url: '/family',
    method: 'put',
    data,
  });
}
