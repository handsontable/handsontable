import {condition, CONDITION_NAME} from 'handsontable-pro/plugins/filters/condition/byValue';
import {dateRowFactory} from './../helpers/utils';

describe('Filters condition (`by_value`)', function() {

  function assertion(items) {
    return function(value) {
      return items.indexOf(value) !== -1;
    };
  }

  it('should filter matching values', function() {
    var data = dateRowFactory();

    expect(condition(data(4), [assertion([4])])).toBe(true);
    expect(condition(data(4), [assertion([4, 4])])).toBe(true);
    expect(condition(data(4), [assertion([1, 2, 3, 4, 5, 6, 7, 8])])).toBe(true);
    expect(condition(data('4'), [assertion(['5', '4'])])).toBe(true);
    expect(condition(data('2015'), [assertion(['2019', '2014', '2015'])])).toBe(true);
    expect(condition(data('foo'), [assertion(['foo', 'bar', 'baz'])])).toBe(true);
    expect(condition(data(-1), [assertion([-9, -3, -1])])).toBe(true);
    expect(condition(data(''), [assertion([-9, '', -1])])).toBe(true);
    expect(condition(data(null), [assertion([-9, null, -1])])).toBe(true);
    expect(condition(data(void 0), [assertion([-9, void 0, -1])])).toBe(true);
  });

  it('should filter not matching values', function() {
    var data = dateRowFactory();

    expect(condition(data(null), [assertion([-9, '', -1])])).toBe(false);
    expect(condition(data(void 0), [assertion([-9, '', -1])])).toBe(false);
    expect(condition(data(4), [assertion([1, 9])])).toBe(false);
    expect(condition(data(4), [assertion([1, 1, 2, 3, 4.8])])).toBe(false);
    expect(condition(data(4), [assertion([1, 2, 3, 5, 6, 7, 8])])).toBe(false);
    expect(condition(data('4'), [assertion(['5', '4:)'])])).toBe(false);
    expect(condition(data('2015'), [assertion(['2019.', '2014.', '2015.'])])).toBe(false);
    expect(condition(data('foo'), [assertion(['fooo', 'bar', 'baz'])])).toBe(false);
    expect(condition(data(-1), [assertion([-9, -3, -1.1])])).toBe(false);
  });
});
