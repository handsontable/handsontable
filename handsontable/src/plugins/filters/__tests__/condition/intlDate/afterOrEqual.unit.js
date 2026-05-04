import { condition } from 'handsontable/plugins/filters/condition/intlDate/afterOrEqual';
import { dateRowFactory } from '../../helpers/utils';

describe('Filters condition (`intl_date_after_or_equal`)', () => {

  using('data set', [
    // Strictly after
    {
      dateFormat: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      },
      testDate: '2015-12-20',
      startDate: '2015-11-20',
      assumption: true
    },
    // Equal to boundary — must pass (inclusive)
    {
      dateFormat: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      },
      testDate: '2015-12-20',
      startDate: '2015-12-20',
      assumption: true
    },
    // Strictly before — must not pass
    {
      dateFormat: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      },
      testDate: '2015-12-15',
      startDate: '2015-12-20',
      assumption: false
    },
  ], ({ dateFormat, testDate, startDate, assumption }) => {
    it('should filter matching and non-matching values (intl-date cell type)', () => {
      const data = dateRowFactory({ type: 'intl-date', dateFormat });

      expect(condition(data(testDate), [startDate])).toBe(assumption);
    });
  });
});
