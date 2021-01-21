import { condition } from 'handsontable/plugins/filters/condition/notEmpty';
import { dateRowFactory } from '../helpers/utils';

describe('Filters condition (`not_empty`)', () => {

  it('should filter matching values', () => {
    const data = dateRowFactory();

    expect(condition(data('tom'), [])).toBe(true);
    expect(condition(data(1), [])).toBe(true);
    expect(condition(data(0), [])).toBe(true);
    expect(condition(data(false), [])).toBe(true);
    expect(condition(data(true), [])).toBe(true);
    expect(condition(data({}), [])).toBe(true);
    expect(condition(data([]), [])).toBe(true);
  });

  it('should filter not matching values', () => {
    const data = dateRowFactory();

    expect(condition(data(''), [])).toBe(false);
    expect(condition(data(null), [])).toBe(false);
    expect(condition(data(void 0), [])).toBe(false);
  });
});
