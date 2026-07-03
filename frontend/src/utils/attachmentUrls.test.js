import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAttachmentUploadUrl, buildAttachmentFileUrl } from './attachmentUrls.js';

test('buildAttachmentUploadUrl appends records path to API base url without duplicating api', () => {
  assert.equal(
    buildAttachmentUploadUrl('http://localhost:3000/api', 'record-123'),
    'http://localhost:3000/api/records/record-123/attachments'
  );
});

test('buildAttachmentFileUrl converts api base url to uploads root url', () => {
  assert.equal(
    buildAttachmentFileUrl('http://localhost:3000/api', 'uploads/families/f1/records/r1/image.webp'),
    'http://localhost:3000/uploads/families/f1/records/r1/image.webp'
  );
});

test('buildAttachmentFileUrl leaves existing uploads path intact under site root', () => {
  assert.equal(
    buildAttachmentFileUrl('https://api.example.com/api', '/uploads/families/f1/records/r1/test.png'),
    'https://api.example.com/uploads/families/f1/records/r1/test.png'
  );
});
