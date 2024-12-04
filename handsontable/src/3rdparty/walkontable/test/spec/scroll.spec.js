describe('WalkontableScroll', () => {
  const COLUMN_LABEL_BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const COLUMN_LABEL_BASE_LENGTH = COLUMN_LABEL_BASE.length;
  const debug = false;

  function spreadsheetColumnLabel(index) {
    let dividend = index + 1;
    let columnLabel = '';
    let modulo;

    while (dividend > 0) {
      modulo = (dividend - 1) % COLUMN_LABEL_BASE_LENGTH;
      columnLabel = String.fromCharCode(65 + modulo) + columnLabel;
      dividend = parseInt((dividend - modulo) / COLUMN_LABEL_BASE_LENGTH, 10);
    }

    return columnLabel;
  }

  function createDataArray(rows = 100, columns = 4) {
    const _rows = [];

    spec().data = [];

    for (let i = 0; i < rows; i++) {
      const row = [];

      for (let j = 0; j < columns; j++) {
        row.push(spreadsheetColumnLabel(j) + (i + 1));
      }

      _rows.push(row);
      spec().data.push(row);
    }
  }

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(201 + getScrollbarWidth()).height(185 + getScrollbarWidth());
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(100, 50);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  using('document layout direction', [
    { htmlDir: 'ltr' },
    { htmlDir: 'rtl' },
  ], ({ htmlDir }) => {
    beforeEach(() => {
      $('html').attr('dir', htmlDir);
    });

    afterEach(() => {
      $('html').attr('dir', 'ltr');
    });

    it('should scroll to the last row and column when headers are not enabled', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(
        getTotalRows() - 1, getTotalColumns() - 1
      ));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('AT92');
      expect(firstRow.find('td:last').text()).toBe('AX92');
      expect(lastRow.find('td:first').text()).toBe('AT100');
      expect(lastRow.find('td:last').text()).toBe('AX100');
    });

    it('should scroll to the last row and column when headers are enabled', () => {
      function plusOne(i) {
        return i + 1;
      }

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [function(col, TH) {
          TH.innerHTML = plusOne(col);
        }],
        rowHeaders: [function(row, TH) {
          TH.innerHTML = plusOne(row);
        }]
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(
        getTotalRows() - 1, getTotalColumns() - 1
      ));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('AU93');
      expect(firstRow.find('td:last').text()).toBe('AX93');
      expect(lastRow.find('td:first').text()).toBe('AU100');
      expect(lastRow.find('td:last').text()).toBe('AX100');
    });

    it('should not scroll the viewport when the cell is already visible in the viewport', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(6, 2));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('A1');
      expect(firstRow.find('td:last').text()).toBe('E1');
      expect(lastRow.find('td:first').text()).toBe('A9');
      expect(lastRow.find('td:last').text()).toBe('E9');
    });

    it('should scroll to the cell so that it sticks to the right edge of the viewport (without headers)', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, 10));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('G1');
      expect(firstRow.find('td:last').text()).toBe('K1');
      expect(lastRow.find('td:first').text()).toBe('G9');
      expect(lastRow.find('td:last').text()).toBe('K9');
    });

    it('should scroll to the cell so that it sticks to the right edge of the viewport (with headers)', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [function(row, TH) {
          TH.innerHTML = row + 1;
        }],
        columnHeaders: [function(column, TH) {
          TH.innerHTML = column + 1;
        }]
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, 10));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('I1');
      expect(firstRow.find('td:last').text()).toBe('K1');
      expect(lastRow.find('td:first').text()).toBe('I8');
      expect(lastRow.find('td:last').text()).toBe('K8');
    });

    it('should scroll to the cell so that it sticks to the right edge of the viewport (forced by method flag)', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, getTotalColumns() - 1));
      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, 10), 'end', 'auto'); // snap K1 to the right
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');

      expect(firstRow.find('td:first').text()).toBe('G1');
      expect(firstRow.find('td:last').text()).toBe('K1');
    });

    it('should scroll to the cell so that it sticks to the left edge of the viewport (without headers)', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, getTotalColumns() - 1));
      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, 10));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('K1');
      expect(firstRow.find('td:last').text()).toBe('O1');
      expect(lastRow.find('td:first').text()).toBe('K9');
      expect(lastRow.find('td:last').text()).toBe('O9');
    });

    it('should scroll to the cell so that it sticks to the left edge of the viewport (with headers)', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [function(row, TH) {
          TH.innerHTML = row + 1;
        }],
        columnHeaders: [function(column, TH) {
          TH.innerHTML = column + 1;
        }]
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, getTotalColumns() - 1));
      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, 10));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('K1');
      expect(firstRow.find('td:last').text()).toBe('M1');
      expect(lastRow.find('td:first').text()).toBe('K8');
      expect(lastRow.find('td:last').text()).toBe('M8');
    });

    it('should scroll to the cell so that it sticks to the left edge of the viewport (forced by method flag)', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, 10), 'start', 'auto'); // snap K1 to the left
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');

      expect(firstRow.find('td:first').text()).toBe('K1');
      expect(firstRow.find('td:last').text()).toBe('O1');
    });

    it('should scroll to the cell so that it sticks to the bottom edge of the viewport (without headers)', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(50, 0));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('A44');
      expect(firstRow.find('td:last').text()).toBe('E44');
      expect(lastRow.find('td:first').text()).toBe('A52');
      expect(lastRow.find('td:last').text()).toBe('E52');
    });

    it('should scroll to the cell so that it sticks to the bottom edge of the viewport (with headers)', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [function(row, TH) {
          TH.innerHTML = row + 1;
        }],
        columnHeaders: [function(column, TH) {
          TH.innerHTML = column + 1;
        }]
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(50, 0));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('A45');
      expect(firstRow.find('td:last').text()).toBe('D45');
      expect(lastRow.find('td:first').text()).toBe('A52');
      expect(lastRow.find('td:last').text()).toBe('D52');
    });

    it('should scroll to the cell so that it sticks to the bottom edge of the viewport (forced by method flag)', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(20, 0), 'auto', 'bottom'); // snap A21 to the bottom
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('A14');
      expect(lastRow.find('td:first').text()).toBe('A22');
    });

    it('should scroll to the cell so that it sticks to the top edge of the viewport (without headers)', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(getTotalRows() - 1, 0));
      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(50, 0));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('A51');
      expect(firstRow.find('td:last').text()).toBe('E51');
      expect(lastRow.find('td:first').text()).toBe('A59');
      expect(lastRow.find('td:last').text()).toBe('E59');
    });

    it('should scroll to the cell so that it sticks to the top edge of the viewport (with headers)', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [function(row, TH) {
          TH.innerHTML = row + 1;
        }],
        columnHeaders: [function(column, TH) {
          TH.innerHTML = column + 1;
        }]
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(getTotalRows() - 1, 0));
      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(50, 0));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('A51');
      expect(firstRow.find('td:last').text()).toBe('D51');
      expect(lastRow.find('td:first').text()).toBe('A57');
      expect(lastRow.find('td:last').text()).toBe('D57');
    });

    it('should scroll to the cell so that it sticks to the top edge of the viewport (forced by method flag)', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(getTotalRows() - 1, 0));
      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(20, 0), 'auto', 'top'); // snap A21 to the top
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('A21');
      expect(lastRow.find('td:first').text()).toBe('A29');
    });

    it('should scroll to the cell that is after viewport and is not fully visible', () => {
      spec().$wrapper.width(175 + getScrollbarWidth()).height(175 + getScrollbarWidth());

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(7, 3));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('A1');
      expect(firstRow.find('td:last').text()).toBe('D1');
      expect(lastRow.find('td:first').text()).toBe('A9');
      expect(lastRow.find('td:last').text()).toBe('D9');
      expect(wt.wtTable.getFirstVisibleRow()).toBe(1);
      expect(wt.wtTable.getLastVisibleRow()).toBe(7);
      expect(wt.wtTable.getFirstVisibleColumn()).toBe(1);
      expect(wt.wtTable.getLastVisibleColumn()).toBe(3);
    });

    it('should scroll to the cell that is after viewport, is not fully visible and is long and wide', () => {
      spec().$wrapper.width(175 + getScrollbarWidth()).height(175 + getScrollbarWidth());

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth(col) {
          if (col === 3) {
            return 150;
          }

          return 50;
        },
        rowHeight(row) {
          if (row === 7) {
            return 150;
          }

          return 23;
        }
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(7, 3));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('C6');
      expect(firstRow.find('td:last').text()).toBe('D6');
      expect(lastRow.find('td:first').text()).toBe('C9');
      expect(lastRow.find('td:last').text()).toBe('D9');
      expect(wt.wtTable.getFirstVisibleRow()).toBe(6);
      expect(wt.wtTable.getLastVisibleRow()).toBe(7);
      expect(wt.wtTable.getFirstVisibleColumn()).toBe(3);
      expect(wt.wtTable.getLastVisibleColumn()).toBe(3);
    });

    it('should scroll to the cell that is after viewport, is not fully visible and is oversized ' +
       '(bigger than table\'s viewport size)', () => {
      spec().$wrapper.width(175 + getScrollbarWidth()).height(175 + getScrollbarWidth());

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth(col) {
          if (col === 3) {
            return 500;
          }

          return 50;
        },
        rowHeight(row) {
          if (row === 7) {
            return 500;
          }

          return 23;
        }
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(7, 3));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('D8');
      expect(firstRow.find('td:last').text()).toBe('D8');
      expect(lastRow.find('td:first').text()).toBe('D8');
      expect(lastRow.find('td:last').text()).toBe('D8');
      expect(wt.wtTable.getFirstVisibleRow()).toBe(-1);
      expect(wt.wtTable.getLastVisibleRow()).toBe(-1);
      expect(wt.wtTable.getFirstVisibleColumn()).toBe(-1);
      expect(wt.wtTable.getLastVisibleColumn()).toBe(-1);
      expect(wt.wtTable.getFirstRenderedRow()).toBe(7);
      expect(wt.wtTable.getLastRenderedRow()).toBe(7);
      expect(wt.wtTable.getFirstRenderedColumn()).toBe(3);
      expect(wt.wtTable.getLastRenderedColumn()).toBe(3);
    });

    it('should scroll to the cell that is before viewport and is not fully visible', () => {
      spec().$wrapper.width(175 + getScrollbarWidth()).height(175 + getScrollbarWidth());

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(getTotalRows() - 1, getTotalColumns() - 1));
      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(getTotalRows() - 7, getTotalColumns() - 4));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('AU93');
      expect(firstRow.find('td:last').text()).toBe('AX93');
      expect(lastRow.find('td:first').text()).toBe('AU100');
      expect(lastRow.find('td:last').text()).toBe('AX100');
      expect(wt.wtTable.getFirstVisibleRow()).toBe(93);
      expect(wt.wtTable.getLastVisibleRow()).toBe(99);
      expect(wt.wtTable.getFirstVisibleColumn()).toBe(46);
      expect(wt.wtTable.getLastVisibleColumn()).toBe(48);
    });

    it('should scroll to the cell that is before viewport, is not fully visible and is long and wide', () => {
      spec().$wrapper.width(175 + getScrollbarWidth()).height(175 + getScrollbarWidth());

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth(col) {
          if (col === 46) {
            return 150;
          }

          return 50;
        },
        rowHeight(row) {
          if (row === 93) {
            return 150;
          }

          return 23;
        }
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(getTotalRows() - 1, getTotalColumns() - 1));
      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(getTotalRows() - 7, getTotalColumns() - 4));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('AU94');
      expect(firstRow.find('td:last').text()).toBe('AV94');
      expect(lastRow.find('td:first').text()).toBe('AU96');
      expect(lastRow.find('td:last').text()).toBe('AV96');
      expect(wt.wtTable.getFirstVisibleRow()).toBe(93);
      expect(wt.wtTable.getLastVisibleRow()).toBe(94);
      expect(wt.wtTable.getFirstVisibleColumn()).toBe(46);
      expect(wt.wtTable.getLastVisibleColumn()).toBe(46);
    });

    it('should scroll to the cell that is before viewport, is not fully visible and is oversized ' +
       '(bigger than table\'s viewport size)', () => {
      spec().$wrapper.width(175 + getScrollbarWidth()).height(175 + getScrollbarWidth());

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth(col) {
          if (col === 46) {
            return 500;
          }

          return 50;
        },
        rowHeight(row) {
          if (row === 93) {
            return 500;
          }

          return 23;
        }
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(getTotalRows() - 1, getTotalColumns() - 1));
      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(getTotalRows() - 7, getTotalColumns() - 4));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('AU94');
      expect(firstRow.find('td:last').text()).toBe('AU94');
      expect(lastRow.find('td:first').text()).toBe('AU94');
      expect(lastRow.find('td:last').text()).toBe('AU94');
      expect(wt.wtTable.getFirstVisibleRow()).toBe(-1);
      expect(wt.wtTable.getLastVisibleRow()).toBe(-1);
      expect(wt.wtTable.getFirstVisibleColumn()).toBe(-1);
      expect(wt.wtTable.getLastVisibleColumn()).toBe(-1);
      expect(wt.wtTable.getFirstRenderedColumn()).toBe(46);
      expect(wt.wtTable.getLastRenderedColumn()).toBe(46);
    });

    it('should keep the viewport scroll position in the same place when the last row is removed', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(getTotalRows() - 1, 0));
      wt.draw();

      createDataArray(getTotalRows() - 1, getTotalColumns()); // removing by passing new dataset
      wt.wtOverlays.adjustElementsSize();
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('A91');
      expect(firstRow.find('td:last').text()).toBe('E91');
      expect(lastRow.find('td:first').text()).toBe('A99');
      expect(lastRow.find('td:last').text()).toBe('E99');
    });

    it('should keep the viewport scroll position in the same place when the last column is removed', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, getTotalColumns() - 1));
      wt.draw();

      createDataArray(getTotalRows(), getTotalColumns() - 1); // removing by passing new dataset
      wt.wtOverlays.adjustElementsSize();
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('AS1');
      expect(firstRow.find('td:last').text()).toBe('AW1');
      expect(lastRow.find('td:first').text()).toBe('AS9');
      expect(lastRow.find('td:last').text()).toBe('AW9');
    });

    it('should keep the viewport scroll position in the last row when the smaller dataset is loaded', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(getTotalRows() / 2, 0));
      wt.draw();

      createDataArray(12, getTotalColumns());
      wt.wtOverlays.adjustElementsSize();
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('A4');
      expect(firstRow.find('td:last').text()).toBe('E4');
      expect(lastRow.find('td:first').text()).toBe('A12');
      expect(lastRow.find('td:last').text()).toBe('E12');
    });

    it('should keep the viewport scroll position in the last column when the smaller dataset is loaded', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, getTotalColumns() / 2));
      wt.draw();

      createDataArray(getTotalRows(), 5);
      wt.wtOverlays.adjustElementsSize();
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('A1');
      expect(firstRow.find('td:last').text()).toBe('E1');
      expect(lastRow.find('td:first').text()).toBe('A9');
      expect(lastRow.find('td:last').text()).toBe('E9');
    });

    it('should scroll to the last row when all rows are very long (but not longer than table\'s viewport height)', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeight: 120,
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(getTotalRows() - 1, 0));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('A99');
      expect(firstRow.find('td:last').text()).toBe('E99');
      expect(lastRow.find('td:first').text()).toBe('A100');
      expect(lastRow.find('td:last').text()).toBe('E100');
    });

    it('should scroll to the last row when all rows are very long (longer than table\'s viewport height)', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeight: 500,
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(getTotalRows() - 1, 0));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('A100');
      expect(firstRow.find('td:last').text()).toBe('E100');
      expect(lastRow.find('td:first').text()).toBe('A100');
      expect(lastRow.find('td:last').text()).toBe('E100');
    });

    it('should scroll to the last column when all columns are very wide (but not wider than table\'s viewport width)', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 120,
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, getTotalColumns() - 1));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('AW1');
      expect(firstRow.find('td:last').text()).toBe('AX1');
      expect(lastRow.find('td:first').text()).toBe('AW9');
      expect(lastRow.find('td:last').text()).toBe('AX9');
    });

    it('should scroll to the last column when all columns are very wide (wider than table\'s viewport width)', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 500,
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, getTotalColumns() - 1));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('AX1');
      expect(firstRow.find('td:last').text()).toBe('AX1');
      expect(lastRow.find('td:first').text()).toBe('AX9');
      expect(lastRow.find('td:last').text()).toBe('AX9');
    });

    it('should scroll to the cell when row points outside the viewport and column points to the left overlay', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsStart: 2
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(10, 1));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('C4');
      expect(firstRow.find('td:last').text()).toBe('E4');
      expect(lastRow.find('td:first').text()).toBe('C12');
      expect(lastRow.find('td:last').text()).toBe('E12');
    });

    it('should scroll to the cell when column points outside the viewport and row points to the top overlay', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(1, 10));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('G3');
      expect(firstRow.find('td:last').text()).toBe('K3');
      expect(lastRow.find('td:first').text()).toBe('G9');
      expect(lastRow.find('td:last').text()).toBe('K9');
    });

    it('should scroll to the cell when column points outside the viewport and row points to the bottom overlay', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsBottom: 2
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(getTotalRows() - 2, 10));
      wt.draw();

      const firstRow = getTableMaster().find('tbody tr:first');
      const lastRow = getTableMaster().find('tbody tr:last');

      expect(firstRow.find('td:first').text()).toBe('G1');
      expect(firstRow.find('td:last').text()).toBe('K1');
      expect(lastRow.find('td:first').text()).toBe('G7');
      expect(lastRow.find('td:last').text()).toBe('K7');
    });

    it('should update the scroll position of overlays only once, when scrolling the master table', async() => {
      createDataArray(100, 100);
      spec().$wrapper.width(245 + getScrollbarWidth()).height(186 + getScrollbarWidth());

      const topOverlayCallback = jasmine.createSpy('topOverlayCallback');
      const inlineStartOverlayCallback = jasmine.createSpy('inlineStartOverlayCallback');

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsStart: 2,
        fixedRowsTop: 2
      });
      const masterHolder = wt.wtTable.holder;
      const inlineStartOverlayHolder = wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder;
      const topOverlayHolder = wt.wtOverlays.topOverlay.clone.wtTable.holder;

      topOverlayHolder.addEventListener('scroll', topOverlayCallback);
      inlineStartOverlayHolder.addEventListener('scroll', inlineStartOverlayCallback);

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(50, 50));
      wt.draw();

      await sleep(50);

      expect(topOverlayCallback.calls.count()).toEqual(1);
      expect(inlineStartOverlayCallback.calls.count()).toEqual(1);

      expect(topOverlayHolder.scrollLeft).toEqual(masterHolder.scrollLeft);
      expect(inlineStartOverlayHolder.scrollTop).toEqual(masterHolder.scrollTop);

      topOverlayHolder.removeEventListener('scroll', topOverlayCallback);
      inlineStartOverlayHolder.removeEventListener('scroll', inlineStartOverlayCallback);
    });

    it('should call onScrollVertically hook, if scrollTop was changed', async() => {
      createDataArray(100, 100);
      spec().$wrapper.width(245 + getScrollbarWidth()).height(186 + getScrollbarWidth());

      const scrollHorizontally = jasmine.createSpy('scrollHorizontal');
      const scrollVertically = jasmine.createSpy('scrollVertically');

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
        onScrollVertically: scrollVertically,
        onScrollHorizontally: scrollHorizontally,
      });

      wt.draw();
      wt.wtTable.holder.scrollTop = 400;
      wt.draw();

      await sleep(50);

      expect(scrollVertically.calls.count()).toEqual(1);
      expect(scrollHorizontally.calls.count()).toEqual(0);
    });

    it('should call onScrollHorizontally hook, if scrollLeft was changed', async() => {
      createDataArray(100, 100);
      spec().$wrapper.width(245 + getScrollbarWidth()).height(186 + getScrollbarWidth());

      const scrollHorizontally = jasmine.createSpy('scrollHorizontal');
      const scrollVertically = jasmine.createSpy('scrollVertically');

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
        onScrollVertically: scrollVertically,
        onScrollHorizontally: scrollHorizontally,
      });

      wt.draw();
      wt.wtTable.holder.scrollLeft = 400;
      wt.draw();

      await sleep(50);

      expect(scrollVertically.calls.count()).toEqual(0);
      expect(scrollHorizontally.calls.count()).toEqual(1);
    });

    it('should add the "innerBorderInlineStart" CSS class (compensation for 1px border bug) to the root element when ' +
       'the table is horizontally scrolled', () => {
      spec().$wrapper.width(186 + getScrollbarWidth()).height(186 + getScrollbarWidth());
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [(row, TH) => {
          TH.innerHTML = row;
        }],
      });

      wt.draw();
      wt.scrollViewportHorizontally(getTotalColumns() - 1);
      wt.draw();

      expect(wt.wtTable.wtRootElement).toHaveClass('innerBorderInlineStart');
      expect(wt.wtTable.wtRootElement).toHaveClass('innerBorderLeft'); // for backward compatibility support
    });

    describe('`wheel` event', () => {
      it('should scroll the table when triggered on the top-left corner overlay', async() => {
        createDataArray(100, 100);
        spec().$wrapper.width(245 + getScrollbarWidth()).height(186 + getScrollbarWidth());

        const masterCallback = jasmine.createSpy('masterCallback');
        const topCallback = jasmine.createSpy('topCallback');
        const bottomCallback = jasmine.createSpy('bottomCallback');
        const leftCallback = jasmine.createSpy('leftCallback');

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
          fixedColumnsStart: 2,
          fixedRowsTop: 2,
          fixedRowsBottom: 2,
        });

        wt.draw();

        const topInlineStartCornerOverlayHolder = wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder;
        const topHolder = wt.wtOverlays.topOverlay.clone.wtTable.holder;
        const bottomHolder = wt.wtOverlays.bottomOverlay.clone.wtTable.holder;
        const leftHolder = wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder;
        const masterHolder = wt.wtTable.holder;

        masterHolder.addEventListener('scroll', masterCallback);
        topHolder.addEventListener('scroll', topCallback);
        bottomHolder.addEventListener('scroll', bottomCallback);
        leftHolder.addEventListener('scroll', leftCallback);

        // wheel + shift
        wheelOnElement(topInlineStartCornerOverlayHolder, 400);
        wt.draw();

        await sleep(200);

        expect(masterCallback.calls.count()).toEqual(1);
        expect(topCallback.calls.count()).toEqual(1);
        expect(bottomCallback.calls.count()).toEqual(1);
        expect(leftCallback.calls.count()).toEqual(0);

        wheelOnElement(topInlineStartCornerOverlayHolder, 0, 400);
        wt.draw();

        await sleep(200);

        expect(masterCallback.calls.count()).toEqual(2);
        expect(topCallback.calls.count()).toEqual(1);
        expect(bottomCallback.calls.count()).toEqual(1);
        expect(leftCallback.calls.count()).toEqual(1);

        masterHolder.removeEventListener('scroll', masterCallback);
        topHolder.removeEventListener('scroll', topCallback);
        bottomHolder.removeEventListener('scroll', bottomCallback);
        leftHolder.removeEventListener('scroll', leftCallback);
      });

      it('should scroll the table when triggered on the bottom-left corner overlay', async() => {
        createDataArray(100, 100);
        spec().$wrapper.width(245 + getScrollbarWidth()).height(186 + getScrollbarWidth());

        const masterCallback = jasmine.createSpy('masterCallback');
        const topCallback = jasmine.createSpy('topCallback');
        const bottomCallback = jasmine.createSpy('bottomCallback');
        const leftCallback = jasmine.createSpy('leftCallback');

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
          fixedColumnsStart: 2,
          fixedRowsTop: 2,
          fixedRowsBottom: 2,
        });

        wt.draw();

        const bottomInlineStartCornerOverlayHolder = wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.holder;
        const topHolder = wt.wtOverlays.topOverlay.clone.wtTable.holder;
        const bottomHolder = wt.wtOverlays.bottomOverlay.clone.wtTable.holder;
        const leftHolder = wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder;
        const masterHolder = wt.wtTable.holder;

        masterHolder.addEventListener('scroll', masterCallback);
        topHolder.addEventListener('scroll', topCallback);
        bottomHolder.addEventListener('scroll', bottomCallback);
        leftHolder.addEventListener('scroll', leftCallback);

        // wheel + shift
        wheelOnElement(bottomInlineStartCornerOverlayHolder, 400);
        wt.draw();

        await sleep(200);

        expect(masterCallback.calls.count()).toEqual(1);
        expect(topCallback.calls.count()).toEqual(1);
        expect(bottomCallback.calls.count()).toEqual(1);
        expect(leftCallback.calls.count()).toEqual(0);

        wheelOnElement(bottomInlineStartCornerOverlayHolder, 0, 400);
        wt.draw();

        await sleep(200);

        expect(masterCallback.calls.count()).toEqual(2);
        expect(topCallback.calls.count()).toEqual(1);
        expect(bottomCallback.calls.count()).toEqual(1);
        expect(leftCallback.calls.count()).toEqual(1);

        masterHolder.removeEventListener('scroll', masterCallback);
        topHolder.removeEventListener('scroll', topCallback);
        bottomHolder.removeEventListener('scroll', bottomCallback);
        leftHolder.removeEventListener('scroll', leftCallback);
      });

      it('should scroll the table when triggered on the left overlay', async() => {
        createDataArray(100, 100);
        spec().$wrapper.width(245 + getScrollbarWidth()).height(186 + getScrollbarWidth());

        const masterCallback = jasmine.createSpy('masterCallback');
        const topCallback = jasmine.createSpy('topCallback');
        const bottomCallback = jasmine.createSpy('bottomCallback');
        const leftCallback = jasmine.createSpy('leftCallback');

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
          fixedColumnsStart: 2,
          fixedRowsTop: 2,
          fixedRowsBottom: 2,
        });

        wt.draw();

        const topHolder = wt.wtOverlays.topOverlay.clone.wtTable.holder;
        const bottomHolder = wt.wtOverlays.bottomOverlay.clone.wtTable.holder;
        const leftHolder = wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder;
        const masterHolder = wt.wtTable.holder;

        masterHolder.addEventListener('scroll', masterCallback);
        topHolder.addEventListener('scroll', topCallback);
        bottomHolder.addEventListener('scroll', bottomCallback);
        leftHolder.addEventListener('scroll', leftCallback);

        // wheel + shift
        wheelOnElement(leftHolder, 400);
        wt.draw();

        await sleep(200);

        expect(masterCallback.calls.count()).toEqual(1);
        expect(topCallback.calls.count()).toEqual(1);
        expect(bottomCallback.calls.count()).toEqual(1);
        expect(leftCallback.calls.count()).toEqual(0);

        wheelOnElement(leftHolder, 0, 400);
        wt.draw();

        await sleep(200);

        expect(masterCallback.calls.count()).toEqual(2);
        expect(topCallback.calls.count()).toEqual(1);
        expect(bottomCallback.calls.count()).toEqual(1);
        expect(leftCallback.calls.count()).toEqual(1);

        masterHolder.removeEventListener('scroll', masterCallback);
        topHolder.removeEventListener('scroll', topCallback);
        bottomHolder.removeEventListener('scroll', bottomCallback);
        leftHolder.removeEventListener('scroll', leftCallback);
      });

      it('should scroll the table when triggered on the top overlay', async() => {
        createDataArray(100, 100);
        spec().$wrapper.width(245 + getScrollbarWidth()).height(186 + getScrollbarWidth());

        const masterCallback = jasmine.createSpy('masterCallback');
        const topCallback = jasmine.createSpy('topCallback');
        const bottomCallback = jasmine.createSpy('bottomCallback');
        const leftCallback = jasmine.createSpy('leftCallback');

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
          fixedColumnsStart: 2,
          fixedRowsTop: 2,
          fixedRowsBottom: 2,
        });

        wt.draw();

        const topHolder = wt.wtOverlays.topOverlay.clone.wtTable.holder;
        const bottomHolder = wt.wtOverlays.bottomOverlay.clone.wtTable.holder;
        const leftHolder = wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder;
        const masterHolder = wt.wtTable.holder;

        masterHolder.addEventListener('scroll', masterCallback);
        topHolder.addEventListener('scroll', topCallback);
        bottomHolder.addEventListener('scroll', bottomCallback);
        leftHolder.addEventListener('scroll', leftCallback);

        // wheel + shift
        wheelOnElement(topHolder, 400);
        wt.draw();

        await sleep(200);

        expect(masterCallback.calls.count()).toEqual(1);
        expect(topCallback.calls.count()).toEqual(1);
        expect(bottomCallback.calls.count()).toEqual(1);
        expect(leftCallback.calls.count()).toEqual(0);

        wheelOnElement(topHolder, 0, 400);
        wt.draw();

        await sleep(200);

        expect(masterCallback.calls.count()).toEqual(2);
        expect(topCallback.calls.count()).toEqual(1);
        expect(bottomCallback.calls.count()).toEqual(1);
        expect(leftCallback.calls.count()).toEqual(1);

        masterHolder.removeEventListener('scroll', masterCallback);
        topHolder.removeEventListener('scroll', topCallback);
        bottomHolder.removeEventListener('scroll', bottomCallback);
        leftHolder.removeEventListener('scroll', leftCallback);
      });

      it('should scroll the table when triggered on the bottom overlay', async() => {
        createDataArray(100, 100);
        spec().$wrapper.width(245 + getScrollbarWidth()).height(186 + getScrollbarWidth());

        const masterCallback = jasmine.createSpy('masterCallback');
        const topCallback = jasmine.createSpy('topCallback');
        const bottomCallback = jasmine.createSpy('bottomCallback');
        const leftCallback = jasmine.createSpy('leftCallback');

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
          fixedColumnsStart: 2,
          fixedRowsTop: 2,
          fixedRowsBottom: 2,
        });

        wt.draw();

        const topHolder = wt.wtOverlays.topOverlay.clone.wtTable.holder;
        const bottomHolder = wt.wtOverlays.bottomOverlay.clone.wtTable.holder;
        const leftHolder = wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder;
        const masterHolder = wt.wtTable.holder;

        masterHolder.addEventListener('scroll', masterCallback);
        topHolder.addEventListener('scroll', topCallback);
        bottomHolder.addEventListener('scroll', bottomCallback);
        leftHolder.addEventListener('scroll', leftCallback);

        // wheel + shift
        wheelOnElement(bottomHolder, 400);
        wt.draw();

        await sleep(200);

        expect(masterCallback.calls.count()).toEqual(1);
        expect(topCallback.calls.count()).toEqual(1);
        expect(bottomCallback.calls.count()).toEqual(1);
        expect(leftCallback.calls.count()).toEqual(0);

        wheelOnElement(bottomHolder, 0, 400);
        wt.draw();

        await sleep(200);

        expect(masterCallback.calls.count()).toEqual(2);
        expect(topCallback.calls.count()).toEqual(1);
        expect(bottomCallback.calls.count()).toEqual(1);
        expect(leftCallback.calls.count()).toEqual(1);

        masterHolder.removeEventListener('scroll', masterCallback);
        topHolder.removeEventListener('scroll', topCallback);
        bottomHolder.removeEventListener('scroll', bottomCallback);
        leftHolder.removeEventListener('scroll', leftCallback);
      });

      it('should not try to set the window\'s `scrollTop`/`scrollLeft` and `scrollY`/`scrollX` properties ' +
      'when the window-scrolled table is scrolled', async() => {
        spec().$wrapper.eq(0).css({ overflow: '', height: '', width: '' });

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
        });

        spyOn(wt.wtOverlays, 'scrollVertically').and.callThrough();
        spyOn(wt.wtOverlays, 'scrollHorizontally').and.callThrough();

        wt.draw();

        const masterRootElement = wt.wtTable.wtRootElement;

        wheelOnElement(masterRootElement, 400);
        wt.draw();

        await sleep(200);

        expect(window.scrollTop).toEqual(undefined);
        expect(window.scrollLeft).toEqual(undefined);

        expect(wt.wtOverlays.scrollVertically).not.toHaveBeenCalled();
        expect(wt.wtOverlays.scrollHorizontally).not.toHaveBeenCalled();
      });
    });

    describe('horizontal scroll', () => {
      it('should return `false` if given number is smaller than 0', () => {
        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns
        });

        wt.draw();

        expect(wt.scrollViewportHorizontally(-1)).toBe(false);
      });

      it('should return `false` if given number is bigger than total columns count in dataset', () => {
        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns
        });

        wt.draw();

        expect(wt.scrollViewportHorizontally(999)).toBe(false);
      });

      it('should scroll to the next cell that is after viewport when all columns are oversized', () => {
        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
          columnWidth: 500,
        });

        wt.draw();
        wt.scrollViewportHorizontally(1);
        wt.draw();

        const firstRow = getTableMaster().find('tbody tr:first');

        expect(firstRow.find('td:first').text()).toBe('B1');
        expect(firstRow.find('td:last').text()).toBe('B1');
        expect(wt.wtTable.getFirstVisibleColumn()).toBe(-1);
        expect(wt.wtTable.getLastVisibleColumn()).toBe(-1);
        expect(wt.wtTable.getFirstRenderedColumn()).toBe(1);
        expect(wt.wtTable.getLastRenderedColumn()).toBe(1);

        wt.scrollViewportHorizontally(2);
        wt.draw();

        expect(firstRow.find('td:first').text()).toBe('C1');
        expect(firstRow.find('td:last').text()).toBe('C1');
        expect(wt.wtTable.getFirstVisibleColumn()).toBe(-1);
        expect(wt.wtTable.getLastVisibleColumn()).toBe(-1);
        expect(wt.wtTable.getFirstRenderedColumn()).toBe(2);
        expect(wt.wtTable.getLastRenderedColumn()).toBe(2);

        wt.scrollViewportHorizontally(10);
        wt.draw();

        expect(firstRow.find('td:first').text()).toBe('K1');
        expect(firstRow.find('td:last').text()).toBe('K1');
        expect(wt.wtTable.getFirstVisibleColumn()).toBe(-1);
        expect(wt.wtTable.getLastVisibleColumn()).toBe(-1);
        expect(wt.wtTable.getFirstRenderedColumn()).toBe(10);
        expect(wt.wtTable.getLastRenderedColumn()).toBe(10);

        wt.scrollViewportHorizontally(getTotalColumns() - 1);
        wt.draw();

        expect(firstRow.find('td:first').text()).toBe('AX1');
        expect(firstRow.find('td:last').text()).toBe('AX1');
        expect(wt.wtTable.getFirstVisibleColumn()).toBe(-1);
        expect(wt.wtTable.getLastVisibleColumn()).toBe(-1);
        expect(wt.wtTable.getFirstRenderedColumn()).toBe(49);
        expect(wt.wtTable.getLastRenderedColumn()).toBe(49);
      });

      it('should scroll to the next cell that is before viewport when all columns are oversized', () => {
        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
          columnWidth: 500,
        });

        wt.draw();
        wt.scrollViewportHorizontally(getTotalColumns() - 1);
        wt.draw();
        wt.scrollViewportHorizontally(40);
        wt.draw();

        const firstRow = getTableMaster().find('tbody tr:first');

        expect(firstRow.find('td:first').text()).toBe('AO1');
        expect(firstRow.find('td:last').text()).toBe('AO1');
        expect(wt.wtTable.getFirstVisibleColumn()).toBe(-1);
        expect(wt.wtTable.getLastVisibleColumn()).toBe(-1);
        expect(wt.wtTable.getFirstRenderedColumn()).toBe(40);
        expect(wt.wtTable.getLastRenderedColumn()).toBe(40);

        wt.scrollViewportHorizontally(39);
        wt.draw();

        expect(firstRow.find('td:first').text()).toBe('AN1');
        expect(firstRow.find('td:last').text()).toBe('AN1');
        expect(wt.wtTable.getFirstVisibleColumn()).toBe(-1);
        expect(wt.wtTable.getLastVisibleColumn()).toBe(-1);
        expect(wt.wtTable.getFirstRenderedColumn()).toBe(39);
        expect(wt.wtTable.getLastRenderedColumn()).toBe(39);

        wt.scrollViewportHorizontally(0);
        wt.draw();

        expect(firstRow.find('td:first').text()).toBe('A1');
        expect(firstRow.find('td:last').text()).toBe('A1');
        expect(wt.wtTable.getFirstVisibleColumn()).toBe(-1);
        expect(wt.wtTable.getLastVisibleColumn()).toBe(-1);
        expect(wt.wtTable.getFirstRenderedColumn()).toBe(0);
        expect(wt.wtTable.getLastRenderedColumn()).toBe(0);
      });
    });

    describe('vertical scroll', () => {
      it('should return `false` if given number is smaller than 0', () => {
        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns
        });

        wt.draw();

        expect(wt.scrollViewportVertically(-1)).toBe(false);
      });

      it('should return `false` if given number is bigger than total rows count in dataset', () => {
        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns
        });

        wt.draw();

        expect(wt.scrollViewportVertically(999)).toBe(false);
      });

      it('should scroll to the next cell that is below viewport when all rows are oversized', () => {
        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
          rowHeight: 500,
          rowHeightByOverlayName: 500,
        });

        wt.draw();
        wt.scrollViewport(new Walkontable.CellCoords(1, 0));
        wt.draw();

        {
          const firstRow = getTableMaster().find('tbody tr:first');

          expect(firstRow.find('td:first').text()).toBe('A2');
          expect(firstRow.find('td:last').text()).toBe('E2');
          expect(wt.wtTable.getFirstVisibleRow()).toBe(-1);
          expect(wt.wtTable.getLastVisibleRow()).toBe(-1);
          expect(wt.wtTable.getFirstRenderedRow()).toBe(1);
          expect(wt.wtTable.getLastRenderedRow()).toBe(1);
        }

        wt.scrollViewport(new Walkontable.CellCoords(2, 0));
        wt.draw();

        {
          const firstRow = getTableMaster().find('tbody tr:first');

          expect(firstRow.find('td:first').text()).toBe('A3');
          expect(firstRow.find('td:last').text()).toBe('E3');
          expect(wt.wtTable.getFirstVisibleRow()).toBe(-1);
          expect(wt.wtTable.getLastVisibleRow()).toBe(-1);
          expect(wt.wtTable.getFirstRenderedRow()).toBe(2);
          expect(wt.wtTable.getLastRenderedRow()).toBe(2);
        }

        wt.scrollViewport(new Walkontable.CellCoords(10, 0));
        wt.draw();

        {
          const firstRow = getTableMaster().find('tbody tr:first');

          expect(firstRow.find('td:first').text()).toBe('A11');
          expect(firstRow.find('td:last').text()).toBe('E11');
          expect(wt.wtTable.getFirstVisibleRow()).toBe(-1);
          expect(wt.wtTable.getLastVisibleRow()).toBe(-1);
          expect(wt.wtTable.getFirstRenderedRow()).toBe(10);
          expect(wt.wtTable.getLastRenderedRow()).toBe(10);
        }

        wt.scrollViewport(new Walkontable.CellCoords(getTotalRows() - 1, 0));
        wt.draw();

        {
          const firstRow = getTableMaster().find('tbody tr:first');

          expect(firstRow.find('td:first').text()).toBe('A100');
          expect(firstRow.find('td:last').text()).toBe('E100');
          expect(wt.wtTable.getFirstVisibleRow()).toBe(-1);
          expect(wt.wtTable.getLastVisibleRow()).toBe(-1);
          expect(wt.wtTable.getFirstRenderedRow()).toBe(99);
          expect(wt.wtTable.getLastRenderedRow()).toBe(99);
        }
      });

      it('should scroll to the next cell that is above viewport when all rows are oversized', () => {
        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
          rowHeight: 500,
          rowHeightByOverlayName: 500,
        });

        wt.draw();
        wt.scrollViewport(new Walkontable.CellCoords(getTotalRows() - 1, 0));
        wt.draw();
        wt.scrollViewport(new Walkontable.CellCoords(90, 0));
        wt.draw();

        {
          const firstRow = getTableMaster().find('tbody tr:first');

          expect(firstRow.find('td:first').text()).toBe('A91');
          expect(firstRow.find('td:last').text()).toBe('E91');
          expect(wt.wtTable.getFirstVisibleRow()).toBe(-1);
          expect(wt.wtTable.getLastVisibleRow()).toBe(-1);
          expect(wt.wtTable.getFirstRenderedRow()).toBe(90);
          expect(wt.wtTable.getLastRenderedRow()).toBe(90);
        }

        wt.scrollViewport(new Walkontable.CellCoords(50, 0));
        wt.draw();

        {
          const firstRow = getTableMaster().find('tbody tr:first');

          expect(firstRow.find('td:first').text()).toBe('A51');
          expect(firstRow.find('td:last').text()).toBe('E51');
          expect(wt.wtTable.getFirstVisibleRow()).toBe(-1);
          expect(wt.wtTable.getLastVisibleRow()).toBe(-1);
          expect(wt.wtTable.getFirstRenderedRow()).toBe(50);
          expect(wt.wtTable.getLastRenderedRow()).toBe(50);
        }

        wt.scrollViewport(new Walkontable.CellCoords(0, 0));
        wt.draw();

        {
          const firstRow = getTableMaster().find('tbody tr:first');

          expect(firstRow.find('td:first').text()).toBe('A1');
          expect(firstRow.find('td:last').text()).toBe('E1');
          expect(wt.wtTable.getFirstVisibleRow()).toBe(-1);
          expect(wt.wtTable.getLastVisibleRow()).toBe(-1);
          expect(wt.wtTable.getFirstRenderedRow()).toBe(0);
          expect(wt.wtTable.getLastRenderedRow()).toBe(0);
        }
      });
    });
  });

  describe('API', () => {
    describe('getLastVisibleColumn', () => {
      it('should return the same results when calling the `getLastVisibleColumn` method for RTL and LTR modes, when' +
        ' there\'s a gap at the inline-end-side of the table', async() => {
        let lastVisibleColumn = null;

        $('html').attr('dir', 'rtl');

        spec().$wrapper.css({
          overflow: '',
          paddingInlineEnd: '10000px'
        });
        spec().$wrapper.width('auto').height('auto');

        createDataArray(100, 100);

        const wt1 = walkontable({
          rtlMode: true,
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns
        });

        wt1.draw();

        await sleep(300);

        lastVisibleColumn = wt1.wtScroll.getLastVisibleColumn();

        // Reset the DOM setup
        $('html').attr('dir', 'ltr');

        spec().$wrapper.remove();
        spec().wotInstance.destroy();
        spec().$wrapper = $('<div></div>').addClass('handsontable').css({ paddingInlineEnd: '10000px' });
        spec().$container = $('<div></div>');
        spec().$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
        spec().$wrapper.append(spec().$container);
        spec().$container.append(spec().$table);
        spec().$wrapper.appendTo('body');

        const wt2 = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns
        });

        wt2.draw();

        await sleep(300);

        expect(wt2.wtScroll.getLastVisibleColumn()).toEqual(lastVisibleColumn);
      });
    });
  });
});
