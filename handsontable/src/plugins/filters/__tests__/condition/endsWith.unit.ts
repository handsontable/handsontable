import { condition } from 'handsontable/plugins/filters/condition/endsWith';
import { dateRowFactory } from '../helpers/utils';

describe('Filters condition (`ends_with`)', () => {

  it('should filter matching values', () => {
    const data = dateRowFactory();

    expect(condition(data('tom'), [''])).toBe(true);
    expect(condition(data('tom'), ['m'])).toBe(true);
    expect(condition(data('tom'), ['om'])).toBe(true);
    expect(condition(data('tom'), ['tom'])).toBe(true);
    expect(condition(data('2015-10-10'), ['-10'])).toBe(true);
    expect(condition(data('2015-10-10'), ['10-10'])).toBe(true);

    expect(condition(data(1), [1])).toBe(true);
    expect(condition(data('1'), [1])).toBe(true);
    expect(condition(data(1), ['1'])).toBe(true);

    expect(condition(data(true), [true])).toBe(true);
    expect(condition(data(true), ['true'])).toBe(true);
    expect(condition(data('true'), [true])).toBe(true);
    expect(condition(data(true), ['e'])).toBe(true);
  });

  it('should filter not matching values', () => {
    const data = dateRowFactory();

    expect(condition(data('tom'), ['o'])).toBe(false);
    expect(condition(data('tom'), ['m '])).toBe(false);
    expect(condition(data('tom'), ['tttttom'])).toBe(false);
    expect(condition(data('2015-10-10'), ['/10'])).toBe(false);

    expect(condition(data(1), ['2'])).toBe(false);
    expect(condition(data('1'), [2])).toBe(false);
    expect(condition(data(1), ['2'])).toBe(false);

    expect(condition(data(true), [false])).toBe(false);
    expect(condition(data(true), ['false'])).toBe(false);
    expect(condition(data('true'), [false])).toBe(false);
    expect(condition(data(true), [' true'])).toBe(false);
  });

  it('should handle locales properly', () => {
    const data = dateRowFactory({ locale: 'tr-TR' });

    expect(condition(data('İnanç'), ['ç'])).toBe(true);
    expect(condition(data('İnanç'), ['nç'])).toBe(true);
    expect(condition(data('İnanç'), ['anç'])).toBe(true);
    expect(condition(data('İnanç'), ['nanç'])).toBe(true);
    expect(condition(data('İnanç'), ['inanç'])).toBe(true);

    expect(condition(data('İNANÇ'), ['ç'])).toBe(true);
    expect(condition(data('İNANÇ'), ['nç'])).toBe(true);
    expect(condition(data('İNANÇ'), ['anç'])).toBe(true);
    expect(condition(data('İNANÇ'), ['nanç'])).toBe(true);
    expect(condition(data('İNANÇ'), ['inanç'])).toBe(true);
  });
});
