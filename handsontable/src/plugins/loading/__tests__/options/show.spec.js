describe('Loading - show method', () => {
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

  it('should show loading dialog with default configuration', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
      loading: true,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.show();

    expect(loadingPlugin.isVisible()).toBe(true);
    expect(getLoadingContainerElement()).toBeDefined();
  });

  it('should show loading dialog with custom title', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
      loading: true,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.show({
      title: 'Custom Loading Title',
    });

    expect(loadingPlugin.isVisible()).toBe(true);
    expect(getLoadingContainerElement().querySelector('.ht-loading__title').textContent)
      .toBe('Custom Loading Title');
  });

  it('should show loading dialog with custom description', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
      loading: true,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.show({
      description: 'Custom loading description',
    });

    expect(loadingPlugin.isVisible()).toBe(true);
    expect(getLoadingContainerElement().querySelector('.ht-loading__description').textContent)
      .toBe('Custom loading description');
  });

  it('should show loading dialog with custom icon', async() => {
    const customIcon = '<svg class="custom-icon" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7"/></svg>';

    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
      loading: true,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.show({
      icon: customIcon,
    });

    expect(loadingPlugin.isVisible()).toBe(true);
    expect(getLoadingContainerElement().querySelector('.ht-loading__icon').innerHTML).toContain('custom-icon');
  });

  it('should show loading dialog with all custom options', async() => {
    const customIcon = '<svg class="custom-icon" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7"/></svg>';

    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
      loading: true,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.show({
      icon: customIcon,
      title: 'Custom Title',
      description: 'Custom Description',
    });

    expect(loadingPlugin.isVisible()).toBe(true);
    expect(getLoadingContainerElement().querySelector('.ht-loading__title').textContent)
      .toBe('Custom Title');
    expect(getLoadingContainerElement().querySelector('.ht-loading__description').textContent)
      .toBe('Custom Description');
    expect(getLoadingContainerElement().querySelector('.ht-loading__icon').innerHTML)
      .toContain('custom-icon');
  });

  it('should not show loading dialog when plugin is disabled', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
      loading: false,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.show({
      title: 'Test title',
    });

    expect(loadingPlugin.isVisible()).toBe(false);
    expect(getLoadingContainerElement()).toBe(null);
  });

  it('should not show loading dialog when dialog plugin is not enabled', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      loading: true,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.show({
      title: 'Test title',
    });

    expect(loadingPlugin.isVisible()).toBe(false);
    expect(getLoadingContainerElement()).toBe(null);
  });

  it('should update loading configuration when show method is called with new options', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
      loading: true,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.show({
      title: 'Initial title',
      description: 'Initial description',
    });

    expect(loadingPlugin.isVisible()).toBe(true);
    expect(getLoadingContainerElement().querySelector('.ht-loading__title').textContent).toBe('Initial title');
    expect(getLoadingContainerElement().querySelector('.ht-loading__description').textContent)
      .toBe('Initial description');

    loadingPlugin.show({
      title: 'Updated title',
      description: 'Updated description',
    });

    expect(loadingPlugin.isVisible()).toBe(true);
    expect(getLoadingContainerElement().querySelector('.ht-loading__title').textContent).toBe('Updated title');
    expect(getLoadingContainerElement().querySelector('.ht-loading__description').textContent)
      .toBe('Updated description');
  });
});
