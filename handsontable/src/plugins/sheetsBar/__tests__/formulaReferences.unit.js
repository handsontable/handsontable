import { remapOwnSheetReferences } from '../formulaReferences';

/**
 * Builds an index map from a lookup array; an index past it maps to itself.
 *
 * @param {number[]} lookup The mapped index of each index.
 * @returns {Function}
 */
function mapOf(lookup) {
  return index => lookup[index] ?? index;
}

const identity = index => index;
const isS = name => name.toLowerCase() === 's';

describe('remapOwnSheetReferences()', () => {
  it('rewrites the rows and columns of the references to its own sheet, relative or absolute', () => {
    expect(remapOwnSheetReferences('=A1+$B$2+C$3', isS, mapOf([2, 0, 1]), mapOf([1, 2, 0])))
      .toBe('=B3+$C$1+A$2');
  });

  it('leaves references to other sheets as they are, also at the end of a range', () => {
    expect(remapOwnSheetReferences('=Main!A1+B1+SUM(Main!A1:A2)', isS, mapOf([1, 0]), mapOf([1, 0])))
      .toBe('=Main!A1+A2+SUM(Main!A1:A2)');
  });

  it('rewrites a reference that names its own sheet, quoted or not', () => {
    expect(remapOwnSheetReferences('=S!A1+\'S\'!A2', isS, mapOf([1, 0]), identity)).toBe('=S!A2+\'S\'!A1');
  });

  it('rewrites both ends of a range, a column range, and a row range', () => {
    expect(remapOwnSheetReferences('=SUM(A1:B2)+SUM(A:A)+SUM(1:1)', isS, mapOf([3, 4]), mapOf([2, 1])))
      .toBe('=SUM(C4:B5)+SUM(C:C)+SUM(4:4)');
  });

  it('leaves strings, error literals, function names, numbers, and quoted sheet names alone', () => {
    const formula = '="A1"&LOG10(2.5)+#REF!+\'A1 sheet\'!A1+10';

    expect(remapOwnSheetReferences(formula, isS, mapOf([5]), mapOf([5]))).toBe(formula);
  });

  it('reads references after a string that holds an escaped quote', () => {
    expect(remapOwnSheetReferences('=A1&" said ""hi"" "&B1', isS, identity, mapOf([2, 0, 1])))
      .toBe('=C1&" said ""hi"" "&A1');
  });

  it('leaves a string after a string that holds an escaped quote alone', () => {
    expect(remapOwnSheetReferences('="a""b"&"C1"', isS, identity, mapOf([2, 0, 1]))).toBe('="a""b"&"C1"');
  });

  it('reads a quoted sheet name that holds an escaped quote', () => {
    const isItS = name => name === 'it\'s';

    expect(remapOwnSheetReferences('=\'it\'\'s\'!A1+\'Main\'\'s\'!A1+B1', isItS, identity, mapOf([2, 0, 1])))
      .toBe('=\'it\'\'s\'!C1+\'Main\'\'s\'!A1+A1');
  });

  it('reads a sheet name in another script', () => {
    expect(remapOwnSheetReferences('=Лист2!A1+A1', isS, mapOf([1]), identity)).toBe('=Лист2!A1+A2');
  });
});
