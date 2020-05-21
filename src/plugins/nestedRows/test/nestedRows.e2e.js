describe('NestedRows', () => {
  const id = 'testContainer';
  const dataInOrder = [
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
    ['a2-a1-a1', 'b2-b1-b1']
  ];

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('Displaying a nested structure', () => {
    it('should display as many rows as there are overall elements in a nested structure', () => {
      const hot = handsontable({
        data: getMoreComplexNestedData(),
        nestedRows: true
      });

      expect(hot.countRows()).toEqual(13);
    });

    it('should show full dataset when the `Filters` plugin is enabled #5889', () => {
      const hot = handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        filters: true
      });

      expect(hot.countRows()).toEqual(18);
    });

    it('should display all nested structure elements in correct order (parent, its children, its children children, next parent etc)', () => {
      const hot = handsontable({
        data: getMoreComplexNestedData(),
        nestedRows: true
      });

      expect(hot.getData()).toEqual(dataInOrder);
    });
  });

  describe('Cooperation with the `ManualRowMove` plugin', () => {
    it('should display the right amount of entries with the `manualRowMove` plugin enabled', () => {
      const hot = handsontable({
        data: getMoreComplexNestedData(),
        nestedRows: true,
        manualRowMove: true
      });

      expect(hot.getData().length).toEqual(13);
    });

    it('should move child which is under a parent to the another position, also under the same parent', () => {
      handsontable({
        data: getMoreComplexNestedData(),
        nestedRows: true,
        manualRowMove: true,
        rowHeaders: true
      });

      getPlugin('manualRowMove').dragRow(2, 1);

      expect(getDataAtCell(1, 0)).toEqual('a0-a1');
      expect(getDataAtCell(2, 0)).toEqual('a0-a0');

      getPlugin('manualRowMove').dragRow(1, 3);

      expect(getDataAtCell(1, 0)).toEqual('a0-a0');
      expect(getDataAtCell(2, 0)).toEqual('a0-a1');
    });

    it('should not move rows when any of them is a parent', () => {
      handsontable({
        data: getMoreComplexNestedData(),
        nestedRows: true,
        manualRowMove: true,
        rowHeaders: true
      });

      getPlugin('manualRowMove').dragRows([0, 1], 2);

      expect(getData()).toEqual(dataInOrder);

      getPlugin('manualRowMove').dragRows([1, 0], 2);

      expect(getData()).toEqual(dataInOrder);
    });

    // Another work than the `ManualRowMove` plugin.
    it('should not move rows when any of them is tried to be moved to the position of moved row', () => {
      handsontable({
        data: getMoreComplexNestedData(),
        nestedRows: true,
        manualRowMove: true,
        rowHeaders: true
      });

      getPlugin('manualRowMove').dragRows([1, 2], 1);

      expect(getData()).toEqual(dataInOrder);

      getPlugin('manualRowMove').dragRows([2, 1], 1);

      expect(getData()).toEqual(dataInOrder);

      getPlugin('manualRowMove').dragRows([1, 2], 2);

      expect(getData()).toEqual(dataInOrder);

      getPlugin('manualRowMove').dragRows([2, 1], 2);

      expect(getData()).toEqual(dataInOrder);
    });

    it('should move row to the first parent of destination row whether there was a try of moving it on the row being a parent #1', () => {
      handsontable({
        data: getMoreComplexNestedData(),
        nestedRows: true,
        manualRowMove: true,
        rowHeaders: true
      });

      const firstParent = getPlugin('nestedRows').dataManager.getRowParent(12);
      expect(getPlugin('nestedRows').dataManager.countChildren(firstParent)).toBe(2);

      getPlugin('manualRowMove').dragRow(12, 4);

      // First parent to the primary destination row.
      expect(getDataAtCell(3, 0)).toEqual('a0-a2');
      expect(getPlugin('nestedRows').dataManager.isParent(3)).toBeTruthy();

      expect(getDataAtCell(4, 0)).toEqual('a0-a2-a0');
      expect(getPlugin('nestedRows').dataManager.isParent(4)).toBeTruthy();

      expect(getDataAtCell(5, 0)).toEqual('a0-a2-a0-a0');
      expect(getPlugin('nestedRows').dataManager.isParent(5)).toBeFalsy();

      // Moved row.
      expect(getDataAtCell(6, 0)).toEqual('a2-a1-a1');

      // Previous parent of moved row.
      expect(getDataAtCell(11, 0)).toEqual('a2-a1');

      expect(getPlugin('nestedRows').dataManager.countChildren(firstParent)).toBe(1);
    });

    it('should move row to the first parent of destination row whether there was a try of moving it on the row being a parent #2', () => {
      handsontable({
        data: getMoreComplexNestedData(),
        nestedRows: true,
        manualRowMove: true,
        rowHeaders: true
      });

      const firstParent = getPlugin('nestedRows').dataManager.getRowParent(12);
      expect(getPlugin('nestedRows').dataManager.countChildren(firstParent)).toBe(2);

      getPlugin('manualRowMove').dragRow(12, 10);

      // First parent to the primary destination row.
      expect(getDataAtCell(8, 0)).toEqual('a2');
      expect(getPlugin('nestedRows').dataManager.isParent(8)).toBeTruthy();

      expect(getDataAtCell(9, 0)).toEqual('a2-a0');
      // expect(getPlugin('nestedRows').dataManager.isParent(9)).toBeFalsy(); // TODO: Bug? Element has empty array under the `__children` key.

      // Previous parent of moved row.
      expect(getDataAtCell(10, 0)).toEqual('a2-a1');

      expect(getPlugin('nestedRows').dataManager.isParent(10)).toBeTruthy();
      expect(getPlugin('nestedRows').dataManager.countChildren(firstParent)).toBe(1);

      expect(getDataAtCell(11, 0)).toEqual('a2-a1-a0');
      // expect(getPlugin('nestedRows').dataManager.isParent(11)).toBeFalsy(); // TODO: Bug? Element has empty array under the `__children` key.

      // Moved row.
      expect(getDataAtCell(12, 0)).toEqual('a2-a1-a1');

      expect(getPlugin('nestedRows').dataManager.isParent(12)).toBeFalsy();
    });

    it('should add row to element as child whether there is no parent of final destination row', () => {
      const hot = handsontable({
        data: getMoreComplexNestedData(),
        nestedRows: true,
        manualRowMove: true,
        rowHeaders: true
      });

      expect(getPlugin('nestedRows').dataManager.isParent(8)).toBeTruthy();
      expect(getPlugin('nestedRows').dataManager.isParent(7)).toBeFalsy();

      // Row placed at index 8 is row being a parent.
      getPlugin('manualRowMove').dragRow(1, 8);
      hot.render();

      const finalParent = getPlugin('nestedRows').dataManager.getRowParent(7);

      // Row at index 6 is row which was primary placed at index 7.
      expect(getDataAtCell(6, 0)).toEqual('a1');
      expect(getPlugin('nestedRows').dataManager.isParent(6)).toBeTruthy();
      expect(getPlugin('nestedRows').dataManager.countChildren(finalParent)).toBe(1);

      // Row at index 7 is row which was primary placed at index 8.
      expect(getDataAtCell(7, 0)).toEqual('a0-a0');
    });

    it('should not move row whether there was a try of moving it on the row being a parent and it has no rows above', () => {
      handsontable({
        data: getMoreComplexNestedData(),
        nestedRows: true,
        manualRowMove: true,
        rowHeaders: true
      });

      getPlugin('manualRowMove').dragRow(1, 0);

      expect(getData()).toEqual(dataInOrder);

      getPlugin('manualRowMove').dragRow(11, 0);

      expect(getData()).toEqual(dataInOrder);
    });

    it('should move single row between parents properly (moving from the top to the bottom)', () => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        manualRowMove: true,
        rowHeaders: true
      });

      const $targetHeader = spec().$container.find('tbody tr:eq(6) th:eq(0)');

      spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mousedown');
      spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mouseup');
      spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mousedown');

      $targetHeader.simulate('mouseover');
      $targetHeader.simulate('mousemove', {
        clientY: $targetHeader.offset().top + $targetHeader.height()
      });

      $targetHeader.simulate('mouseup');

      expect(getDataAtCell(0, 0)).toEqual('Best Rock Performance');
      expect(getDataAtCell(1, 1)).toEqual('Florence & The Machine');
      expect(getDataAtCell(5, 0)).toEqual('Best Metal Performance');
      expect(getDataAtCell(6, 1)).toEqual('Alabama Shakes');
      expect(getSelectedLast()).toEqual([6, 0, 6, 3]);
    });

    it('should move single row between parents properly (moving from the bottom to the top)', () => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        manualRowMove: true,
        rowHeaders: true
      });

      const $targetHeader = spec().$container.find('tbody tr:eq(1) th:eq(0)');

      spec().$container.find('tbody tr:eq(7) th:eq(0)').simulate('mousedown');
      spec().$container.find('tbody tr:eq(7) th:eq(0)').simulate('mouseup');
      spec().$container.find('tbody tr:eq(7) th:eq(0)').simulate('mousedown');

      $targetHeader.simulate('mouseover');
      $targetHeader.simulate('mousemove', {
        clientY: $targetHeader.offset().top
      });

      $targetHeader.simulate('mouseup');

      expect(getDataAtCell(0, 0)).toEqual('Best Rock Performance');
      expect(getDataAtCell(1, 1)).toEqual('Ghost');
      expect(getDataAtCell(7, 0)).toEqual('Best Metal Performance');
      expect(getDataAtCell(8, 1)).toEqual('August Burns Red');
      expect(getSelectedLast()).toEqual([1, 0, 1, 3]);
    });
  });

  describe('API', () => {
    describe('disableCoreAPIModifiers and enableCoreAPIModifiers', () => {
      it('should kill the runtime of the core API modifying hook callbacks - onModifyRowData, onModifySourceLength and onBeforeDataSplice', () => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          manualRowMove: true,
          rowHeaders: true
        });

        const nrPlugin = getPlugin('nestedRows');

        nrPlugin.disableCoreAPIModifiers();

        expect(nrPlugin.onModifyRowData()).toEqual(void 0);
        expect(nrPlugin.onModifySourceLength()).toEqual(void 0);
        expect(nrPlugin.onBeforeDataSplice(1)).toEqual(true);

        nrPlugin.enableCoreAPIModifiers();

        expect(nrPlugin.onModifyRowData()).not.toEqual(void 0);
        expect(nrPlugin.onModifySourceLength()).not.toEqual(void 0);
        expect(nrPlugin.onBeforeDataSplice(1)).toEqual(false);
      });
    });
  });

  describe('Core HOT API', () => {
    it('should recreate the nested structure when updating the data with the `updateSettings` method', () => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        contextMenu: true
      });

      updateSettings({
        data: getMoreComplexNestedData()
      });

      const nrPlugin = getPlugin('nestedRows');

      expect(nrPlugin.dataManager.countAllRows()).toEqual(13);
      expect(nrPlugin.dataManager.getRowLevel(5)).toEqual(3);
      expect(nrPlugin.dataManager.getRowParent(5).a).toEqual('a0-a2-a0');
    });
  });

  it('should add child properly', () => {
    handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      contextMenu: true
    });

    expect(countRows()).toEqual(18);

    selectCell(0, 0);
    contextMenu();

    $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(0).simulate('mousedown').simulate('mouseup'); // Insert child row.

    expect(countRows()).toEqual(19);
    expect(getDataAtCell(0, 0)).toEqual('Best Rock Performance');
    expect(getDataAtCell(1, 1)).toEqual('Alabama Shakes');
    expect(getDataAtCell(2, 1)).toEqual('Florence & The Machine');
    expect(getDataAtCell(6, 1)).toEqual(null);
    expect(getPlugin('nestedRows').dataManager.isParent(0)).toBeTruthy();
    expect(getPlugin('nestedRows').dataManager.isParent(1)).toBeFalsy();
    expect(getPlugin('nestedRows').dataManager.isParent(2)).toBeFalsy();

    // Added child.
    // expect(getPlugin('nestedRows').dataManager.isParent(6)).toBeFalsy(); // TODO: Bug? Element has null under the `__children` key.

    selectCell(1, 0);
    contextMenu();

    $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(0).simulate('mousedown').simulate('mouseup'); // Insert child row.

    expect(countRows()).toEqual(20);
    expect(getDataAtCell(0, 0)).toEqual('Best Rock Performance');
    expect(getDataAtCell(1, 1)).toEqual('Alabama Shakes');
    expect(getDataAtCell(2, 1)).toEqual(null);
    expect(getDataAtCell(3, 1)).toEqual('Florence & The Machine');
    expect(getDataAtCell(7, 1)).toEqual(null); // Previously added child.
    expect(getPlugin('nestedRows').dataManager.isParent(0)).toBeTruthy();
    expect(getPlugin('nestedRows').dataManager.isParent(1)).toBeTruthy();
    expect(getPlugin('nestedRows').dataManager.isParent(3)).toBeFalsy();

    // Added child.
    // expect(getPlugin('nestedRows').dataManager.isParent(2)).toBeFalsy(); // TODO: Bug? Element has null under the `__children` key.

    // Previously added child.
    // expect(getPlugin('nestedRows').dataManager.isParent(7)).toBeTruthy(); // TODO: Bug? Element has null under the `__children` key.
  });

  it('should allow user to detach already added child', () => {
    handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      contextMenu: true
    });

    selectCell(0, 0);
    contextMenu();
    $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(0).simulate('mousedown').simulate('mouseup'); // Insert child row.

    selectCell(6, 0);
    contextMenu();
    $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(1).simulate('mousedown').simulate('mouseup'); // Detach from parent.

    expect(getDataAtCell(6, 0)).toEqual('Best Metal Performance');
    expect(getDataAtCell(18, 1)).toEqual(null);

    // Added and then detached child.
    // expect(getPlugin('nestedRows').dataManager.isParent(18)).toBeFalsy(); // TODO: Bug? Element has null under the `__children` key.
  });

  it('should allow user to insert row below and above the parent', () => {
    handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      contextMenu: true
    });

    selectCell(0, 0);
    contextMenu();

    $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(2).simulate('mousedown').simulate('mouseup'); // Insert row above.
    expect(getDataAtRow(0)).toEqual([null, null, null, null]);
    expect(getDataAtRow(1)).toEqual(['Best Rock Performance', null, null, null]);
    expect(getDataAtRow(2)).toEqual([null, 'Alabama Shakes', 'Don\'t Wanna Fight', 'ATO Records']);
    expect(getDataAtRow(7)).toEqual(['Best Metal Performance', null, null, null]);

    selectCell(1, 0);
    contextMenu();

    $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(3).simulate('mousedown').simulate('mouseup'); // Insert row below.

    expect(getDataAtRow(0)).toEqual([null, null, null, null]);
    expect(getDataAtRow(1)).toEqual(['Best Rock Performance', null, null, null]);
    expect(getDataAtRow(2)).toEqual([null, 'Alabama Shakes', 'Don\'t Wanna Fight', 'ATO Records']);
    expect(getDataAtRow(7)).toEqual([null, null, null, null]);
    expect(getDataAtRow(8)).toEqual(['Best Metal Performance', null, null, null]);
  });

  it('should warn user that `moveRow` and `moveRows` methods can\'t be used and they don\'t move data', () => {
    const warnSpy = spyOn(console, 'warn');

    handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      manualRowMove: true
    });

    const dataAtStart = getData();

    getPlugin('manualRowMove').moveRow(1, 2);

    expect(warnSpy.calls.count()).toEqual(1);
    expect(getData()).toEqual(dataAtStart);

    getPlugin('manualRowMove').moveRow(2, 1);

    expect(warnSpy.calls.count()).toEqual(2);
    expect(getData()).toEqual(dataAtStart);

    getPlugin('manualRowMove').moveRow(0, 1);

    expect(warnSpy.calls.count()).toEqual(3);
    expect(getData()).toEqual(dataAtStart);

    getPlugin('manualRowMove').moveRows([1], 2);

    expect(warnSpy.calls.count()).toEqual(4);
    expect(getData()).toEqual(dataAtStart);

    getPlugin('manualRowMove').moveRows([2], 1);

    expect(warnSpy.calls.count()).toEqual(5);
    expect(getData()).toEqual(dataAtStart);

    getPlugin('manualRowMove').moveRows([0], 1);

    expect(warnSpy.calls.count()).toEqual(6);
    expect(getData()).toEqual(dataAtStart);
  });

  it('should display the right amount of entries when calling loadData after being initialized with empty data', (done) => {
    const hot = handsontable({
      data: [],
      nestedRows: true
    });

    setTimeout(() => {
      hot.loadData(getMoreComplexNestedData());
      expect(hot.countRows()).toEqual(13);
      done();
    }, 100);
  });

  it('should display the right amount of entries when calling loadData with another set of data', (done) => {
    const hot = handsontable({
      data: getMoreComplexNestedData(),
      nestedRows: true
    });

    setTimeout(() => {
      hot.loadData(getMoreComplexNestedData().slice(0, 1));
      expect(hot.countRows()).toEqual(7);
      done();
    }, 100);
  });

  it('should display proper row headers after collapsing one parent - cooperation with the `BindRowsWithHeaders` plugin #5874', () => {
    handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      rowHeaders: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S'],
      bindRowsWithHeaders: true
    });

    // Test with the `getColHeader` passed, but rendered headers weren't proper.
    let rowHeaders = $('.ht_clone_left').find('span.rowHeader').toArray().map(element => $(element).text());

    expect(rowHeaders).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S']);

    $('.ht_nestingButton').eq(0).simulate('mousedown');
    $('.ht_nestingButton').eq(0).simulate('click');
    $('.ht_nestingButton').eq(0).simulate('mouseup');

    rowHeaders = $('.ht_clone_left').find('span.rowHeader').toArray().map(element => $(element).text());

    expect(rowHeaders).toEqual(['A', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S']);
  });
});
