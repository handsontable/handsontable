describe('Pagination', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be possible to enable the plugin', async() => {
    handsontable({
      data: createSpreadsheetData(20, 10),
      pagination: true,
    });

    const plugin = getPlugin('pagination');

    expect(plugin.isEnabled()).toBe(true);
    expect(countVisibleRows()).toBe(10);
  });

  it('should be possible to disable the plugin', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      pagination: {
        pageSize: 3,
      },
    });

    await updateSettings({
      pagination: false,
    });

    const plugin = getPlugin('pagination');

    expect(plugin.isEnabled()).toBe(false);
    expect(countVisibleRows()).toBe(10);
  });

  it('should recalculate the internal state correctly after inserting new rows (complex scenario)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      pagination: {
        pageSize: 3,
      },
    });

    rowIndexMapper().setIndexesSequence([9, 7, 4, 2, 1, 3, 5, 6, 8, 0]);

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(2, true);
    hidingMap.setValueAtIndex(4, true);
    hidingMap.setValueAtIndex(8, true);
    hidingMap.setValueAtIndex(9, true);

    await render();

    const plugin = getPlugin('pagination');

    expect(plugin.getCurrentPageData()).toEqual([
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8'],
      ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'], // hidden row
      ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'], // hidden row
      ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
      ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
    ]);
    expect(countVisibleRows()).toBe(3);

    await alter('insert_row_above', 2);

    expect(plugin.getCurrentPageData()).toEqual([
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8'],
      [null, null, null, null, null, null, null, null, null, null],
      ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'], // hidden row
      ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'], // hidden row
      ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
    ]);
    expect(countVisibleRows()).toBe(3);

    await alter('insert_row_below', 5);

    expect(plugin.getCurrentPageData()).toEqual([
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8'],
      [null, null, null, null, null, null, null, null, null, null],
      ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'], // hidden row
      ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'], // hidden row
      ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
    ]);
    expect(countVisibleRows()).toBe(3);

    plugin.setPage(2);

    expect(plugin.getCurrentPageData()).toEqual([
      [null, null, null, null, null, null, null, null, null, null],
      ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
      ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6', 'J6'],
    ]);
    expect(countVisibleRows()).toBe(3);
  });

  it('should remove the last rows when `index` is `null` and pagination is enabled (regression #11643)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 1),
      pagination: {
        pageSize: 3,
      },
    });

    await alter('remove_row', null, 2);

    expect(countRows()).toBe(8);
    expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8']);
  });

  it('should recalculate the internal state correctly after removing rows (complex scenario)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      pagination: {
        pageSize: 3,
      },
    });

    rowIndexMapper().setIndexesSequence([9, 7, 4, 2, 1, 3, 5, 6, 8, 0]);

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(2, true);
    hidingMap.setValueAtIndex(4, true);
    hidingMap.setValueAtIndex(8, true);
    hidingMap.setValueAtIndex(9, true);

    await render();

    const plugin = getPlugin('pagination');

    expect(plugin.getCurrentPageData()).toEqual([
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8'],
      ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'], // hidden row
      ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'], // hidden row
      ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
      ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
    ]);
    expect(countVisibleRows()).toBe(3);

    await alter('remove_row', 2);

    expect(plugin.getCurrentPageData()).toEqual([
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8'],
      ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'], // hidden row
      ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
      ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
    ]);
    expect(countVisibleRows()).toBe(3);

    await alter('remove_row', 5);

    expect(plugin.getCurrentPageData()).toEqual([
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8'],
      ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'], // hidden row
      ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
      ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
    ]);
    expect(countVisibleRows()).toBe(3);

    plugin.setPage(2);

    expect(plugin.getCurrentPageData()).toEqual([
      ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7', 'I7', 'J7'],
    ]);
    expect(countVisibleRows()).toBe(1);
  });

  it('should translate UI text when different language pack is used on init', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      language: 'pl-pl',
      pagination: {
        pageSize: 3,
      },
    });

    expect(visualizePageSections()).toEqual([
      'Liczba wierszy: [[auto], 5, 10, 20, 50, 100]',
      '1 - 3 z 10',
      '|< < Strona 1 z 4 [>] [>|]',
    ]);

    const container = getPaginationContainerElement();

    expect(container.querySelector('[name="pageSize"]').getAttribute('aria-label')).toBe('Liczba wierszy');
    expect(container.querySelector('.ht-page-navigation-section').getAttribute('aria-label')).toBe('Paginacja');
    expect(container.querySelector('.ht-page-first').getAttribute('aria-label')).toBe('Przejdź do pierwszej strony');
    expect(container.querySelector('.ht-page-prev').getAttribute('aria-label')).toBe('Przejdź do poprzedniej strony');
    expect(container.querySelector('.ht-page-next').getAttribute('aria-label')).toBe('Przejdź do następnej strony');
    expect(container.querySelector('.ht-page-last').getAttribute('aria-label')).toBe('Przejdź do ostatniej strony');
  });

  it('should translate UI text when different language pack is used using `updateSettings`', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      pagination: {
        pageSize: 3,
      },
    });

    await updateSettings({
      language: 'pl-pl',
    });

    expect(visualizePageSections()).toEqual([
      'Liczba wierszy: [[auto], 5, 10, 20, 50, 100]',
      '1 - 3 z 10',
      '|< < Strona 1 z 4 [>] [>|]',
    ]);

    const container = getPaginationContainerElement();

    expect(container.querySelector('[name="pageSize"]').getAttribute('aria-label')).toBe('Liczba wierszy');
    expect(container.querySelector('.ht-page-navigation-section').getAttribute('aria-label')).toBe('Paginacja');
    expect(container.querySelector('.ht-page-first').getAttribute('aria-label')).toBe('Przejdź do pierwszej strony');
    expect(container.querySelector('.ht-page-prev').getAttribute('aria-label')).toBe('Przejdź do poprzedniej strony');
    expect(container.querySelector('.ht-page-next').getAttribute('aria-label')).toBe('Przejdź do następnej strony');
    expect(container.querySelector('.ht-page-last').getAttribute('aria-label')).toBe('Przejdź do ostatniej strony');
  });

  it('should scroll the viewport to the top when the page is changed', async() => {
    handsontable({
      data: createSpreadsheetData(50, 20),
      width: 500,
      height: 200 + getPaginationContainerHeight(),
      pagination: {
        pageSize: 25,
      },
    });

    await scrollViewportTo({ row: 10, col: 10 });

    const verticalScrollBefore = topOverlay().getScrollPosition();
    const horizontalScrollBefore = inlineStartOverlay().getScrollPosition();

    expect(verticalScrollBefore).toBeGreaterThan(0);
    expect(horizontalScrollBefore).toBeGreaterThan(0);

    getPlugin('pagination').setPage(2);

    expect(topOverlay().getScrollPosition()).toBe(0);
    expect(inlineStartOverlay().getScrollPosition())
      .toBe(horizontalScrollBefore);
  });

  it('should update the internal cache after changing the page size to the state where there is only one page', async() => {
    handsontable({
      data: createSpreadsheetData(50, 20),
      width: 500,
      height: 200,
      pagination: {
        pageSize: 25,
      },
    });

    expect(rowIndexMapper().getRenderableIndexesLength()).toBe(25);

    getPlugin('pagination').setPageSize(50);

    expect(rowIndexMapper().getRenderableIndexesLength()).toBe(50);
  });

  describe('nested grid (non-root instance)', () => {
    it('should not enable the plugin in a grid nested in the `handsontable` cell type', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        columns: [{
          type: 'handsontable',
          handsontable: {
            data: createSpreadsheetData(10, 2),
            pagination: { pageSize: 5 },
          },
        }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const innerHot = getActiveEditor().htEditor;

      // The pagination bar needs the FocusScopeManager, the LayoutManager and the root grid element,
      // and all three belong to the root instance only. The plugin declines to enable instead of
      // throwing (DEV-2641).
      expect(getActiveEditor().isOpened()).toBe(true);
      expect(innerHot.countRows()).toBe(10);
      expect(innerHot.getPlugin('pagination').isEnabled()).toBe(false);
      expect(innerHot.getPlugin('pagination').enabled).toBe(false);

      // An update carrying the plugin's own key reaches the enable-on-update branch of
      // `BasePlugin#onUpdateSettings`, which the editor's own width/height update does not.
      await innerHot.updateSettings({ pagination: { pageSize: 5 } });

      expect(innerHot.getPlugin('pagination').isEnabled()).toBe(false);
      expect(innerHot.getPlugin('pagination').enabled).toBe(false);
    });

    it('should not fire page-change hooks from the public methods on a nested grid', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        columns: [{
          type: 'handsontable',
          handsontable: {
            data: createSpreadsheetData(20, 2),
            pagination: { pageSize: 5 },
          },
        }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const innerHot = getActiveEditor().htEditor;
      const afterPageChange = jasmine.createSpy('afterPageChange');
      const afterPageSizeChange = jasmine.createSpy('afterPageSizeChange');

      innerHot.addHook('afterPageChange', afterPageChange);
      innerHot.addHook('afterPageSizeChange', afterPageSizeChange);

      // The plugin is disabled here, so the paging methods must stay quiet. Without the `enabled`
      // check they announced `afterPageChange(1, 1)` - a page change that never happened.
      innerHot.getPlugin('pagination').setPage(3);
      innerHot.getPlugin('pagination').nextPage();
      innerHot.getPlugin('pagination').setPageSize(10);

      expect(afterPageChange).not.toHaveBeenCalled();
      expect(afterPageSizeChange).not.toHaveBeenCalled();
      expect(innerHot.rowIndexMapper.getRenderableIndexesLength()).toBe(20);
    });

    it('should keep paging the root grid while a nested grid asks for pagination too', async() => {
      handsontable({
        data: createSpreadsheetData(20, 2),
        columns: [{
          type: 'handsontable',
          handsontable: {
            data: createSpreadsheetData(10, 2),
            pagination: { pageSize: 5 },
          },
        }, {}],
        pagination: { pageSize: 8 },
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const innerHot = getActiveEditor().htEditor;

      // The root grid pages as configured, while the nested grid renders all of its rows because
      // its own pagination never enables.
      expect(getPlugin('pagination').enabled).toBe(true);
      expect(rowIndexMapper().getRenderableIndexesLength()).toBe(8);
      expect(innerHot.countRows()).toBe(10);
      expect(innerHot.rowIndexMapper.getRenderableIndexesLength()).toBe(10);
    });
  });
});
