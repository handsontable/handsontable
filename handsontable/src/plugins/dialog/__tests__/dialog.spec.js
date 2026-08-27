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

    it('should call the sanitizer with the `dialog` context', async() => {
      const sanitizer = jasmine.createSpy('sanitizer')
        .and
        .callFake(content => content.replace(/</g, '&lt;').replace(/>/g, '&gt;'));

      handsontable({
        data: createSpreadsheetData(5, 5),
        sanitizer,
        dialog: true,
      });

      getPlugin('dialog').show({ content: '<b>Bold dialog</b>' });

      // The dialog used to wrap the sanitizer in `(html, ctx) => sanitizer(html)`, dropping the
      // context, so a context-aware sanitizer could not tell dialog content from anything else.
      expect(sanitizer).toHaveBeenCalledWith('<b>Bold dialog</b>', 'dialog');
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
            dialog: true,
          },
        }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const innerHot = getActiveEditor().htEditor;

      // The dialog needs the FocusScopeManager and the `ht-overlay` element, and both belong to the
      // root instance only. The plugin declines to enable instead of throwing (DEV-2641).
      expect(getActiveEditor().isOpened()).toBe(true);
      expect(innerHot.countRows()).toBe(2);
      expect(innerHot.getPlugin('dialog').isEnabled()).toBe(false);
      expect(innerHot.getPlugin('dialog').enabled).toBe(false);

      // An update carrying the plugin's own key reaches the enable-on-update branch of
      // `BasePlugin#onUpdateSettings`, which the editor's own width/height update does not.
      await innerHot.updateSettings({ dialog: true });

      expect(innerHot.getPlugin('dialog').isEnabled()).toBe(false);
      expect(innerHot.getPlugin('dialog').enabled).toBe(false);
    });

    it('should not enable the plugin in a grid nested in the `autocomplete` cell type', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        columns: [{
          type: 'autocomplete',
          source: ['A1', 'A2'],
          handsontable: {
            dialog: true,
          },
        }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const innerHot = getActiveEditor().htEditor;

      // `AutocompleteEditor` and `DropdownEditor` extend `HandsontableEditor`, so they share the
      // `handsontable` settings passthrough and build the same non-root instance.
      expect(getActiveEditor().isOpened()).toBe(true);
      expect(innerHot.getPlugin('dialog').isEnabled()).toBe(false);
      expect(innerHot.getPlugin('dialog').enabled).toBe(false);
    });

    it('should keep the root instance dialog working when a nested grid asks for one too', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        columns: [{
          type: 'handsontable',
          handsontable: {
            data: createSpreadsheetData(2, 2),
            dialog: true,
          },
        }],
        dialog: { animation: false },
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      getPlugin('dialog').show({
        content: 'Root content',
      });

      expect(getPlugin('dialog').enabled).toBe(true);
      expect(getPlugin('dialog').isVisible()).toBe(true);
      expect(getDialogContainerElement().parentNode).toBe(hot().rootOverlaysElement);
    });
  });
});
