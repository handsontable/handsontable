import { condition } from 'handsontable-pro/plugins/filters/condition/none';
import { dateRowFactory } from './../helpers/utils';

describe('Filters condition (`false`)', () => {
  it('should filter all values', () => {
    const data = dateRowFactory();

    expect(condition(data(4))).toBe(false);
    expect(condition(data('1.9'))).toBe(false);
    expect(condition(data(-10))).toBe(false);
    expect(condition(data('-5'))).toBe(false);
    expect(condition(data(null))).toBe(false);
    expect(condition(data('null'))).toBe(false);
    expect(condition(data(void 0))).toBe(false);
    expect(condition(data(undefined))).toBe(false);
    expect(condition(data('undefined'))).toBe(false);
    expect(condition(data(''))).toBe(false);
    expect(condition(data(true))).toBe(false);
    expect(condition(data('true'))).toBe(false);
    expect(condition(data(false))).toBe(false);
    expect(condition(data('false'))).toBe(false);
  });
});
