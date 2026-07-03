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

/**
 * 获取家庭邀请码
 */
export function getInviteCode() {
  return request({
    url: '/family/invite',
    method: 'get',
  });
}

/**
 * 重新生成邀请码
 */
export function regenerateInviteCode() {
  return request({
    url: '/family/invite/regenerate',
    method: 'post',
  });
}

/**
 * 获取家庭成员列表
 */
export function getMembers() {
  return request({
    url: '/family/members',
    method: 'get',
  });
}
