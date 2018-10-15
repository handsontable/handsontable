'use strict';

var _utils = require('handsontable/plugins/columnSorting/utils');

describe('ColumnSorting', function () {
  it('areValidSortStates', function () {
    expect((0, _utils.areValidSortStates)([{}])).toBeFalsy();
    expect((0, _utils.areValidSortStates)([{ column: 1 }])).toBeFalsy();
    expect((0, _utils.areValidSortStates)([{ sortOrder: _utils.ASC_SORT_STATE }])).toBeFalsy();
    expect((0, _utils.areValidSortStates)([{ sortOrder: _utils.DESC_SORT_STATE }])).toBeFalsy();
    expect((0, _utils.areValidSortStates)([{ column: 1, sortOrder: _utils.DESC_SORT_STATE }, {
      column: 1,
      sortOrder: _utils.DESC_SORT_STATE
    }])).toBeFalsy();
    expect((0, _utils.areValidSortStates)([{ column: 1, sortOrder: _utils.DESC_SORT_STATE }])).toBeTruthy();
    expect((0, _utils.areValidSortStates)([{ column: 1, sortOrder: _utils.ASC_SORT_STATE }])).toBeTruthy();
  });
});