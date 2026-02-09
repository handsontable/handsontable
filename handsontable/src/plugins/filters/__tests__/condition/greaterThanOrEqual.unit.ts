import { condition } from 'handsontable/plugins/filters/condition/greaterThanOrEqual';
import { dateRowFactory } from '../helpers/utils';

describe('Filters condition (`gte`)', () => {

  it('should filter matching values (numeric cell type)', () => {
    const data = dateRowFactory({ type: 'numeric' });

    expect(condition(data(4), [4])).toBe(true);
    expect(condition(data(4), [3])).toBe(true);
    expect(condition(data(4), [2])).toBe(true);
    expect(condition(data(4), ['1.9'])).toBe(true);
    expect(condition(data(-4), [-10])).toBe(true);
    expect(condition(data(-4), ['-5'])).toBe(true);
  });

  it('should filter not matching values (numeric cell type)', () => {
    const data = dateRowFactory({ type: 'numeric' });

    expect(condition(data(4), [43])).toBe(false);
    expect(condition(data(4), ['55'])).toBe(false);
    expect(condition(data(4), [42.99])).toBe(false);
    expect(condition(data(-4), [-2])).toBe(false);
    expect(condition(data(-4), [-3.11])).toBe(false);
  });

  it('should filter matching values (text cell type)', () => {
    const data = dateRowFactory({ type: 'text' });

    expect(condition(data('foo'), ['bar'])).toBe(true);
    expect(condition(data('4'), ['2'])).toBe(true);
    expect(condition(data(4), ['1.9'])).toBe(true);
  });
  it('should filter not matching values (text cell type)', () => {
    const data = dateRowFactory({ type: 'text' });

    expect(condition(data('boo'), ['zar'])).toBe(false);
    expect(condition(data('4'), ['45'])).toBe(false);
    expect(condition(data(4), ['9.9'])).toBe(false);
  });
});
