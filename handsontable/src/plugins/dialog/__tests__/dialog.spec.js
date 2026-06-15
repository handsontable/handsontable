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

  it('covers the whole wrapper (incl. the bottom slot with pagination) when shown - it is a modal', async() => {
    handsontable({
      data: createSpreadsheetData(50, 5),
      width: 400,
      height: 300,
      pagination: { pageSize: 10 },
      dialog: { animation: false },
    });

    await waitForNextAnimationFrames(2);

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Modal content',
    });

    await waitForNextAnimationFrames(2);

    const dialogRect = getDialogContainerElement().getBoundingClientRect();
    const wrapperRect = hot().rootWrapperElement.getBoundingClientRect();
    const bottomSlotRect = hot().rootSlotBottomElement.getBoundingClientRect();

    // The bottom slot holds the pagination bar and has a real height.
    expect(bottomSlotRect.height).toBeGreaterThan(0);

    // The dialog is a modal overlay: it spans the whole wrapper and covers the bottom slot
    // (pagination / license notification) rather than stopping above it. Covering it is correct -
    // the dialog is aria-modal and traps focus, so the controls underneath are not reachable while open.
    expect(Math.round(dialogRect.height)).toBe(Math.round(wrapperRect.height));
    expect(dialogRect.top).toBeLessThanOrEqual(Math.ceil(bottomSlotRect.top));
    expect(dialogRect.bottom).toBeGreaterThanOrEqual(Math.floor(bottomSlotRect.bottom));
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
