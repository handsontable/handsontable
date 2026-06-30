import { condition } from 'handsontable/plugins/filters/condition/intlDate/after';
import { dateRowFactory } from '../../helpers/utils';

describe('Filters condition (`intl_date_after`)', () => {
  using('data set', [
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
    {
      dateFormat: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      },
      testDate: '2015-12-20',
      startDate: '2015-12-20',
      assumption: false
    },
  ], ({ dateFormat, testDate, startDate, assumption }) => {
    it('should filter matching and non-matching values (date cell type)', () => {
      const data = dateRowFactory({ type: 'intl-date', dateFormat });

      expect(condition(data(testDate), [startDate])).toBe(assumption);
    });
  });
});
