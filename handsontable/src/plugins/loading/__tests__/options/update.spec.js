describe('Loading - update method', () => {
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

  it('should update the loading settings via update when dialog is visible', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      dialog: true,
      loading: true,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.show();

    loadingPlugin.update({
      title: 'Updated title',
    });

    const container = getLoadingContainerElement();

    expect(container.querySelector('.ht-loading__title').textContent).toBe('Updated title');
  });

  it('should update the loading settings via update when dialog is not visible', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      dialog: true,
      loading: true,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.update({
      title: 'Updated title',
    });

    const container = getLoadingContainerElement();

    expect(container.querySelector('.ht-loading__title').textContent).toBe('Updated title');
  });

  it('should not update the loading settings via update when plugin is disabled', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      dialog: true,
      loading: false,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.update({
      title: 'Updated title',
    });

    const container = getLoadingContainerElement();

    expect(container).toBe(null);
  });

  it('should not update the loading settings via update when dialog plugin is disabled', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      dialog: false,
      loading: true,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.update({
      title: 'Updated title',
    });

    const container = getLoadingContainerElement();

    expect(container).toBe(null);
  });
});
