import { condition } from 'handsontable/plugins/filters/condition/date/today';
import { dateRowFactory } from '../../helpers/utils';

/**
 * Returns an ISO 8601 date string offset by `days` from today.
 *
 * @param {number} days Number of days to offset (negative = past, positive = future).
 * @returns {string}
 */
function isoOffset(days: number): string {
  const d = new Date();

  d.setDate(d.getDate() + days);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('Filters condition (`date_today`)', () => {
  it('should filter matching values', () => {
    const data = dateRowFactory({});

    expect(condition(data(isoOffset(0)))).toBe(true);
  });

  it('should filter not matching values', () => {
    const data = dateRowFactory({});

    expect(condition(data(isoOffset(-3)))).toBe(false);
    expect(condition(data(isoOffset(-2)))).toBe(false);
    expect(condition(data(isoOffset(-1)))).toBe(false);
    expect(condition(data(isoOffset(1)))).toBe(false);
    expect(condition(data(isoOffset(2)))).toBe(false);
    expect(condition(data(isoOffset(3)))).toBe(false);
  });

  it('should return false for non-ISO date strings', () => {
    const data = dateRowFactory({});

    expect(condition(data('13/11/2022'))).toBe(false);
    expect(condition(data('not-a-date'))).toBe(false);
    expect(condition(data(null))).toBe(false);
    expect(condition(data(undefined))).toBe(false);
    expect(condition(data(''))).toBe(false);
  });
});
