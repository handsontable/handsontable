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
    it('should be able to set initialState', async() => {
      const cells = () => {};

      handsontable({
        initialState: {
          data: createSpreadsheetData(5, 5),
          manualColumnMove: [1, 0],
          fragmentSelection: true,
          columns: [
            {
              type: 'numeric',
            },
          ],
          cells,
        },
      });

      expect(getSettings().data).toEqual(createSpreadsheetData(5, 5));
      expect(getSettings().manualColumnMove).toEqual([1, 0]);
      expect(getSettings().fragmentSelection).toBe(true);
      expect(getSettings().columns).toEqual([
        {
          type: 'numeric',
        },
      ]);
      expect(getSettings().cells).toBe(cells);
    });

    it('should initialState be merged and override by table settings', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        initialState: {
          manualColumnMove: [1, 0],
          fragmentSelection: true,
        },
        manualColumnMove: [0, 1],
        fragmentSelection: 'cell',
      });

      expect(getSettings().manualColumnMove).toEqual([0, 1]);
      expect(getSettings().fragmentSelection).toBe('cell');
    });

    it('should keep initialState settings after updateSettings call', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        initialState: {
          manualColumnMove: [1, 0],
          fragmentSelection: true,
        },
      });

      await updateSettings({});

      expect(getSettings().manualColumnMove).toEqual([1, 0]);
      expect(getSettings().fragmentSelection).toBe(true);
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
      expect(getSettings().fragmentSelection).toBe(true);
      expect(getSettings().copyable).toBe(true);

      await updateSettings({
        fragmentSelection: 'cell',
      });

      expect(getSettings().manualColumnMove).toEqual([0, 1]);
      expect(getSettings().fragmentSelection).toBe('cell');
      expect(getSettings().copyable).toBe(true);
    });
  });
});
