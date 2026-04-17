describe('Loading', () => {
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
      data: createSpreadsheetData(10, 10),
      loading: true,
    });

    const plugin = getPlugin('loading');

    expect(plugin.isEnabled()).toBe(true);
  });

  it('should be possible to disable the plugin', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      loading: true,
    });

    await updateSettings({
      loading: false,
    });

    const plugin = getPlugin('loading');

    expect(plugin.isEnabled()).toBe(false);
  });

  it('should enable dialog plugin when loading plugin is enabled', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      loading: true,
    });

    const dialogPlugin = getPlugin('dialog');

    expect(dialogPlugin.isEnabled()).toBe(true);
  });

  it('should update the loading settings via updateSettings', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      loading: true,
    });

    await updateSettings({
      loading: {
        title: 'Reloading...',
      },
    });

    const plugin = getPlugin('loading');

    plugin.show();

    const container = getLoadingContainerElement();

    expect(container.querySelector('.ht-loading__title').textContent).toBe('Reloading...');
  });

  it('should translate UI text when different language pack is used on init', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      language: 'pl-pl',
      loading: true,
    });

    const plugin = getPlugin('loading');

    plugin.show();

    const container = getLoadingContainerElement();

    expect(container.querySelector('.ht-loading__title').textContent).toBe('Ładowanie...');
  });

  it('should destroy the plugin', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      loading: true,
    });

    const plugin = getPlugin('loading');

    plugin.destroy();

    expect(plugin.enabled).toBe(null);
  });

  it('should hide loading plugin on updateSettings to false', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      loading: true,
    });

    await updateSettings({
      loading: false,
    });

    const plugin = getPlugin('loading');

    expect(plugin.isVisible()).toBe(false);
    expect(plugin.enabled).toBe(false);
  });

  it('should not throw when showing loading indicator from afterChange hook during editor close (#12341)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
      loading: true,
      afterChange(changes, source) {
        if (source === 'edit') {
          hot.getPlugin('loading').show();
        }
      },
    });

    await selectCell(0, 0);

    await keyDownUp('enter');
    document.activeElement.value = 'new value';
    await keyDownUp('enter');

    expect(getDataAtCell(0, 0)).toBe('new value');
    expect(hot.getPlugin('loading').isVisible()).toBe(true);
  });

  it('should not throw when calling deselectCell from afterChange hook during editor close (#12341)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
      afterChange(changes, source) {
        if (source === 'edit') {
          hot.deselectCell();
        }
      },
    });

    await selectCell(0, 0);

    await keyDownUp('enter');
    document.activeElement.value = 'new value';
    await keyDownUp('enter');

    expect(getDataAtCell(0, 0)).toBe('new value');
    expect(hot.getSelected()).toBeUndefined();
  });
});
