import {condition, CONDITION_NAME} from 'handsontable-pro/plugins/filters/condition/endsWith';
import {dateRowFactory} from './../helpers/utils';

describe('Filters condition (`ends_with`)', function() {

  it('should filter matching values', function() {
    var data = dateRowFactory();

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

  it('should filter not matching values', function() {
    var data = dateRowFactory();

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
});
