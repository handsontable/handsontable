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
     * Adds a second row header level, the way the documentation and the existing specs do it. Its
     * labels are deliberately much shorter than the first level's.
     *
     * @param {Array} renderers The row header renderers collected so far.
     * @returns {Array}
     */
    function addSecondLevel(renderers: Array<(index: number, TH: HTMLElement) => void>) {
      renderers.push((index: number, TH: HTMLElement) => {
        TH.textContent = `${index}`;
      });

      return renderers;
    }

    it('should measure every row header level, not just the first', () => {
      const { hot } = buildGrid({
        autoRowHeaderSize: true,
        afterGetRowHeaderRenderers: addSecondLevel,
      });
      const plugin = hot.getPlugin('autoRowHeaderSize');

      expect(hot.countRowHeaders()).toBe(2);
      expect(plugin.getRowHeaderWidths().length).toBe(2);

      hot.destroy();
    });

    it('should answer the hook with one width per level, so each level is sized on its own', () => {
      const { hot } = buildGrid({
        autoRowHeaderSize: true,
        afterGetRowHeaderRenderers: addSecondLevel,
      });

      // An array is what lets ColumnUtils give each level its own width. A single number would be
      // applied to EVERY level, making the rendered header wider than the layout expects.
      const answer = hot.runHooks('modifyRowHeaderWidth', 50);

      expect(Array.isArray(answer)).toBe(true);
      expect(answer.length).toBe(2);

      hot.destroy();
    });

    it('should answer with a plain number when there is only one level', () => {
      const { hot } = buildGrid({ autoRowHeaderSize: true });

      expect(hot.runHooks('modifyRowHeaderWidth', 50)).toBe(50);

      hot.destroy();
    });

    it('should keep every level at or above the default column width', () => {
      const { hot } = buildGrid({
        autoRowHeaderSize: true,
        afterGetRowHeaderRenderers: addSecondLevel,
      });

      const answer = hot.runHooks('modifyRowHeaderWidth', 50) as number[];

      answer.forEach((levelWidth) => {
        expect(levelWidth).toBeGreaterThanOrEqual(50);
      });

      hot.destroy();
    });

    it('should read a level by its negative column index too, since row headers sit at -1 and down', () => {
      const { hot } = buildGrid({
        autoRowHeaderSize: true,
        afterGetRowHeaderRenderers: addSecondLevel,
      });
      const plugin = hot.getPlugin('autoRowHeaderSize');

      expect(plugin.getRowHeaderWidth(-1)).toBe(plugin.getRowHeaderWidth(0));
      expect(plugin.getRowHeaderWidth(-2)).toBe(plugin.getRowHeaderWidth(1));

      hot.destroy();
    });

    it('should report 0 for a level the grid does not render', () => {
      const { hot } = buildGrid({ autoRowHeaderSize: true });
      const plugin = hot.getPlugin('autoRowHeaderSize');

      expect(plugin.getRowHeaderWidth(5)).toBe(0);

      hot.destroy();
    });

    it('should render each level with its own renderer, not the first level\'s markup', () => {
      const rendered: string[] = [];
      const { hot } = buildGrid({
        autoRowHeaderSize: true,
        afterGetRowHeaderRenderers: (renderers: Array<(index: number, TH: HTMLElement) => void>) => {
          renderers.push((index: number, TH: HTMLElement) => {
            rendered.push(`L2-${index}`);
            TH.textContent = `L2-${index}`;
          });

          return renderers;
        },
      });

      hot.getPlugin('autoRowHeaderSize').clearCache();
      rendered.length = 0;
      hot.getPlugin('autoRowHeaderSize').getRowHeaderWidths();

      // The second level's own renderer has to run during the measurement, or its width would be
      // guessed from the first level's labels.
      expect(rendered.length).toBeGreaterThan(0);

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
  describe('per-level sampling', () => {
    /**
     * Builds a grid whose FIRST row header is the default numbering, and whose SECOND one carries a
     * much longer label on a row the first one's sampling would never pick.
     *
     * @returns {object} The instance, plus the rows the ghost table really measured for level two.
     */
    function buildUnevenLevels() {
      const measuredRows: number[] = [];
      const hot = new Handsontable(document.createElement('div'), {
        data: Array.from({ length: 100 }, (_, i) => [i]),
        // Level one reads "1".."100", so bucketing by label length picks only rows near 0, 9 and 99.
        rowHeaders: true,
        autoRowHeaderSize: true,
        licenseKey: 'non-commercial-and-evaluation',
        afterGetRowHeaderRenderers: (renderers: Array<(row: number, TH: HTMLElement) => void>) => {
          renderers.push((renderableRow: number, TH: HTMLElement) => {
            // Only the ghost table stamps this attribute, so this counts real measurements and not
            // the cheap label read that chooses the samples.
            if (TH.getAttribute('ghost-table') === '1') {
              measuredRows.push(renderableRow);
            }

            TH.textContent = renderableRow === 50
              ? 'A considerably longer second level label'
              : `L${renderableRow}`;
          });

          return renderers;
        },
      });

      return { hot, measuredRows };
    }

    it('should measure the row carrying a level\'s own longest label', () => {
      const { hot, measuredRows } = buildUnevenLevels();
      const plugin = hot.getPlugin('autoRowHeaderSize');

      plugin.clearCache();
      measuredRows.length = 0;
      plugin.getRowHeaderWidths();

      // Sampling by the FIRST header's labels never picks row 50, so the second header would be
      // measured without its widest label and would come out too narrow.
      expect(measuredRows).toContain(50);

      hot.destroy();
    });
  });
  describe('hidden rows', () => {
    /**
     * Builds a grid where only one row carries a long label, and registers a hiding map so that row
     * can be hidden and shown without changing the visual row count.
     *
     * @returns {object}
     */
    function buildWithHidableLongLabel() {
      const labels = Array.from({ length: 20 }, (_, i) => (i === 5 ? 'A very long row label here' : `R${i}`));
      const hot = new Handsontable(document.createElement('div'), {
        data: Array.from({ length: 20 }, (_, i) => [i]),
        rowHeaders: labels,
        autoRowHeaderSize: true,
        licenseKey: 'non-commercial-and-evaluation',
      });
      const hidingMap = hot.rowIndexMapper.createAndRegisterIndexMap('test-hide', 'hiding', false);

      return { hot, hidingMap };
    }

    it('should measure again after a row is shown, even though the row count did not change', () => {
      const { hot, hidingMap } = buildWithHidableLongLabel();
      const plugin = hot.getPlugin('autoRowHeaderSize');

      hidingMap.setValueAtIndex(5, true);
      hot.render();
      plugin.clearCache();

      const readsWhileHidden: number[] = [];
      const original = hot.getRowHeader;

      // Hiding does not change countRows(), so the cache key alone would never notice the change.
      hot.getRowHeader = ((row: number) => {
        readsWhileHidden.push(row);

        return original.call(hot, row);
      }) as typeof hot.getRowHeader;

      plugin.getRowHeaderWidths();

      expect(readsWhileHidden).not.toContain(5);

      hidingMap.setValueAtIndex(5, false);
      hot.render();

      readsWhileHidden.length = 0;
      plugin.getRowHeaderWidths();

      // The long label is visible again, so it has to be measured again.
      expect(readsWhileHidden).toContain(5);

      hot.getRowHeader = original;
      hot.destroy();
    });
  });
  describe('splitting the work up', () => {
    /**
     * Builds a grid bigger than the sync limit under test, with one long label near the end so a
     * partial scan is detectable.
     *
     * @param {object} settings Settings merged over the defaults.
     * @returns {object} The instance and the label spy.
     */
    function buildBigGrid(settings: Record<string, unknown> = {}) {
      const labelSpy = jest.fn((index: number) => (
        index === 1200 ? 'A considerably longer row label' : `Row ${index + 1}`
      ));
      const hot = new Handsontable(document.createElement('div'), {
        data: Array.from({ length: 1500 }, (_, i) => [i]),
        rowHeaders: labelSpy,
        licenseKey: 'non-commercial-and-evaluation',
        ...settings,
      });

      return { hot, labelSpy };
    }

    /**
     * Runs animation frames until `isDone` holds, or gives up.
     *
     * `requestIdleTask` falls back to an animation frame when `requestIdleCallback` is missing,
     * which is the case in this environment - so the frames are what has to be awaited. The
     * condition is always something the sweep DID, never a field on the plugin: how far it has got
     * is its own business.
     *
     * @param {Function} isDone Whether there is nothing left to wait for.
     * @param {number} [maxFrames=100] How many frames to give it.
     */
    async function drainFrames(isDone: () => boolean, maxFrames = 100) {
      for (let frame = 0; frame < maxFrames && !isDone(); frame++) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
      }
    }

    it('should read only up to the sync limit before the first width is reported', () => {
      const { hot, labelSpy } = buildBigGrid({ autoRowHeaderSize: { syncLimit: 100 } });
      const plugin = hot.getPlugin('autoRowHeaderSize');

      plugin.clearCache();
      labelSpy.mockClear();
      plugin.getRowHeaderWidth();

      const readRows = labelSpy.mock.calls.map(([index]) => index);

      // A grid this size must not be swept in one go: that is the freeze this limit exists to stop.
      expect(Math.max(...readRows)).toBe(100);
      // Row 1200 carries the longest label, so a one-pass scan would have read it already.
      expect(readRows).not.toContain(1200);

      hot.destroy();
    });

    it('should keep reading the rest of the rows in the background', async() => {
      const { hot, labelSpy } = buildBigGrid({ autoRowHeaderSize: { syncLimit: 100 } });
      const plugin = hot.getPlugin('autoRowHeaderSize');

      plugin.clearCache();
      labelSpy.mockClear();
      plugin.getRowHeaderWidth();

      const readRows = () => new Set(labelSpy.mock.calls.map(([index]) => index));

      await drainFrames(() => readRows().size >= 1500);

      // The long label sits at row 1200, well past the sync limit. If the sweep stopped early the
      // header would stay too narrow forever.
      expect(readRows().has(1200)).toBe(true);
      expect(readRows().size).toBe(1500);

      hot.destroy();
    });

    it('should read everything up front when the grid is smaller than the sync limit', async() => {
      const { hot, labelSpy } = buildGrid({ autoRowHeaderSize: true });
      const plugin = hot.getPlugin('autoRowHeaderSize');

      plugin.clearCache();
      labelSpy.mockClear();
      plugin.getRowHeaderWidth();

      // 100 rows against a 500-row default limit: nothing is left for the idle sweep.
      expect(new Set(labelSpy.mock.calls.map(([index]) => index)).size).toBe(100);

      const readsUpFront = labelSpy.mock.calls.length;

      await drainFrames(() => false, 5);

      // Nothing was queued, so waiting changes nothing. A flag would say the same, but this holds
      // even if the sweep were left scheduled with no rows to read.
      expect(labelSpy.mock.calls.length).toBe(readsUpFront);

      hot.destroy();
    });

    it('should accept a percent sync limit, like AutoColumnSize does', () => {
      const { hot } = buildBigGrid({ autoRowHeaderSize: { syncLimit: '10%' } });

      // 10% of the 1499 rows the limit is measured against.
      expect(hot.getPlugin('autoRowHeaderSize').getSyncCalculationLimit()).toBe(149);

      hot.destroy();
    });

    it('should keep the default sync limit when the settings object does not mention it', () => {
      const { hot } = buildBigGrid({ autoRowHeaderSize: { samplingRatio: 5 } });

      // A missing `syncLimit` must not read as zero, or an object config would lose its first paint.
      expect(hot.getPlugin('autoRowHeaderSize').getSyncCalculationLimit()).toBe(500);

      hot.destroy();
    });

    it('should stop the sweep when the plugin is destroyed mid-way', async() => {
      const { hot, labelSpy } = buildBigGrid({ autoRowHeaderSize: { syncLimit: 100 } });
      const plugin = hot.getPlugin('autoRowHeaderSize');

      plugin.getRowHeaderWidth();

      // Still work outstanding: the longest label is past the sync limit and has not been read.
      expect(labelSpy.mock.calls.map(([index]) => index)).not.toContain(1200);

      hot.destroy();
      labelSpy.mockClear();

      // A chunk queued before the grid went away must not run against the dead instance. Waiting a
      // few frames is what would let it, if it were still scheduled.
      for (let frame = 0; frame < 3; frame++) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
      }

      expect(labelSpy).not.toHaveBeenCalled();
    });

    it('should reuse one cell to read the labels of a level added through the hook', () => {
      const createSpy = jest.spyOn(document, 'createElement');
      const { hot } = buildGrid({
        autoRowHeaderSize: true,
        afterGetRowHeaderRenderers: (renderers: Array<(row: number, TH: HTMLElement) => void>) => {
          renderers.push((row: number, TH: HTMLElement) => {
            TH.textContent = `Second level ${row}`;
          });

          return renderers;
        },
      });
      const plugin = hot.getPlugin('autoRowHeaderSize');

      plugin.clearCache();
      createSpy.mockClear();
      plugin.getRowHeaderWidths();

      const cellsCreated = createSpy.mock.calls.filter(([tag]) => tag === 'th').length;

      // Reading a level added through the hook used to build a cell per row, which was the single
      // biggest cost of the scan. Only the sampled cells should be built now.
      expect(cellsCreated).toBeLessThan(20);

      createSpy.mockRestore();
      hot.destroy();
    });
  });

  describe('editing cells', () => {
    /**
     * Runs the queued measurement of changed rows.
     *
     * `requestIdleTask` falls back to an animation frame when `requestIdleCallback` is missing,
     * which is the case in this environment - so the frames are what has to be awaited.
     */
    async function flushPending() {
      for (let frame = 0; frame < 5; frame++) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
      }
    }

    it('should not measure inside the edit itself', () => {
      const { hot, labelSpy } = buildGrid({ autoRowHeaderSize: true });
      const plugin = hot.getPlugin('autoRowHeaderSize');

      plugin.getRowHeaderWidth();
      labelSpy.mockClear();

      hot.setDataAtCell(5, 0, 'edited');

      // Measuring in the hook is the trap: a draw is either under way or about to be, and a ghost
      // table measured at that moment comes back too small - so a header that should have grown
      // silently stayed as it was. The reads have to wait for the queued task.
      expect(labelSpy.mock.calls.map(([index]) => index)).not.toContain(5);

      hot.destroy();
    });

    it('should read only the rows that changed, not the whole grid', async() => {
      const { hot, labelSpy } = buildGrid({ autoRowHeaderSize: true });
      const plugin = hot.getPlugin('autoRowHeaderSize');

      plugin.getRowHeaderWidth();
      labelSpy.mockClear();

      hot.setDataAtCell(5, 0, 'edited');
      await flushPending();

      const readRows = new Set(labelSpy.mock.calls.map(([index]) => index));

      // A cell edit used to throw the whole cache away, so every row header was read again. On a
      // large grid that turned each edit into a freeze.
      expect(readRows.has(5)).toBe(true);
      expect(readRows.size).toBeLessThan(50);

      hot.destroy();
    });

    it('should collect a burst of edits into one measurement', async() => {
      const { hot, labelSpy } = buildGrid({ autoRowHeaderSize: true });
      const plugin = hot.getPlugin('autoRowHeaderSize');

      plugin.getRowHeaderWidth();
      labelSpy.mockClear();

      // The same row twice, plus two others - what a paste looks like.
      hot.runHooks('afterSetDataAtCell', [[3, 0, 'a', 'b'], [3, 0, 'b', 'c'], [4, 0, 'a', 'b']]);
      hot.runHooks('afterSetDataAtCell', [[7, 0, 'a', 'b']]);
      await flushPending();

      const readRows = [...new Set(labelSpy.mock.calls.map(([index]) => index))].sort((a, b) => a - b);

      // Every changed row is measured once, and only the changed ones.
      expect(readRows).toEqual([3, 4, 7]);

      hot.destroy();
    });

    it('should measure the row whose label is built from the cell that changed', async() => {
      const data = [['ID-1'], ['ID-2'], ['ID-3']];
      const hot = new Handsontable(document.createElement('div'), {
        data,
        // The label comes from the data, so editing the cell does change the header.
        rowHeaders: (visualRow: number) => (data[visualRow] ? data[visualRow][0] : ''),
        autoRowHeaderSize: true,
        licenseKey: 'non-commercial-and-evaluation',
      });
      const plugin = hot.getPlugin('autoRowHeaderSize');

      plugin.getRowHeaderWidth();

      const readRows: number[] = [];
      const originalGetRowHeader = hot.getRowHeader;

      hot.getRowHeader = ((row: number) => {
        readRows.push(row);

        return originalGetRowHeader.call(hot, row);
      }) as typeof hot.getRowHeader;

      hot.setDataAtCell(1, 0, 'ID-2-with-a-considerably-longer-value');
      await flushPending();

      // The changed row has to be looked at, or a data-derived header would keep clipping. That the
      // header really grows on screen is asserted in tests/e2e/auto-row-header-size.spec.ts - jsdom
      // reports every width as zero, so it cannot see it here.
      expect(readRows).toContain(1);

      hot.getRowHeader = originalGetRowHeader;
      hot.destroy();
    });

    it('should fall back to a full sweep when more rows change than the sync limit', async() => {
      const { hot, labelSpy } = buildGrid({
        data: Array.from({ length: 1200 }, (_, i) => [i]),
        // measured in one go, so the fallback is not just the "sweep already running" branch
        autoRowHeaderSize: { syncLimit: 2000 },
      });
      const plugin = hot.getPlugin('autoRowHeaderSize');

      plugin.getRowHeaderWidth();
      labelSpy.mockClear();

      // 600 rows against a 500-row limit: reading them one by one costs more than sweeping, and a
      // sweep also lets the headers shrink again.
      hot.runHooks('afterSetDataAtCell', Array.from({ length: 600 }, (_, i) => [i, 0, 'a', 'b']));
      plugin.getRowHeaderWidth();
      await flushPending();

      // Row 1100 was not in the batch, so reading it can only mean the whole grid was swept.
      expect(labelSpy.mock.calls.map(([index]) => index)).toContain(1100);

      hot.destroy();
    });

    it('should measure only the changed rows when a wide paste hits few of them', async() => {
      const { hot, labelSpy } = buildGrid({ autoRowHeaderSize: true });
      const plugin = hot.getPlugin('autoRowHeaderSize');

      plugin.getRowHeaderWidth();
      labelSpy.mockClear();

      // 600 changes, but only three rows - a paste three rows tall and two hundred columns wide.
      // Counting the changes rather than the rows sent this down the full-sweep path, which threw
      // away a cache that only three rows could have affected.
      const wide = Array.from({ length: 600 }, (_, i) => [i % 3, i, 'a', 'b']);

      hot.runHooks('afterSetDataAtCell', wide);
      await flushPending();

      const readRows = [...new Set(labelSpy.mock.calls.map(([index]) => index))].sort((a, b) => a - b);

      expect(readRows).toEqual([0, 1, 2]);

      hot.destroy();
    });
  });
});
