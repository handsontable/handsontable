describe('i18n', () => {
  const id = 'testContainer';

  const DEFAULT_LANGUAGE_CODE = 'en-US';
  const NOT_EXISTING_LANGUAGE_CODE = 'bs-GY';
  const NOT_EXISTING_LANGUAGE_CODE2 = 'dd-Da';
  const POLISH_LANGUAGE_CODE = 'pl-PL';

  const INSERT_ROW_ABOVE_IN_DEFAULT_LANGUAGE = 'Insert row above';
  const INSERT_ROW_ABOVE_IN_POLISH_LANGUAGE = 'Wstaw wiersz powyżej';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should propagate `language` key to meta of cells', async() => {
    handsontable({
      language: POLISH_LANGUAGE_CODE
    });

    expect(getCellMeta(0, 0).language).toBe('pl-PL');
  });

  describe('Hook `beforeLanguageChange`', () => {
    it('should not call the `beforeLanguageChange` at start (`language` key have not been set)', async() => {
      let beforeLanguageChangeCalled = false;

      handsontable({
        beforeLanguageChange() {
          beforeLanguageChangeCalled = true;
        }
      });

      expect(beforeLanguageChangeCalled).toEqual(false);
    });

    it('should not call the `beforeLanguageChange` at start (`language` key have been set)', async() => {
      let beforeLanguageChangeCalled = false;

      handsontable({
        language: POLISH_LANGUAGE_CODE,
        beforeLanguageChange() {
          beforeLanguageChangeCalled = true;
        }
      });

      expect(beforeLanguageChangeCalled).toEqual(false);
    });

    it('should call the `beforeLanguageChange` before updating settings', async() => {
      let languageInsideHook;

      handsontable({
        beforeLanguageChange() {
          const settings = this.getSettings();

          languageInsideHook = settings.language;
        }
      });

      await updateSettings({
        language: POLISH_LANGUAGE_CODE
      });

      expect(languageInsideHook).toEqual(DEFAULT_LANGUAGE_CODE);
    });
  });

  describe('Hook `afterLanguageChange`', () => {
    it('should not call the `afterLanguageChange` at start (`language` key have not been set)', async() => {
      let afterLanguageChangeCalled = false;

      handsontable({
        afterLanguageChange() {
          afterLanguageChangeCalled = true;
        }
      });

      expect(afterLanguageChangeCalled).toEqual(false);
    });

    it('should not call the `afterLanguageChange` at start (`language` key have been set)', async() => {
      let afterLanguageChangeCalled = false;

      handsontable({
        language: POLISH_LANGUAGE_CODE,
        afterLanguageChange() {
          afterLanguageChangeCalled = true;
        }
      });

      expect(afterLanguageChangeCalled).toEqual(false);
    });

    it('should call the `afterLanguageChange` after updating settings', async() => {
      let languageInsideHook;

      handsontable({
        afterLanguageChange() {
          const settings = this.getSettings();

          languageInsideHook = settings.language;
        }
      });

      await updateSettings({
        language: POLISH_LANGUAGE_CODE
      });

      expect(languageInsideHook).toEqual(POLISH_LANGUAGE_CODE);
    });
  });

  describe('translation does not throw exceptions', () => {
    it('should not throw error when setting not existing language code at start', async() => {
      spyOn(console, 'error'); // overriding console.error
      const spy = spyOn(window, 'onerror');

      handsontable({
        language: NOT_EXISTING_LANGUAGE_CODE
      });

      await sleep(100);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not throw error when setting directly default language code at start', async() => {
      const spy = spyOn(window, 'onerror');

      handsontable({
        language: DEFAULT_LANGUAGE_CODE
      });

      await sleep(100);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not throw error when trying to set not existing language code by updateSettings', async() => {
      spyOn(console, 'error'); // overriding console.error
      const spy = spyOn(window, 'onerror');

      handsontable();

      await updateSettings({ language: NOT_EXISTING_LANGUAGE_CODE });

      await sleep(100);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not throw error when trying to set directly default language code by updateSettings', async() => {
      const spy = spyOn(window, 'onerror');

      handsontable();

      await updateSettings({ language: DEFAULT_LANGUAGE_CODE });

      await sleep(100);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('translation log error when needed', () => {
    it('should log error when setting not existing language code at start', async() => {
      const spy = spyOn(console, 'error');

      handsontable({
        language: NOT_EXISTING_LANGUAGE_CODE
      });

      expect(spy).toHaveBeenCalled();
    });

    it('should log error when trying to set not existing language code by updateSettings', async() => {
      const spy = spyOn(console, 'error');

      handsontable();

      await updateSettings({ language: NOT_EXISTING_LANGUAGE_CODE });

      expect(spy).toHaveBeenCalled();
    });

    it('should not log error when setting directly default language code at start', async() => {
      const spy = spyOn(console, 'error');

      handsontable({
        language: DEFAULT_LANGUAGE_CODE
      });

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log error when trying to set directly default language code by updateSettings', async() => {
      const spy = spyOn(console, 'error');

      handsontable();

      await updateSettings({ language: DEFAULT_LANGUAGE_CODE });

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('settings', () => {
    it('should set default language code at start', async() => {
      handsontable();

      expect(getSettings().language).toEqual(DEFAULT_LANGUAGE_CODE);
    });

    it('should not set language code as own property of settings object at start', async() => {
      handsontable();

      // eslint-disable-next-line no-prototype-builtins
      expect(getSettings().hasOwnProperty('language')).toEqual(false);
    });

    it('should not set language code as own property of settings object when using updateSettings', async() => {
      handsontable();

      await updateSettings({ language: POLISH_LANGUAGE_CODE });

      // eslint-disable-next-line no-prototype-builtins
      expect(getSettings().hasOwnProperty('language')).toEqual(false);
    });

    it('should set proper `language` key when trying to set not existing language code at start', async() => {
      spyOn(console, 'error'); // overriding console.error

      handsontable({
        language: NOT_EXISTING_LANGUAGE_CODE
      });

      expect(getSettings().language).toEqual(DEFAULT_LANGUAGE_CODE);
    });

    it('should set proper `language` key when trying to set not existing language code by updateSettings #1', async() => {
      spyOn(console, 'error'); // overriding console.error

      handsontable();

      await updateSettings({ language: NOT_EXISTING_LANGUAGE_CODE });

      expect(getSettings().language).toEqual(DEFAULT_LANGUAGE_CODE);
    });

    it('should set proper `language` key when trying to set not existing language code by updateSettings #2', async() => {
      spyOn(console, 'error'); // overriding console.error

      handsontable({
        language: POLISH_LANGUAGE_CODE
      });

      await updateSettings({ language: NOT_EXISTING_LANGUAGE_CODE });

      expect(getSettings().language).toEqual(POLISH_LANGUAGE_CODE);
    });

    it('should accept not normalized language code by default #1', async() => {
      handsontable({
        language: POLISH_LANGUAGE_CODE.toLowerCase()
      });

      expect(getSettings().language).toEqual(POLISH_LANGUAGE_CODE);
    });

    it('should accept not normalized language code by default #2', async() => {
      handsontable();

      await updateSettings({
        language: POLISH_LANGUAGE_CODE.toUpperCase()
      });

      expect(getSettings().language).toEqual(POLISH_LANGUAGE_CODE);
    });

    it('should not change language when `language` key passed to `updateSettings` was not set', async() => {
      handsontable({
        language: POLISH_LANGUAGE_CODE
      });

      await updateSettings({
        fillHandle: true
      });

      expect(getSettings().language).toEqual(POLISH_LANGUAGE_CODE);
    });
  });

  describe('contextMenu translation', () => {
    it('should translate contextMenu UI when setting existing language code at start', async() => {
      handsontable({
        language: POLISH_LANGUAGE_CODE,
        contextMenu: ['row_above']
      });

      await selectCell(0, 0);
      await contextMenu();

      const $contextMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($contextMenuItem.text()).toEqual(INSERT_ROW_ABOVE_IN_POLISH_LANGUAGE);
    });

    it('should not change default contextMenu UI when trying to set not existing language code at start', async() => {
      spyOn(console, 'error'); // overriding console.error

      handsontable({
        language: NOT_EXISTING_LANGUAGE_CODE,
        contextMenu: ['row_above']
      });

      await selectCell(0, 0);
      await contextMenu();

      const $contextMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($contextMenuItem.text()).toEqual(INSERT_ROW_ABOVE_IN_DEFAULT_LANGUAGE);
    });

    it('should translate contextMenu UI when setting existing language code by updateSettings', async() => {
      handsontable({
        contextMenu: ['row_above']
      });

      await updateSettings({ language: POLISH_LANGUAGE_CODE });

      await sleep(0);

      await contextMenu();

      const $contextMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($contextMenuItem.text()).toEqual(INSERT_ROW_ABOVE_IN_POLISH_LANGUAGE);
    });

    it('should not change default contextMenu UI when trying to set not existing language code by updateSettings #1', async() => {
      spyOn(console, 'error'); // overriding console.error

      handsontable({
        contextMenu: ['row_above']
      });

      await updateSettings({ language: NOT_EXISTING_LANGUAGE_CODE });

      await sleep(0);

      await contextMenu();

      const $contextMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($contextMenuItem.text()).toEqual(INSERT_ROW_ABOVE_IN_DEFAULT_LANGUAGE);
    });

    it('should not change default contextMenu UI when trying to set not existing language code by updateSettings #2', async() => {
      spyOn(console, 'error'); // overriding console.error

      handsontable({
        language: NOT_EXISTING_LANGUAGE_CODE,
        contextMenu: ['row_above']
      });

      await updateSettings({ language: NOT_EXISTING_LANGUAGE_CODE2 });

      await sleep(0);

      await contextMenu();

      const $contextMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($contextMenuItem.text()).toEqual(INSERT_ROW_ABOVE_IN_DEFAULT_LANGUAGE);
    });

    it('should not change previously translated contextMenu UI when trying to set not existing language code by updateSettings', async() => {
      spyOn(console, 'error'); // overriding console.error

      handsontable({
        language: POLISH_LANGUAGE_CODE,
        contextMenu: ['row_above']
      });

      await updateSettings({ language: NOT_EXISTING_LANGUAGE_CODE });

      await sleep(0);

      await contextMenu();

      const $contextMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($contextMenuItem.text()).toEqual(INSERT_ROW_ABOVE_IN_POLISH_LANGUAGE);
    });

    it('should translate multi-level menu properly', async() => {
      const ALIGN_LEFT_IN_POLISH = 'Do lewej';

      handsontable({
        language: POLISH_LANGUAGE_CODE,
        contextMenu: ['alignment']
      });

      await selectCell(0, 0);
      await contextMenu();

      const $menu = $('.htSubmenu');

      $menu.simulate('mouseover');

      await sleep(300);

      const $submenuItem = $('.htContextMenu').eq(1).find('tbody td:not(.htSeparator)').eq(0);

      expect($submenuItem.text()).toEqual(ALIGN_LEFT_IN_POLISH);
    });

    it('should choose proper form of phrase when translating', async() => {
      const REMOVE_ROW_PLURAL_IN_DEFAULT_LANGUAGE = 'Remove rows';
      const REMOVE_COLUMN_PLURAL_IN_DEFAULT_LANGUAGE = 'Remove columns';

      handsontable({
        contextMenu: ['remove_row', 'remove_col']
      });

      await selectCell(0, 0, 2, 2);
      await contextMenu();

      const $removeRowItem = $('.htContextMenu').eq(0).find('tbody td:not(.htSeparator)').eq(0);
      const $removeColumnItem = $('.htContextMenu').eq(0).find('tbody td:not(.htSeparator)').eq(1);

      expect($removeRowItem.text()).toEqual(REMOVE_ROW_PLURAL_IN_DEFAULT_LANGUAGE);
      expect($removeColumnItem.text()).toEqual(REMOVE_COLUMN_PLURAL_IN_DEFAULT_LANGUAGE);
    });

    it('should translate item from enabled `freezeColumn` plugin when setting existing language code at start', async() => {
      const FREEZE_COLUMN_IN_POLISH_LANGUAGE = 'Zablokuj kolumnę';

      handsontable({
        contextMenu: ['freeze_column'],
        manualColumnFreeze: true,
        language: POLISH_LANGUAGE_CODE,
      });

      await selectCell(0, 0);
      await contextMenu();

      const $freezeColumnMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($freezeColumnMenuItem.text()).toEqual(FREEZE_COLUMN_IN_POLISH_LANGUAGE);
    });

    it('should translate item from enabled `comments` plugin when setting existing language code at start', async() => {
      const ADD_COMMENT_IN_POLISH_LANGUAGE = 'Dodaj komentarz';

      handsontable({
        contextMenu: ['commentsAddEdit'],
        comments: true,
        language: POLISH_LANGUAGE_CODE,
      });

      await selectCell(0, 0);
      await contextMenu();

      const $addCommentMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($addCommentMenuItem.text()).toEqual(ADD_COMMENT_IN_POLISH_LANGUAGE);
    });

    it('should translate item from enabled `customBorders` plugin when setting existing language code at start', async() => {
      const BORDERS_IN_POLISH = 'Obramowanie';

      handsontable({
        language: POLISH_LANGUAGE_CODE,
        contextMenu: ['borders'],
        customBorders: true
      });

      await selectCell(0, 0);
      await contextMenu();

      const $bordersMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($bordersMenuItem.text()).toEqual(BORDERS_IN_POLISH);
    });

    it('should translate item from enabled `mergeCells` plugin when setting existing language code at start', async() => {
      const MERGE_CELLS_IN_POLISH = 'Scal komórki';

      handsontable({
        language: POLISH_LANGUAGE_CODE,
        contextMenu: ['mergeCells'],
        mergeCells: true
      });

      await selectCell(0, 0);
      await contextMenu();

      const $mergeCellsMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($mergeCellsMenuItem.text()).toEqual(MERGE_CELLS_IN_POLISH);
    });

    it('should translate item from enabled `copyPaste` plugin when setting existing language code at start', async() => {
      const COPY_IN_POLISH = 'Kopiuj';

      handsontable({
        language: POLISH_LANGUAGE_CODE,
        contextMenu: ['copy'],
        copyPaste: true
      });

      await selectCell(0, 0);
      await contextMenu();

      const $copyMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($copyMenuItem.text()).toEqual(COPY_IN_POLISH);
    });
  });
});
