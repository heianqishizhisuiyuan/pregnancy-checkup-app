import request from './request';

/**
 * 获取所有记录
 */
export function getRecords() {
  return request({
    url: '/records',
    method: 'get',
  });
}

/**
 * 获取单条记录
 */
export function getRecordById(id) {
  return request({
    url: `/records/${id}`,
    method: 'get',
  });
}

/**
 * 创建记录
 */
export function createRecord(data) {
  return request({
    url: '/records',
    method: 'post',
    data,
  });
}

/**
 * 更新记录
 */
export function updateRecord(id, data) {
  return request({
    url: `/records/${id}`,
    method: 'put',
    data,
  });
}

/**
 * 删除记录
 */
export function deleteRecord(id) {
  return request({
    url: `/records/${id}`,
    method: 'delete',
  });
}
