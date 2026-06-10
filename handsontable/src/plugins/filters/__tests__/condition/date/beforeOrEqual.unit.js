import { condition } from 'handsontable/plugins/filters/condition/date/beforeOrEqual';
import { dateRowFactory } from '../../helpers/utils';

describe('Filters condition (`date_before_or_equal`)', () => {

  using('data set', [
    // Strictly before — always passes
    {
      testDate: '2015-12-20',
      startDate: '2015-12-24',
      assumption: true
    },
    // Equal to boundary — must pass (inclusive)
    {
      testDate: '2015-12-20',
      startDate: '2015-12-20',
      assumption: true
    },
    {
      testDate: '2015-05-12',
      startDate: '2015-05-12',
      assumption: true
    },
    {
      testDate: '2015-05-12',
      startDate: '2015-05-13',
      assumption: true
    },
    {
      testDate: '2015-05-12',
      startDate: '2099-05-13',
      assumption: true
    },
    // Strictly after — must not pass
    {
      testDate: '2015-05-12',
      startDate: '2015-05-11',
      assumption: false
    },
    // Non-ISO input dates → false
    {
      testDate: '12/05/2015',
      startDate: '2015-05-13',
      assumption: false
    },
    {
      testDate: '2015-12-20',
      startDate: '06/2015',
      assumption: false
    },
    {
      testDate: '2015-12-20',
      startDate: '2017',
      assumption: false
    },
  ], ({ testDate, startDate, assumption }) => {
    it('should filter matching and non-matching values (ISO date)', () => {
      const data = dateRowFactory({ type: 'date' });

      expect(condition(data(testDate), [startDate])).toBe(assumption);
    });
  });
});
