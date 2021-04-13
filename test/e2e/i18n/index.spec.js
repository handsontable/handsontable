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

  it('should propagate `language` key to meta of cells', () => {
    handsontable({
      language: POLISH_LANGUAGE_CODE
    });

    expect(getCellMeta(0, 0).language).toBe('pl-PL');
  });

  describe('Hook `beforeLanguageChange`', () => {
    it('should not call the `beforeLanguageChange` at start (`language` key have not been set)', () => {
      let beforeLanguageChangeCalled = false;

      handsontable({
        beforeLanguageChange() {
          beforeLanguageChangeCalled = true;
        }
      });

      expect(beforeLanguageChangeCalled).toEqual(false);
    });

    it('should not call the `beforeLanguageChange` at start (`language` key have been set)', () => {
      let beforeLanguageChangeCalled = false;

      handsontable({
        language: POLISH_LANGUAGE_CODE,
        beforeLanguageChange() {
          beforeLanguageChangeCalled = true;
        }
      });

      expect(beforeLanguageChangeCalled).toEqual(false);
    });

    it('should call the `beforeLanguageChange` before updating settings', () => {
      let languageInsideHook;

      handsontable({
        beforeLanguageChange() {
          const settings = this.getSettings();

          languageInsideHook = settings.language;
        }
      });

      updateSettings({
        language: POLISH_LANGUAGE_CODE
      });

      expect(languageInsideHook).toEqual(DEFAULT_LANGUAGE_CODE);
    });
  });

  describe('Hook `afterLanguageChange`', () => {
    it('should not call the `afterLanguageChange` at start (`language` key have not been set)', () => {
      let afterLanguageChangeCalled = false;

      handsontable({
        afterLanguageChange() {
          afterLanguageChangeCalled = true;
        }
      });

      expect(afterLanguageChangeCalled).toEqual(false);
    });

    it('should not call the `afterLanguageChange` at start (`language` key have been set)', () => {
      let afterLanguageChangeCalled = false;

      handsontable({
        language: POLISH_LANGUAGE_CODE,
        afterLanguageChange() {
          afterLanguageChangeCalled = true;
        }
      });

      expect(afterLanguageChangeCalled).toEqual(false);
    });

    it('should call the `afterLanguageChange` after updating settings', () => {
      let languageInsideHook;

      handsontable({
        afterLanguageChange() {
          const settings = this.getSettings();

          languageInsideHook = settings.language;
        }
      });

      updateSettings({
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

      updateSettings({ language: NOT_EXISTING_LANGUAGE_CODE });

      await sleep(100);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not throw error when trying to set directly default language code by updateSettings', async() => {
      const spy = spyOn(window, 'onerror');

      handsontable();

      updateSettings({ language: DEFAULT_LANGUAGE_CODE });

      await sleep(100);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('translation log error when needed', () => {
    it('should log error when setting not existing language code at start', () => {
      const spy = spyOn(console, 'error');

      handsontable({
        language: NOT_EXISTING_LANGUAGE_CODE
      });

      expect(spy).toHaveBeenCalled();
    });

    it('should log error when trying to set not existing language code by updateSettings', () => {
      const spy = spyOn(console, 'error');

      handsontable();

      updateSettings({ language: NOT_EXISTING_LANGUAGE_CODE });

      expect(spy).toHaveBeenCalled();
    });

    it('should not log error when setting directly default language code at start', () => {
      const spy = spyOn(console, 'error');

      handsontable({
        language: DEFAULT_LANGUAGE_CODE
      });

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log error when trying to set directly default language code by updateSettings', () => {
      const spy = spyOn(console, 'error');

      handsontable();

      updateSettings({ language: DEFAULT_LANGUAGE_CODE });

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('settings', () => {
    it('should set default language code at start', () => {
      const hot = handsontable();

      expect(hot.getSettings().language).toEqual(DEFAULT_LANGUAGE_CODE);
    });

    it('should not set language code as own property of settings object at start', () => {
      const hot = handsontable();

      // eslint-disable-next-line no-prototype-builtins
      expect(hot.getSettings().hasOwnProperty('language')).toEqual(false);
    });

    it('should not set language code as own property of settings object when using updateSettings', () => {
      const hot = handsontable();

      updateSettings({ language: POLISH_LANGUAGE_CODE });

      // eslint-disable-next-line no-prototype-builtins
      expect(hot.getSettings().hasOwnProperty('language')).toEqual(false);
    });

    it('should set proper `language` key when trying to set not existing language code at start', () => {
      spyOn(console, 'error'); // overriding console.error

      const hot = handsontable({
        language: NOT_EXISTING_LANGUAGE_CODE
      });

      expect(hot.getSettings().language).toEqual(DEFAULT_LANGUAGE_CODE);
    });

    it('should set proper `language` key when trying to set not existing language code by updateSettings #1', () => {
      spyOn(console, 'error'); // overriding console.error

      const hot = handsontable();

      updateSettings({ language: NOT_EXISTING_LANGUAGE_CODE });

      expect(hot.getSettings().language).toEqual(DEFAULT_LANGUAGE_CODE);
    });

    it('should set proper `language` key when trying to set not existing language code by updateSettings #2', () => {
      spyOn(console, 'error'); // overriding console.error

      const hot = handsontable({
        language: POLISH_LANGUAGE_CODE
      });

      updateSettings({ language: NOT_EXISTING_LANGUAGE_CODE });

      expect(hot.getSettings().language).toEqual(POLISH_LANGUAGE_CODE);
    });

    it('should accept not normalized language code by default #1', () => {
      const hot = handsontable({
        language: POLISH_LANGUAGE_CODE.toLowerCase()
      });

      expect(hot.getSettings().language).toEqual(POLISH_LANGUAGE_CODE);
    });

    it('should accept not normalized language code by default #2', () => {
      const hot = handsontable();

      updateSettings({
        language: POLISH_LANGUAGE_CODE.toUpperCase()
      });

      expect(hot.getSettings().language).toEqual(POLISH_LANGUAGE_CODE);
    });

    it('should not change language when `language` key passed to `updateSettings` was not set', () => {
      const hot = handsontable({
        language: POLISH_LANGUAGE_CODE
      });

      updateSettings({
        fillHandle: true
      });

      expect(hot.getSettings().language).toEqual(POLISH_LANGUAGE_CODE);
    });
  });

  describe('contextMenu translation', () => {
    it('should translate contextMenu UI when setting existing language code at start', () => {
      handsontable({
        language: POLISH_LANGUAGE_CODE,
        contextMenu: ['row_above']
      });

      selectCell(0, 0);
      contextMenu();

      const $contextMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($contextMenuItem.text()).toEqual(INSERT_ROW_ABOVE_IN_POLISH_LANGUAGE);
    });

    it('should not change default contextMenu UI when trying to set not existing language code at start', () => {
      spyOn(console, 'error'); // overriding console.error

      handsontable({
        language: NOT_EXISTING_LANGUAGE_CODE,
        contextMenu: ['row_above']
      });

      selectCell(0, 0);
      contextMenu();

      const $contextMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($contextMenuItem.text()).toEqual(INSERT_ROW_ABOVE_IN_DEFAULT_LANGUAGE);
    });

    it('should translate contextMenu UI when setting existing language code by updateSettings', async() => {
      handsontable({
        contextMenu: ['row_above']
      });

      updateSettings({ language: POLISH_LANGUAGE_CODE });

      await sleep(0);

      contextMenu();

      const $contextMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($contextMenuItem.text()).toEqual(INSERT_ROW_ABOVE_IN_POLISH_LANGUAGE);
    });

    it('should not change default contextMenu UI when trying to set not existing language code by updateSettings #1', async() => {
      spyOn(console, 'error'); // overriding console.error

      handsontable({
        contextMenu: ['row_above']
      });

      updateSettings({ language: NOT_EXISTING_LANGUAGE_CODE });

      await sleep(0);

      contextMenu();

      const $contextMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($contextMenuItem.text()).toEqual(INSERT_ROW_ABOVE_IN_DEFAULT_LANGUAGE);
    });

    it('should not change default contextMenu UI when trying to set not existing language code by updateSettings #2', async() => {
      spyOn(console, 'error'); // overriding console.error

      handsontable({
        language: NOT_EXISTING_LANGUAGE_CODE,
        contextMenu: ['row_above']
      });

      updateSettings({ language: NOT_EXISTING_LANGUAGE_CODE2 });

      await sleep(0);

      contextMenu();

      const $contextMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($contextMenuItem.text()).toEqual(INSERT_ROW_ABOVE_IN_DEFAULT_LANGUAGE);
    });

    it('should not change previously translated contextMenu UI when trying to set not existing language code by updateSettings', async() => {
      spyOn(console, 'error'); // overriding console.error

      handsontable({
        language: POLISH_LANGUAGE_CODE,
        contextMenu: ['row_above']
      });

      updateSettings({ language: NOT_EXISTING_LANGUAGE_CODE });

      await sleep(0);

      contextMenu();

      const $contextMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($contextMenuItem.text()).toEqual(INSERT_ROW_ABOVE_IN_POLISH_LANGUAGE);
    });

    it('should translate multi-level menu properly', async() => {
      const ALIGN_LEFT_IN_POLISH = 'Do lewej';

      handsontable({
        language: POLISH_LANGUAGE_CODE,
        contextMenu: ['alignment']
      });

      selectCell(0, 0);
      contextMenu();

      const $menu = $('.htSubmenu');

      $menu.simulate('mouseover');

      await sleep(300);

      const $submenuItem = $('.htContextMenu').eq(1).find('tbody td:not(.htSeparator)').eq(0);

      expect($submenuItem.text()).toEqual(ALIGN_LEFT_IN_POLISH);
    });

    it('should choose proper form of phrase when translating', () => {
      const REMOVE_ROW_PLURAL_IN_DEFAULT_LANGUAGE = 'Remove rows';
      const REMOVE_COLUMN_PLURAL_IN_DEFAULT_LANGUAGE = 'Remove columns';

      handsontable({
        contextMenu: ['remove_row', 'remove_col']
      });

      selectCell(0, 0, 2, 2);
      contextMenu();

      const $removeRowItem = $('.htContextMenu').eq(0).find('tbody td:not(.htSeparator)').eq(0);
      const $removeColumnItem = $('.htContextMenu').eq(0).find('tbody td:not(.htSeparator)').eq(1);

      expect($removeRowItem.text()).toEqual(REMOVE_ROW_PLURAL_IN_DEFAULT_LANGUAGE);
      expect($removeColumnItem.text()).toEqual(REMOVE_COLUMN_PLURAL_IN_DEFAULT_LANGUAGE);
    });

    it('should translate item from enabled `freezeColumn` plugin when setting existing language code at start', () => {
      const FREEZE_COLUMN_IN_POLISH_LANGUAGE = 'Zablokuj kolumnę';

      handsontable({
        contextMenu: ['freeze_column'],
        manualColumnFreeze: true,
        language: POLISH_LANGUAGE_CODE,
      });

      selectCell(0, 0);
      contextMenu();

      const $freezeColumnMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($freezeColumnMenuItem.text()).toEqual(FREEZE_COLUMN_IN_POLISH_LANGUAGE);
    });

    it('should translate item from enabled `comments` plugin when setting existing language code at start', () => {
      const ADD_COMMENT_IN_POLISH_LANGUAGE = 'Dodaj komentarz';

      handsontable({
        contextMenu: ['commentsAddEdit'],
        comments: true,
        language: POLISH_LANGUAGE_CODE,
      });

      selectCell(0, 0);
      contextMenu();

      const $addCommentMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($addCommentMenuItem.text()).toEqual(ADD_COMMENT_IN_POLISH_LANGUAGE);
    });

    it('should translate item from enabled `customBorders` plugin when setting existing language code at start', () => {
      const BORDERS_IN_POLISH = 'Obramowanie';

      handsontable({
        language: POLISH_LANGUAGE_CODE,
        contextMenu: ['borders'],
        customBorders: true
      });

      selectCell(0, 0);
      contextMenu();

      const $bordersMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($bordersMenuItem.text()).toEqual(BORDERS_IN_POLISH);
    });

    it('should translate item from enabled `mergeCells` plugin when setting existing language code at start', () => {
      const MERGE_CELLS_IN_POLISH = 'Scal komórki';

      handsontable({
        language: POLISH_LANGUAGE_CODE,
        contextMenu: ['mergeCells'],
        mergeCells: true
      });

      selectCell(0, 0);
      contextMenu();

      const $mergeCellsMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($mergeCellsMenuItem.text()).toEqual(MERGE_CELLS_IN_POLISH);
    });

    it('should translate item from enabled `copyPaste` plugin when setting existing language code at start', () => {
      const COPY_IN_POLISH = 'Kopiuj';

      handsontable({
        language: POLISH_LANGUAGE_CODE,
        contextMenu: ['copy'],
        copyPaste: true
      });

      selectCell(0, 0);
      contextMenu();

      const $copyMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($copyMenuItem.text()).toEqual(COPY_IN_POLISH);
    });
  });
});
