import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from 'dayjs/plugin/utc';
import { condition } from 'handsontable/plugins/filters/condition/date/yesterday';
import { dateRowFactory } from '../../helpers/utils';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

describe('Filters condition (`date_yesterday`)', () => {
  const format = 'DD/MM/YYYY';

  it('should filter matching values', () => {
    const data = dateRowFactory({ dateFormat: format });

    expect(condition(data(dayjs().subtract(1, 'day').format(format)))).toBe(true);
  });

  it('should filter not matching values', () => {
    const data = dateRowFactory({ dateFormat: format });

    expect(condition(data(dayjs().subtract(3, 'day').format(format)))).toBe(false);
    expect(condition(data(dayjs().subtract(2, 'day').format(format)))).toBe(false);
    expect(condition(data(dayjs().format(format)))).toBe(false);
    expect(condition(data(dayjs().add(1, 'day').format(format)))).toBe(false);
    expect(condition(data(dayjs().add(2, 'day').format(format)))).toBe(false);
    expect(condition(data(dayjs().add(3, 'day').format(format)))).toBe(false);
  });
});
