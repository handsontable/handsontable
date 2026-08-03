import { parseIsoDateTimeStringToSerial, getDateTimeNumFmt } from '../types/xlsx/date-utils';

describe('parseIsoDateTimeStringToSerial', () => {
  it('converts an ISO datetime to an Excel serial with a fractional day', () => {
    const serial = parseIsoDateTimeStringToSerial('2024-01-01T12:00:00');

    expect(Math.floor(serial)).toBe(45292);
    expect(serial - Math.floor(serial)).toBeCloseTo(0.5, 6);
  });

  it('handles date-only values (midnight)', () => {
    const serial = parseIsoDateTimeStringToSerial('2024-01-01');

    expect(serial).toBe(45292);
  });

  it('returns null for invalid input', () => {
    expect(parseIsoDateTimeStringToSerial('garbage')).toBe(null);
  });

  it('exposes a datetime number format', () => {
    expect(typeof getDateTimeNumFmt()).toBe('string');
  });
});
