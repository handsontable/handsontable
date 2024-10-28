import { condition } from 'handsontable/plugins/filters/condition/notEqual';
import { dateRowFactory } from '../helpers/utils';

describe('Filters condition (`neq`)', () => {

  it('should filter matching values', () => {
    const data = dateRowFactory();

    expect(condition(data('tom'), ['o'])).toBe(true);
    expect(condition(data('tom'), ['m'])).toBe(true);
    expect(condition(data('tom'), ['tomeeee'])).toBe(true);
    expect(condition(data('2015-10-10'), ['2015/10'])).toBe(true);

    expect(condition(data(1), ['2'])).toBe(true);
    expect(condition(data('1'), [2])).toBe(true);
    expect(condition(data(1), ['2'])).toBe(true);

    expect(condition(data(true), [false])).toBe(true);
    expect(condition(data(true), ['false'])).toBe(true);
    expect(condition(data('true'), [false])).toBe(true);
    expect(condition(data(true), ['e'])).toBe(true);
  });

  it('should filter not matching values', () => {
    const data = dateRowFactory();

    expect(condition(data('tom'), ['tom'])).toBe(false);
    expect(condition(data('2015-10-10'), ['2015-10-10'])).toBe(false);

    expect(condition(data(1), [1])).toBe(false);
    expect(condition(data('1'), [1])).toBe(false);
    expect(condition(data(1), ['1'])).toBe(false);

    expect(condition(data(true), [true])).toBe(false);
    expect(condition(data(true), ['true'])).toBe(false);
    expect(condition(data('true'), [true])).toBe(false);

    expect(condition(data(null), [null])).toBe(false);
    expect(condition(data(null), [''])).toBe(false);
    expect(condition(data(null), [undefined])).toBe(false);
  });
});
