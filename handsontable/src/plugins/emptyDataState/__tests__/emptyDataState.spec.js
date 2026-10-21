describe('EmptyDataState', () => {
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

  it('should be disabled by default', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isEnabled()).toBe(false);
  });

  it('should be enabled when emptyDataState option is set to true', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: true,
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isEnabled()).toBe(true);
  });

  it('should be enabled when emptyDataState option is set to object', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: {
        message: 'Test empty data state',
      },
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isEnabled()).toBe(true);
  });

  it('should destroy emptyDataState elements when plugin is destroyed', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: true,
    });

    expect(getEmptyDataStateContainerElement()).toBeDefined();

    destroy();

    expect($('.ht-empty-data-state').length).toBe(0);
  });

  it('should update emptyDataState via updateSettings', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: true,
    });

    await updateSettings({
      emptyDataState: false,
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isEnabled()).toBe(false);

    await updateSettings({
      emptyDataState: true,
    });

    expect(emptyDataStatePlugin.isEnabled()).toBe(true);
  });

  it('should show emptyDataState when data is updated to empty via updateSettings', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: true,
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(false);

    // Add data
    await updateSettings({
      data: [],
    });

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement()).toBeDefined();
  });

  it('should hide emptyDataState when data is updated to non-empty via updateSettings', async() => {
    handsontable({
      data: [],
      emptyDataState: true,
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);

    // Add data
    await updateSettings({
      data: createSpreadsheetData(2, 2),
    });

    expect(emptyDataStatePlugin.isVisible()).toBe(false);
    expect(getEmptyDataStateContainerElement().style.display).toBe('none');
  });

  it('should keep the emptyDateState DOM element inside ht-grid', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: true,
    });

    expect(getEmptyDataStateContainerElement().parentNode).toBe(hot().rootGridElement);

    await updateSettings({
      pagination: true,
    });

    await waitForNextAnimationFrames(1);

    expect(getEmptyDataStateContainerElement().parentNode).toBe(hot().rootGridElement);
  });

  it('should keep the emptyDateState DOM element inside ht-grid after re-enabling the plugin', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: true,
    });

    expect(getEmptyDataStateContainerElement().parentNode).toBe(hot().rootGridElement);

    await updateSettings({
      emptyDataState: false,
    });
    await updateSettings({
      emptyDataState: true,
      pagination: true,
    });

    await waitForNextAnimationFrames(1);

    expect(getEmptyDataStateContainerElement().parentNode).toBe(hot().rootGridElement);
  });

  it('should have correct top position after initialization', async() => {
    handsontable({
      data: [],
      colHeaders: true,
      columns: ['A', 'B', 'C', 'D', 'E'],
      emptyDataState: true,
    });

    const top = getComputedStyle(getEmptyDataStateContainerElement()).top;

    expect(top).toBe(`${hot().view.getColumnHeaderHeight()}px`);
  });

  describe('Borders visibility', () => {
    it('should disable top border when there are column headers', async() => {
      handsontable({
        data: [],
        colHeaders: true,
        columns: ['A', 'B', 'C', 'D', 'E'],
        emptyDataState: true,
      });

      expect(
        getEmptyDataStateContainerElement().classList.contains('ht-empty-data-state--disable-top-border')
      ).toBe(true);
    });

    it('should not disable top border when there are no column headers', async() => {
      handsontable({
        data: [],
        colHeaders: false,
        columns: ['A', 'B', 'C', 'D', 'E'],
        emptyDataState: true,
      });

      expect(
        getEmptyDataStateContainerElement().classList.contains('ht-empty-data-state--disable-top-border')
      ).toBe(false);
    });

    it('should disable inline border when there are rows', async() => {
      handsontable({
        data: [[]],
        rowHeaders: true,
        emptyDataState: true,
      });

      expect(
        getEmptyDataStateContainerElement().classList.contains('ht-empty-data-state--disable-inline-border')
      ).toBe(true);
    });

    it('should not disable inline border when there are no rows', async() => {
      handsontable({
        data: [],
        rowHeaders: true,
        emptyDataState: true,
      });

      expect(
        getEmptyDataStateContainerElement().classList.contains('ht-empty-data-state--disable-inline-border')
      ).toBe(false);
    });

    it('should disable bottom border when there is horizontal scroll', async() => {
      handsontable({
        data: [],
        emptyDataState: true,
        colHeaders: true,
        columns: ['A', 'B', 'C', 'D', 'E'],
        width: 100,
        height: 'auto',
      });

      expect(
        getEmptyDataStateContainerElement().classList.contains('ht-empty-data-state--disable-bottom-border')
      ).toBe(true);
    });

    it('should not disable bottom border when there is horizontal scroll and it is scrollable by window', async() => {
      handsontable({
        data: [],
        emptyDataState: true,
        colHeaders: true,
        columns: ['A', 'B', 'C', 'D', 'E'],
        width: 'auto',
        height: 'auto',
      });

      expect(
        getEmptyDataStateContainerElement().classList.contains('ht-empty-data-state--disable-bottom-border')
      ).toBe(false);
    });

    it('should not disable bottom border when there is no pagination', async() => {
      handsontable({
        data: [],
        pagination: false,
        emptyDataState: true,
        height: 'auto',
      });

      await waitForNextAnimationFrames(1);

      const borderBottomWidth = getComputedStyle(getEmptyDataStateContainerElement()).borderBottomWidth;

      expect(borderBottomWidth).toBe('1px');
    });

    it('should keep non-zero height when data is empty and height is auto', async() => {
      handsontable({
        data: [],
        pagination: false,
        emptyDataState: true,
        height: 'auto',
      });

      await sleep(10);

      const height = parseInt(getComputedStyle(getEmptyDataStateContainerElement()).height, 10);

      expect(height).toBeGreaterThan(0);
    });
  });

  describe('nested grid (non-root instance)', () => {
    it('should not enable the plugin in a grid nested in the `handsontable` cell type', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        columns: [{
          type: 'handsontable',
          handsontable: {
            data: createSpreadsheetData(2, 2),
            emptyDataState: true,
          },
        }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const innerHot = getActiveEditor().htEditor;

      // The empty data state needs the FocusScopeManager and the root grid element, and both belong
      // to the root instance only. The plugin declines to enable instead of throwing (DEV-2641).
      expect(getActiveEditor().isOpened()).toBe(true);
      expect(innerHot.countRows()).toBe(2);
      expect(innerHot.getPlugin('emptyDataState').isEnabled()).toBe(false);
      expect(innerHot.getPlugin('emptyDataState').enabled).toBe(false);

      // An update carrying the plugin's own key reaches the enable-on-update branch of
      // `BasePlugin#onUpdateSettings`, which the editor's own width/height update does not.
      await innerHot.updateSettings({ emptyDataState: true });

      expect(innerHot.getPlugin('emptyDataState').isEnabled()).toBe(false);
      expect(innerHot.getPlugin('emptyDataState').enabled).toBe(false);
    });

    it('should not enable the plugin in an empty nested grid', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        columns: [{
          type: 'handsontable',
          handsontable: {
            data: [],
            emptyDataState: true,
          },
        }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const innerHot = getActiveEditor().htEditor;

      // An empty nested grid is the case the plugin is actually about, so it gets its own coverage.
      expect(getActiveEditor().isOpened()).toBe(true);
      expect(innerHot.countRows()).toBe(0);
      expect(innerHot.getPlugin('emptyDataState').isEnabled()).toBe(false);
      expect(innerHot.getPlugin('emptyDataState').enabled).toBe(false);
      expect(innerHot.rootElement.querySelector('.ht-empty-data-state')).toBe(null);
    });

    it('should keep the root instance empty data state working when a nested grid asks for it too', async() => {
      handsontable({
        data: [],
        columns: [{
          type: 'handsontable',
          handsontable: {
            data: createSpreadsheetData(2, 2),
            emptyDataState: true,
          },
        }],
        emptyDataState: true,
      });

      await waitForNextAnimationFrames(2);

      expect(getPlugin('emptyDataState').enabled).toBe(true);
      expect(getEmptyDataStateContainerElement()).toBeTruthy();
    });
  });
});
