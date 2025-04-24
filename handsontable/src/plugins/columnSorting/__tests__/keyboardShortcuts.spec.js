describe('ColumnSorting keyboard shortcut', () => {
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

  describe('"Enter"', () => {
    it('should not be possible to sort non-visible column', async() => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        columnSorting: true
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true);

      await render();
      await selectCell(-1, 1);
      await keyDownUp('enter');

      expect(getPlugin('columnSorting').getSortConfig()).toEqual([]);
    });

    it('should be possible to sort columns with correct sort order', async() => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        columnSorting: true
      });

      await selectCell(-1, 1);
      await keyDownUp('enter');

      expect(getPlugin('columnSorting').getSortConfig()).toEqual([{
        column: 1,
        sortOrder: 'asc',
      }]);

      await keyDownUp('enter');

      expect(getPlugin('columnSorting').getSortConfig()).toEqual([{
        column: 1,
        sortOrder: 'desc',
      }]);

      await keyDownUp('enter');

      expect(getPlugin('columnSorting').getSortConfig()).toEqual([]);

      await keyDownUp('enter');

      expect(getPlugin('columnSorting').getSortConfig()).toEqual([{
        column: 1,
        sortOrder: 'asc',
      }]);

      await selectCell(-1, 3);
      await keyDownUp('enter');

      expect(getPlugin('columnSorting').getSortConfig()).toEqual([{
        column: 3,
        sortOrder: 'asc',
      }]);
    });

    it('should be possible to sort a column when a column header is selected', async() => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        columnSorting: true
      });

      await selectCell(-1, 4);
      await listen();
      await keyDownUp('enter');

      expect(getPlugin('columnSorting').getSortConfig()).toEqual([{
        column: 4,
        sortOrder: 'asc',
      }]);
    });

    it('should be possible to sort a column when a column header is selected and NestedRows plugin is enabled (#dev-1817)', async() => {
      handsontable({
        data: [
          {
            category: 'Best Rock Performance',
            artist: null,
            __children: [
              {
                artist: 'Alabama Shakes',
              },
            ],
          }
        ],
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        columnSorting: true,
        nestedRows: true,
      });

      await selectCell(-1, 1);
      await listen();
      await keyDownUp('enter');

      expect(getPlugin('columnSorting').getSortConfig()).toEqual([{
        column: 1,
        sortOrder: 'asc',
      }]);
    });

    it('should not be possible to sort a column when a range of the columns are selected', async() => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        columnSorting: true
      });

      await selectColumns(1, 4, -1);
      await listen();
      await keyDownUp('enter');

      expect(getPlugin('columnSorting').getSortConfig()).toEqual([]);
    });

    it('should be possible to sort columns only by triggering the action from the lowest column header', async() => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        columnSorting: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
      });

      await selectCell(-1, -1); // corner
      await keyDownUp('enter');

      expect(getPlugin('columnSorting').getSortConfig()).toEqual([]);

      await selectCell(1, -1); // row header
      await keyDownUp('enter');

      expect(getPlugin('columnSorting').getSortConfig()).toEqual([]);

      await selectCell(-3, 1); // the first (top) column header
      await keyDownUp('enter');

      expect(getPlugin('columnSorting').getSortConfig()).toEqual([]);

      await selectCell(-2, 1); // the second column header
      await keyDownUp('enter');

      expect(getPlugin('columnSorting').getSortConfig()).toEqual([]);

      await selectCell(-1, 1); // the third (bottom) column header
      await keyDownUp('enter');

      expect(getPlugin('columnSorting').getSortConfig()).toEqual([{
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
        columnSorting: true,
      });

      await selectCell(-1, 1);
      await keyDownUp('enter');

      expect(getActiveEditor()).toBeUndefined();
    });
  });
});
