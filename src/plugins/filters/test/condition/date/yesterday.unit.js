import moment from 'moment';
import {condition, CONDITION_NAME} from 'handsontable-pro/plugins/filters/condition/date/yesterday';
import {dateRowFactory} from './../../helpers/utils';

describe('Filters condition (`date_yesterday`)', function() {
  var format = 'DD/MM/YYYY';

  it('should filter matching values', function() {
    var data = dateRowFactory({dateFormat: format});

    expect(condition(data(moment().add(-1, 'days').format(format)))).toBe(true);
  });

  it('should filter not matching values', function() {
    var data = dateRowFactory({dateFormat: format});

    expect(condition(data(moment().add(-3, 'days').format(format)))).toBe(false);
    expect(condition(data(moment().add(-2, 'days').format(format)))).toBe(false);
    expect(condition(data(moment().format(format)))).toBe(false);
    expect(condition(data(moment().add(1, 'days').format(format)))).toBe(false);
    expect(condition(data(moment().add(2, 'days').format(format)))).toBe(false);
    expect(condition(data(moment().add(3, 'days').format(format)))).toBe(false);
  });
});
