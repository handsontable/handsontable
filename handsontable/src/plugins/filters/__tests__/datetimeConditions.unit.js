import { condition as before } from '../condition/intlDatetime/before';
import { condition as between } from '../condition/intlDatetime/between';

const row = value => ({ value, meta: {} });

describe('intl-datetime filter conditions', () => {
  it('before compares chronologically', () => {
    expect(before(row('2024-03-15T09:00:00'), ['2024-03-15T10:00:00'])).toBe(true);
    expect(before(row('2024-03-15T11:00:00'), ['2024-03-15T10:00:00'])).toBe(false);
  });

  it('between is inclusive', () => {
    expect(between(row('2024-03-15T10:00:00'), ['2024-03-15T09:00:00', '2024-03-15T11:00:00'])).toBe(true);
    expect(between(row('2024-03-15T12:00:00'), ['2024-03-15T09:00:00', '2024-03-15T11:00:00'])).toBe(false);
  });
});
