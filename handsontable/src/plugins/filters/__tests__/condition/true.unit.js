import { condition } from 'handsontable/plugins/filters/condition/true';
import { dateRowFactory } from '../helpers/utils';

describe('Filters condition (`true`)', () => {
  it('should filter no values', () => {
    const data = dateRowFactory();

    expect(condition(data(4))).toBe(true);
    expect(condition(data('1.9'))).toBe(true);
    expect(condition(data(-10))).toBe(true);
    expect(condition(data('-5'))).toBe(true);
    expect(condition(data(null))).toBe(true);
    expect(condition(data('null'))).toBe(true);
    expect(condition(data(undefined))).toBe(true);
    expect(condition(data(undefined))).toBe(true);
    expect(condition(data('undefined'))).toBe(true);
    expect(condition(data(''))).toBe(true);
    expect(condition(data(true))).toBe(true);
    expect(condition(data('true'))).toBe(true);
    expect(condition(data(false))).toBe(true);
    expect(condition(data('false'))).toBe(true);
  });
});
