describe('MultiColumnSorting keyboard shortcut', () => {
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

  function columnHeader(renderedColumnIndex, TH) {
    const visualColumnsIndex = renderedColumnIndex >= 0 ?
      this.columnIndexMapper.getVisualFromRenderableIndex(renderedColumnIndex) : renderedColumnIndex;

    this.view.appendColHeader(visualColumnsIndex, TH);
  }

  describe('"Shift" + "Enter"', () => {
    it('should not be possible to sort non-visible column', async() => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        multiColumnSorting: true
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true);

      await render();
      await selectCell(-1, 1);
      await keyDownUp(['shift', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([]);
    });

    it('should be possible to sort columns with correct sort order', async() => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        multiColumnSorting: true
      });

      await selectCell(-1, 1);
      await keyDownUp(['shift', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([{
        column: 1,
        sortOrder: 'asc',
      }]);

      await keyDownUp(['shift', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([{
        column: 1,
        sortOrder: 'desc',
      }]);

      await keyDownUp(['shift', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([]);

      await keyDownUp(['shift', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([{
        column: 1,
        sortOrder: 'asc',
      }]);
    });

    it('should be possible to sort multi-columns with correct sort order', async() => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        multiColumnSorting: true
      });

      await selectCell(-1, 1);
      await keyDownUp(['shift', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([{
        column: 1,
        sortOrder: 'asc',
      }]);

      await selectCell(-1, 3);
      await keyDownUp(['shift', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([
        {
          column: 1,
          sortOrder: 'asc',
        },
        {
          column: 3,
          sortOrder: 'asc',
        }
      ]);

      await keyDownUp(['shift', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([
        {
          column: 1,
          sortOrder: 'asc',
        },
        {
          column: 3,
          sortOrder: 'desc',
        }
      ]);

      await keyDownUp(['shift', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([{
        column: 1,
        sortOrder: 'asc',
      }]);

      await selectCell(-1, 5);
      await keyDownUp(['shift', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([
        {
          column: 1,
          sortOrder: 'asc',
        },
        {
          column: 5,
          sortOrder: 'asc',
        }
      ]);

      await selectCell(-1, 1);
      await keyDownUp(['shift', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([
        {
          column: 5,
          sortOrder: 'asc',
        },
        {
          column: 1,
          sortOrder: 'desc',
        },
      ]);
    });

    it('should be possible to sort a column when a range of the columns are selected', async() => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        multiColumnSorting: true
      });

      await selectCell(-1, 4);
      await listen();
      await keyDownUp(['shift', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([{
        column: 4,
        sortOrder: 'asc',
      }]);
    });

    it('should not be possible to sort a column when a range of the columns are selected', async() => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        multiColumnSorting: true
      });

      await selectColumns(1, 4, -1);
      await listen();
      await keyDownUp(['shift', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([]);
    });

    it('should be possible to sort columns only by triggering the action from the lowest column header', async() => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        multiColumnSorting: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
      });

      await selectCell(-1, -1); // corner
      await keyDownUp(['shift', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([]);

      await selectCell(1, -1); // row header
      await keyDownUp(['shift', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([]);

      await selectCell(-3, 1); // the first (top) column header
      await keyDownUp(['shift', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([]);

      await selectCell(-2, 1); // the second column header
      await keyDownUp(['shift', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([]);

      await selectCell(-1, 1); // the third (bottom) column header
      await keyDownUp(['shift', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([{
        column: 1,
        sortOrder: 'asc',
      }]);
    });

    it('should not trigger the editor to be opened', async() => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        multiColumnSorting: true,
      });

      await selectCell(-1, 1);
      await keyDownUp(['shift', 'enter']);

      expect(getActiveEditor()).toBeUndefined();
    });
  });

  describe('"Enter"', () => {
    it('should clear all multiple columns sort state and sort a single column', async() => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        multiColumnSorting: true,
      });

      getPlugin('multiColumnSorting').sort([
        { column: 1, sortOrder: 'asc' },
        { column: 3, sortOrder: 'desc' },
        { column: 4, sortOrder: 'desc' },
      ]);

      await selectCell(-1, 2);
      await keyDownUp('enter');

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([{
        column: 2,
        sortOrder: 'asc',
      }]);
    });
  });
});
