import { valueFormatter } from '../datetimeRenderer';
import { BAD_VALUE_TEXT } from '../../../helpers/constants';

describe('datetimeRenderer valueFormatter', () => {
  it('formats a datetime via Intl using dateTimeFormat', () => {
    const out = valueFormatter('2024-12-25T14:30:00', {
      dateTimeFormat: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      },
      locale: 'en-GB',
    });

    expect(out).toContain('2024');
    expect(out).toContain('14:30');
  });

  it('formats a date-only value at midnight', () => {
    const out = valueFormatter('2024-06-01', {
      dateTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
      locale: 'en-GB',
    });

    expect(out).toContain('00:00');
  });

  it('returns the bad-value placeholder for invalid input', () => {
    expect(valueFormatter('not-a-date', {})).toBe(BAD_VALUE_TEXT);
  });

  it('returns empty value when allowEmpty is true', () => {
    expect(valueFormatter('', { allowEmpty: true })).toBe('');
  });
});
