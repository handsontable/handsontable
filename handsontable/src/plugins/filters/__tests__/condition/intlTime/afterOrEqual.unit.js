import { condition } from 'handsontable/plugins/filters/condition/intlTime/afterOrEqual';
import { dateRowFactory } from '../../helpers/utils';

describe('Filters condition (`intl_time_after_or_equal`)', () => {
  using('data set', [
    // Strictly after
    {
      timeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      },
      testTime: '23:15',
      startTime: '20:44',
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
    // Strictly before — must not pass
    {
      timeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      },
      testTime: '10:00',
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
