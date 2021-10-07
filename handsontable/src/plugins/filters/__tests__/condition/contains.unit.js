import { condition } from 'handsontable/plugins/filters/condition/contains';
import { dateRowFactory } from '../helpers/utils';

describe('Filters condition (`contains`)', () => {

  it('should filter matching values', () => {
    const data = dateRowFactory();

    expect(condition(data('tom'), [''])).toBe(true);
    expect(condition(data('tom'), ['t'])).toBe(true);
    expect(condition(data('tom'), ['o'])).toBe(true);
    expect(condition(data('tom'), ['om'])).toBe(true);
    expect(condition(data('2015-10-10'), ['015'])).toBe(true);
    expect(condition(data('2015-10-10'), ['15-10-10'])).toBe(true);

    expect(condition(data(1), [1])).toBe(true);
    expect(condition(data('1'), [1])).toBe(true);
    expect(condition(data(1), ['1'])).toBe(true);

    expect(condition(data(true), ['ue'])).toBe(true);
    expect(condition(data(true), ['tr'])).toBe(true);
    expect(condition(data('true'), ['r'])).toBe(true);
    expect(condition(data(true), ['t'])).toBe(true);
  });

  it('should filter not matching values', () => {
    const data = dateRowFactory();

    expect(condition(data('tom'), ['ome'])).toBe(false);
    expect(condition(data('tom'), ['mt'])).toBe(false);
    expect(condition(data('tom'), ['z'])).toBe(false);
    expect(condition(data('2015-10-10'), ['/10'])).toBe(false);

    expect(condition(data(1), ['2'])).toBe(false);
    expect(condition(data('1'), [2])).toBe(false);
    expect(condition(data(1), ['2'])).toBe(false);

    expect(condition(data(true), ['truee'])).toBe(false);
    expect(condition(data(true), ['true '])).toBe(false);
    expect(condition(data('true'), [false])).toBe(false);
    expect(condition(data(true), ['e '])).toBe(false);
  });
});
