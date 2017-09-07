import {condition, CONDITION_NAME} from 'handsontable-pro/plugins/filters/condition/lessThanOrEqual';
import {dateRowFactory} from './../helpers/utils';

describe('Filters condition (`lte`)', function() {

  it('should filter matching values (numeric cell type)', function() {
    var data = dateRowFactory({type: 'numeric'});

    expect(condition(data(4), [4])).toBe(true);
    expect(condition(data(3), [4])).toBe(true);
    expect(condition(data(2), [4])).toBe(true);
    expect(condition(data('1.9'), [2])).toBe(true);
    expect(condition(data(-10), [-4])).toBe(true);
    expect(condition(data('-5'), [-4])).toBe(true);
  });

  it('should filter not matching values (numeric cell type)', function() {
    var data = dateRowFactory({type: 'numeric'});

    expect(condition(data(43), [4])).toBe(false);
    expect(condition(data('55'), [4])).toBe(false);
    expect(condition(data(42.99), [4])).toBe(false);
    expect(condition(data(-2), [-4])).toBe(false);
    expect(condition(data(-3.11), [-4])).toBe(false);
  });

  it('should filter matching values (text cell type)', function() {
    var data = dateRowFactory({type: 'text'});

    expect(condition(data('bar'), ['foo'])).toBe(true);
    expect(condition(data('2'), ['4'])).toBe(true);
    expect(condition(data('1.9'), [4])).toBe(true);
  });

  it('should filter not matching values (text cell type)', function() {
    var data = dateRowFactory({type: 'text'});

    expect(condition(data('zar'), ['boo'])).toBe(false);
    expect(condition(data('45'), ['4'])).toBe(false);
    expect(condition(data('9.9'), [4])).toBe(false);
  });
});
