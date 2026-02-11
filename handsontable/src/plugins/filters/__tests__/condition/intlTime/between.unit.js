import { condition } from 'handsontable/plugins/filters/condition/intlTime/between';
import { dateRowFactory } from '../../helpers/utils';

describe('Filters condition (`intl_time_between`)', () => {
  using('data set', [
    {
      timeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      },
      testTime: '21:55',
      startTime: '21:44',
      endTime: '22:44',
      assumption: true
    },
    {
      timeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      },
      testTime: '21:55',
      startTime: '21:55',
      endTime: '21:55',
      assumption: true
    },
    {
      timeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      },
      testTime: '21:50',
      startTime: '21:55',
      endTime: '22:55',
      assumption: false
    },
    {
      timeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      },
      testTime: '23:50',
      startTime: '21:55',
      endTime: '22:55',
      assumption: false
    },
  ], ({ timeFormat, testTime, startTime, endTime, assumption }) => {
    it('should filter matching and non-matching values (time cell type)', () => {
      const data = dateRowFactory({ type: 'intl-time', timeFormat });

      expect(condition(data(testTime), [startTime, endTime])).toBe(assumption);
    });
  });
});
