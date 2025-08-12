describe('settings', () => {
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

  describe('initialState', () => {
    it('should not install Proxy to settings prototype when initialState is not used', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      expect(getSettings().__isProxy__).toBeUndefined();
    });

    it('should be able to set initialState', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        initialState: {
          manualColumnMove: [1, 0],
          fragmentSelection: true,
        },
      });

      expect(getSettings().__isProxy__).toBe(true);
      expect(getSettings().manualColumnMove).toEqual([1, 0]);
      expect(getSettings().fragmentSelection).toBe(true);
    });

    it('should take settings from initialState object until first updateSettings call', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        initialState: {
          manualColumnMove: [1, 0],
          fragmentSelection: true,
        },
        manualColumnMove: [0, 1],
        fragmentSelection: 'cell',
      });

      expect(getSettings().manualColumnMove).toEqual([1, 0]);
      expect(getSettings().fragmentSelection).toBe(true);

      await updateSettings({});

      expect(getSettings().manualColumnMove).toEqual([0, 1]);
      expect(getSettings().fragmentSelection).toBe('cell');

      await updateSettings({});

      expect(getSettings().manualColumnMove).toEqual([0, 1]);
      expect(getSettings().fragmentSelection).toBe('cell');
    });

    it('should be possible to override initialState settings by calling the `updateSettings` method', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        initialState: {
          manualColumnMove: [1, 0],
          fragmentSelection: true,
          copyable: true,
        },
      });

      expect(getSettings().manualColumnMove).toEqual([1, 0]);
      expect(getSettings().fragmentSelection).toBe(true);
      expect(getSettings().copyable).toBe(true);

      await updateSettings({
        manualColumnMove: [0, 1],
      });

      expect(getSettings().manualColumnMove).toEqual([0, 1]);
      expect(getSettings().fragmentSelection).toBe(false); // switched to its default value (false)
      expect(getSettings().copyable).toBe(true); // switched to its default value (true)

      await updateSettings({
        fragmentSelection: 'cell',
      });

      expect(getSettings().manualColumnMove).toEqual([0, 1]);
      expect(getSettings().fragmentSelection).toBe('cell');
      expect(getSettings().copyable).toBe(true); // switched to its default value (true)
    });

    it('should not be possible to change the initialState settings by calling the `updateSettings` method', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        initialState: {
          manualColumnMove: [1, 0],
          fragmentSelection: true,
        },
        manualColumnMove: true,
      });

      expect(getSettings().manualColumnMove).toEqual([1, 0]);
      expect(getSettings().fragmentSelection).toBe(true);

      await updateSettings({
        initialState: {
          manualColumnMove: [0, 1],
          fragmentSelection: 'cell',
        },
      });

      expect(getSettings().manualColumnMove).toBe(true);
      expect(getSettings().fragmentSelection).toBe(false); // switched to its default value (false)
    });
  });
});
