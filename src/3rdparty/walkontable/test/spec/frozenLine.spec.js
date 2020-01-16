function getAllCells() {
  return Array.from(spec().$wrapper[0].querySelectorAll('th, td'));
}

function cellHasFrozenLine(elem) {
  const frozenLineColor = 'rgb(150, 150, 150)'; // must be in RGB, because that's the format returned by getComputedStyle
  const computedStyle = window.getComputedStyle(elem);
  if (computedStyle.borderTopColor === frozenLineColor
        || computedStyle.borderLeftColor === frozenLineColor
        || computedStyle.borderBottomColor === frozenLineColor
        || computedStyle.borderRightColor === frozenLineColor) {
    return true;
  }
  return false;
}

function getTextsOfCellsWithFrozenLine() {
  const cellsWithFrozenLine = getAllCells().filter(cellHasFrozenLine);
  return cellsWithFrozenLine.map(elem => elem.innerText);
}

function renderText(elem, text) {
  elem.innerText = text;
}

const columnHeaders = [(col, TH) => renderText(TH, `Col${col + 1}`)];
const rowHeaders = [(row, TH) => renderText(TH, `Row${row + 1}`)];

describe('Frozen line', () => {
  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$container = $('<div></div>');
    this.$wrapper.width(300).height(200);
    this.$table = $('<table></table>').addClass('htCore');
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    this.data = createSpreadsheetData(4, 4);
  });

  afterEach(function() {
    $('.wtHolder').remove();
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  describe('fixed rows top', () => {
    it('should render a frozen line at the bottom of fixed rows top', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
      });

      wt.draw();

      expect(getTextsOfCellsWithFrozenLine()).toEqual(['A2', 'B2', 'C2', 'D2']);
    });

    it('should render a frozen line at the bottom of fixed rows top, with row and column headers', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        columnHeaders,
        rowHeaders,
      });

      wt.draw();

      expect(getTextsOfCellsWithFrozenLine()).toEqual(['A2', 'B2', 'C2', 'D2', 'Row2']);
    });

    it('should not render a frozen line when there are no fixed rows top', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 0,
      });

      wt.draw();

      expect(getTextsOfCellsWithFrozenLine()).toEqual([]);
    });

    it('should not render a frozen line when there are no fixed rows top, with row and column headers', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 0,
        columnHeaders,
        rowHeaders,
      });

      wt.draw();

      expect(getTextsOfCellsWithFrozenLine()).toEqual([]);
    });
  });

  describe('fixed rows bottom', () => {
    it('should render a frozen line at the top of fixed rows bottom', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsBottom: 2,
      });

      wt.draw();

      expect(getTextsOfCellsWithFrozenLine()).toEqual(['A3', 'B3', 'C3', 'D3']);
    });

    it('should render a frozen line at the top of fixed rows bottom, with row and column headers', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsBottom: 2,
        columnHeaders,
        rowHeaders,
      });

      wt.draw();

      expect(getTextsOfCellsWithFrozenLine()).toEqual(['A3', 'B3', 'C3', 'D3', 'Row3']);
    });

    it('should not render a frozen line when there are no fixed rows bottom', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsBottom: 0,
      });

      wt.draw();

      expect(getTextsOfCellsWithFrozenLine()).toEqual([]);
    });

    it('should not render a frozen line when there are no fixed rows bottom, with row and column headers', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsBottom: 0,
        columnHeaders,
        rowHeaders,
      });

      wt.draw();

      expect(getTextsOfCellsWithFrozenLine()).toEqual([]);
    });
  });

  describe('fixed columns left', () => {
    it('should render a frozen line at the right of fixed columns left', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsLeft: 2,
      });

      wt.draw();

      expect(getTextsOfCellsWithFrozenLine()).toEqual(['B1', 'B2', 'B3', 'B4']);
    });

    it('should render a frozen line at the right of fixed columns left, with row and column headers', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsLeft: 2,
        columnHeaders,
        rowHeaders,
      });

      wt.draw();

      expect(getTextsOfCellsWithFrozenLine()).toEqual(['B1', 'B2', 'B3', 'B4', 'Col2']);
    });

    it('should not render a frozen line when there are no fixed columns left', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsLeft: 0,
      });

      wt.draw();

      expect(getTextsOfCellsWithFrozenLine()).toEqual([]);
    });

    it('should not render a frozen line when there are no fixed columns left, with row and column headers', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsLeft: 0,
        columnHeaders,
        rowHeaders,
      });

      wt.draw();

      expect(getTextsOfCellsWithFrozenLine()).toEqual([]);
    });
  });

});

