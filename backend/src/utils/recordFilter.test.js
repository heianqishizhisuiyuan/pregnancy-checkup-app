import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildRecordFilter } from './recordFilter.js';

describe('buildRecordFilter', () => {
  const familyId = '507f1f77bcf86cd799439011';

  it('returns familyId only when no query params', () => {
    const filter = buildRecordFilter(familyId, {});
    assert.equal(filter.familyId, familyId);
    assert.equal(filter.hospital, undefined);
  });

  it('adds hospital regex filter', () => {
    const filter = buildRecordFilter(familyId, { hospital: '妇幼' });
    assert.ok(filter.hospital instanceof RegExp);
    assert.match(filter.hospital.source, /妇幼/);
  });

  it('adds date range filter', () => {
    const filter = buildRecordFilter(familyId, {
      startDate: '2026-01-01',
      endDate: '2026-06-30',
    });
    assert.ok(filter.checkupDate.$gte);
    assert.ok(filter.checkupDate.$lte);
  });

  it('adds gestational week range', () => {
    const filter = buildRecordFilter(familyId, { minWeek: '12', maxWeek: '20' });
    assert.equal(filter.gestationalWeek.$gte, 12);
    assert.equal(filter.gestationalWeek.$lte, 20);
  });

  it('adds keyword or search', () => {
    const filter = buildRecordFilter(familyId, { keyword: '正常' });
    assert.equal(filter.$or.length, 3);
  });
});
