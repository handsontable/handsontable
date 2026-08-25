import Handsontable from 'handsontable/base';
import { registerPlugin, AutoRowHeaderWidth } from 'handsontable/plugins';

registerPlugin(AutoRowHeaderWidth);

/**
 * Builds a grid whose row header labels are produced by a spy, so the test can count how many
 * of them the plugin reads.
 *
 * @param {object} settings Settings merged over the defaults.
 * @returns {object} The instance and the label spy.
 */
function buildGrid(settings: Record<string, unknown> = {}) {
  const labelSpy = jest.fn((index: number) => `Row ${index + 1}`);
  const hot = new Handsontable(document.createElement('div'), {
    data: Array.from({ length: 100 }, (_, i) => [i]),
    rowHeaders: labelSpy,
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });

  return { hot, labelSpy };
}

describe('AutoRowHeaderWidth', () => {
  describe('enabling', () => {
    it('should stay disabled when `rowHeaderWidth` is not set', () => {
      const { hot } = buildGrid();

      expect(hot.getPlugin('autoRowHeaderWidth').isEnabled()).toBe(false);

      hot.destroy();
    });

    it('should stay disabled for a numeric `rowHeaderWidth`', () => {
      const { hot } = buildGrid({ rowHeaderWidth: 120 });

      expect(hot.getPlugin('autoRowHeaderWidth').isEnabled()).toBe(false);

      hot.destroy();
    });

    it('should enable itself when `rowHeaderWidth` is "auto"', () => {
      const { hot } = buildGrid({ rowHeaderWidth: 'auto' });

      expect(hot.getPlugin('autoRowHeaderWidth').isEnabled()).toBe(true);

      hot.destroy();
    });

    it('should stay disabled when the plugin setting turns it off, despite the "auto" keyword', () => {
      const { hot } = buildGrid({ rowHeaderWidth: 'auto', autoRowHeaderWidth: false });

      expect(hot.getPlugin('autoRowHeaderWidth').isEnabled()).toBe(false);

      hot.destroy();
    });

    it('should ignore "auto" inside the array form, which addresses one header level per entry', () => {
      const { hot } = buildGrid({ rowHeaderWidth: ['auto'] });

      expect(hot.getPlugin('autoRowHeaderWidth').isEnabled()).toBe(false);

      hot.destroy();
    });
  });

  describe('scanning for the longest label', () => {
    /**
     * The row indexes the plugin looked at. Assertions are made on these rather than on a call
     * count, because the ghost table re-reads the labels of the rows it renders, so the same row
     * is legitimately read more than once.
     *
     * @param {object} labelSpy The row header label spy.
     * @returns {number[]}
     */
    function readRows(labelSpy: { mock: { calls: number[][] } }) {
      return labelSpy.mock.calls.map(([index]) => index);
    }

    /**
     * Forces one measurement and reports which rows it read.
     *
     * @param {object} settings Settings merged over the defaults.
     * @returns {object}
     */
    function measureAndCollect(settings: Record<string, unknown>) {
      const { hot, labelSpy } = buildGrid({ rowHeaderWidth: 'auto', ...settings });
      const plugin = hot.getPlugin('autoRowHeaderWidth');

      plugin.clearCache();
      labelSpy.mockClear();
      plugin.getRowHeaderWidth();

      const rows = readRows(labelSpy as never);

      hot.destroy();

      return { rows, highest: Math.max(...rows) };
    }

    it('should read every row header when no limit is set', () => {
      const { highest } = measureAndCollect({});

      expect(highest).toBe(99);
    });

    it('should stop reading at a numeric `scanLimit`', () => {
      const { rows, highest } = measureAndCollect({ autoRowHeaderWidth: { scanLimit: 10 } });

      expect(highest).toBe(9);
      expect(rows.some(row => row >= 10)).toBe(false);
    });

    it('should accept `scanLimit` as a percentage of the row count', () => {
      const { highest } = measureAndCollect({ autoRowHeaderWidth: { scanLimit: '25%' } });

      expect(highest).toBe(24);
    });

    it('should fall back to a full scan when `scanLimit` is not a usable number', () => {
      const { highest } = measureAndCollect({ autoRowHeaderWidth: { scanLimit: 'nonsense' } });

      expect(highest).toBe(99);
    });

    it('should never read past the last row when `scanLimit` overshoots it', () => {
      const { rows, highest } = measureAndCollect({ autoRowHeaderWidth: { scanLimit: 5000 } });

      expect(highest).toBe(99);
      expect(rows.some(row => row > 99)).toBe(false);
    });
  });

  describe('caching', () => {
    it('should read the row headers once, then answer from the cache', () => {
      const { hot, labelSpy } = buildGrid({ rowHeaderWidth: 'auto' });
      const plugin = hot.getPlugin('autoRowHeaderWidth');

      plugin.clearCache();
      plugin.getRowHeaderWidth();
      labelSpy.mockClear();

      plugin.getRowHeaderWidth();
      plugin.getRowHeaderWidth();

      // The hook behind this runs on every draw, so a cached read must touch no row headers at all.
      expect(labelSpy).not.toHaveBeenCalled();

      hot.destroy();
    });

    it('should measure again once the row count changes', () => {
      const { hot, labelSpy } = buildGrid({ rowHeaderWidth: 'auto' });
      const plugin = hot.getPlugin('autoRowHeaderWidth');

      plugin.getRowHeaderWidth();
      labelSpy.mockClear();

      hot.alter('remove_row', 0);
      plugin.getRowHeaderWidth();

      expect(labelSpy).toHaveBeenCalled();

      hot.destroy();
    });
  });

  describe('the resolved width', () => {
    it('should never return a width below the one the grid resolved on its own', () => {
      const { hot } = buildGrid({ rowHeaderWidth: 'auto' });

      // jsdom reports no layout, so the measurement is 0 - the incoming width has to win, or a
      // headless environment would collapse the row header to nothing.
      expect(hot.runHooks('modifyRowHeaderWidth', 50)).toBe(50);

      hot.destroy();
    });

    it('should tolerate a non-numeric width without producing NaN', () => {
      const { hot } = buildGrid({ rowHeaderWidth: 'auto' });

      expect(hot.runHooks('modifyRowHeaderWidth', undefined)).toBe(0);

      hot.destroy();
    });
  });
  describe('duplicate labels', () => {
    /**
     * A grid whose rows all carry the same label, so duplicate handling is the only thing that
     * decides how many of them get rendered for measurement.
     *
     * @param {object} settings Settings merged over the defaults.
     * @returns {object}
     */
    function buildRepeatedLabelGrid(settings: Record<string, unknown> = {}) {
      const labelSpy = jest.fn(() => 'Same label');
      const hot = new Handsontable(document.createElement('div'), {
        data: Array.from({ length: 20 }, (_, i) => [i]),
        rowHeaders: labelSpy,
        rowHeaderWidth: 'auto',
        licenseKey: 'non-commercial-and-evaluation',
        ...settings,
      });

      return { hot, labelSpy };
    }

    /**
     * How many row headers the ghost table actually rendered. Reading a label during the scan and
     * rendering it for measurement both hit the spy, so the rendered count is the total minus the
     * rows that were scanned.
     *
     * @param {object} labelSpy The row header label spy.
     * @param {number} scannedRows How many rows the scan read.
     * @returns {number}
     */
    function renderedCount(labelSpy: { mock: { calls: unknown[][] } }, scannedRows: number) {
      return labelSpy.mock.calls.length - scannedRows;
    }

    it('should measure a repeated label once by default', () => {
      const { hot, labelSpy } = buildRepeatedLabelGrid();
      const plugin = hot.getPlugin('autoRowHeaderWidth');

      plugin.clearCache();
      labelSpy.mockClear();
      plugin.getRowHeaderWidth();

      expect(renderedCount(labelSpy as never, 20)).toBe(1);

      hot.destroy();
    });

    it('should measure every copy of a repeated label when duplicates are allowed', () => {
      const { hot, labelSpy } = buildRepeatedLabelGrid({
        autoRowHeaderWidth: { allowSampleDuplicates: true },
      });
      const plugin = hot.getPlugin('autoRowHeaderWidth');

      plugin.clearCache();
      labelSpy.mockClear();
      plugin.getRowHeaderWidth();

      // Capped by samplingRatio, which keeps 3 samples per label length by default. Without the
      // setting this would still be 1 - that difference is the whole point of the option, and it
      // matters when a row header renders the same label at different widths (nestedRows indents
      // by depth).
      expect(renderedCount(labelSpy as never, 20)).toBe(3);

      hot.destroy();
    });

    it('should respect samplingRatio when duplicates are allowed', () => {
      const { hot, labelSpy } = buildRepeatedLabelGrid({
        autoRowHeaderWidth: { allowSampleDuplicates: true, samplingRatio: 5 },
      });
      const plugin = hot.getPlugin('autoRowHeaderWidth');

      plugin.clearCache();
      labelSpy.mockClear();
      plugin.getRowHeaderWidth();

      expect(renderedCount(labelSpy as never, 20)).toBe(5);

      hot.destroy();
    });
  });
  describe('multiple row header levels', () => {
    /**
     * Adds a second row header level, the way the documentation and the existing specs do it.
     *
     * @param {Array} renderers The row header renderers collected so far.
     * @returns {Array}
     */
    function addSecondLevel(renderers: Array<(index: number, TH: HTMLElement) => void>) {
      renderers.push((index: number, TH: HTMLElement) => {
        TH.textContent = `L2-${index}`;
      });

      return renderers;
    }

    it('should leave the width alone when the grid renders more than one row header', () => {
      const { hot } = buildGrid({
        rowHeaderWidth: 'auto',
        afterGetRowHeaderRenderers: addSecondLevel,
      });

      // Returning the incoming width untouched is what keeps the levels consistent. Answering with
      // a single measured number would set EVERY level to it, so the rendered header would be
      // `levels x width` while the viewport still expected one width - the columns then draw in the
      // wrong place.
      expect(hot.countRowHeaders()).toBe(2);
      expect(hot.runHooks('modifyRowHeaderWidth', 50)).toBe(50);

      hot.destroy();
    });

    it('should never measure anything when there is more than one row header', () => {
      const { hot, labelSpy } = buildGrid({
        rowHeaderWidth: 'auto',
        afterGetRowHeaderRenderers: addSecondLevel,
      });

      hot.getPlugin('autoRowHeaderWidth').clearCache();
      labelSpy.mockClear();
      hot.runHooks('modifyRowHeaderWidth', 50);

      expect(labelSpy).not.toHaveBeenCalled();

      hot.destroy();
    });

    it('should still size a single row header, to prove the guard is not too broad', () => {
      const { hot } = buildGrid({ rowHeaderWidth: 'auto' });

      expect(hot.countRowHeaders()).toBe(1);
      expect(hot.runHooks('modifyRowHeaderWidth', 50)).toBe(50);

      hot.destroy();
    });
  });
});
