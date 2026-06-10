import { condition } from 'handsontable/plugins/filters/condition/date/afterOrEqual';
import { dateRowFactory } from '../../helpers/utils';

describe('Filters condition (`date_after_or_equal`)', () => {

  using('data set', [
    // Strictly after — always passes
    {
      testDate: '2015-12-20',
      startDate: '2015-11-20',
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
      startDate: '2015-05-11',
      assumption: true
    },
    {
      testDate: '2015-05-12',
      startDate: '1999-05-11',
      assumption: true
    },
    // Strictly before — must not pass
    {
      testDate: '2015-05-12',
      startDate: '2015-05-13',
      assumption: false
    },
    // Non-ISO input dates → false
    {
      testDate: '12/05/2015',
      startDate: '2015-05-11',
      assumption: false
    },
    {
      testDate: '2015-12-20',
      startDate: '05/2015',
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
