import {condition, CONDITION_NAME} from 'handsontable-pro/plugins/filters/condition/notBetween';
import {dateRowFactory} from './../helpers/utils';

describe('Filters condition (`not_between`)', function() {

  it('should filter matching values (numeric cell type)', function() {
    var data = dateRowFactory({type: 'numeric'});

    expect(condition(data(4), [1, 3])).toBe(true);
    expect(condition(data(4), [-4, 3])).toBe(true);
    expect(condition(data(4), [5, 53])).toBe(true);
    expect(condition(data(4), [4.00001, 53])).toBe(true);
    expect(condition(data(4), ['5', '53'])).toBe(true);
    expect(condition(data(-4), [5, 53])).toBe(true);
    expect(condition(data(-4), [-10, -5])).toBe(true);
    expect(condition(data(-4), ['-10', '-5'])).toBe(true);
  });

  it('should filter not matching values (numeric cell type)', function() {
    var data = dateRowFactory({type: 'numeric'});

    expect(condition(data(4), [4, 9])).toBe(false);
    expect(condition(data(4), [4, 4])).toBe(false);
    expect(condition(data(4), [9, 3])).toBe(false);
    expect(condition(data(4), [3.999, 6.9])).toBe(false);
    expect(condition(data(4), ['3.999', 6.9])).toBe(false);
    expect(condition(data(4), ['3.999', '6.9'])).toBe(false);
    expect(condition(data(-4), [-9, -3])).toBe(false);
    expect(condition(data(-4), [-4, -4])).toBe(false);
    expect(condition(data(-4), ['-4', '-4'])).toBe(false);
  });

  it('should filter matching values (date cell type)', function() {
    var data = dateRowFactory({type: 'date', dateFormat: 'YYYY-MM-DD'});

    expect(condition(data('2015-12-20'), ['2015-11-20', '2015-12-24'])).toBe(false);
    expect(condition(data('2015-12-20'), ['2015-12-20', '2015-12-20'])).toBe(false);
    expect(condition(data('2015-12-20'), ['2013', '2014'])).toBe(true);
    expect(condition(data('2015-12-20'), ['2013', 'bar'])).toBe(true);
  });

  it('should filter not matching values (date cell type)', function() {
    var data = dateRowFactory({type: 'date', dateFormat: 'YYYY-MM-DD'});

    expect(condition(data('2015-12-20'), ['2015-11-20', '2015-12-24'])).toBe(false);
    expect(condition(data('2015-12-20'), ['2015-12-20', '2015-12-20'])).toBe(false);
    expect(condition(data('2015-12-20'), ['2015', '2016'])).toBe(false);
  });

  it('should filter matching values (text cell type)', function() {
    var data = dateRowFactory({type: 'text'});

    expect(condition(data('f'), ['a', 'z'])).toBe(false);
    expect(condition(data('foo'), ['a', 'z'])).toBe(false);
    expect(condition(data('foo'), ['f', 'z'])).toBe(false);
    expect(condition(data('f'), ['f', 'f'])).toBe(false);
  });
});
