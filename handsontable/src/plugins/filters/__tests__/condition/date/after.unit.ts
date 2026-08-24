import { condition } from 'handsontable/plugins/filters/condition/date/after';
import { dateRowFactory } from '../../helpers/utils';

describe('Filters condition (`date_after`)', () => {
  using('data set', [
    // Strictly after — should pass
    {
      testDate: '2015-12-20',
      startDate: '2015-11-20',
      assumption: true
    },
    {
      testDate: '2015-05-12',
      startDate: '1999-05-11',
      assumption: true
    },
    // Equal — should not pass (strict)
    {
      testDate: '2015-12-20',
      startDate: '2015-12-20',
      assumption: false
    },
    {
      testDate: '2015-05-12',
      startDate: '2015-05-12',
      assumption: false
    },
    // Strictly before — should not pass
    {
      testDate: '2015-05-12',
      startDate: '2015-05-13',
      assumption: false
    },

    // Non-ISO input dates → both sides must be invalid → false
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
      startDate: '2012', // year-only is not valid ISO
      assumption: false
    },
  ], ({ testDate, startDate, assumption }) => {
    it('should filter matching and non-matching values (ISO date)', () => {
      const data = dateRowFactory({ type: 'date' });

      expect(condition(data(testDate), [startDate])).toBe(assumption);
    });
  });
});
