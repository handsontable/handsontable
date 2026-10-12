import { valueFormatter } from '../dateRenderer';
import { BAD_VALUE_TEXT } from '../../../helpers/constants';

describe('dateRenderer valueFormatter', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('formats an ISO date like a new Intl.DateTimeFormat with the default format', () => {
    expect(valueFormatter('2024-12-25', { locale: 'en-US' })).toBe('12/25/2024');
    expect(valueFormatter('2024-12-25', { locale: 'de-DE' })).toBe('25.12.2024');
  });

  it('formats an ISO date with a custom dateFormat', () => {
    expect(valueFormatter('2024-12-25', {
      dateFormat: { year: 'numeric', month: 'long', day: 'numeric' },
      locale: 'en-US',
    })).toBe('December 25, 2024');
  });

  it('returns the bad-value placeholder for invalid input', () => {
    expect(valueFormatter('not-a-date', {})).toBe(BAD_VALUE_TEXT);
  });

  it('builds the Intl formatter once for repeated values with the same format', () => {
    const cellProperties = { dateFormat: { year: 'numeric', month: 'short', day: 'numeric' }, locale: 'en-US' };

    valueFormatter('2024-12-25', cellProperties);

    const constructorSpy = jest.spyOn(Intl, 'DateTimeFormat');

    for (let i = 0; i < 100; i++) {
      valueFormatter(`2024-12-${String((i % 28) + 1).padStart(2, '0')}`, cellProperties);
    }

    expect(constructorSpy).not.toHaveBeenCalled();
  });

  it('follows a dateFormat object changed in place', () => {
    const cellProperties = { dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' }, locale: 'en-US' };

    expect(valueFormatter('2024-12-25', cellProperties)).toBe('12/25/2024');

    cellProperties.dateFormat.month = 'long';

    expect(valueFormatter('2024-12-25', cellProperties)).toBe('December 25, 2024');
  });
});
