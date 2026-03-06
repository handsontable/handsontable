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

  it('should keep the emptyDateState DOM element after ht-grid element', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: true,
    });

    expect(getEmptyDataStateContainerElement().previousElementSibling).toBe(hot().rootGridElement);

    await updateSettings({
      pagination: true,
    });

    await sleep(10);

    expect(getEmptyDataStateContainerElement().previousElementSibling).toBe(hot().rootGridElement);
  });

  it('should keep the emptyDateState DOM element after ht-grid element after re-enabling the plugin', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: true,
    });

    expect(getEmptyDataStateContainerElement().previousElementSibling).toBe(hot().rootGridElement);

    await updateSettings({
      emptyDataState: false,
    });
    await updateSettings({
      emptyDataState: true,
      pagination: true,
    });

    await sleep(10);

    expect(getEmptyDataStateContainerElement().previousElementSibling).toBe(hot().rootGridElement);
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

    it('should disable bottom border when there is pagination', async() => {
      handsontable({
        data: [],
        pagination: true,
        emptyDataState: true,
        height: 'auto',
      });

      await sleep(10);

      const borderBottomWidth = getComputedStyle(getEmptyDataStateContainerElement()).borderBottomWidth;

      expect(borderBottomWidth).toBe('0px');
    });

    it('should not disable bottom border when there is no pagination', async() => {
      handsontable({
        data: [],
        pagination: false,
        emptyDataState: true,
        height: 'auto',
      });

      await sleep(10);

      const borderBottomWidth = getComputedStyle(getEmptyDataStateContainerElement()).borderBottomWidth;

      expect(borderBottomWidth).toBe('1px');
    });
  });
});
