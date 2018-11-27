import { condition } from 'handsontable-pro/plugins/filters/condition/date/before';
import { dateRowFactory } from './../../helpers/utils';

describe('Filters condition (`date_before`)', () => {
  it('should filter matching values', () => {
    const data = dateRowFactory({ dateFormat: 'DD/MM/YYYY' });

    expect(condition(data('12/05/2015'), ['12/05/2015'])).toBe(true);
    expect(condition(data('12/05/2015'), ['13/05/2015'])).toBe(true);
    expect(condition(data('12/05/2015'), ['14/05/2018'])).toBe(true);
    expect(condition(data('12/05/2015'), ['14-05-2019'])).toBe(true);
  });

  it('should filter not matching values', () => {
    const data = dateRowFactory({ dateFormat: 'DD/MM/YYYY' });

    expect(condition(data('12/05/2015'), ['11/05/2015'])).toBe(false);
    expect(condition(data('12/05/2015'), ['05/2014'])).toBe(false);
    expect(condition(data('12/05/2015'), ['2014'])).toBe(false);
  });
});
