import {
  areValidSortStates,
  ASC_SORT_STATE,
  DESC_SORT_STATE,
  isFirstLevelColumnHeader,
  wasHeaderClickedProperly,
} from 'handsontable/plugins/columnSorting/utils';

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
