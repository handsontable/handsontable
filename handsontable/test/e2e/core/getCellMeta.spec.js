describe('Core.getCellMeta', () => {
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

  it('should get proper cell meta when indexes was modified', async() => {
    handsontable({
      minRows: 5,
      minCols: 5,
    });

    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);
    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    const cellMeta = getCellMeta(0, 1);

    expect(cellMeta.row).toBe(4);
    expect(cellMeta.col).toBe(3);
    expect(cellMeta.visualRow).toBe(0);
    expect(cellMeta.visualCol).toBe(1);
  });

  it('should not allow manual editing of a read only cell', async() => {
    let allCellsReadOnly = false;

    handsontable({
      cells() {
        return { readOnly: allCellsReadOnly };
      }
    });
    allCellsReadOnly = true;

    await render(); // It triggers the table "slow render" cycle that clears the cell meta cache

    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(isEditorVisible()).toBe(false);
  });

  it('should allow manual editing of cell that is no longer read only', async() => {
    let allCellsReadOnly = true;

    handsontable({
      cells() {
        return { readOnly: allCellsReadOnly };
      }
    });
    allCellsReadOnly = false;

    await render(); // It triggers the table "slow render" cycle that clears the cell meta cache

    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(isEditorVisible()).toBe(true);
  });

  it('should move the selection to the cell below, when hitting the ENTER key on a read-only cell', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      cells() {
        return { readOnly: true };
      }
    });

    await selectCell(0, 0);

    expect(getCellMeta(0, 0).readOnly).toBe(true);

    await keyDownUp('enter');

    expect(getSelected()).toEqual([[1, 0, 1, 0]]);
  });

  it('should use default cell editor for a cell that has declared only cell renderer', async() => {
    handsontable({
      cells() {
        return {
          renderer(instance, td, ...args) {
            // taken from demo/renderers.html
            Handsontable.renderers.TextRenderer.apply(this, [instance, td, ...args]);
            $(td).css({
              background: 'yellow'
            });
          }
        };
      }
    });

    await selectCell(2, 2);
    await keyDownUp('enter');

    document.activeElement.value = 'new value';
    destroyEditor();

    expect(getDataAtCell(2, 2)).toBe('new value');
  });

  it('should allow to use `type` and other type-related options in the same configuration level (using `beforeGetCellMeta` hook)', async() => {
    const { getCellType } = Handsontable.cellTypes;
    const myRenderer = function(instance, td, row, col, prop, value) {
      td.innerHTML = `${value}-*`;
    };

    handsontable({
      beforeGetCellMeta(row, col, cellProperties) {
        if (row === 1 && col === 0) {
          cellProperties.type = 'numeric';
        }
        if (row === 2 && col === 0) {
          cellProperties.type = 'autocomplete';
          cellProperties.renderer = myRenderer;
          cellProperties.copyable = false;
        }
      },
    });

    expect(getCellMeta(0, 0).editor).toBe(getCellType('text').editor);
    expect(getCellMeta(1, 0).editor).toBe(getCellType('numeric').editor);
    expect(getCellMeta(1, 0).renderer).toBe(getCellType('numeric').renderer);
    expect(getCellMeta(1, 0).validator).toBe(getCellType('numeric').validator);
    expect(getCellMeta(2, 0).editor).toBe(getCellType('autocomplete').editor);
    expect(getCellMeta(2, 0).renderer).toBe(myRenderer);
    expect(getCellMeta(2, 0).copyable).toBe(false);
    expect(getCellMeta(2, 0).validator).toBe(getCellType('autocomplete').validator);
    expect(getCellMeta(3, 0).editor).toBe(getCellType('text').editor);
  });

  it('should allow to use `type` and other type-related options in the same configuration level (using `cells` option)', async() => {
    const { getCellType } = Handsontable.cellTypes;
    const myRenderer = function(instance, td, row, col, prop, value) {
      td.innerHTML = `${value}-*`;
    };

    handsontable({
      cells(row, col) {
        const cellProperties = {};

        if (row === 1 && col === 0) {
          cellProperties.type = 'numeric';
        }
        if (row === 2 && col === 0) {
          cellProperties.type = 'autocomplete';
          cellProperties.renderer = myRenderer;
          cellProperties.copyable = false;
        }

        return cellProperties;
      },
    });

    expect(getCellMeta(0, 0).editor).toBe(getCellType('text').editor);
    expect(getCellMeta(1, 0).editor).toBe(getCellType('numeric').editor);
    expect(getCellMeta(1, 0).renderer).toBe(getCellType('numeric').renderer);
    expect(getCellMeta(1, 0).validator).toBe(getCellType('numeric').validator);
    expect(getCellMeta(2, 0).editor).toBe(getCellType('autocomplete').editor);
    expect(getCellMeta(2, 0).renderer).toBe(myRenderer);
    expect(getCellMeta(2, 0).copyable).toBe(false);
    expect(getCellMeta(2, 0).validator).toBe(getCellType('autocomplete').validator);
    expect(getCellMeta(3, 0).editor).toBe(getCellType('text').editor);
  });

  it('should allow to use `type` and other type-related options in the same configuration level (using `columns` option)', async() => {
    const { getCellType } = Handsontable.cellTypes;
    const myRenderer = function(instance, td, row, col, prop, value) {
      td.innerHTML = `${value}-*`;
    };

    class MyEditor {}

    handsontable({
      columns: [
        { type: 'text' },
        {
          type: 'text',
          renderer: myRenderer,
        },
        {
          type: 'password',
          editor: MyEditor,
          copyable: true,
        },
      ]
    });

    expect(getCellMeta(0, 0).type).toBe('text');
    expect(getCellMeta(0, 0).renderer).toBe(getCellType('text').renderer);
    expect(getCellMeta(0, 0).editor).toBe(getCellType('text').editor);
    expect(getCellMeta(0, 1).type).toBe('text');
    expect(getCellMeta(0, 1).renderer).toBe(myRenderer);
    expect(getCellMeta(0, 1).editor).toBe(getCellType('text').editor);
    expect(getCellMeta(0, 2).type).toBe('password');
    expect(getCellMeta(0, 2).renderer).toBe(getCellType('password').renderer);
    expect(getCellMeta(0, 2).editor).toBe(MyEditor);
    expect(getCellMeta(0, 2).copyable).toBe(true);
  });

  it('"this" in cells should point to cellProperties', async() => {
    let called = 0;
    let _row;
    let _this;

    handsontable({
      autoRowSize: false,
      autoColumnSize: false,
      cells(row) {
        called += 1;
        _row = row;
        _this = this;
      }
    });

    const HOT = getInstance();

    expect(called).toBe(25); // default dataset is 5x5 so 25 calls
    expect(_this.row).toBe(_row);
    expect(_this.instance).toBe(HOT);
  });

  it('should get proper cellProperties when order of displayed rows is different than order of stored data', async() => {
    handsontable({
      data: [
        ['C'],
        ['A'],
        ['B']
      ],
      minSpareRows: 1,
      cells(row, col) {
        const cellProperties = {};

        if (this.instance.getSourceDataAtCell(row, col) === 'A') {
          cellProperties.readOnly = true;
        }

        return cellProperties;
      }
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toBe('C');
    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').hasClass('htDimmed')).toBe(false);

    expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toBe('A');
    expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').hasClass('htDimmed')).toBe(true);

    expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toBe('B');
    expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').hasClass('htDimmed')).toBe(false);

    // Column sorting changes the order of displayed rows while keeping table data unchanged
    await updateSettings({
      columnSorting: {
        initialConfig: {
          column: 0,
          sortOrder: 'asc'
        }
      }
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toBe('A');
    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').hasClass('htDimmed')).toBe(true);

    expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toBe('B');
    expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').hasClass('htDimmed')).toBe(false);

    expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toBe('C');
    expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').hasClass('htDimmed')).toBe(false);
  });

  it('should call `beforeGetCellMeta` plugin hook with visual indexes as parameters', async() => {
    let rowInsideHook;
    let colInsideHook;

    handsontable({
      minRows: 5,
      minCols: 5,
      beforeGetCellMeta(row, col) {
        rowInsideHook = row;
        colInsideHook = col;
      },
    });

    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);
    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    await render(); // It triggers the table "slow render" cycle that clears the cell meta cache

    getCellMeta(0, 0);

    // The last beforeGetCellMeta call should be called with visual index 4, 4
    expect(rowInsideHook).toBe(4);
    expect(colInsideHook).toBe(4);
  });

  it('should call `afterGetCellMeta` plugin hook with visual indexes as parameters', async() => {
    let rowInsideHook;
    let colInsideHook;

    handsontable({
      minRows: 5,
      minCols: 5,
      afterGetCellMeta(row, col) {
        rowInsideHook = row;
        colInsideHook = col;
      }
    });

    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);
    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    await render(); // It triggers the table "slow render" cycle that clears the cell meta cache

    getCellMeta(0, 1);

    // The last beforeGetCellMeta call should be called with visual index 4, 4
    expect(rowInsideHook).toBe(4);
    expect(colInsideHook).toBe(4);
  });

  describe('when skipMetaExtension =', () => {
    let cellsSpy;
    let beforeGetCellMetaSpy;
    let afterGetCellMetaSpy;

    beforeEach(() => {
      cellsSpy = jasmine.createSpy('cells');
      beforeGetCellMetaSpy = jasmine.createSpy('beforeGetCellMeta');
      afterGetCellMetaSpy = jasmine.createSpy('afterGetCellMeta');

      handsontable({
        data: createSpreadsheetData(1, 1),
        columns: [
          { type: 'date', dateFormat: 'DD/MM/YYYY' },
        ],
        cells: cellsSpy,
        beforeGetCellMeta: beforeGetCellMetaSpy,
        afterGetCellMeta: afterGetCellMetaSpy,
      });

      runHooks('beforeRender', true); // Clear DynamicCellMetaMod cache

      cellsSpy.calls.reset();
      beforeGetCellMetaSpy.calls.reset();
      afterGetCellMetaSpy.calls.reset();
    });

    it('false (default), should call `cells`, `beforeGetCellMeta` and `afterGetCellMeta`', async() => {
      getCellMeta(0, 0);

      expect(cellsSpy).toHaveBeenCalledTimes(1);
      expect(beforeGetCellMetaSpy).toHaveBeenCalledTimes(1);
      expect(afterGetCellMetaSpy).toHaveBeenCalledTimes(1);
    });

    it('true, should not call `cells`, `beforeGetCellMeta` nor `afterGetCellMeta`', async() => {
      getCellMeta(0, 0, { skipMetaExtension: true });

      expect(cellsSpy).not.toHaveBeenCalled();
      expect(beforeGetCellMetaSpy).not.toHaveBeenCalled();
      expect(afterGetCellMetaSpy).not.toHaveBeenCalled();
    });
  });
});
