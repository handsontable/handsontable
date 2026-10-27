import Handsontable from 'handsontable';

const LICENSE_KEY = 'non-commercial-and-evaluation';
const TOGETHER_ERROR = 'The `fixedColumnsLeft` and `fixedColumnsStart` should not be used together.';
const RTL_ERROR = 'The `fixedColumnsLeft` is not supported for RTL.';

describe('Core: the `fixedColumnsLeft` alias of `fixedColumnsStart`', () => {
  let container;
  let hot;

  beforeAll(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: () => {} });
  });

  afterAll(() => {
    delete Element.prototype.scrollIntoView;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (hot && !hot.isDestroyed) {
      hot.destroy();
    }

    hot = null;
    container.remove();
  });

  /**
   * Builds a grid with five columns.
   *
   * @param {object} settings The grid settings.
   * @returns {Handsontable} The grid.
   */
  function createGrid(settings) {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(3, 5),
      colHeaders: true,
      licenseKey: LICENSE_KEY,
      ...settings,
    });

    return hot;
  }

  describe('on a plain grid', () => {
    it('applies `fixedColumnsStart` in an update after `fixedColumnsLeft` was set at init', () => {
      createGrid({ fixedColumnsLeft: 2 });

      expect(() => hot.updateSettings({ fixedColumnsStart: 4 })).not.toThrow();
      expect(hot.getSettings().fixedColumnsStart).toBe(4);
      expect(hot.getSettings().fixedColumnsLeft).toBe(4);
    });

    it('applies `fixedColumnsLeft` in an update after `fixedColumnsStart` was set at init', () => {
      createGrid({ fixedColumnsStart: 2 });

      expect(() => hot.updateSettings({ fixedColumnsLeft: 3 })).not.toThrow();
      expect(hot.getSettings().fixedColumnsStart).toBe(3);
      expect(hot.getSettings().fixedColumnsLeft).toBe(3);
    });

    it('applies the two names in separate updates, in either order', () => {
      createGrid({});

      expect(() => {
        hot.updateSettings({ fixedColumnsLeft: 1 });
        hot.updateSettings({ fixedColumnsStart: 2 });
        hot.updateSettings({ fixedColumnsLeft: 3 });
      }).not.toThrow();
      expect(hot.getSettings().fixedColumnsStart).toBe(3);
      expect(hot.getSettings().fixedColumnsLeft).toBe(3);
    });

    it('does not change the payload object the caller passed', () => {
      createGrid({});

      const payload = { fixedColumnsLeft: 2 };

      hot.updateSettings(payload);

      expect(payload).toEqual({ fixedColumnsLeft: 2 });
      expect(hot.getSettings().fixedColumnsStart).toBe(2);
    });

    it('still throws when one update carries both names', () => {
      createGrid({});

      expect(() => hot.updateSettings({ fixedColumnsStart: 4, fixedColumnsLeft: 3 })).toThrowError(TOGETHER_ERROR);
    });

    it('still throws when the constructor gets both names', () => {
      expect(() => createGrid({ fixedColumnsStart: 3, fixedColumnsLeft: 1 })).toThrowError(TOGETHER_ERROR);
    });

    it('still throws for `fixedColumnsLeft` in an RTL grid, at init and in an update', () => {
      expect(() => createGrid({ layoutDirection: 'rtl', fixedColumnsLeft: 1 })).toThrowError(RTL_ERROR);

      if (hot && !hot.isDestroyed) {
        hot.destroy();
      }

      container.remove();
      container = document.createElement('div');
      document.body.appendChild(container);
      createGrid({ layoutDirection: 'rtl', fixedColumnsStart: 1 });

      expect(() => hot.updateSettings({ fixedColumnsLeft: 2 })).toThrowError(RTL_ERROR);
    });

    it('still refuses to update the init-only options the constructor set', () => {
      createGrid({ fixedColumnsLeft: 1, layoutDirection: 'ltr', ariaTags: true });

      expect(() => hot.updateSettings({ layoutDirection: 'rtl' }))
        .toThrowError('The `layoutDirection` option can not be updated after the Handsontable is initialized.');
      expect(() => hot.updateSettings({ ariaTags: false }))
        .toThrowError('The `ariaTags` option can not be updated after the Handsontable is initialized.');
    });
  });

  describe('under the sheets bar', () => {
    /**
     * Builds a workbook of five-column sheets.
     *
     * @param {object} gridSettings Grid-level settings.
     * @param {object[]} sheetSettings The `settings` of each sheet after the first, plain one.
     * @returns {object} The SheetsBar plugin.
     */
    function createWorkbook(gridSettings, sheetSettings) {
      createGrid({
        ...gridSettings,
        data: undefined,
        sheetsBar: {
          sheets: [
            { name: 'Plain', data: Handsontable.helper.createSpreadsheetData(3, 5) },
            ...sheetSettings.map((settings, index) => ({
              name: `S${index + 1}`,
              data: Handsontable.helper.createSpreadsheetData(3, 5),
              settings,
            })),
          ],
        },
      });

      return hot.getPlugin('sheetsBar');
    }

    it('switches between a sheet with `fixedColumnsLeft` and a sheet with `fixedColumnsStart`', () => {
      const plugin = createWorkbook({}, [{ fixedColumnsLeft: 1 }, { fixedColumnsStart: 2 }]);
      const counts = [];

      ['S1', 'S2', 'Plain', 'S2', 'S1', 'Plain'].forEach((name) => {
        plugin.setActiveSheet(name);
        counts.push([name, hot.getSettings().fixedColumnsStart]);
      });

      expect(counts).toEqual([
        ['S1', 1], ['S2', 2], ['Plain', 0], ['S2', 2], ['S1', 1], ['Plain', 0],
      ]);
    });

    it('applies a sheet\'s `fixedColumnsStart` over a grid-level `fixedColumnsLeft`, and back', () => {
      const plugin = createWorkbook({ fixedColumnsLeft: 1 }, [{ fixedColumnsStart: 2 }]);

      plugin.setActiveSheet('S1');

      expect(hot.getSettings().fixedColumnsStart).toBe(2);

      plugin.setActiveSheet('Plain');

      expect(hot.getSettings().fixedColumnsStart).toBe(1);
      expect(hot.getSettings().fixedColumnsLeft).toBe(1);
    });

    it('applies a sheet\'s `fixedColumnsLeft` over a grid-level `fixedColumnsStart`, and back', () => {
      const plugin = createWorkbook({ fixedColumnsStart: 1 }, [{ fixedColumnsLeft: 2 }]);

      plugin.setActiveSheet('S1');

      expect(hot.getSettings().fixedColumnsStart).toBe(2);

      plugin.setActiveSheet('Plain');

      expect(hot.getSettings().fixedColumnsStart).toBe(1);
    });

    it('applies a sheet\'s `fixedColumnsLeft` when the grid sets neither name', () => {
      const plugin = createWorkbook({}, [{ fixedColumnsLeft: 2 }]);

      plugin.setActiveSheet('S1');

      expect(hot.getSettings().fixedColumnsStart).toBe(2);

      plugin.setActiveSheet('Plain');

      expect(hot.getSettings().fixedColumnsStart).toBe(0);
    });

    it('gives the grid-level `fixedColumnsLeft` back when the bar is turned off on a sheet with its own count', () => {
      const plugin = createWorkbook({ fixedColumnsLeft: 1 }, [{ fixedColumnsStart: 3 }]);

      plugin.setActiveSheet('S1');
      hot.updateSettings({ sheetsBar: false });

      expect(hot.getSettings().fixedColumnsStart).toBe(1);
    });
  });

  describe('turning the bar off on a grid that names the start freeze `fixedColumnsLeft`', () => {
    /**
     * Turns the bar off and reports what it left, with the error message it threw, if any.
     *
     * @returns {object}
     */
    function turnOff() {
      let thrown = null;

      try {
        hot.updateSettings({ sheetsBar: false });
      } catch (error) {
        thrown = error.message;
      }

      return {
        thrown,
        enabled: hot.getPlugin('sheetsBar').enabled,
        barInDom: hot.rootWrapperElement.querySelector('.ht-sheets-bar') !== null,
        fixedColumnsStart: hot.getSettings().fixedColumnsStart,
        fixedColumnsLeft: hot.getSettings().fixedColumnsLeft,
      };
    }

    /**
     * Builds a two-sheet workbook of four-column sheets.
     *
     * @param {object} gridSettings Grid-level settings.
     * @param {object} [firstSheetSettings] The first sheet's own settings.
     */
    function createWorkbook(gridSettings, firstSheetSettings) {
      hot = new Handsontable(container, {
        ...gridSettings,
        sheetsBar: {
          sheets: [
            { name: 'A', data: [[1, 2, 3, 4]], settings: firstSheetSettings },
            { name: 'B', data: [[5, 6, 7, 8]] },
          ],
        },
        licenseKey: LICENSE_KEY,
      });
    }

    it('puts the grid-level count back after a runtime freeze', () => {
      createWorkbook({ fixedColumnsLeft: 1, manualColumnFreeze: true });

      hot.getPlugin('manualColumnFreeze').freezeColumn(2);

      expect(hot.getSettings().fixedColumnsStart).toBe(2);
      expect(turnOff()).toEqual({
        thrown: null, enabled: false, barInDom: false, fixedColumnsStart: 1, fixedColumnsLeft: 1,
      });
    });

    it('puts the grid-level count back on a sheet that declares its own `fixedColumnsLeft`', () => {
      createWorkbook({ fixedColumnsLeft: 1, manualColumnFreeze: true }, { fixedColumnsLeft: 2 });

      hot.getPlugin('manualColumnFreeze').freezeColumn(2);

      expect(hot.getSettings().fixedColumnsStart).toBe(3);
      expect(turnOff()).toEqual({
        thrown: null, enabled: false, barInDom: false, fixedColumnsStart: 1, fixedColumnsLeft: 1,
      });
    });

    it('puts the grid-level `fixedColumnsStart` back after a runtime freeze', () => {
      createWorkbook({ fixedColumnsStart: 1, manualColumnFreeze: true });

      hot.getPlugin('manualColumnFreeze').freezeColumn(2);

      expect(turnOff()).toEqual({
        thrown: null, enabled: false, barInDom: false, fixedColumnsStart: 1, fixedColumnsLeft: 1,
      });
    });

    it('puts the count back after the host changed `fixedColumnsLeft` while the bar was on', () => {
      createWorkbook({ fixedColumnsLeft: 1 });

      hot.updateSettings({ fixedColumnsLeft: 3 });

      expect(hot.getSettings().fixedColumnsStart).toBe(3);
      expect(turnOff()).toEqual({
        thrown: null, enabled: false, barInDom: false, fixedColumnsStart: 1, fixedColumnsLeft: 1,
      });
    });
  });
});
