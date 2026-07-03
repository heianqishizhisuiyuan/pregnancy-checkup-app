import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAttachmentPreviewUrl,
  createAttachmentPreviewObjectUrl
} from './attachmentPreview.js';

test('buildAttachmentPreviewUrl keeps api uploads behind the authenticated request layer', () => {
  assert.equal(
    buildAttachmentPreviewUrl('http://localhost:3000/api', 'uploads/families/f1/records/r1/image.webp'),
    'http://localhost:3000/uploads/families/f1/records/r1/image.webp'
  );
});

test('createAttachmentPreviewObjectUrl fetches protected uploads with bearer token', async () => {
  const fetchCalls = [];
  const objectUrl = await createAttachmentPreviewObjectUrl({
    apiBaseUrl: 'http://localhost:3000/api',
    path: 'uploads/families/f1/records/r1/image.webp',
    token: 'token-123',
    fetchImpl: async (url, options) => {
      fetchCalls.push([url, options.headers.Authorization]);
      return {
        ok: true,
        blob: async () => new Blob(['preview'])
      };
    },
    createObjectUrl: () => 'blob:preview-url'
  });

  assert.equal(objectUrl, 'blob:preview-url');
  assert.deepEqual(fetchCalls, [
    ['http://localhost:3000/uploads/families/f1/records/r1/image.webp', 'Bearer token-123']
  ]);
});
