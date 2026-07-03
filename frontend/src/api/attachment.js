import request from './request';

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

export function uploadAttachmentEntry(recordId, entry) {
  const formData = new FormData();
  formData.append('files', entry.file);
  formData.append('category', entry.category);
  formData.append('tags', JSON.stringify(entry.tags));
  return uploadAttachments(recordId, formData);
}

export function deleteAttachment(recordId, attachmentId) {
  return request({
    url: `/records/${recordId}/attachments/${attachmentId}`,
    method: 'delete'
  });
}

export function updateAttachment(recordId, attachmentId, data) {
  return request({
    url: `/records/${recordId}/attachments/${attachmentId}`,
    method: 'put',
    data
  });
}
