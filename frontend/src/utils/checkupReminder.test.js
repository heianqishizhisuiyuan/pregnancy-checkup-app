import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDaysUntilNextCheckup,
  isInReminderWindow,
  formatCheckupReminderText,
} from './checkupReminder.js';

describe('checkupReminder', () => {
  it('calculates days until next checkup', () => {
    const days = getDaysUntilNextCheckup('2026-07-10', '2026-07-03');
    assert.equal(days, 7);
  });

  it('detects reminder window', () => {
    assert.equal(isInReminderWindow('2026-07-05', 1, '2026-07-03'), false);
    assert.equal(isInReminderWindow('2026-07-04', 1, '2026-07-03'), true);
    assert.equal(isInReminderWindow('2026-07-03', 1, '2026-07-03'), true);
  });

  it('formats reminder text for today', () => {
    const text = formatCheckupReminderText('2026-07-03', '2026-07-03');
    assert.equal(text.tone, 'today');
    assert.match(text.message, /今天产检/);
  });
});
