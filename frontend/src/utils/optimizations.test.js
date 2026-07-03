import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCheckupGuideForWeek } from './checkupGuide.js';
import { buildExportFilename } from './exportFilename.js';
import { seriesHasData } from './chartData.js';
import { groupRecordsByMonth } from './timelineGroups.js';

describe('getCheckupGuideForWeek', () => {
  it('returns guide for matching week', () => {
    const guide = getCheckupGuideForWeek(25);
    assert.ok(guide);
    assert.ok(guide.items.includes('糖耐量试验'));
  });

  it('returns null for out of range week', () => {
    assert.equal(getCheckupGuideForWeek(5), null);
  });
});

describe('buildExportFilename', () => {
  it('includes filter hints in filename', () => {
    const name = buildExportFilename({
      startDate: '2026-01-01',
      endDate: '2026-06-01',
      minWeek: 20,
      maxWeek: 28,
      hospital: '市妇幼',
    });
    assert.match(name, /产检记录/);
    assert.match(name, /孕20-28周/);
    assert.match(name, /市妇幼/);
  });

  it('includes keyword in filename', () => {
    const name = buildExportFilename({ keyword: '糖耐' });
    assert.match(name, /糖耐/);
  });
});

describe('seriesHasData', () => {
  it('detects non-null values', () => {
    assert.equal(seriesHasData([null, 60, null]), true);
    assert.equal(seriesHasData([null, null]), false);
  });
});

describe('groupRecordsByMonth', () => {
  it('groups records under month labels', () => {
    const groups = groupRecordsByMonth([
      { checkupDate: '2026-06-15' },
      { checkupDate: '2026-06-01' },
      { checkupDate: '2026-05-20' },
    ]);
    assert.equal(groups.length, 2);
    assert.equal(groups[0].label, '2026年6月');
    assert.equal(groups[0].records.length, 2);
  });
});
