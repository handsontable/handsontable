import { valueFormatter } from '../intlDatetimeRenderer';
import { BAD_VALUE_TEXT } from '../../../helpers/constants';

describe('intlDatetimeRenderer valueFormatter', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

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

  it('builds the Intl formatter once for repeated values with the same format', () => {
    const cellProperties = { dateTimeFormat: { year: 'numeric', hour: '2-digit', hour12: false }, locale: 'en-GB' };

    valueFormatter('2024-12-25T14:30:00', cellProperties);

    const constructorSpy = jest.spyOn(Intl, 'DateTimeFormat');

    for (let i = 0; i < 100; i++) {
      valueFormatter(`2024-12-${String((i % 28) + 1).padStart(2, '0')}T14:30:00`, cellProperties);
    }

    expect(constructorSpy).not.toHaveBeenCalled();
  });

  it('follows a dateTimeFormat object changed in place', () => {
    const cellProperties = { dateTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false }, locale: 'en-GB' };

    expect(valueFormatter('2024-12-25T14:30:00', cellProperties)).toBe('14:30');

    cellProperties.dateTimeFormat.minute = undefined;
    cellProperties.dateTimeFormat.year = 'numeric';

    expect(valueFormatter('2024-12-25T14:30:00', cellProperties)).toBe(
      new Intl.DateTimeFormat('en-GB', cellProperties.dateTimeFormat).format(new Date(2024, 11, 25, 14, 30)),
    );
    expect(valueFormatter('2024-12-25T14:30:00', cellProperties)).not.toBe('14:30');
  });
});
