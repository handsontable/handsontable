import Handsontable from 'handsontable/base';
import { registerPlugin, AutoRowHeaderSize } from 'handsontable/plugins';

registerPlugin(AutoRowHeaderSize);

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

describe('AutoRowHeaderSize', () => {
  describe('enabling', () => {
    it('should stay disabled by default', () => {
      const { hot } = buildGrid();

      expect(hot.getPlugin('autoRowHeaderSize').isEnabled()).toBe(false);

      hot.destroy();
    });

    it('should enable itself when the option is `true`', () => {
      const { hot } = buildGrid({ autoRowHeaderSize: true });

      expect(hot.getPlugin('autoRowHeaderSize').isEnabled()).toBe(true);

      hot.destroy();
    });

    it('should enable itself when the option is a settings object', () => {
      const { hot } = buildGrid({ autoRowHeaderSize: { samplingRatio: 5 } });

      expect(hot.getPlugin('autoRowHeaderSize').isEnabled()).toBe(true);

      hot.destroy();
    });

    it('should stay disabled when the option is `false`', () => {
      const { hot } = buildGrid({ autoRowHeaderSize: false });

      expect(hot.getPlugin('autoRowHeaderSize').isEnabled()).toBe(false);

      hot.destroy();
    });

    it('should not be switched on by `rowHeaderWidth` alone', () => {
      const { hot } = buildGrid({ rowHeaderWidth: 120 });

      expect(hot.getPlugin('autoRowHeaderSize').isEnabled()).toBe(false);

      hot.destroy();
    });
  });

  describe('taking the width over', () => {
    it('should ignore a `rowHeaderWidth` that is already set', () => {
      // The whole point of the single switch: turning the plugin on is enough, and a width left
      // over in the settings does not fight it.
      const { hot } = buildGrid({ autoRowHeaderSize: true, rowHeaderWidth: 400 });

      expect(hot.runHooks('modifyRowHeaderWidth', 400)).not.toBe(400);

      hot.destroy();
    });

    it('should never return less than the default column width', () => {
      // jsdom reports no layout, so the measurement is 0. The floor keeps a grid of short labels
      // looking like it does today instead of collapsing - the same floor AutoColumnSize keeps.
      const { hot } = buildGrid({ autoRowHeaderSize: true });

      expect(hot.runHooks('modifyRowHeaderWidth', 0)).toBe(50);

      hot.destroy();
    });
  });

  describe('scanning for the longest label', () => {
    it('should read every row header, so a long label anywhere is found', () => {
      const { hot, labelSpy } = buildGrid({ autoRowHeaderSize: true });
      const plugin = hot.getPlugin('autoRowHeaderSize');

      plugin.clearCache();
      labelSpy.mockClear();
      plugin.getRowHeaderWidth();

      // Reading a label is cheap; only the few longest ones are laid out. A partial scan would
      // silently miss a long label further down and leave the header too narrow.
      const readRows = labelSpy.mock.calls.map(([index]) => index);

      expect(Math.max(...readRows)).toBe(99);
      expect(new Set(readRows).size).toBe(100);

      hot.destroy();
    });
  });

  describe('caching', () => {
    it('should read the row headers once, then answer from the cache', () => {
      const { hot, labelSpy } = buildGrid({ autoRowHeaderSize: true });
      const plugin = hot.getPlugin('autoRowHeaderSize');

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
      const { hot, labelSpy } = buildGrid({ autoRowHeaderSize: true });
      const plugin = hot.getPlugin('autoRowHeaderSize');

      plugin.getRowHeaderWidth();
      labelSpy.mockClear();

      hot.alter('remove_row', 0);
      plugin.getRowHeaderWidth();

      expect(labelSpy).toHaveBeenCalled();

      hot.destroy();
    });
  });

  describe('the resolved width', () => {
    it('should not depend on the width handed to the hook', () => {
      // The plugin decides this width, so whatever the grid resolved on its own is discarded. Both
      // calls must answer the same thing.
      const { hot } = buildGrid({ autoRowHeaderSize: true });

      expect(hot.runHooks('modifyRowHeaderWidth', 400))
        .toBe(hot.runHooks('modifyRowHeaderWidth', 20));

      hot.destroy();
    });

    it('should tolerate a non-numeric width without producing NaN', () => {
      const { hot } = buildGrid({ autoRowHeaderSize: true });

      expect(hot.runHooks('modifyRowHeaderWidth', undefined)).toBe(50);

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
        autoRowHeaderSize: true,
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
      const plugin = hot.getPlugin('autoRowHeaderSize');

      plugin.clearCache();
      labelSpy.mockClear();
      plugin.getRowHeaderWidth();

      expect(renderedCount(labelSpy as never, 20)).toBe(1);

      hot.destroy();
    });

    it('should measure every copy of a repeated label when duplicates are allowed', () => {
      const { hot, labelSpy } = buildRepeatedLabelGrid({
        autoRowHeaderSize: { allowSampleDuplicates: true },
      });
      const plugin = hot.getPlugin('autoRowHeaderSize');

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
        autoRowHeaderSize: { allowSampleDuplicates: true, samplingRatio: 5 },
      });
      const plugin = hot.getPlugin('autoRowHeaderSize');

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
        autoRowHeaderSize: true,
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
        autoRowHeaderSize: true,
        afterGetRowHeaderRenderers: addSecondLevel,
      });

      hot.getPlugin('autoRowHeaderSize').clearCache();
      labelSpy.mockClear();
      hot.runHooks('modifyRowHeaderWidth', 50);

      expect(labelSpy).not.toHaveBeenCalled();

      hot.destroy();
    });

    it('should still size a single row header, to prove the guard is not too broad', () => {
      const { hot } = buildGrid({ autoRowHeaderSize: true });

      expect(hot.countRowHeaders()).toBe(1);
      expect(hot.runHooks('modifyRowHeaderWidth', 50)).toBe(50);

      hot.destroy();
    });
  });
  describe('index translation', () => {
    it('should read labels through the same translation the renderer uses', () => {
      // `modifyRowHeader` is how bindRowsWithHeaders makes a label follow its row. The plugin has
      // to read through it, exactly as TableView#appendRowHeader does, or it would sample labels
      // from one index space and render them from another.
      // The offset is deliberate: a remap that merely reverses the order would leave the set of
      // indexes unchanged, so the assertion would pass even if the translation were skipped.
      const { hot, labelSpy } = buildGrid({
        autoRowHeaderSize: true,
        modifyRowHeader: (row: number) => row + 1000,
      });
      const plugin = hot.getPlugin('autoRowHeaderSize');

      plugin.clearCache();
      labelSpy.mockClear();
      plugin.getRowHeaderWidth();

      const readIndexes = labelSpy.mock.calls.map(([index]) => index);

      // Visual row 0 must reach the label factory as 1000, not as 0.
      expect(Math.min(...readIndexes)).toBe(1000);
      expect(Math.max(...readIndexes)).toBe(1099);

      hot.destroy();
    });

    it('should not change the measured width when rows are only reordered', () => {
      // Reordering does not change the set of labels, so the width must hold still. A width that
      // moved on every sort would be the flickering-header defect all over again (#3850).
      const { hot } = buildGrid({ autoRowHeaderSize: true });
      const plugin = hot.getPlugin('autoRowHeaderSize');
      const before = plugin.getRowHeaderWidth();

      hot.rowIndexMapper.moveIndexes([0], 5);
      plugin.clearCache();

      expect(plugin.getRowHeaderWidth()).toBe(before);

      hot.destroy();
    });

    it('should stop at the visible row count, so trimmed rows are never sampled', () => {
      const { hot, labelSpy } = buildGrid({ autoRowHeaderSize: true });
      const plugin = hot.getPlugin('autoRowHeaderSize');

      const trimMap = hot.rowIndexMapper.createAndRegisterIndexMap('test-trim', 'trimming', false);

      trimMap.setValueAtIndex(99, true);
      hot.render();

      plugin.clearCache();
      labelSpy.mockClear();
      plugin.getRowHeaderWidth();

      expect(hot.countRows()).toBe(99);
      expect(Math.max(...labelSpy.mock.calls.map(([index]) => index))).toBe(98);

      hot.destroy();
    });
  });
});
