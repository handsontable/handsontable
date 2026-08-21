import { condition as before } from '../condition/intlDatetime/before';
import { condition as between } from '../condition/intlDatetime/between';
import { condition as today } from '../condition/intlDatetime/today';
import { condition as yesterday } from '../condition/intlDatetime/yesterday';
import { condition as tomorrow } from '../condition/intlDatetime/tomorrow';

const toIsoDate = (date) => {
  const pad = n => String(n).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

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

  it('today matches full datetime values regardless of the time part', () => {
    const now = new Date();

    expect(today(row(`${toIsoDate(now)}T00:00:01`))).toBe(true);
    expect(today(row(`${toIsoDate(now)}T23:59:59`))).toBe(true);
    expect(today(row(toIsoDate(now)))).toBe(true);
    expect(today(row('1999-01-01T12:00:00'))).toBe(false);
    expect(today(row('not-a-date'))).toBe(false);
  });

  it('yesterday matches datetime values from the previous calendar day', () => {
    const reference = new Date();

    reference.setDate(reference.getDate() - 1);

    expect(yesterday(row(`${toIsoDate(reference)}T15:30:00`))).toBe(true);
    expect(yesterday(row(`${toIsoDate(new Date())}T15:30:00`))).toBe(false);
  });

  it('tomorrow matches datetime values from the next calendar day', () => {
    const reference = new Date();

    reference.setDate(reference.getDate() + 1);

    expect(tomorrow(row(`${toIsoDate(reference)}T08:00:00`))).toBe(true);
    expect(tomorrow(row(`${toIsoDate(new Date())}T08:00:00`))).toBe(false);
  });
});
