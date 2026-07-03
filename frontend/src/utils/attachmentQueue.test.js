import test from 'node:test';
import assert from 'node:assert/strict';
import { uploadQueuedAttachments } from './attachmentQueue.js';

test('uploadQueuedAttachments uploads queued files in order after record creation', async () => {
  const calls = [];
  const queue = [
    {
      file: { name: 'report-a.png' },
      category: 'B超',
      tags: ['12周']
    },
    {
      file: { name: 'report-b.png' },
      category: '血常规',
      tags: ['空腹']
    }
  ];

  const uploader = async (recordId, entry) => {
    calls.push([recordId, entry.file.name, entry.category, entry.tags]);
    return { success: true };
  };

  const result = await uploadQueuedAttachments({
    recordId: 'record-123',
    queue,
    uploader
  });

  assert.deepEqual(calls, [
    ['record-123', 'report-a.png', 'B超', ['12周']],
    ['record-123', 'report-b.png', '血常规', ['空腹']]
  ]);
  assert.equal(result.failed.length, 0);
});

test('uploadQueuedAttachments reports failed entries without hiding successful uploads', async () => {
  const uploader = async (recordId, entry) => {
    if (entry.file.name === 'bad.png') {
      throw new Error('UPLOAD_FAILED');
    }
    return { success: true };
  };

  const result = await uploadQueuedAttachments({
    recordId: 'record-123',
    queue: [
      { file: { name: 'good.png' }, category: '其他', tags: [] },
      { file: { name: 'bad.png' }, category: '其他', tags: [] }
    ],
    uploader
  });

  assert.equal(result.succeeded.length, 1);
  assert.equal(result.failed.length, 1);
  assert.equal(result.failed[0].file.name, 'bad.png');
});
