describe('Core_getCellMeta', () => {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should get proper cell meta when indexes was modified', () => {
    handsontable({
      modifyRow(row) {
        return row + 10;
      },
      modifyCol(col) {
        return col + 10;
      }
    });

    const cellMeta = getCellMeta(0, 1);

    expect(cellMeta.row).toEqual(10);
    expect(cellMeta.col).toEqual(11);
    expect(cellMeta.visualRow).toEqual(0);
    expect(cellMeta.visualCol).toEqual(1);
  });

  it('should not allow manual editing of a read only cell', () => {
    var allCellsReadOnly = false;

    handsontable({
      cells() {
        return {readOnly: allCellsReadOnly};
      }
    });
    allCellsReadOnly = true;
    selectCell(2, 2);

    keyDown('enter');

    expect(isEditorVisible()).toEqual(false);
  });

  it('should allow manual editing of cell that is no longer read only', () => {
    var allCellsReadOnly = true;

    handsontable({
      cells() {
        return {readOnly: allCellsReadOnly};
      }
    });
    allCellsReadOnly = false;
    selectCell(2, 2);

    keyDown('enter');

    expect(isEditorVisible()).toEqual(true);
  });

  it('should move the selection to the cell below, when hitting the ENTER key on a read-only cell', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      cells() {
        return {readOnly: true};
      }
    });

    selectCell(0, 0);
    expect(getCellMeta(0, 0).readOnly).toBe(true);
    keyDown('enter');
    expect(getSelected()).toEqual([1, 0, 1, 0]);

  });

  it('should use default cell editor for a cell that has declared only cell renderer', () => {
    handsontable({
      cells() {
        return {
          renderer(instance, td, row, col, prop, value, cellProperties) {
            // taken from demo/renderers.html
            Handsontable.renderers.TextRenderer.apply(this, arguments);
            $(td).css({
              background: 'yellow'
            });
          }
        };
      }
    });
    selectCell(2, 2);

    keyDown('enter');
    document.activeElement.value = 'new value';
    destroyEditor();
    expect(getDataAtCell(2, 2)).toEqual('new value');
  });

  it('should allow to use type and renderer in `flat` notation', () => {
    handsontable({
      data: [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [0, 9, 8, 7]
      ],
      cells(row, col) {
        if (row === 2 && col === 2) {
          return {
            type: 'checkbox',
            renderer(instance, td, row, col, prop, value, cellProperties) {
              // taken from demo/renderers.html
              Handsontable.renderers.TextRenderer.apply(this, arguments);

              td.style.backgroundColor = 'yellow';
            }
          };
        }
      }
    });

    expect(getCell(2, 2).style.backgroundColor).toEqual('yellow');
    expect(getCell(1, 1).style.backgroundColor).toEqual('');
  });

  it('this in cells should point to cellProperties', () => {
    var called = 0,
      _row,
      _this;

    handsontable({
      cells(row, col, prop) {
        called++;
        _row = row;
        _this = this;
      }
    });

    var HOT = getInstance();

    expect(called).toBeGreaterThan(0);
    expect(_this.row).toEqual(_row);
    expect(_this.instance).toBe(HOT);
  });

  it('should get proper cellProperties when order of displayed rows is different than order of stored data', function() {
    var hot = handsontable({
      data: [
        ['C'],
        ['A'],
        ['B']
      ],
      minSpareRows: 1,
      cells(row, col, prop) {
        var cellProperties = {};

        if (getSourceData()[row][col] === 'A') {
          cellProperties.readOnly = true;
        }

        return cellProperties;
      }
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('C');
    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').hasClass('htDimmed')).toBe(false);

    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('A');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').hasClass('htDimmed')).toBe(true);

    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('B');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').hasClass('htDimmed')).toBe(false);

    // Column sorting changes the order of displayed rows while keeping table data unchanged
    updateSettings({
      columnSorting: {
        column: 0,
        sortOrder: true
      }
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A');
    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').hasClass('htDimmed')).toBe(true);

    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('B');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').hasClass('htDimmed')).toBe(false);

    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('C');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').hasClass('htDimmed')).toBe(false);
  });

  it('should call `beforeGetCellMeta` plugin hook with visual indexes as parameters', () => {
    let rowInsideHook;
    let colInsideHook;

    const hot = handsontable({
      beforeGetCellMeta: function (row, col) {
        rowInsideHook = row;
        colInsideHook = col;
      },
      modifyRow(row) {
        return row + 10;
      },
      modifyCol(col) {
        return col + 10;
      }
    });

    hot.getCellMeta(0, 1);

    expect(rowInsideHook).toEqual(0);
    expect(colInsideHook).toEqual(1);
  });

  it('should call `afterGetCellMeta` plugin hook with visual indexes as parameters', () => {
    let rowInsideHook;
    let colInsideHook;

    const hot = handsontable({
      afterGetCellMeta: function (row, col) {
        rowInsideHook = row;
        colInsideHook = col;
      },
      modifyRow(row) {
        return row + 10;
      },
      modifyCol(col) {
        return col + 10;
      }
    });

    hot.getCellMeta(0, 1);

    expect(rowInsideHook).toEqual(0);
    expect(colInsideHook).toEqual(1);
  });
});
