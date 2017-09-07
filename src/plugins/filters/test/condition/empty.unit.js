import {condition, CONDITION_NAME} from 'handsontable-pro/plugins/filters/condition/empty';
import {dateRowFactory} from './../helpers/utils';

describe('Filters condition (`empty`)', function() {

  it('should filter matching values', function() {
    var data = dateRowFactory();

    expect(condition(data(''), [])).toBe(true);
    expect(condition(data(null), [])).toBe(true);
    expect(condition(data(void 0), [])).toBe(true);
  });

  it('should filter not matching values', function() {
    var data = dateRowFactory();

    expect(condition(data('tom'), [])).toBe(false);
    expect(condition(data(1), [])).toBe(false);
    expect(condition(data(0), [])).toBe(false);
    expect(condition(data(false), [])).toBe(false);
    expect(condition(data(true), [])).toBe(false);
    expect(condition(data({}), [])).toBe(false);
    expect(condition(data([]), [])).toBe(false);
  });
});
