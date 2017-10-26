describe('i18n', () => {
  const id = 'testContainer';

  const DEFAULT_LANGUAGE_CODE = 'en-US';
  const NOT_EXISTING_LANGUAGE_CODE = 'bs-GY';
  const NOT_EXISTING_LANGUAGE_CODE2 = 'dd-Da';
  const EXISTING_LANGUAGE_CODE = 'pl-PL';
  const POLISH_LANGUAGE_CODE = EXISTING_LANGUAGE_CODE;

  const INSERT_ROW_ABOVE_IN_DEFAULT_LANGUAGE = 'Insert row above';
  const INSERT_ROW_ABOVE_IN_POLISH = 'Umieść wiersz powyżej';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('translation doesn\'t throw errors', () => {
    it('should not throw error when setting not existing language at start', async () => {
      const spy = spyOn(window, 'onerror');

      handsontable({
        language: NOT_EXISTING_LANGUAGE_CODE
      });

      await sleep(100);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not throw error when setting directly default language at start', async () => {
      const spy = spyOn(window, 'onerror');

      handsontable({
        language: DEFAULT_LANGUAGE_CODE
      });

      await sleep(100);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not throw error when trying to set not existing language by updateSettings', async () => {
      const spy = spyOn(window, 'onerror');

      handsontable();

      updateSettings({language: NOT_EXISTING_LANGUAGE_CODE});

      await sleep(100);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not throw error when trying to set directly default language by updateSettings', async () => {
      const spy = spyOn(window, 'onerror');

      handsontable();

      updateSettings({language: DEFAULT_LANGUAGE_CODE});

      await sleep(100);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('contextMenu translation', () => {
    it('should translate contextMenu UI when setting existing language at start', async () => {
      handsontable({
        language: POLISH_LANGUAGE_CODE,
        contextMenu: ['row_above']
      });

      selectCell(0, 0);
      contextMenu();

      await sleep(300);

      const $contextMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($contextMenuItem.text()).toEqual(INSERT_ROW_ABOVE_IN_POLISH);
    });

    it('should not change default contextMenu UI when trying to set not existing language at start', async () => {
      handsontable({
        language: NOT_EXISTING_LANGUAGE_CODE,
        contextMenu: ['row_above']
      });

      selectCell(0, 0);
      contextMenu();

      await sleep(300);

      const $contextMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($contextMenuItem.text()).toEqual(INSERT_ROW_ABOVE_IN_DEFAULT_LANGUAGE);
    });

    it('should translate contextMenu UI when setting existing language by updateSettings', async () => {
      handsontable({
        contextMenu: ['row_above']
      });

      updateSettings({language: POLISH_LANGUAGE_CODE});

      selectCell(0, 0);
      contextMenu();

      await sleep(300);

      const $contextMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($contextMenuItem.text()).toEqual(INSERT_ROW_ABOVE_IN_POLISH);
    });

    it('should not change default contextMenu UI when trying to set not existing language by updateSettings #1', async () => {
      handsontable({
        contextMenu: ['row_above']
      });

      updateSettings({language: NOT_EXISTING_LANGUAGE_CODE});

      selectCell(0, 0);
      contextMenu();

      await sleep(300);

      const $contextMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($contextMenuItem.text()).toEqual(INSERT_ROW_ABOVE_IN_DEFAULT_LANGUAGE);
    });

    it('should not change default contextMenu UI when trying to set not existing language by updateSettings #2', async () => {
      handsontable({
        language: NOT_EXISTING_LANGUAGE_CODE,
        contextMenu: ['row_above']
      });

      updateSettings({language: NOT_EXISTING_LANGUAGE_CODE2});

      selectCell(0, 0);
      contextMenu();

      await sleep(300);

      const $contextMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($contextMenuItem.text()).toEqual(INSERT_ROW_ABOVE_IN_DEFAULT_LANGUAGE);
    });

    it('should not change previously translated contextMenu UI when trying to set not existing language by updateSettings', async () => {
      handsontable({
        language: POLISH_LANGUAGE_CODE,
        contextMenu: ['row_above']
      });

      updateSettings({language: NOT_EXISTING_LANGUAGE_CODE});

      selectCell(0, 0);
      contextMenu();

      await sleep(300);

      const $contextMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($contextMenuItem.text()).toEqual(INSERT_ROW_ABOVE_IN_POLISH);
    });

    it('should translate multi-level menu properly', async () => {
      const ALIGN_LEFT_IN_POLISH = 'Lewo';

      handsontable({
        language: POLISH_LANGUAGE_CODE,
        contextMenu: ['alignment']
      });

      selectCell(0, 0);
      contextMenu();

      await sleep(300);

      const $menu = $('.htSubmenu');

      $menu.simulate('mouseover');

      await sleep(300);

      const $submenuItem = $('.htContextMenu').eq(1).find('tbody td:not(.htSeparator)').eq(0);

      expect($submenuItem.text()).toEqual(ALIGN_LEFT_IN_POLISH);
    });

    it('should choose proper form of phrase when translating', async () => {
      const REMOVE_ROW_PLURAL_IN_DEFAULT_LANGUAGE = 'Remove rows';
      const REMOVE_COLUMN_PLURAL_IN_DEFAULT_LANGUAGE = 'Remove columns';

      handsontable({
        contextMenu: ['remove_row', 'remove_col']
      });

      selectCell(0, 0, 2, 2);
      contextMenu();

      await sleep(300);

      const $removeRowItem = $('.htContextMenu').eq(0).find('tbody td:not(.htSeparator)').eq(0);
      const $removeColumnItem = $('.htContextMenu').eq(0).find('tbody td:not(.htSeparator)').eq(1);

      expect($removeRowItem.text()).toEqual(REMOVE_ROW_PLURAL_IN_DEFAULT_LANGUAGE);
      expect($removeColumnItem.text()).toEqual(REMOVE_COLUMN_PLURAL_IN_DEFAULT_LANGUAGE);
    });
  });
});
