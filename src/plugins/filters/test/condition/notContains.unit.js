import {condition, CONDITION_NAME} from 'handsontable-pro/plugins/filters/condition/notContains';
import {dateRowFactory} from './../helpers/utils';

describe('Filters condition (`not_contains`)', function() {

  it('should filter matching values', function() {
    var data = dateRowFactory();

    expect(condition(data('tom'), ['ome'])).toBe(true);
    expect(condition(data('tom'), ['mt'])).toBe(true);
    expect(condition(data('tom'), ['z'])).toBe(true);
    expect(condition(data('2015-10-10'), ['/10'])).toBe(true);

    expect(condition(data(1), ['2'])).toBe(true);
    expect(condition(data('1'), [2])).toBe(true);
    expect(condition(data(1), ['2'])).toBe(true);

    expect(condition(data(true), ['truee'])).toBe(true);
    expect(condition(data(true), ['true '])).toBe(true);
    expect(condition(data('true'), [false])).toBe(true);
    expect(condition(data(true), ['e '])).toBe(true);
  });

  it('should filter not matching values', function() {
    var data = dateRowFactory();

    expect(condition(data('tom'), [''])).toBe(false);
    expect(condition(data('tom'), ['t'])).toBe(false);
    expect(condition(data('tom'), ['o'])).toBe(false);
    expect(condition(data('tom'), ['om'])).toBe(false);
    expect(condition(data('2015-10-10'), ['015'])).toBe(false);
    expect(condition(data('2015-10-10'), ['15-10-10'])).toBe(false);

    expect(condition(data(1), [1])).toBe(false);
    expect(condition(data('1'), [1])).toBe(false);
    expect(condition(data(1), ['1'])).toBe(false);

    expect(condition(data(true), ['ue'])).toBe(false);
    expect(condition(data(true), ['tr'])).toBe(false);
    expect(condition(data('true'), ['r'])).toBe(false);
    expect(condition(data(true), ['t'])).toBe(false);
  });
});
