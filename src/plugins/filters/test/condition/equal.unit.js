import {condition, CONDITION_NAME} from 'handsontable-pro/plugins/filters/condition/equal';
import {dateRowFactory} from './../helpers/utils';

describe('Filters condition (`eq`)', function() {

  it('should filter matching values', function() {
    var data = dateRowFactory();

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
    expect(condition(data(null), [void 0])).toBe(true);
  });

  it('should filter not matching values', function() {
    var data = dateRowFactory();

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
