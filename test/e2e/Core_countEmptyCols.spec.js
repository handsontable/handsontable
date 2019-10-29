/* eslint-disable no-multi-spaces, array-bracket-spacing */

describe('Core_countEmptyCols', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should count empty columns properly for empty data set', () => {
    handsontable({
      data: []
    });

    expect(countEmptyCols()).toBe(0);
  });

  it('should count empty columns properly when using a simple data set', () => {
    handsontable({
      data: [
        [null, null, 1,    null, null, null],
        [4,    null, null, null, null, null],
        [null, null, null, null, null, null],
        [3,    null, null, null, null, null],
        [1,    null, null, null, null, null],
        [null, null, null, null, 1,    null],
      ]
    });

    expect(countEmptyCols()).toBe(3);
  });

  it('should count empty columns at the end of the data source properly (optional `ending` parameter)', () => {
    handsontable({
      data: [
        [null, null, 1,    null, null, null],
        [4,    null, null, null, null, null],
        [null, null, null, null, null, null],
        [3,    null, null, null, null, null],
        [1,    null, null, null, null, null],
        [null, null, null, null, 1,    null],
      ]
    });

    expect(countEmptyCols(true)).toBe(1);
  });

  it('should count empty columns properly when using `minSpareCols` option', () => {
    handsontable({
      data: [
        [null, null, 1,    null, null],
        [4,    null, null, null, null],
        [null, null, null, null, null],
        [3,    null, null, null, null],
        [1,    null, null, null, null],
        [null, null, null, null, 1   ],
      ],
      minSpareCols: 2
    });

    expect(countEmptyCols()).toBe(4);
  });

  it('should count empty columns properly when translating columns in the viewport', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5)
    });

    hot.columnIndexMapper.setIndexesSequence([2, 3, 4, 5, 6]);

    expect(countEmptyCols()).toBe(2);
  });

  it('should count empty columns properly when translating columns outside the viewport', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(100, 100)
    });

    hot.columnIndexMapper.setIndexesSequence(new Array(100).fill(0).map((_, index) => index + 5));

    expect(countEmptyCols()).toBe(5);
  });
});
