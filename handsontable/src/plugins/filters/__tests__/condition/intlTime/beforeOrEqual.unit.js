import { condition } from 'handsontable/plugins/filters/condition/intlTime/beforeOrEqual';
import { dateRowFactory } from '../../helpers/utils';

describe('Filters condition (`intl_time_before_or_equal`)', () => {
  using('data set', [
    // Strictly before
    {
      timeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      },
      testTime: '10:00',
      startTime: '23:15',
      assumption: true
    },
    // Equal to boundary — must pass (inclusive)
    {
      timeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      },
      testTime: '23:15',
      startTime: '23:15',
      assumption: true
    },
    // Strictly after — must not pass
    {
      timeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      },
      testTime: '23:15',
      startTime: '10:00',
      assumption: false
    },
  ], ({ timeFormat, testTime, startTime, assumption }) => {
    it('should filter matching and non-matching values (time cell type)', () => {
      const data = dateRowFactory({ type: 'intl-time', timeFormat });

      expect(condition(data(testTime), [startTime])).toBe(assumption);
    });
  });
});
