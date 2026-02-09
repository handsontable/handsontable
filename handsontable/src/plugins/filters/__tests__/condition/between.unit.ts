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
    {
      dateFormat: 'YYYY-MM-DD',
      testDate: '2015-12-20',
      startDate: '2015-11-20',
      endDate: '2015-12-24',
      assumption: true
    },
    {
      dateFormat: 'YYYY-MM-DD',
      testDate: '2015-12-20',
      startDate: '2015-12-20',
      endDate: '2015-12-20',
      assumption: true
    },
    {
      dateFormat: 'YYYY-MM-DD',
      testDate: '2015-12-20',
      startDate: '2015',
      endDate: '2016',
      assumption: true
    },
    {
      dateFormat: 'YYYY-MM-DD',
      testDate: '2015-12-20',
      startDate: '2013',
      endDate: '2014',
      assumption: false
    },
    {
      dateFormat: 'YYYY-MM-DD',
      testDate: '2015-12-20',
      startDate: '2013',
      endDate: 'bar',
      assumption: false
    },
    {
      dateFormat: 'DD/MM/YY',
      testDate: '20/12/15',
      startDate: '01/01/14',
      endDate: '01/01/16',
      assumption: true
    },
    {
      dateFormat: 'D.M.YY',
      testDate: '20.12.15',
      startDate: '1.1.14',
      endDate: '1.1.16',
      assumption: true
    },
    {
      dateFormat: 'YYYY MMMM Do',
      testDate: '2015 February 2nd',
      startDate: '2003 March 11th',
      endDate: '2032 March 13rd',
      assumption: true
    },
    {
      dateFormat: '[The] Do [of] MMMM \'YY',
      testDate: 'The 2nd of February \'23',
      startDate: 'The 2nd of March \'13',
      endDate: 'The 12th of December \'23',
      assumption: true
    },

    // Improper date format configuration:
    {
      dateFormat: 'YYYY-MM-DD',
      testDate: '15-12-20',
      startDate: '15-11-20',
      endDate: '15-12-24',
      assumption: true
    },
    {
      dateFormat: 'YY-MM-DD',
      testDate: '2015-12-20',
      startDate: '2015-12-20',
      endDate: '2015-12-20',
      assumption: true
    },
    {
      dateFormat: 'YYYY-M-D',
      testDate: '2015-05-03',
      startDate: '2015',
      endDate: '2016',
      assumption: true
    },
    {
      dateFormat: 'D.M.YY',
      testDate: '1.2.2032',
      startDate: '1.2.1975',
      endDate: '1.2.2035',
      assumption: true
    },
  ], ({ dateFormat, testDate, startDate, endDate, assumption }) => {
    it('should filter matching and non-matching values (date cell type)', () => {
      const data = dateRowFactory({ type: 'date', dateFormat });

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
