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

  describe('"Control/Meta" + "Enter"', () => {
    it('should be possible to sort columns with correct sort order', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        multiColumnSorting: true
      });

      selectCell(-1, 1);
      keyDownUp(['control/meta', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([{
        column: 1,
        sortOrder: 'asc',
      }]);

      keyDownUp(['control/meta', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([{
        column: 1,
        sortOrder: 'desc',
      }]);

      keyDownUp(['control/meta', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([]);

      keyDownUp(['control/meta', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([{
        column: 1,
        sortOrder: 'asc',
      }]);
    });

    it('should be possible to sort multi-columns with correct sort order', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        multiColumnSorting: true
      });

      selectCell(-1, 1);
      keyDownUp(['control/meta', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([{
        column: 1,
        sortOrder: 'asc',
      }]);

      selectCell(-1, 3);
      keyDownUp(['control/meta', 'enter']);

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

      keyDownUp(['control/meta', 'enter']);

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

      keyDownUp(['control/meta', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([{
        column: 1,
        sortOrder: 'asc',
      }]);

      selectCell(-1, 5);
      keyDownUp(['control/meta', 'enter']);

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

      selectCell(-1, 1);
      keyDownUp(['control/meta', 'enter']);

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

    it('should be possible to sort a column when a range of the columns are selected', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        multiColumnSorting: true
      });

      selectColumns(1, 4, -1);
      listen();
      keyDownUp(['control/meta', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([{
        column: 1,
        sortOrder: 'asc',
      }]);
    });

    it('should be possible to sort columns only by triggering the action from the lowest column header', () => {
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

      selectCell(-1, -1); // corner
      keyDownUp(['control/meta', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([]);

      selectCell(1, -1); // row header
      keyDownUp(['control/meta', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([]);

      selectCell(-3, 1); // the first (top) column header
      keyDownUp(['control/meta', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([]);

      selectCell(-2, 1); // the second column header
      keyDownUp(['control/meta', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([]);

      selectCell(-1, 1); // the third (bottom) column header
      keyDownUp(['control/meta', 'enter']);

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([{
        column: 1,
        sortOrder: 'asc',
      }]);
    });

    it('should not trigger the editor to be opened', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        multiColumnSorting: true,
      });

      selectCell(-1, 1);
      keyDownUp(['control/meta', 'enter']);

      expect(getActiveEditor()).toBeUndefined();
    });
  });

  describe('"Enter"', () => {
    it('should clear all multiple columns sort state and sort a single column', () => {
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

      selectCell(-1, 2);
      keyDownUp('enter');

      expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([{
        column: 2,
        sortOrder: 'asc',
      }]);
    });
  });
});
