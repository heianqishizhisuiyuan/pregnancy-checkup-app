import request from './request.js';
import { assertAttachmentRecordId } from '../utils/attachmentQueue.js';
import { createAttachmentFormData } from '../utils/attachmentFormData.js';

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

  const formData = createAttachmentFormData(entry);
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
