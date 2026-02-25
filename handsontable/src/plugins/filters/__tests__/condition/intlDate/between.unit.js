import { condition } from 'handsontable/plugins/filters/condition/intlDate/between';
import { dateRowFactory } from '../../helpers/utils';

describe('Filters condition (`intl_date_between`)', () => {

  using('data set', [
    {
      dateFormat: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      },
      testDate: '2015-12-20',
      startDate: '2015-12-19',
      endDate: '2015-12-25',
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
      endDate: '2015-12-20',
      assumption: true
    },
    {
      dateFormat: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      },
      testDate: '2015-12-19',
      startDate: '2015-12-20',
      endDate: '2015-12-21',
      assumption: false
    },
    {
      dateFormat: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      },
      testDate: '2015-12-22',
      startDate: '2015-12-20',
      endDate: '2015-12-21',
      assumption: false
    },
  ], ({ dateFormat, testDate, startDate, endDate, assumption }) => {
    it('should filter matching and non-matching values (date cell type)', () => {
      const data = dateRowFactory({ type: 'intl-date', dateFormat });

      expect(condition(data(testDate), [startDate, endDate])).toBe(assumption);
    });
  });
});
