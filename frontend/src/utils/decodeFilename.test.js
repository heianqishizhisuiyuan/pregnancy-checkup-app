import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUploadedFilename } from './decodeFilename.js';

test('normalizeUploadedFilename fixes mojibake Chinese filenames for display', () => {
  const garbled = Buffer.from('孙子新增 (3).png', 'utf8').toString('latin1');
  assert.equal(normalizeUploadedFilename(garbled), '孙子新增 (3).png');
});

test('normalizeUploadedFilename keeps already-correct Chinese filenames', () => {
  assert.equal(normalizeUploadedFilename('孙子新增.png'), '孙子新增.png');
});

test('normalizeUploadedFilename keeps ASCII filenames unchanged', () => {
  assert.equal(normalizeUploadedFilename('report.png'), 'report.png');
});
