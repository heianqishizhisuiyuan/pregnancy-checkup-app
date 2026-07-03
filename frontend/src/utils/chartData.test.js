import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildVitalChartSeries } from './chartData.js';
import { recordsToRows } from './exportRecords.js';

describe('buildVitalChartSeries', () => {
  it('sorts records by checkup date ascending', () => {
    const result = buildVitalChartSeries([
      { checkupDate: '2026-06-01', gestationalWeek: 20, gestationalDay: 0, vitals: { weight: 60 } },
      { checkupDate: '2026-04-01', gestationalWeek: 12, gestationalDay: 0, vitals: { weight: 55 } },
    ]);

    assert.equal(result.weight[0], 55);
    assert.equal(result.weight[1], 60);
  });
});

describe('recordsToRows', () => {
  it('maps record fields to export columns', () => {
    const rows = recordsToRows([
      {
        checkupDate: '2026-06-01',
        gestationalWeek: 12,
        gestationalDay: 3,
        hospital: '市妇幼',
        doctor: '李医生',
        vitals: { weight: 58.5, bloodPressure: { systolic: 110, diastolic: 70 } },
        notes: '正常',
        attachmentCount: 2,
      },
    ]);

    assert.equal(rows[0].医院, '市妇幼');
    assert.equal(rows[0].附件数, 2);
  });
});
