import moment from 'moment';
import { condition } from 'handsontable-pro/plugins/filters/condition/date/today';
import { dateRowFactory } from './../../helpers/utils';

describe('Filters condition (`date_today`)', () => {
  const format = 'DD/MM/YYYY';

  it('should filter matching values', () => {
    const data = dateRowFactory({ dateFormat: format });

    expect(condition(data(moment().format(format)))).toBe(true);
  });

  it('should filter not matching values', () => {
    const data = dateRowFactory({ dateFormat: format });

    expect(condition(data(moment().add(-3, 'days').format(format)))).toBe(false);
    expect(condition(data(moment().add(-2, 'days').format(format)))).toBe(false);
    expect(condition(data(moment().add(-1, 'days').format(format)))).toBe(false);
    expect(condition(data(moment().add(1, 'days').format(format)))).toBe(false);
    expect(condition(data(moment().add(2, 'days').format(format)))).toBe(false);
    expect(condition(data(moment().add(3, 'days').format(format)))).toBe(false);
  });
});
