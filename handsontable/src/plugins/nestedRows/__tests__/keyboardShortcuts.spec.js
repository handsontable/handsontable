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
    it('should not be possible to collapse or expand non-visible row', async() => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true
      });

      const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(0, true);

      await render();
      await selectCell(0, -1);
      await keyDownUp('enter');

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

    it('should be possible to collapse nested rows', async() => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true
      });

      await selectCell(4, -1);
      await keyDownUp('enter');

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

      await selectCell(3, -1);
      await keyDownUp('enter');

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

      await selectCell(0, -1);
      await keyDownUp('enter');

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

      await selectCell(2, -1);
      await keyDownUp('enter');

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

    it('should be possible to collapse a single row when a single row header is selected', async() => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true
      });

      await selectCell(0, -1);
      await listen();
      await keyDownUp('enter');

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

    it('should be possible to collapse a single row when a single row header is selected and ColumnSorting plugin is enabled (#dev-1817)', async() => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true,
        columnSorting: true,
      });

      await selectCell(0, -1);
      await listen();
      await keyDownUp('enter');

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

    it('should not be possible to collapse a single row when a range of the rows are selected', async() => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true
      });

      await selectRows(0, 4, -1);
      await listen();
      await keyDownUp('enter');

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

    it('should be possible to expand all nested rows', async() => {
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

      await selectCell(2, -1);
      await keyDownUp('enter');

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

      await selectCell(0, -1);
      await keyDownUp('enter');

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

      await selectCell(8, -1);
      await keyDownUp('enter');

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

      await selectCell(3, -1);
      await keyDownUp('enter');

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

    it('should be possible to expand a single row when a row header is selected', async() => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true
      });

      getPlugin('nestedRows').collapsingUI.collapseChildren(0);

      await selectCell(0, -1);
      await listen();
      await keyDownUp('enter');

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

    it('should not be possible to expand a single row when a range of rows are selected', async() => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true
      });

      getPlugin('nestedRows').collapsingUI.collapseChildren(0);

      await selectRows(0, 4, -1);
      await listen();
      await keyDownUp('enter');

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

    it('should be possible to collapse/expand only nested rows', async() => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true,
      });

      await selectCell(-1, -1); // corner
      await keyDownUp('enter');

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

      await selectCell(-1, 1); // column header
      await keyDownUp('enter');

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

      await selectCell(2, -1); // non nested header
      await keyDownUp('enter');

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

    it('should not trigger the editor to be opened', async() => {
      handsontable({
        data: getMoreComplexNestedData(),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedRows: true
      });

      await selectCell(0, -1);
      await keyDownUp('enter');

      expect(getActiveEditor()).toBeUndefined();
    });
  });
});
