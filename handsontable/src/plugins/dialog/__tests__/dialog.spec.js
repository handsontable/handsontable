describe('Dialog', () => {
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

    const dialogPlugin = getPlugin('dialog');

    expect(dialogPlugin.isEnabled()).toBe(false);
  });

  it('should be enabled when dialog option is set to true', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    expect(dialogPlugin.isEnabled()).toBe(true);
  });

  it('should be enabled when dialog option is set to object', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        content: 'Test dialog',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    expect(dialogPlugin.isEnabled()).toBe(true);
  });

  it('should not be visible by default', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    expect(dialogPlugin.isVisible()).toBe(false);
  });

  it('should render dialog container inside rootOverlaysElement (ht-overlay)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test content',
    });

    expect(getDialogContainerElement()).toBeDefined();
    expect(getDialogContainerElement().parentNode).toBe(hot().rootOverlaysElement);
  });

  it('should destroy dialog elements when plugin is destroyed', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test content',
    });

    expect(getDialogContainerElement()).toBeDefined();

    destroy();

    expect($('.ht-dialog').length).toBe(0);
  });

  it('should update dialog via updateSettings', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    await updateSettings({
      dialog: false,
    });

    const dialogPlugin = getPlugin('dialog');

    expect(dialogPlugin.isEnabled()).toBe(false);

    await updateSettings({
      dialog: true,
    });

    expect(dialogPlugin.isEnabled()).toBe(true);
  });

  describe('sanitizer', () => {
    it('should warn once when string content contains HTML and no sanitizer is configured', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        dialog: true,
      });

      const dialogPlugin = getPlugin('dialog');
      const warnSpy = spyOnConsoleWarn();

      dialogPlugin.show({ content: '<b>Bold dialog</b>' });

      expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching(/without a sanitizer/));

      // Showing the dialog again on the same instance must not emit a second warning.
      warnSpy.calls.reset();
      dialogPlugin.show({ content: '<i>Another</i>' });

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should NOT warn when a sanitizer is configured', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        sanitizer: content => content,
        dialog: true,
      });

      const dialogPlugin = getPlugin('dialog');
      const warnSpy = spyOnConsoleWarn();

      dialogPlugin.show({ content: '<b>Bold dialog</b>' });

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
