describe('i18n', () => {
  const id = 'testContainer';
  const DEFAULT_LANGUAGE_CODE = 'en-US';
  const NOT_EXISTING_LANGUAGE_CODE = 'bs-GY';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('error / warning handling when changing languages', () => {
    xit('should log warn in console when setting not existing language at start', () => {
      const spy = spyOn(console, 'warn');

      handsontable({
        language: NOT_EXISTING_LANGUAGE_CODE
      });

      expect(spy).toHaveBeenCalled();
    });

    it('should not throw error when setting not existing language at start', async () => {
      const spy = spyOn(window, 'onerror');

      handsontable({
        language: NOT_EXISTING_LANGUAGE_CODE
      });

      await sleep(100);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log warn in console when setting directly default language at start', () => {
      const spy = spyOn(console, 'warn');

      handsontable({
        language: DEFAULT_LANGUAGE_CODE
      });

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

    it('should log warn when trying to set not existing language by updateSettings', () => {
      const spy = spyOn(console, 'warn');

      handsontable();

      updateSettings({language: NOT_EXISTING_LANGUAGE_CODE});

      expect(spy).toHaveBeenCalled();
    });

    it('should not throw error when trying to set not existing language by updateSettings', async () => {
      const spy = spyOn(window, 'onerror');

      handsontable();

      updateSettings({language: NOT_EXISTING_LANGUAGE_CODE});

      await sleep(100);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log warn in console when trying to set default language by updateSettings', () => {
      const spy = spyOn(console, 'warn');

      handsontable();

      updateSettings({language: DEFAULT_LANGUAGE_CODE});

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not throw error when trying to set default language by updateSettings', async () => {
      const spy = spyOn(console, 'warn');

      handsontable();

      updateSettings({language: DEFAULT_LANGUAGE_CODE});

      await sleep(100);

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
