import { areValidSortStates, ASC_SORT_STATE, DESC_SORT_STATE } from 'handsontable/plugins/columnSorting/utils';

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
});
