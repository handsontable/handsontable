describe('HiddenRows', () => {
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
    it('should hide rows if the "hiddenRows" has "rows" property set', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenRows: {
          rows: [1, 3],
        }
      });

      expect(spec().$container.find('tr').length).toBe(3);
      expect(getCell(0, 0).innerText).toBe('A1');
      expect(getCell(1, 0)).toBe(null);
      expect(getCell(2, 0).innerText).toBe('A3');
      expect(getCell(3, 0)).toBe(null);
      expect(getCell(4, 0).innerText).toBe('A5');
      expect(countRows()).toBe(5);
    });

    it('should return to default state after calling the disablePlugin method', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenRows: {
          rows: [1, 3],
        },
      });

      getPlugin('hiddenRows').disablePlugin();
      render();

      expect(getCell(0, 0).innerText).toBe('A1');
      expect(getCell(1, 0).innerText).toBe('A2');
      expect(getCell(2, 0).innerText).toBe('A3');
      expect(getCell(3, 0).innerText).toBe('A4');
      expect(getCell(4, 0).innerText).toBe('A5');
      expect(countRows()).toBe(5);
    });

    it('should hide rows after calling the enablePlugin method', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenRows: {
          rows: [1, 3],
        },
      });

      const plugin = getPlugin('hiddenRows');

      plugin.disablePlugin();
      render();

      expect(countRows()).toBe(5);

      plugin.enablePlugin();
      render();

      expect(countRows()).toBe(5);
      expect(getCell(0, 0).innerText).toBe('A1');
      expect(getCell(1, 0)).toBe(null);
      expect(getCell(2, 0).innerText).toBe('A3');
      expect(getCell(3, 0)).toBe(null);
      expect(getCell(4, 0).innerText).toBe('A5');
    });

    it('should initialize the plugin after setting it up with the "updateSettings" method', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
      });

      const plugin = getPlugin('hiddenRows');

      expect(plugin.enabled).toEqual(false);

      updateSettings({
        hiddenRows: {
          rows: [1, 3],
        },
      });

      expect(plugin.enabled).toEqual(true);
      expect(spec().$container.find('tr').length).toBe(3);
      expect(countRows()).toBe(5);
      expect(getCell(0, 0).innerText).toBe('A1');
      expect(getCell(1, 0)).toBe(null);
      expect(getCell(2, 0).innerText).toBe('A3');
      expect(getCell(3, 0)).toBe(null);
      expect(getCell(4, 0).innerText).toBe('A5');
    });

    it('should update hidden rows with the "updateSettings" method', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenRows: {
          rows: [1, 3],
        },
      });

      expect(countRows()).toBe(5);
      expect(spec().$container.find('tr').length).toBe(3);
      expect(getCell(0, 0).innerText).toBe('A1');
      expect(getCell(1, 0)).toBe(null);
      expect(getCell(2, 0).innerText).toBe('A3');
      expect(getCell(3, 0)).toBe(null);
      expect(getCell(4, 0).innerText).toBe('A5');

      updateSettings({
        hiddenRows: {
          rows: [0, 2, 4],
        },
      });

      expect(countRows()).toBe(5);
      expect(spec().$container.find('tr').length).toBe(2);
      expect(getCell(0, 0)).toBe(null);
      expect(getCell(1, 0).innerText).toBe('A2');
      expect(getCell(2, 0)).toBe(null);
      expect(getCell(3, 0).innerText).toBe('A4');
      expect(getCell(4, 0)).toBe(null);
    });
  });
});
