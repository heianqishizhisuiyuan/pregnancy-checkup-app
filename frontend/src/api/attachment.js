import request from './request.js';
import { assertAttachmentRecordId } from '../utils/attachmentQueue.js';

export function uploadAttachments(recordId, formData) {
  assertAttachmentRecordId(recordId);

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
  assertAttachmentRecordId(recordId);

  const formData = new FormData();
  formData.append('files', entry.file);
  formData.append('category', entry.category);
  formData.append('tags', JSON.stringify(entry.tags));
  return uploadAttachments(recordId, formData);
}

export function deleteAttachment(recordId, attachmentId) {
  assertAttachmentRecordId(recordId);

  return request({
    url: `/records/${recordId}/attachments/${attachmentId}`,
    method: 'delete'
  });
}

export function updateAttachment(recordId, attachmentId, data) {
  assertAttachmentRecordId(recordId);

  return request({
    url: `/records/${recordId}/attachments/${attachmentId}`,
    method: 'put',
    data
  });
}
