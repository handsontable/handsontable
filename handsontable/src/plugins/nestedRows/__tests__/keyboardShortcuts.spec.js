describe('NestedRows keyboard shortcut', () => {
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

  describe('"Enter"', () => {
    it('should not be possible to collapse or expand non-visible row', () => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true
      });

      const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(0, true);

      render();
      selectCell(0, -1);
      keyDownUp('enter');

      expect(getData()).toEqual([
        ['a0', 'b0'],
        ['a0-a0', 'b0-b0'],
        ['a0-a1', 'b0-b1'],
        ['a0-a2', 'b0-b2'],
        ['a0-a2-a0', 'b0-b2-b0'],
        ['a0-a2-a0-a0', 'b0-b2-b0-b0'],
        ['a0-a3', 'b0-b3'],
        ['a1', 'b1'],
        ['a2', 'b2'],
        ['a2-a0', 'b2-b0'],
        ['a2-a1', 'b2-b1'],
        ['a2-a1-a0', 'b2-b1-b0'],
        ['a2-a1-a1', 'b2-b1-b1'],
      ]);
    });

    it('should be possible to collapse nested rows', () => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true
      });

      selectCell(4, -1);
      keyDownUp('enter');

      expect(getData()).toEqual([
        ['a0', 'b0'],
        ['a0-a0', 'b0-b0'],
        ['a0-a1', 'b0-b1'],
        ['a0-a2', 'b0-b2'],
        ['a0-a2-a0', 'b0-b2-b0'],
        // ['a0-a2-a0-a0', 'b0-b2-b0-b0'], // collapsed data
        ['a0-a3', 'b0-b3'],
        ['a1', 'b1'],
        ['a2', 'b2'],
        ['a2-a0', 'b2-b0'],
        ['a2-a1', 'b2-b1'],
        ['a2-a1-a0', 'b2-b1-b0'],
        ['a2-a1-a1', 'b2-b1-b1'],
      ]);

      selectCell(3, -1);
      keyDownUp('enter');

      expect(getData()).toEqual([
        ['a0', 'b0'],
        ['a0-a0', 'b0-b0'],
        ['a0-a1', 'b0-b1'],
        ['a0-a2', 'b0-b2'],
        // ['a0-a2-a0', 'b0-b2-b0'], // collapsed data
        // ['a0-a2-a0-a0', 'b0-b2-b0-b0'],
        ['a0-a3', 'b0-b3'],
        ['a1', 'b1'],
        ['a2', 'b2'],
        ['a2-a0', 'b2-b0'],
        ['a2-a1', 'b2-b1'],
        ['a2-a1-a0', 'b2-b1-b0'],
        ['a2-a1-a1', 'b2-b1-b1'],
      ]);

      selectCell(0, -1);
      keyDownUp('enter');

      expect(getData()).toEqual([
        ['a0', 'b0'],
        // ['a0-a0', 'b0-b0'], // collapsed data
        // ['a0-a1', 'b0-b1'],
        // ['a0-a2', 'b0-b2'],
        // ['a0-a2-a0', 'b0-b2-b0'],
        // ['a0-a2-a0-a0', 'b0-b2-b0-b0'],
        // ['a0-a3', 'b0-b3'],
        ['a1', 'b1'],
        ['a2', 'b2'],
        ['a2-a0', 'b2-b0'],
        ['a2-a1', 'b2-b1'],
        ['a2-a1-a0', 'b2-b1-b0'],
        ['a2-a1-a1', 'b2-b1-b1'],
      ]);

      selectCell(2, -1);
      keyDownUp('enter');

      expect(getData()).toEqual([
        ['a0', 'b0'],
        // ['a0-a0', 'b0-b0'], // collapsed data
        // ['a0-a1', 'b0-b1'],
        // ['a0-a2', 'b0-b2'],
        // ['a0-a2-a0', 'b0-b2-b0'],
        // ['a0-a2-a0-a0', 'b0-b2-b0-b0'],
        // ['a0-a3', 'b0-b3'],
        ['a1', 'b1'],
        ['a2', 'b2'],
        // ['a2-a0', 'b2-b0'], // collapsed data
        // ['a2-a1', 'b2-b1'],
        // ['a2-a1-a0', 'b2-b1-b0'],
        // ['a2-a1-a1', 'b2-b1-b1'],
      ]);
    });

    it('should be possible to collapse a single row when a single row header is selected', () => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true
      });

      selectCell(0, -1);
      listen();
      keyDownUp('enter');

      expect(getData()).toEqual([
        ['a0', 'b0'],
        // ['a0-a0', 'b0-b0'],
        // ['a0-a1', 'b0-b1'],
        // ['a0-a2', 'b0-b2'],
        // ['a0-a2-a0', 'b0-b2-b0'],
        // ['a0-a2-a0-a0', 'b0-b2-b0-b0'],
        // ['a0-a3', 'b0-b3'],
        ['a1', 'b1'],
        ['a2', 'b2'],
        ['a2-a0', 'b2-b0'],
        ['a2-a1', 'b2-b1'],
        ['a2-a1-a0', 'b2-b1-b0'],
        ['a2-a1-a1', 'b2-b1-b1'],
      ]);
    });

    it('should be possible to collapse a single row when a single row header is selected and ColumnSorting plugin is enabled (#dev-1817)', () => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true,
        columnSorting: true,
      });

      selectCell(0, -1);
      listen();
      keyDownUp('enter');

      expect(getData()).toEqual([
        ['a0', 'b0'],
        // ['a0-a0', 'b0-b0'],
        // ['a0-a1', 'b0-b1'],
        // ['a0-a2', 'b0-b2'],
        // ['a0-a2-a0', 'b0-b2-b0'],
        // ['a0-a2-a0-a0', 'b0-b2-b0-b0'],
        // ['a0-a3', 'b0-b3'],
        ['a1', 'b1'],
        ['a2', 'b2'],
        ['a2-a0', 'b2-b0'],
        ['a2-a1', 'b2-b1'],
        ['a2-a1-a0', 'b2-b1-b0'],
        ['a2-a1-a1', 'b2-b1-b1'],
      ]);
    });

    it('should not be possible to collapse a single row when a range of the rows are selected', () => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true
      });

      selectRows(0, 4, -1);
      listen();
      keyDownUp('enter');

      expect(getData()).toEqual([
        ['a0', 'b0'],
        ['a0-a0', 'b0-b0'],
        ['a0-a1', 'b0-b1'],
        ['a0-a2', 'b0-b2'],
        ['a0-a2-a0', 'b0-b2-b0'],
        ['a0-a2-a0-a0', 'b0-b2-b0-b0'],
        ['a0-a3', 'b0-b3'],
        ['a1', 'b1'],
        ['a2', 'b2'],
        ['a2-a0', 'b2-b0'],
        ['a2-a1', 'b2-b1'],
        ['a2-a1-a0', 'b2-b1-b0'],
        ['a2-a1-a1', 'b2-b1-b1'],
      ]);
    });

    it('should be possible to expand all nested rows', () => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true
      });

      getPlugin('nestedRows').collapsingUI.collapseChildren(3);
      getPlugin('nestedRows').collapsingUI.collapseChildren(0);
      getPlugin('nestedRows').collapsingUI.collapseChildren(10);
      getPlugin('nestedRows').collapsingUI.collapseChildren(8);

      selectCell(2, -1);
      keyDownUp('enter');

      expect(getData()).toEqual([
        ['a0', 'b0'],
        // ['a0-a0', 'b0-b0'], // collapsed data
        // ['a0-a1', 'b0-b1'],
        // ['a0-a2', 'b0-b2'],
        // ['a0-a2-a0', 'b0-b2-b0'],
        // ['a0-a2-a0-a0', 'b0-b2-b0-b0'],
        // ['a0-a3', 'b0-b3'],
        ['a1', 'b1'],
        ['a2', 'b2'],
        ['a2-a0', 'b2-b0'],
        ['a2-a1', 'b2-b1'],
        // ['a2-a1-a0', 'b2-b1-b0'], // collapsed data
        // ['a2-a1-a1', 'b2-b1-b1'],
      ]);

      selectCell(0, -1);
      keyDownUp('enter');

      expect(getData()).toEqual([
        ['a0', 'b0'],
        ['a0-a0', 'b0-b0'],
        ['a0-a1', 'b0-b1'],
        ['a0-a2', 'b0-b2'],
        // ['a0-a2-a0', 'b0-b2-b0'], // collapsed data
        // ['a0-a2-a0-a0', 'b0-b2-b0-b0'],
        ['a0-a3', 'b0-b3'],
        ['a1', 'b1'],
        ['a2', 'b2'],
        ['a2-a0', 'b2-b0'],
        ['a2-a1', 'b2-b1'],
        // ['a2-a1-a0', 'b2-b1-b0'], // collapsed data
        // ['a2-a1-a1', 'b2-b1-b1'],
      ]);

      selectCell(8, -1);
      keyDownUp('enter');

      expect(getData()).toEqual([
        ['a0', 'b0'],
        ['a0-a0', 'b0-b0'],
        ['a0-a1', 'b0-b1'],
        ['a0-a2', 'b0-b2'],
        // ['a0-a2-a0', 'b0-b2-b0'], // collapsed data
        // ['a0-a2-a0-a0', 'b0-b2-b0-b0'],
        ['a0-a3', 'b0-b3'],
        ['a1', 'b1'],
        ['a2', 'b2'],
        ['a2-a0', 'b2-b0'],
        ['a2-a1', 'b2-b1'],
        ['a2-a1-a0', 'b2-b1-b0'],
        ['a2-a1-a1', 'b2-b1-b1'],
      ]);

      selectCell(3, -1);
      keyDownUp('enter');

      expect(getData()).toEqual([
        ['a0', 'b0'],
        ['a0-a0', 'b0-b0'],
        ['a0-a1', 'b0-b1'],
        ['a0-a2', 'b0-b2'],
        ['a0-a2-a0', 'b0-b2-b0'],
        ['a0-a2-a0-a0', 'b0-b2-b0-b0'],
        ['a0-a3', 'b0-b3'],
        ['a1', 'b1'],
        ['a2', 'b2'],
        ['a2-a0', 'b2-b0'],
        ['a2-a1', 'b2-b1'],
        ['a2-a1-a0', 'b2-b1-b0'],
        ['a2-a1-a1', 'b2-b1-b1'],
      ]);
    });

    it('should be possible to expand a single row when a row header is selected', () => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true
      });

      getPlugin('nestedRows').collapsingUI.collapseChildren(0);

      selectCell(0, -1);
      listen();
      keyDownUp('enter');

      expect(getData()).toEqual([
        ['a0', 'b0'],
        ['a0-a0', 'b0-b0'],
        ['a0-a1', 'b0-b1'],
        ['a0-a2', 'b0-b2'],
        ['a0-a2-a0', 'b0-b2-b0'],
        ['a0-a2-a0-a0', 'b0-b2-b0-b0'],
        ['a0-a3', 'b0-b3'],
        ['a1', 'b1'],
        ['a2', 'b2'],
        ['a2-a0', 'b2-b0'],
        ['a2-a1', 'b2-b1'],
        ['a2-a1-a0', 'b2-b1-b0'],
        ['a2-a1-a1', 'b2-b1-b1'],
      ]);
    });

    it('should not be possible to expand a single row when a range of rows are selected', () => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true
      });

      getPlugin('nestedRows').collapsingUI.collapseChildren(0);

      selectRows(0, 4, -1);
      listen();
      keyDownUp('enter');

      expect(getData()).toEqual([
        ['a0', 'b0'],
        ['a1', 'b1'],
        ['a2', 'b2'],
        ['a2-a0', 'b2-b0'],
        ['a2-a1', 'b2-b1'],
        ['a2-a1-a0', 'b2-b1-b0'],
        ['a2-a1-a1', 'b2-b1-b1'],
      ]);
    });

    it('should be possible to collapse/expand only nested rows', () => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true,
      });

      selectCell(-1, -1); // corner
      keyDownUp('enter');

      expect(getData()).toEqual([
        ['a0', 'b0'],
        ['a0-a0', 'b0-b0'],
        ['a0-a1', 'b0-b1'],
        ['a0-a2', 'b0-b2'],
        ['a0-a2-a0', 'b0-b2-b0'],
        ['a0-a2-a0-a0', 'b0-b2-b0-b0'],
        ['a0-a3', 'b0-b3'],
        ['a1', 'b1'],
        ['a2', 'b2'],
        ['a2-a0', 'b2-b0'],
        ['a2-a1', 'b2-b1'],
        ['a2-a1-a0', 'b2-b1-b0'],
        ['a2-a1-a1', 'b2-b1-b1'],
      ]);

      selectCell(-1, 1); // column header
      keyDownUp('enter');

      expect(getData()).toEqual([
        ['a0', 'b0'],
        ['a0-a0', 'b0-b0'],
        ['a0-a1', 'b0-b1'],
        ['a0-a2', 'b0-b2'],
        ['a0-a2-a0', 'b0-b2-b0'],
        ['a0-a2-a0-a0', 'b0-b2-b0-b0'],
        ['a0-a3', 'b0-b3'],
        ['a1', 'b1'],
        ['a2', 'b2'],
        ['a2-a0', 'b2-b0'],
        ['a2-a1', 'b2-b1'],
        ['a2-a1-a0', 'b2-b1-b0'],
        ['a2-a1-a1', 'b2-b1-b1'],
      ]);

      selectCell(2, -1); // non nested header
      keyDownUp('enter');

      expect(getData()).toEqual([
        ['a0', 'b0'],
        ['a0-a0', 'b0-b0'],
        ['a0-a1', 'b0-b1'],
        ['a0-a2', 'b0-b2'],
        ['a0-a2-a0', 'b0-b2-b0'],
        ['a0-a2-a0-a0', 'b0-b2-b0-b0'],
        ['a0-a3', 'b0-b3'],
        ['a1', 'b1'],
        ['a2', 'b2'],
        ['a2-a0', 'b2-b0'],
        ['a2-a1', 'b2-b1'],
        ['a2-a1-a0', 'b2-b1-b0'],
        ['a2-a1-a1', 'b2-b1-b1'],
      ]);
    });

    it('should not trigger the editor to be opened', () => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true
      });

      selectCell(0, -1);
      keyDownUp('enter');

      expect(getActiveEditor()).toBeUndefined();
    });
  });
});
