import { condition } from 'handsontable/plugins/filters/condition/date/beforeOrEqual';
import { dateRowFactory } from '../../helpers/utils';

describe('Filters condition (`date_before_or_equal`)', () => {

  using('data set', [
    // Strictly before — always passes
    {
      dateFormat: 'YYYY-MM-DD',
      testDate: '2015-12-20',
      startDate: '2015-12-24',
      assumption: true
    },
    // Equal to boundary — must pass (inclusive)
    {
      dateFormat: 'YYYY-MM-DD',
      testDate: '2015-12-20',
      startDate: '2015-12-20',
      assumption: true
    },
    {
      dateFormat: 'DD/MM/YYYY',
      testDate: '12/05/2015',
      startDate: '12/05/2015',
      assumption: true
    },
    {
      dateFormat: 'DD/MM/YYYY',
      testDate: '12/05/2015',
      startDate: '13/05/2015',
      assumption: true
    },
    {
      dateFormat: 'DD/MM/YYYY',
      testDate: '12/05/2015',
      startDate: '13/05/2099',
      assumption: true
    },
    // Strictly after — must not pass
    {
      dateFormat: 'DD/MM/YYYY',
      testDate: '12/05/2015',
      startDate: '11/05/2015',
      assumption: false
    },
    // Improper date format
    {
      dateFormat: 'DD/MM/YYYY',
      testDate: '12/05/2015',
      startDate: '06/2015',
      assumption: false
    },
    {
      dateFormat: 'DD/MM/YYYY',
      testDate: '12/05/2015',
      startDate: '2017',
      assumption: false
    },
  ], ({ dateFormat, testDate, startDate, assumption }) => {
    it('should filter matching and non-matching values (date cell type)', () => {
      const data = dateRowFactory({ type: 'date', dateFormat });

      expect(condition(data(testDate), [startDate])).toBe(assumption);
    });
  });
});
