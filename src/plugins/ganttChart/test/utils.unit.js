import { parseDate } from '../utils';

describe('the `parseDate` function', () => {
  it('should return a Date object if the provided date string is valid and null if it\'s invalid', () => {
    expect(parseDate('01/01/2017') instanceof Date).toBe(true);
    expect(parseDate('01/31/2017') instanceof Date).toBe(true);
    expect(parseDate('31/01/2017') instanceof Date).toBe(false);
    expect(parseDate('31/01/2017')).toEqual(null);
  });

  it('should return a Date object if the provided date object is valid and null if it\'s invalid', () => {
    expect(parseDate(new Date()) instanceof Date).toBe(true);
    expect(parseDate({}) instanceof Date).toBe(false);
    expect(parseDate({})).toEqual(null);
  });
});
