import { findClosestMatch, getEditDistance } from 'handsontable/settingsSchema/closestMatch';

describe('getEditDistance', () => {
  it('should count the insertions, deletions and substitutions between two strings', () => {
    expect(getEditDistance('', '')).toBe(0);
    expect(getEditDistance('abc', 'abc')).toBe(0);
    expect(getEditDistance('', 'abc')).toBe(3);
    expect(getEditDistance('abc', '')).toBe(3);
    expect(getEditDistance('colHeader', 'colHeaders')).toBe(1);
    expect(getEditDistance('columnSort', 'columnSorting')).toBe(3);
    expect(getEditDistance('kitten', 'sitting')).toBe(3);
  });

  it('should be symmetric', () => {
    expect(getEditDistance('rowHeaders', 'rowHeigths')).toBe(getEditDistance('rowHeigths', 'rowHeaders'));
  });
});

describe('findClosestMatch', () => {
  const options = ['colHeaders', 'colWidths', 'columnSorting', 'rowHeaders', 'readOnly'];

  it('should return the candidate with the smallest edit distance', () => {
    expect(findClosestMatch('colHeader', options)).toBe('colHeaders');
    expect(findClosestMatch('columnSort', options)).toBe('columnSorting');
    expect(findClosestMatch('rowHeader', options)).toBe('rowHeaders');
  });

  it('should prefer a candidate that differs in letter case only', () => {
    expect(findClosestMatch('readonly', options)).toBe('readOnly');
    expect(findClosestMatch('COLWIDTHS', options)).toBe('colWidths');
  });

  it('should return null when no candidate is close enough', () => {
    expect(findClosestMatch('licenseKeyz', options)).toBeNull();
    expect(findClosestMatch('x', options)).toBeNull();
    expect(findClosestMatch('colHeaders', [])).toBeNull();
  });

  it('should prefer, of equally close candidates, one that starts with the word', () => {
    expect(findClosestMatch('columnSort', ['columns', 'columnSorting'])).toBe('columnSorting');
  });

  it('should return the first of equally close candidates', () => {
    expect(findClosestMatch('ab', ['ac', 'ad'])).toBe('ac');
  });
});
