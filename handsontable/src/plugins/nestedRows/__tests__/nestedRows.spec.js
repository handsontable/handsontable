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
    it('should display as many rows as there are overall elements in a nested structure', async() => {
      handsontable({
        data: getMoreComplexNestedData(),
        nestedRows: true
      });

      expect(countRows()).toEqual(13);
    });

    it('should show full dataset when the `Filters` plugin is enabled #5889', async() => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        filters: true
      });

      expect(countRows()).toEqual(18);
    });

    it('should display all nested structure elements in correct order (parent, its children, ' +
      'its children children, next parent etc)', async() => {
      handsontable({
        data: getMoreComplexNestedData(),
        nestedRows: true
      });

      expect(getData()).toEqual(dataInOrder);
    });

    it('should not crash the table, when there\'s no `data` provided', async() => {
      const errors = [];

      try {
        handsontable({
          nestedRows: true
        });
      } catch (e) {
        errors.push(e);
      }

      expect(errors.length).toEqual(0);
    });
  });

  describe('UI', () => {
    using('configuration object', [
      { htmlDir: 'ltr', layoutDirection: 'inherit' },
      { htmlDir: 'rtl', layoutDirection: 'ltr' },
    ], ({ htmlDir, layoutDirection }) => {
      beforeEach(() => {
        $('html').attr('dir', htmlDir);
      });

      afterEach(() => {
        $('html').attr('dir', 'ltr');
      });

      it.forTheme('classic')('should display indicators properly located', async() => {
        handsontable({
          layoutDirection,
          data: getMoreComplexNestedData(),
          nestedRows: true,
          rowHeaders: true
        });

        expect(countRows()).toEqual(13);
        expect(window.getComputedStyle($('.ht_nestingLevel_empty')[0]).float).toEqual('left');
        expect(window.getComputedStyle($('.ht_nestingCollapse')[0]).right).toEqual('-2px');
      });

      it.forTheme('main')('should display indicators properly located', async() => {
        handsontable({
          layoutDirection,
          data: getMoreComplexNestedData(),
          nestedRows: true,
          rowHeaders: true
        });

        expect(countRows()).toEqual(13);
        expect(window.getComputedStyle($('.ht_nestingLevel_empty')[0]).order).toEqual('-2');
        expect(window.getComputedStyle($('.ht_nestingCollapse')[0].parentNode).display).toEqual('flex');
      });

      it.forTheme('horizon')('should display indicators properly located', async() => {
        handsontable({
          layoutDirection,
          data: getMoreComplexNestedData(),
          nestedRows: true,
          rowHeaders: true
        });

        expect(countRows()).toEqual(13);
        expect(window.getComputedStyle($('.ht_nestingLevel_empty')[0]).order).toEqual('-2');
        expect(window.getComputedStyle($('.ht_nestingCollapse')[0].parentNode).display).toEqual('flex');
      });
    });

    it('should render row header with correct default width', async() => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        rowHeaders: true,
      });

      expect(getCell(0, -1).offsetWidth).forThemes(({ classic, main, horizon }) => {
        classic.toBe(56);
        main.toBe(61);
        horizon.toBe(69);
      });
    });

    it('should take into account the `rowHeaderWidth` option when nested rows are enabled', async() => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        rowHeaders: true,
        rowHeaderWidth: 100,
      });

      expect(getCell(0, -1).offsetWidth).toBe(100);
    });

    it('should increase the row header width every time the new child is inserted', async() => {
      handsontable({
        data: getSimplerNestedData(),
        contextMenu: true,
        nestedRows: true,
        rowHeaders: true,
        rowHeaderWidth: 70,
      });

      await selectCell(2, 0);
      await contextMenu();
      await selectContextMenuOption('Insert child row');

      expect(getCell(0, -1).offsetWidth).forThemes(({ classic, main, horizon }) => {
        classic.toBe(70);
        main.toBe(71);
        horizon.toBe(79);
      });

      await selectCell(3, 0);
      await contextMenu();
      await selectContextMenuOption('Insert child row');

      expect(getCell(0, -1).offsetWidth).forThemes(({ classic, main, horizon }) => {
        classic.toBe(76);
        main.toBe(81);
        horizon.toBe(89);
      });

      await selectCell(4, 0);
      await contextMenu();
      await selectContextMenuOption('Insert child row');

      expect(getCell(0, -1).offsetWidth).forThemes(({ classic, main, horizon }) => {
        classic.toBe(86);
        main.toBe(91);
        horizon.toBe(99);
      });
    });
  });

  it('should remove collapsed indexes properly', async() => {
    handsontable({
      data: getSimplerNestedData(),
      nestedRows: true
    });

    const plugin = getPlugin('nestedRows');

    plugin.collapsingUI.collapseChildren(0);
    plugin.collapsingUI.collapseChildren(6);
    plugin.collapsingUI.collapseChildren(12);

    await alter('remove_row', 2);

    await sleep(0); // There is a timeout in the `onAfterRemoveRow` callback.

    expect(getData()).toEqual([
      ['Best Rock Performance', null, null, null],
      ['Best Metal Performance', null, null, null],
    ]);

    await alter('remove_row', 1);

    await sleep(0); // There is a timeout in the `onAfterRemoveRow` callback.

    expect(getData()).toEqual([['Best Rock Performance', null, null, null]]);

    await alter('remove_row', 0);

    await sleep(0); // There is a timeout in the `onAfterRemoveRow` callback.

    expect(getData()).toEqual([]);
  });

  it('should add child properly', async() => {
    handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      contextMenu: true
    });

    expect(countRows()).toEqual(18);

    await selectCell(0, 0);
    await contextMenu();
    await selectContextMenuOption('Insert child row');

    expect(countRows()).toEqual(19);
    expect(getDataAtCell(0, 0)).toEqual('Best Rock Performance');
    expect(getDataAtCell(1, 1)).toEqual('Alabama Shakes');
    expect(getDataAtCell(2, 1)).toEqual('Florence & The Machine');
    expect(getDataAtCell(6, 1)).toEqual(null);
    expect(getPlugin('nestedRows').dataManager.isParent(0)).toBeTruthy();
    expect(getPlugin('nestedRows').dataManager.isParent(1)).toBeFalsy();
    expect(getPlugin('nestedRows').dataManager.isParent(2)).toBeFalsy();

    // Added child.
    expect(getPlugin('nestedRows').dataManager.isParent(6)).toBeFalsy();

    await selectCell(1, 0);
    await contextMenu();
    await selectContextMenuOption('Insert child row');

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
    expect(getPlugin('nestedRows').dataManager.isParent(2)).toBeFalsy();

    // Previously added child.
    expect(getPlugin('nestedRows').dataManager.isParent(7)).toBeFalsy();
  });

  it('should allow user to detach already added child', async() => {
    handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      contextMenu: true
    });

    await selectCell(0, 0);
    await contextMenu();
    await selectContextMenuOption('Insert child row');

    await selectCell(6, 0);
    await contextMenu();
    await selectContextMenuOption('Detach from parent');

    expect(getDataAtCell(6, 0)).toEqual('Best Metal Performance');
    expect(getDataAtCell(18, 1)).toEqual(null);

    // Added and then detached child.
    expect(getPlugin('nestedRows').dataManager.isParent(18)).toBeFalsy();
  });

  it('should allow user to insert row below and above the parent', async() => {
    handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      contextMenu: true
    });

    await selectCell(0, 0);
    await contextMenu();
    await selectContextMenuOption('Insert row above');

    expect(getDataAtRow(0)).toEqual([null, null, null, null]);
    expect(getDataAtRow(1)).toEqual(['Best Rock Performance', null, null, null]);
    expect(getDataAtRow(2)).toEqual([null, 'Alabama Shakes', 'Don\'t Wanna Fight', 'ATO Records']);
    expect(getDataAtRow(7)).toEqual(['Best Metal Performance', null, null, null]);

    await selectCell(1, 0);
    await contextMenu();
    await selectContextMenuOption('Insert row below');

    expect(getDataAtRow(0)).toEqual([null, null, null, null]);
    expect(getDataAtRow(1)).toEqual(['Best Rock Performance', null, null, null]);
    expect(getDataAtRow(2)).toEqual([null, 'Alabama Shakes', 'Don\'t Wanna Fight', 'ATO Records']);
    expect(getDataAtRow(7)).toEqual([null, null, null, null]);
    expect(getDataAtRow(8)).toEqual(['Best Metal Performance', null, null, null]);
  });

  it('should warn user that `moveRow` and `moveRows` methods can\'t be used and they don\'t move data', async() => {
    const warnSpy = spyOnConsoleWarn();

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

  it('should move child data using the `dragRow` and `dragRows` methods', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      manualRowMove: true
    });

    const dataManager = getPlugin('nestedRows').dataManager;
    const row = dataManager.getDataObject(1);

    expect(dataManager.getDataObject(1)).toEqual(row);

    getPlugin('manualRowMove').dragRow(1, 4);

    expect(warnSpy.calls.count()).toEqual(0);
    expect(dataManager.getDataObject(1)).not.toEqual(row);
    expect(dataManager.getDataObject(3)).toEqual(row);

    const rows = [dataManager.getDataObject(1), dataManager.getDataObject(2)];

    expect(dataManager.getDataObject(1)).toEqual(rows[0]);
    expect(dataManager.getDataObject(2)).toEqual(rows[1]);

    getPlugin('manualRowMove').dragRows([1, 2], 5);

    expect(warnSpy.calls.count()).toEqual(0);
    expect(dataManager.getDataObject(1)).not.toEqual(rows[0]);
    expect(dataManager.getDataObject(2)).not.toEqual(rows[1]);

    expect(dataManager.getDataObject(3)).toEqual(rows[0]);
    expect(dataManager.getDataObject(4)).toEqual(rows[1]);
  });

  it('should display the right amount of entries when calling loadData ' +
    'after being initialized with empty data', async() => {
    handsontable({
      data: [],
      nestedRows: true
    });

    await sleep(50);

    // The plugin is disabled after being initialized with the wrong type of dataset.
    getPlugin('nestedRows').enablePlugin();

    await loadData(getMoreComplexNestedData());
    expect(countRows()).toEqual(13);
  });

  it('should display the right amount of entries when calling loadData with another set of data', async() => {
    handsontable({
      data: getMoreComplexNestedData(),
      nestedRows: true
    });

    await sleep(50);

    await loadData(getMoreComplexNestedData().slice(0, 1));
    expect(countRows()).toEqual(7);
  });

  it('should display proper row headers after collapsing one parent - ' +
    'cooperation with the `BindRowsWithHeaders` plugin #5874', async() => {
    handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      rowHeaders: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S'],
      bindRowsWithHeaders: true
    });

    // Test with the `getColHeader` passed, but rendered headers weren't proper.
    let rowHeaders = $('.ht_clone_inline_start').find('span.rowHeader').toArray().map(element => $(element).text());

    expect(rowHeaders).toEqual([
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S']);

    $('.ht_nestingButton').eq(0).simulate('mousedown');
    $('.ht_nestingButton').eq(0).simulate('click');
    $('.ht_nestingButton').eq(0).simulate('mouseup');

    rowHeaders = $('.ht_clone_inline_start').find('span.rowHeader').toArray().map(element => $(element).text());

    expect(rowHeaders).toEqual(['A', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S']);
  });

  it('should not throw an error while inserting new row in specific case', async() => {
    const spy = spyOn(console, 'error');

    handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      rowHeaders: true,
      contextMenu: true,
    });

    await selectCell(1, 0);
    await contextMenu();

    $('.htContextMenu .ht_master .htCore')
      .find('tbody td')
      .not('.htSeparator')
      .eq(2) // Insert row above
      .simulate('mousedown')
      .simulate('mouseup');

    expect(spy).not.toHaveBeenCalled();
  });
});
