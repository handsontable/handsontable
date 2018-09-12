import { condition } from 'handsontable-pro/plugins/filters/condition/beginsWith';
import { dateRowFactory } from './../helpers/utils';

describe('Filters condition (`begins_with`)', () => {

  it('should filter matching values', () => {
    const data = dateRowFactory();

    expect(condition(data('tom'), [''])).toBe(true);
    expect(condition(data('tom'), ['t'])).toBe(true);
    expect(condition(data('tom'), ['to'])).toBe(true);
    expect(condition(data('tom'), ['tom'])).toBe(true);
    expect(condition(data('2015-10-10'), ['2015'])).toBe(true);
    expect(condition(data('2015-10-10'), ['2015-10'])).toBe(true);

    expect(condition(data(1), [1])).toBe(true);
    expect(condition(data('1'), [1])).toBe(true);
    expect(condition(data(1), ['1'])).toBe(true);

    expect(condition(data(true), [true])).toBe(true);
    expect(condition(data(true), ['true'])).toBe(true);
    expect(condition(data('true'), [true])).toBe(true);
    expect(condition(data(true), ['t'])).toBe(true);
  });

  it('should filter not matching values', () => {
    const data = dateRowFactory();

    expect(condition(data('tom'), ['o'])).toBe(false);
    expect(condition(data('tom'), ['m'])).toBe(false);
    expect(condition(data('tom'), ['tomeeee'])).toBe(false);
    expect(condition(data('2015-10-10'), ['2015/10'])).toBe(false);

    expect(condition(data(1), ['2'])).toBe(false);
    expect(condition(data('1'), [2])).toBe(false);
    expect(condition(data(1), ['2'])).toBe(false);

    expect(condition(data(true), [false])).toBe(false);
    expect(condition(data(true), ['false'])).toBe(false);
    expect(condition(data('true'), [false])).toBe(false);
    expect(condition(data(true), ['e'])).toBe(false);
  });
});
