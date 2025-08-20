describe('Dialog keyboard shortcut', () => {
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

  describe('"Escape"', () => {
    it('should close the dialog when closable is true', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        dialog: {
          closable: true,
        },
      });

      await selectCell(0, 0);

      const dialogPlugin = getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test dialog content',
      });

      expect(dialogPlugin.isVisible()).toBe(true);
      expect($('.ht-dialog').is(':visible')).toBe(true);

      await keyDownUp('escape');

      expect(dialogPlugin.isVisible()).toBe(false);
      expect($('.ht-dialog').hasClass('ht-dialog--show')).toBe(false);
    });

    it('should not close the dialog when closable is false', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        dialog: {
          closable: false,
        },
      });

      await selectCell(0, 0);

      const dialogPlugin = getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test dialog content',
      });

      expect(dialogPlugin.isVisible()).toBe(true);
      expect($('.ht-dialog').is(':visible')).toBe(true);

      await keyDownUp('escape');

      expect(dialogPlugin.isVisible()).toBe(true);
      expect($('.ht-dialog').hasClass('ht-dialog--show')).toBe(true);
    });

    it('should not close the dialog when not visible', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        dialog: {
          closable: true,
        },
      });

      await selectCell(0, 0);

      const dialogPlugin = getPlugin('dialog');

      expect(dialogPlugin.isVisible()).toBe(false);

      await keyDownUp('escape');

      expect(dialogPlugin.isVisible()).toBe(false);
    });

    it('should run beforeDialogHide and afterDialogHide hooks when closing with escape', async() => {
      const beforeDialogHideSpy = jasmine.createSpy('beforeDialogHide');
      const afterDialogHideSpy = jasmine.createSpy('afterDialogHide');

      handsontable({
        data: createSpreadsheetData(5, 5),
        dialog: {
          closable: true,
        },
        beforeDialogHide: beforeDialogHideSpy,
        afterDialogHide: afterDialogHideSpy,
      });

      await selectCell(0, 0);

      const dialogPlugin = getPlugin('dialog');

      dialogPlugin.show({
        content: 'Test dialog content',
      });

      expect(dialogPlugin.isVisible()).toBe(true);

      await keyDownUp('escape');

      expect(beforeDialogHideSpy).toHaveBeenCalled();
      expect(afterDialogHideSpy).toHaveBeenCalled();
      expect(dialogPlugin.isVisible()).toBe(false);
    });

    it('should switch back to grid context after closing dialog with escape', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        dialog: {
          closable: true,
        },
      });

      await selectCell(0, 0);

      const dialogPlugin = getPlugin('dialog');
      const shortcutManager = getShortcutManager();

      dialogPlugin.show({
        content: 'Test dialog content',
      });

      expect(shortcutManager.getActiveContextName()).toBe('plugin:dialog');

      await keyDownUp('escape');

      expect(shortcutManager.getActiveContextName()).toBe('grid');
      expect(dialogPlugin.isVisible()).toBe(false);
    });

    it('should work with custom dialog configuration', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        dialog: {
          closable: true,
          content: 'Custom content',
          background: 'semi-transparent',
          contentBackground: true,
          contentDirections: 'column',
          animation: false,
        },
      });

      await selectCell(0, 0);

      const dialogPlugin = getPlugin('dialog');

      dialogPlugin.show();

      expect(dialogPlugin.isVisible()).toBe(true);
      expect($('.ht-dialog').hasClass('ht-dialog--background-semi-transparent')).toBe(true);
      expect($('.ht-dialog__content').hasClass('ht-dialog__content--background')).toBe(true);
      expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-column')).toBe(true);

      await keyDownUp('escape');

      expect(dialogPlugin.isVisible()).toBe(false);
    });

    it('should not interfere with other keyboard shortcuts when dialog is not visible', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        dialog: {
          closable: true,
        },
      });

      await selectCell(0, 0);

      const dialogPlugin = getPlugin('dialog');

      expect(dialogPlugin.isVisible()).toBe(false);

      await selectCell(0, 0);
      await keyDownUp('escape');

      expect(dialogPlugin.isVisible()).toBe(false);
    });

    it('should not close the dialog when active element is outside of the rootWrapperElement', async() => {
      const input = document.createElement('input');

      document.body.appendChild(input);

      handsontable({
        data: createSpreadsheetData(5, 5),
        dialog: {
          closable: true,
        },
      });

      const dialogPlugin = getPlugin('dialog');

      input.focus();

      dialogPlugin.show({
        content: 'Test dialog content',
      });

      document.body.removeChild(input);

      expect(dialogPlugin.isVisible()).toBe(true);

      await keyDownUp('escape');

      expect(dialogPlugin.isVisible()).toBe(true);
    });
  });
});
