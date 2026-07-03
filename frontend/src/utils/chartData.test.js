import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAxisLabelShowIndexes,
  buildChartAxisLabels,
  buildVitalChartSeries,
} from './chartData.js';
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

  it('uses checkup date labels on x-axis', () => {
    const result = buildVitalChartSeries([
      { checkupDate: '2026-04-01', gestationalWeek: 12, gestationalDay: 3, vitals: {} },
    ]);

    assert.equal(result.labels[0], '04-01');
    assert.equal(result.meta[0].gestational, '12周+3天');
  });
});

describe('buildChartAxisLabels', () => {
  it('appends suffix when multiple records share the same date', () => {
    const labels = buildChartAxisLabels([
      { checkupDate: '2026-04-01' },
      { checkupDate: '2026-04-01' },
    ]);

    assert.deepEqual(labels, ['04-01', '04-01(2)']);
  });
});

describe('buildAxisLabelShowIndexes', () => {
  it('shows all labels when count is small', () => {
    const indexes = buildAxisLabelShowIndexes(8);
    assert.equal(indexes.size, 8);
  });

  it('always includes first and last label when thinning', () => {
    const indexes = buildAxisLabelShowIndexes(50, 8);
    assert.ok(indexes.has(0));
    assert.ok(indexes.has(49));
    assert.ok(indexes.size <= 8);
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
