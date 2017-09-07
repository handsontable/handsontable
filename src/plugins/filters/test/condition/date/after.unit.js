import {condition, CONDITION_NAME} from 'handsontable-pro/plugins/filters/condition/date/after';
import {dateRowFactory} from './../../helpers/utils';

describe('Filters condition (`date_after`)', function() {

  it('should filter matching values', function() {
    var data = dateRowFactory({dateFormat: 'DD/MM/YYYY'});

    expect(condition(data('12/05/2015'), ['12/05/2015'])).toBe(true);
    expect(condition(data('12/05/2015'), ['11/05/2015'])).toBe(true);
    expect(condition(data('12/05/2015'), ['11/05/1999'])).toBe(true);
    expect(condition(data('12/05/2015'), ['11-05-1999'])).toBe(true);
    // Invalid format
    expect(condition(data('12/05/2015'), ['2012'])).toBe(false);
  });

  it('should filter not matching values', function() {
    var data = dateRowFactory({dateFormat: 'DD/MM/YYYY'});

    expect(condition(data('12/05/2015'), ['13/05/2015'])).toBe(false);
    expect(condition(data('12/05/2015'), ['05/2015'])).toBe(false);
    expect(condition(data('12/05/2015'), ['2017'])).toBe(false);
  });
});
