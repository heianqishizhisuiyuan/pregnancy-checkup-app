import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeUploadedFilename,
  normalizeUploadedFilename,
  normalizeAttachmentFilenames
} from './decodeFilename.js';

test('decodeUploadedFilename restores UTF-8 Chinese filenames from latin1', () => {
  const garbled = Buffer.from('产检报告.jpg', 'utf8').toString('latin1');
  assert.equal(decodeUploadedFilename(garbled), '产检报告.jpg');
});

test('decodeUploadedFilename keeps ASCII filenames unchanged', () => {
  assert.equal(decodeUploadedFilename('report.png'), 'report.png');
});

test('decodeUploadedFilename handles empty values', () => {
  assert.equal(decodeUploadedFilename(''), '');
  assert.equal(decodeUploadedFilename(null), null);
});

test('normalizeUploadedFilename keeps already-correct Chinese filenames', () => {
  assert.equal(normalizeUploadedFilename('孙子新增.png'), '孙子新增.png');
});

test('normalizeUploadedFilename fixes stored mojibake filenames', () => {
  const garbled = Buffer.from('孙子新增 (3).png', 'utf8').toString('latin1');
  assert.equal(normalizeUploadedFilename(garbled), '孙子新增 (3).png');
});

test('normalizeUploadedFilename keeps ASCII filenames unchanged', () => {
  assert.equal(normalizeUploadedFilename('report.png'), 'report.png');
});

test('normalizeAttachmentFilenames normalizes each attachment filename', () => {
  const garbled = Buffer.from('B超报告.jpg', 'utf8').toString('latin1');
  const attachments = normalizeAttachmentFilenames([
    { _id: '1', filename: garbled, category: 'B超' },
    { _id: '2', filename: 'report.png', category: '其他' }
  ]);

  assert.equal(attachments[0].filename, 'B超报告.jpg');
  assert.equal(attachments[1].filename, 'report.png');
});
