import { condition } from 'handsontable/plugins/filters/condition/between';
import { dateRowFactory } from '../helpers/utils';

describe('Filters condition (`between`)', () => {

  it('should filter matching values (numeric cell type)', () => {
    const data = dateRowFactory({ type: 'numeric' });

    expect(condition(data(4), [4, 9])).toBe(true);
    expect(condition(data(4), [4, 4])).toBe(true);
    expect(condition(data(4), [9, 3])).toBe(true);
    expect(condition(data(4), [3.999, 6.9])).toBe(true);
    expect(condition(data(4), ['3.999', 6.9])).toBe(true);
    expect(condition(data(4), ['3.999', '6.9'])).toBe(true);
    expect(condition(data(-4), [-9, -3])).toBe(true);
    expect(condition(data(-4), [-4, -4])).toBe(true);
    expect(condition(data(-4), ['-4', '-4'])).toBe(true);
  });

  it('should filter not matching values (numeric cell type)', () => {
    const data = dateRowFactory({ type: 'numeric' });

    expect(condition(data(4), [1, 3])).toBe(false);
    expect(condition(data(4), [-4, 3])).toBe(false);
    expect(condition(data(4), [5, 53])).toBe(false);
    expect(condition(data(4), [4.00001, 53])).toBe(false);
    expect(condition(data(4), ['5', '53'])).toBe(false);
    expect(condition(data(-4), [5, 53])).toBe(false);
    expect(condition(data(-4), [-10, -5])).toBe(false);
    expect(condition(data(-4), ['-10', '-5'])).toBe(false);
  });

  using('data set', [
    // Valid ISO range comparisons
    {
      testDate: '2015-12-20',
      startDate: '2015-11-20',
      endDate: '2015-12-24',
      assumption: true
    },
    // Inclusive boundary — should pass
    {
      testDate: '2015-12-20',
      startDate: '2015-12-20',
      endDate: '2015-12-20',
      assumption: true
    },
    {
      testDate: '2015-05-12',
      startDate: '2015-05-11',
      endDate: '2015-05-13',
      assumption: true
    },
    {
      testDate: '2015-05-12',
      startDate: '1999-05-11',
      endDate: '2099-05-13',
      assumption: true
    },
    // Out of range — should not pass
    {
      testDate: '2015-12-20',
      startDate: '2013-01-01',
      endDate: '2014-12-31',
      assumption: false
    },
    // Non-ISO dates → all parse to null → false
    {
      testDate: '20/12/2015',
      startDate: '2015-11-20',
      endDate: '2015-12-24',
      assumption: false
    },
    {
      testDate: '2015-12-20',
      startDate: '2013-01-01',
      endDate: 'bar',
      assumption: false
    },
    {
      testDate: '2015-12-20',
      startDate: '2015',
      endDate: '2016',
      assumption: false // year-only is not valid ISO
    },
  ], ({ testDate, startDate, endDate, assumption }) => {
    it('should filter matching and non-matching values (date cell type)', () => {
      const data = dateRowFactory({ type: 'date' });

      expect(condition(data(testDate), [startDate, endDate])).toBe(assumption);
    });
  });

  it('should filter matching values (text cell type)', () => {
    const data = dateRowFactory({ type: 'text' });

    expect(condition(data('f'), ['a', 'z'])).toBe(true);
    expect(condition(data('foo'), ['a', 'z'])).toBe(true);
    expect(condition(data('foo'), ['f', 'z'])).toBe(true);
    expect(condition(data('f'), ['f', 'f'])).toBe(true);
  });
});
