describe('HiddenColumns', () => {
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

  describe('configuration', () => {
    it('should hide columns if the "hiddenColumns" property is set', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [1, 3],
        }
      });

      expect(spec().$container.find('tr:eq(0) td').length).toBe(3);
      expect(getCell(0, 0).innerText).toBe('A1');
      expect(getCell(0, 1)).toBe(null);
      expect(getCell(0, 2).innerText).toBe('C1');
      expect(getCell(0, 3)).toBe(null);
      expect(getCell(0, 4).innerText).toBe('E1');
      expect(countCols()).toBe(5);
    });

    it('should return to default state after calling the disablePlugin method', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [1, 3],
        },
      });

      getPlugin('hiddenColumns').disablePlugin();
      render();

      expect(getCell(0, 0).innerText).toBe('A1');
      expect(getCell(0, 1).innerText).toBe('B1');
      expect(getCell(0, 2).innerText).toBe('C1');
      expect(getCell(0, 3).innerText).toBe('D1');
      expect(getCell(0, 4).innerText).toBe('E1');
      expect(countCols()).toBe(5);
    });

    it('should hide columns after calling the enablePlugin method', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [1, 3],
        },
      });

      const plugin = getPlugin('hiddenColumns');

      plugin.disablePlugin();
      render();

      expect(countCols()).toBe(5);

      plugin.enablePlugin();
      render();

      expect(countCols()).toBe(5);
      expect(getCell(0, 0).innerText).toBe('A1');
      expect(getCell(0, 1)).toBe(null);
      expect(getCell(0, 2).innerText).toBe('C1');
      expect(getCell(0, 3)).toBe(null);
      expect(getCell(0, 4).innerText).toBe('E1');
    });

    it('should initialize the plugin after setting it up with the "updateSettings" method', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
      });

      const plugin = getPlugin('hiddenColumns');

      expect(plugin.enabled).toEqual(false);

      updateSettings({
        hiddenColumns: {
          columns: [1, 3],
        },
      });

      expect(plugin.enabled).toEqual(true);
      expect(spec().$container.find('tr:eq(0) td').length).toBe(3);
      expect(countCols()).toBe(5);
      expect(getCell(0, 0).innerText).toBe('A1');
      expect(getCell(0, 1)).toBe(null);
      expect(getCell(0, 2).innerText).toBe('C1');
      expect(getCell(0, 3)).toBe(null);
      expect(getCell(0, 4).innerText).toBe('E1');
    });

    it('should update hidden columns with the "updateSettings" method', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: [1, 3],
        },
      });

      expect(countCols()).toBe(5);
      expect(spec().$container.find('tr:eq(0) td').length).toBe(3);
      expect(getCell(0, 0).innerText).toBe('A1');
      expect(getCell(0, 1)).toBe(null);
      expect(getCell(0, 2).innerText).toBe('C1');
      expect(getCell(0, 3)).toBe(null);
      expect(getCell(0, 4).innerText).toBe('E1');

      updateSettings({
        hiddenColumns: {
          columns: [0, 2, 4],
        },
      });

      expect(countCols()).toBe(5);
      expect(spec().$container.find('tr:eq(0) td').length).toBe(2);
      expect(getCell(0, 0)).toBe(null);
      expect(getCell(0, 1).innerText).toBe('B1');
      expect(getCell(0, 2)).toBe(null);
      expect(getCell(0, 3).innerText).toBe('D1');
      expect(getCell(0, 4)).toBe(null);
    });
  });
});
