import {
  areValidSortStates,
  ASC_SORT_STATE,
  DESC_SORT_STATE,
  createIntlDateCompareFunction,
  createIntlTimeCompareFunction,
  isFirstLevelColumnHeader,
  wasHeaderClickedProperly,
} from 'handsontable/plugins/columnSorting/utils';
import * as dateTimeHelpers from 'handsontable/helpers/dateTime';

describe('ColumnSorting', () => {
  it('areValidSortStates', () => {
    expect(areValidSortStates([{}])).toBeFalsy();
    expect(areValidSortStates([{ column: 1 }])).toBeFalsy();
    expect(areValidSortStates([{ sortOrder: ASC_SORT_STATE }])).toBeFalsy();
    expect(areValidSortStates([{ sortOrder: DESC_SORT_STATE }])).toBeFalsy();
    expect(areValidSortStates([{ column: 1, sortOrder: DESC_SORT_STATE }, {
      column: 1,
      sortOrder: DESC_SORT_STATE
    }])).toBeFalsy();
    expect(areValidSortStates([{ column: 1, sortOrder: DESC_SORT_STATE }])).toBeTruthy();
    expect(areValidSortStates([{ column: 1, sortOrder: ASC_SORT_STATE }])).toBeTruthy();
  });

  it('should treat rowspanned headers that reach the last level as first-level headers', () => {
    const thead = document.createElement('thead');
    const topRow = document.createElement('tr');
    const bottomRow = document.createElement('tr');
    const rowspannedHeader = document.createElement('th');
    const regularBottomHeader = document.createElement('th');

    rowspannedHeader.setAttribute('rowspan', '2');
    topRow.appendChild(rowspannedHeader);
    bottomRow.appendChild(regularBottomHeader);
    thead.appendChild(topRow);
    thead.appendChild(bottomRow);

    expect(isFirstLevelColumnHeader(0, rowspannedHeader)).toBe(true);
    expect(isFirstLevelColumnHeader(0, regularBottomHeader)).toBe(true);
  });

  it('should treat clicks on rowspanned bottom-most headers as valid header clicks', () => {
    const thead = document.createElement('thead');
    const topRow = document.createElement('tr');
    const bottomRow = document.createElement('tr');
    const rowspannedHeader = document.createElement('th');

    rowspannedHeader.setAttribute('rowspan', '2');
    topRow.appendChild(rowspannedHeader);
    thead.appendChild(topRow);
    thead.appendChild(bottomRow);

    expect(wasHeaderClickedProperly(-2, 0, { button: 0, target: rowspannedHeader })).toBe(true);
    expect(wasHeaderClickedProperly(-2, 0, { button: 2, target: rowspannedHeader })).toBe(false);
  });
});

describe('createIntlDateCompareFunction', () => {
  it('should parse each distinct value once per created compare function', () => {
    const spy = jest.spyOn(dateTimeHelpers, 'parseToLocalDate');
    const compare = createIntlDateCompareFunction('asc', {});

    expect(compare('2024-01-02', '2024-01-01')).toBe(1);
    expect(compare('2024-01-01', '2024-01-03')).toBe(-1);
    expect(compare('2024-01-03', '2024-01-02')).toBe(1);
    expect(compare('2024-01-02', '2024-01-03')).toBe(-1);

    // 3 distinct values across 8 sides — every repeat must hit the per-run cache.
    expect(spy).toHaveBeenCalledTimes(3);

    spy.mockRestore();
  });

  it('should return symmetric results for cached and freshly-parsed values', () => {
    const compare = createIntlDateCompareFunction('asc', {});

    expect(compare('2024-05-10', '2024-05-11')).toBe(-compare('2024-05-11', '2024-05-10'));
    expect(compare('2024-05-10', '2024-05-10')).toBe(0);
  });

  it('should keep unparsable and empty value handling intact when values repeat', () => {
    const compare = createIntlDateCompareFunction('asc', {});

    expect(compare('not a date', '2024-05-10')).toBe(1);
    expect(compare('2024-05-10', 'not a date')).toBe(-1);
    expect(compare('not a date', '2024-05-10')).toBe(1);
    expect(compare(null, '2024-05-10')).toBe(1);
    expect(compare('2024-05-10', null)).toBe(-1);
  });
});

describe('createIntlTimeCompareFunction', () => {
  it('should parse each distinct value once per created compare function', () => {
    const spy = jest.spyOn(dateTimeHelpers, 'parseToLocalTime');
    const compare = createIntlTimeCompareFunction('asc', {});

    expect(compare('10:30', '09:15')).toBe(1);
    expect(compare('09:15', '11:45')).toBe(-1);
    expect(compare('11:45', '10:30')).toBe(1);

    expect(spy).toHaveBeenCalledTimes(3);

    spy.mockRestore();
  });
});
