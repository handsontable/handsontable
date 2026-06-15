import { condition } from 'handsontable/plugins/filters/condition/notBetween';
import { dateRowFactory } from '../helpers/utils';

describe('Filters condition (`not_between`)', () => {
  it('should filter matching values (numeric cell type)', () => {
    const data = dateRowFactory({ type: 'numeric' });

    expect(condition(data(4), [1, 3])).toBe(true);
    expect(condition(data(4), [-4, 3])).toBe(true);
    expect(condition(data(4), [5, 53])).toBe(true);
    expect(condition(data(4), [4.00001, 53])).toBe(true);
    expect(condition(data(4), ['5', '53'])).toBe(true);
    expect(condition(data(-4), [5, 53])).toBe(true);
    expect(condition(data(-4), [-10, -5])).toBe(true);
    expect(condition(data(-4), ['-10', '-5'])).toBe(true);
  });

  it('should filter not matching values (numeric cell type)', () => {
    const data = dateRowFactory({ type: 'numeric' });

    expect(condition(data(4), [4, 9])).toBe(false);
    expect(condition(data(4), [4, 4])).toBe(false);
    expect(condition(data(4), [9, 3])).toBe(false);
    expect(condition(data(4), [3.999, 6.9])).toBe(false);
    expect(condition(data(4), ['3.999', 6.9])).toBe(false);
    expect(condition(data(4), ['3.999', '6.9'])).toBe(false);
    expect(condition(data(-4), [-9, -3])).toBe(false);
    expect(condition(data(-4), [-4, -4])).toBe(false);
    expect(condition(data(-4), ['-4', '-4'])).toBe(false);
  });

  it('should filter matching values (date cell type) — value inside the ISO range returns false for notBetween', () => {
    const data = dateRowFactory({ type: 'date' });

    // Value within the range — notBetween → false
    expect(condition(data('2015-12-20'), ['2015-11-20', '2015-12-24'])).toBe(false);
    // Value equal to boundary — inclusive — notBetween → false
    expect(condition(data('2015-12-20'), ['2015-12-20', '2015-12-20'])).toBe(false);
  });

  it('should filter not matching values (date cell type) — value outside the ISO range returns true for notBetween', () => {
    const data = dateRowFactory({ type: 'date' });

    // Value strictly before the range — notBetween → true
    expect(condition(data('2015-12-20'), ['2016-01-01', '2020-12-31'])).toBe(true);
    // Value strictly after the range — notBetween → true
    expect(condition(data('2015-12-20'), ['2000-01-01', '2014-12-31'])).toBe(true);
  });

  it('should return true for non-ISO date inputs (parse to null → between returns false → notBetween returns true)', () => {
    const data = dateRowFactory({ type: 'date' });

    // Non-ISO boundaries parse to null → between returns false → notBetween true
    expect(condition(data('2015-12-20'), ['2013', '2014'])).toBe(true);
    expect(condition(data('2015-12-20'), ['2013', 'bar'])).toBe(true);
    // Year-only is not valid ISO
    expect(condition(data('2015-12-20'), ['2015', '2016'])).toBe(true);
  });

  it('should filter matching values (text cell type)', () => {
    const data = dateRowFactory({ type: 'text' });

    expect(condition(data('f'), ['a', 'z'])).toBe(false);
    expect(condition(data('foo'), ['a', 'z'])).toBe(false);
    expect(condition(data('foo'), ['f', 'z'])).toBe(false);
    expect(condition(data('f'), ['f', 'f'])).toBe(false);
  });
});
