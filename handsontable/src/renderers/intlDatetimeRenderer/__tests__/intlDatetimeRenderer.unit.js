import { valueFormatter } from '../intlDatetimeRenderer';
import { BAD_VALUE_TEXT } from '../../../helpers/constants';

describe('intlDatetimeRenderer valueFormatter', () => {
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

  it('warns once per instance and returns the raw value when dateTimeFormat is a string', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const instance = {};

    const out = valueFormatter('2024-12-25T14:30:00', {
      dateTimeFormat: 'YYYY-MM-DD HH:mm',
      instance,
    });

    expect(out).toBe('2024-12-25T14:30:00');
    expect(warnSpy).toHaveBeenCalledTimes(1);

    valueFormatter('2024-12-26T10:00:00', { dateTimeFormat: 'YYYY-MM-DD HH:mm', instance });
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });

  it('warns about a string dateTimeFormat even when the value is unparseable', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const out = valueFormatter('not-a-date', {
      dateTimeFormat: 'YYYY-MM-DD HH:mm',
      instance: {},
    });

    expect(out).toBe('not-a-date');
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });
});
