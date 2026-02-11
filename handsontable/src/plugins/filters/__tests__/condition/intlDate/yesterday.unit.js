import { condition } from 'handsontable/plugins/filters/condition/intlDate/yesterday';
import { dateRowFactory } from '../../helpers/utils';

/**
 * @param {number} dayOffset Days from today (0 = today, -1 = yesterday, 1 = tomorrow).
 * @returns {string} ISO date string (YYYY-MM-DD) in local date.
 */
function dateStringForDay(dayOffset) {
  const d = new Date();

  d.setDate(d.getDate() + dayOffset);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${y}-${m}-${day}`;
}

describe('Filters condition (`intl_date_yesterday`)', () => {
  const format = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };

  it('should filter matching values', () => {
    const data = dateRowFactory({ type: 'intl-date', dateFormat: format });

    expect(condition(data(dateStringForDay(-1)))).toBe(true);
  });

  it('should filter not matching values', () => {
    const data = dateRowFactory({ type: 'intl-date', dateFormat: format });

    expect(condition(data(dateStringForDay(-3)))).toBe(false);
    expect(condition(data(dateStringForDay(-2)))).toBe(false);
    expect(condition(data(dateStringForDay(0)))).toBe(false);
    expect(condition(data(dateStringForDay(1)))).toBe(false);
    expect(condition(data(dateStringForDay(2)))).toBe(false);
    expect(condition(data(dateStringForDay(3)))).toBe(false);
  });
});
