function getAllCells() {
  return Array.from(spec().$wrapper[0].querySelectorAll('th, td'));
}

function cellFrozenLineSummary(elem) {
  const frozenLineColor = 'rgb(93, 99, 101)'; // Color #5d6365 == rgb(93, 99, 101). Must be in RGB, because that's the format returned by getComputedStyle
  const computedStyle = window.getComputedStyle(elem);
  let suffix = '';

  if (computedStyle.borderTopColor === frozenLineColor) {
    suffix += '-top';
  }
  if (computedStyle.borderLeftColor === frozenLineColor) {
    suffix += '-left';
  }
  if (computedStyle.borderBottomColor === frozenLineColor) {
    suffix += '-bottom';
  }
  if (computedStyle.borderRightColor === frozenLineColor) {
    suffix += '-right';
  }

  if (suffix) {
    return elem.textContent + suffix;
  }
  return null;
}

function getTextsOfCellsWithFrozenLine() {
  const texts = getAllCells().map(cellFrozenLineSummary);
  return texts.filter(x => x !== null);
}

function renderText(elem, text) {
  elem.innerText = text;
}

const columnHeaderRenderer = (col, TH) => renderText(TH, `Col${col + 1}`);
const columnHeaders = [columnHeaderRenderer, columnHeaderRenderer];
const rowHeaderRenderer = (row, TH) => renderText(TH, `Row${row + 1}`);
const rowHeaders = [rowHeaderRenderer, rowHeaderRenderer];

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

      expect(getTextsOfCellsWithFrozenLine()).toEqual(['A2-bottom', 'B2-bottom', 'C2-bottom', 'D2-bottom']);
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

      expect(getTextsOfCellsWithFrozenLine()).toEqual(['A2-bottom', 'B2-bottom', 'C2-bottom', 'D2-bottom', 'Row2-bottom', 'Row2-bottom']);
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

      expect(getTextsOfCellsWithFrozenLine()).toEqual(['A3-top', 'B3-top', 'C3-top', 'D3-top']);
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

      expect(getTextsOfCellsWithFrozenLine()).toEqual(['A3-top', 'B3-top', 'C3-top', 'D3-top', 'Row3-top', 'Row3-top']);
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

      expect(getTextsOfCellsWithFrozenLine()).toEqual(['B1-right', 'B2-right', 'B3-right', 'B4-right']);
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

      expect(getTextsOfCellsWithFrozenLine()).toEqual(['B1-right', 'B2-right', 'B3-right', 'B4-right', 'Col2-right', 'Col2-right']);
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

  describe('fixed columns and rows at all edges', () => {
    it('should render a frozen line at the edge of all overlays', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsLeft: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      expect(getTextsOfCellsWithFrozenLine()).toEqual([
        'A2-bottom', 'B2-bottom', 'C2-bottom', 'D2-bottom',
        'A3-top', 'B3-top', 'C3-top', 'D3-top',
        'B1-right', 'B2-right', 'B3-right', 'B4-right', 'B1-right',
        'A2-bottom',
        'B2-bottom-right',
        'A3-top',
        'B3-top-right',
        'B4-right']);
    });

    it('should render a frozen line at the edge of all overlays, with row and column headers', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsLeft: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        columnHeaders,
        rowHeaders,
      });

      wt.draw();

      expect(getTextsOfCellsWithFrozenLine()).toEqual([
        'C2-bottom', 'D2-bottom',
        'C3-top', 'D3-top',
        'B1-right', 'B2-right', 'B3-right', 'B4-right', 'Col2-right', 'Col2-right', 'B1-right',
        'Row2-bottom', 'Row2-bottom', 'A2-bottom',
        'B2-bottom-right',
        'Row3-top', 'Row3-top', 'A3-top',
        'B3-top-right',
        'B4-right']);
    });
  });

});

