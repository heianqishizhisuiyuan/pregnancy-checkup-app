import request from './request';

/**
 * 上传附件
 */
export function uploadAttachments(recordId, formData) {
  return request({
    url: `/records/${recordId}/attachments`,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 删除附件
 */
export function deleteAttachment(recordId, attachmentId) {
  return request({
    url: `/records/${recordId}/attachments/${attachmentId}`,
    method: 'delete'
  });
}

/**
 * 更新附件信息
 */
export function updateAttachment(recordId, attachmentId, data) {
  return request({
    url: `/records/${recordId}/attachments/${attachmentId}`,
    method: 'put',
    data
  });
}
