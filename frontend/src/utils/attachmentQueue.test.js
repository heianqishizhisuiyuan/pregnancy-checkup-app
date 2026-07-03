import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendQueuedAttachmentEntries,
  assertAttachmentRecordId,
  createQueuedAttachmentEntry,
  getRemainingAttachmentSlots,
  normalizeAttachmentTags,
  removeQueuedAttachmentEntry,
  updateQueuedAttachmentEntry,
  uploadQueuedAttachments
} from './attachmentQueue.js';

test('createQueuedAttachmentEntry defaults to category 其他 and queued status', () => {
  const entry = createQueuedAttachmentEntry({
    name: 'report.png',
    size: 100,
    lastModified: 1
  });

  assert.equal(entry.category, '其他');
  assert.deepEqual(entry.tags, []);
  assert.equal(entry.status, 'queued');
});

test('createQueuedAttachmentEntry applies overrides', () => {
  const file = { name: 'report-a.png', size: 1024, lastModified: 12345 };

  assert.deepEqual(
    createQueuedAttachmentEntry(file, {
      id: 'custom-id',
      category: 'B超',
      tags: ['12周'],
      status: 'uploaded'
    }),
    {
      id: 'custom-id',
      file,
      category: 'B超',
      tags: ['12周'],
      status: 'uploaded'
    }
  );
});

test('appendQueuedAttachmentEntries accumulates multiple selected files onto the existing queue', () => {
  const existingQueue = [
    createQueuedAttachmentEntry(
      { name: 'existing.png', size: 10, lastModified: 1 },
      { category: '已有', tags: ['keep'] }
    )
  ];

  const nextQueue = appendQueuedAttachmentEntries(
    existingQueue,
    [
      { name: 'first.png', size: 20, lastModified: 2 },
      { name: 'second.png', size: 30, lastModified: 3 }
    ],
    { category: '报告', tags: ['new'] }
  );

  assert.equal(nextQueue.length, 3);
  assert.deepEqual(
    nextQueue.map((entry) => [entry.file.name, entry.category, entry.tags]),
    [
      ['existing.png', '已有', ['keep']],
      ['first.png', '报告', ['new']],
      ['second.png', '报告', ['new']]
    ]
  );
});

test('updateQueuedAttachmentEntry updates only the matching queued item metadata', () => {
  const originalQueue = [
    createQueuedAttachmentEntry(
      { name: 'first.png', size: 20, lastModified: 2 },
      { id: 'first', category: 'B超', tags: ['12周'] }
    ),
    createQueuedAttachmentEntry(
      { name: 'second.png', size: 30, lastModified: 3 },
      { id: 'second', category: '血常规', tags: ['空腹'] }
    )
  ];

  const nextQueue = updateQueuedAttachmentEntry(originalQueue, 'second', {
    category: 'NT检查',
    tags: ['复查', '重点']
  });

  assert.deepEqual(
    nextQueue.map((entry) => [entry.id, entry.category, entry.tags]),
    [
      ['first', 'B超', ['12周']],
      ['second', 'NT检查', ['复查', '重点']]
    ]
  );
  assert.notEqual(nextQueue, originalQueue);
  assert.equal(nextQueue[0], originalQueue[0]);
  assert.notEqual(nextQueue[1], originalQueue[1]);
});

test('removeQueuedAttachmentEntry removes only the matching queued item', () => {
  const originalQueue = [
    createQueuedAttachmentEntry(
      { name: 'first.png', size: 20, lastModified: 2 },
      { id: 'first' }
    ),
    createQueuedAttachmentEntry(
      { name: 'second.png', size: 30, lastModified: 3 },
      { id: 'second' }
    )
  ];

  const nextQueue = removeQueuedAttachmentEntry(originalQueue, 'first');

  assert.deepEqual(nextQueue.map((entry) => entry.id), ['second']);
  assert.notEqual(nextQueue, originalQueue);
});

test('normalizeAttachmentTags trims separators and removes empty tags', () => {
  assert.deepEqual(
    normalizeAttachmentTags(' 12周,  复查 , , 空腹  '),
    ['12周', '复查', '空腹']
  );
  assert.deepEqual(
    normalizeAttachmentTags([' 复查 ', '', '空腹', '复查']),
    ['复查', '空腹']
  );
  assert.deepEqual(normalizeAttachmentTags(''), []);
});

test('getRemainingAttachmentSlots subtracts queued items from the 20-attachment cap', () => {
  assert.equal(getRemainingAttachmentSlots(3, 4), 13);
  assert.equal(getRemainingAttachmentSlots(18, 3), 0);
});

test('assertAttachmentRecordId throws when recordId is missing', () => {
  assert.throws(
    () => assertAttachmentRecordId(''),
    /recordId is required/
  );
});

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
  const calls = [];
  const uploader = async (recordId, entry) => {
    calls.push([recordId, entry.file.name]);
    if (entry.file.name === 'bad.png') {
      throw new Error('UPLOAD_FAILED');
    }
    return { success: true };
  };

  const result = await uploadQueuedAttachments({
    recordId: 'record-123',
    queue: [
      { file: { name: 'good.png' }, category: '其他', tags: [] },
      { file: { name: 'bad.png' }, category: '其他', tags: [] },
      { file: { name: 'later-good.png' }, category: '其他', tags: [] }
    ],
    uploader
  });

  assert.deepEqual(calls, [
    ['record-123', 'good.png'],
    ['record-123', 'bad.png'],
    ['record-123', 'later-good.png']
  ]);
  assert.equal(result.succeeded.length, 2);
  assert.equal(result.failed.length, 1);
  assert.equal(result.failed[0].file.name, 'bad.png');
});
