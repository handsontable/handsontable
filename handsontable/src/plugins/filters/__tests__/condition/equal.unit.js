import { condition } from 'handsontable/plugins/filters/condition/equal';
import { dateRowFactory } from '../helpers/utils';

describe('Filters condition (`eq`)', () => {

  it('should filter matching values', () => {
    const data = dateRowFactory();

    expect(condition(data('tom'), ['tom'])).toBe(true);
    expect(condition(data('2015-10-10'), ['2015-10-10'])).toBe(true);

    expect(condition(data(1), [1])).toBe(true);
    expect(condition(data('1'), [1])).toBe(true);
    expect(condition(data(1), ['1'])).toBe(true);

    expect(condition(data(true), [true])).toBe(true);
    expect(condition(data(true), ['true'])).toBe(true);
    expect(condition(data('true'), [true])).toBe(true);

    expect(condition(data(null), [null])).toBe(true);
    expect(condition(data(null), [''])).toBe(true);
    expect(condition(data(null), [undefined])).toBe(true);
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

  it('should handle locales properly', () => {
    const data = dateRowFactory({ locale: 'tr-TR' });

    expect(condition(data('İnanç'), ['inanç'])).toBe(true);
    expect(condition(data('İNANÇ'), ['inanç'])).toBe(true);
  });
});
