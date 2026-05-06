import { condition } from 'handsontable/plugins/filters/condition/intlTime/before';
import { dateRowFactory } from '../../helpers/utils';

describe('Filters condition (`intl_time_before`)', () => {
  using('data set', [
    {
      timeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      },
      testTime: '20:15',
      startTime: '21:44',
      assumption: true
    },
    {
      timeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      },
      testTime: '23:15',
      startTime: '23:15',
      assumption: false
    },
  ], ({ timeFormat, testTime, startTime, assumption }) => {
    it('should filter matching and non-matching values (time cell type)', () => {
      const data = dateRowFactory({ type: 'intl-time', timeFormat });

      expect(condition(data(testTime), [startTime])).toBe(assumption);
    });
  });
});
