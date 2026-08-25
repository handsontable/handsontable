import type { CellRange } from '@hfe/core';
import { HandsontableAdapter } from '../handsontableAdapter';
import { makeAdapterOptions, makeHotStub, makePluginStub } from './helpers/stubs';
import type { CustomSelectionStub } from './helpers/stubs';

/**
 * Builds a cell range in HyperFormula coordinates.
 *
 * @param {number} startRow The start row index.
 * @param {number} startCol The start column index.
 * @param {number} endRow The end row index.
 * @param {number} endCol The end column index.
 * @returns {CellRange}
 */
function range(startRow: number, startCol: number, endRow: number, endCol: number): CellRange {
  return {
    start: { sheet: '', row: startRow, col: startCol },
    end: { sheet: '', row: endRow, col: endCol },
  };
}

/**
 * Builds an adapter over a stub grid and returns it with the highlight stub.
 *
 * @param {object} [options] Optional per-test overrides.
 * @param {object} [options.mapping] Index-mapping overrides.
 * @param {object} [options.settings] Grid settings the stub reports.
 * @returns {{ adapter: HandsontableAdapter, hot: object, overlayHost: HTMLElement }}
 */
function makeAdapter(options: {
  mapping?: Parameters<typeof makeAdapterOptions>[2];
  settings?: Record<string, unknown>;
} = {}) {
  const hot = makeHotStub({
    getSettings: () => options.settings ?? {},
  });
  const overlayHost = document.createElement('div');

  document.body.appendChild(overlayHost);
  const adapter = new HandsontableAdapter(
    makeAdapterOptions(hot, overlayHost, options.mapping),
    makePluginStub(),
  );

  return { adapter, hot, overlayHost };
}

/**
 * Returns the custom selections currently registered on the stub grid.
 *
 * @param {object} hot The stub grid.
 * @returns {CustomSelectionStub[]}
 */
function customSelectionsOf(hot: ReturnType<typeof makeHotStub>): CustomSelectionStub[] {
  return (hot as unknown as {
    selection: { highlight: { customSelections: CustomSelectionStub[] } };
  }).selection.highlight.customSelections;
}

describe('HandsontableAdapter custom-selection highlights', () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.head.querySelector('[data-hot-formula-ref-fills]')?.remove();
  });

  it('registers one custom selection per highlight, frozen panes included', () => {
    const { adapter, hot } = makeAdapter({
      settings: { fixedRowsTop: 2, fixedColumnsStart: 2 },
    });

    adapter.setHighlights([{ range: range(0, 0, 10, 10), color: 'red' }]);

    const selections = customSelectionsOf(hot);

    expect(selections).toHaveLength(1);
    expect(selections[0].visualCellRange).toEqual({
      highlight: { row: 0, col: 0 },
      from: { row: 0, col: 0 },
      to: { row: 10, col: 10 },
    });

    adapter.destroy();
  });

  it('passes the highlight color and a corner-less border to the selection', () => {
    const { adapter, hot } = makeAdapter();

    adapter.setHighlights([{ range: range(1, 1, 2, 2), color: 'var(--hfe-ref-3)' }]);

    const { settings } = customSelectionsOf(hot)[0];
    const border = settings.border as { width: number; color: string; cornerVisible: boolean };

    expect(border.color).toBe('var(--hfe-ref-3)');
    expect(border.cornerVisible).toBe(false);
    expect(typeof border.width).toBe('number');

    adapter.destroy();
  });

  it('splits a range fragmented in visual space into one selection per run', () => {
    // HF columns 0..3 map to visual 0,1,5,6 - two contiguous runs.
    const visualByHf: Record<number, number> = { 0: 0, 1: 1, 2: 5, 3: 6 };
    const { adapter, hot } = makeAdapter({
      mapping: { hfToVisualCol: hfCol => visualByHf[hfCol] ?? -1 },
    });

    adapter.setHighlights([{ range: range(0, 0, 0, 3), color: 'red' }]);

    const selections = customSelectionsOf(hot);

    expect(selections).toHaveLength(2);
    expect(selections.map(selection => selection.visualCellRange)).toEqual([
      { highlight: { row: 0, col: 0 }, from: { row: 0, col: 0 }, to: { row: 0, col: 1 } },
      { highlight: { row: 0, col: 5 }, from: { row: 0, col: 5 }, to: { row: 0, col: 6 } },
    ]);

    adapter.destroy();
  });

  it('gives filled highlights a fill class and border-only ones a line class', () => {
    const { adapter, hot } = makeAdapter();

    adapter.setHighlights([
      { range: range(0, 0, 0, 0), color: 'red', fill: true },
      { range: range(1, 1, 1, 1), color: 'blue' },
    ]);

    const [filled, borderOnly] = customSelectionsOf(hot);

    expect(filled.settings.className).toMatch(/^ht-formula-ref-fill-\d+$/);
    expect(borderOnly.settings.className).toMatch(/^ht-formula-ref-line-\d+$/);

    const rules = document.head.querySelector('[data-hot-formula-ref-fills]')?.textContent ?? '';

    // The fill class paints the tint as a background image (layered over row
    // striping); both classes mask the border strips into dashes.
    expect(rules).toContain(`td.${filled.settings.className as string}{background-image:`);
    expect(rules).toContain(`.wtBorder.${filled.settings.className as string}`);
    expect(rules).toContain(`.wtBorder.${borderOnly.settings.className as string}`);
    expect(rules).not.toContain(`td.${borderOnly.settings.className as string}`);

    adapter.destroy();
  });

  it('reuses the generated fill class for a repeated color', () => {
    const { adapter, hot } = makeAdapter();

    adapter.setHighlights([
      { range: range(0, 0, 0, 0), color: 'red', fill: true },
      { range: range(1, 1, 1, 1), color: 'red', fill: true },
    ]);

    const selections = customSelectionsOf(hot);

    expect(selections[0].settings.className).toBe(selections[1].settings.className);

    adapter.destroy();
  });

  it('replaces the persistent selections on a changed set and destroys the old ones', () => {
    const { adapter, hot } = makeAdapter();

    adapter.setHighlights([{ range: range(0, 0, 0, 0), color: 'red' }]);

    const [first] = customSelectionsOf(hot);

    adapter.setHighlights([{ range: range(1, 1, 1, 1), color: 'red' }]);

    expect(first.destroy).toHaveBeenCalled();
    expect(customSelectionsOf(hot)).toHaveLength(1);
    expect(customSelectionsOf(hot)[0]).not.toBe(first);

    adapter.destroy();
  });

  it('renders the ephemeral highlight separately and clears it alone', () => {
    const { adapter, hot } = makeAdapter();

    adapter.setHighlights([{ range: range(0, 0, 0, 0), color: 'red' }]);
    adapter.highlightRange(range(2, 2, 3, 3), 'blue');

    expect(customSelectionsOf(hot)).toHaveLength(2);

    adapter.clearEphemeralHighlight();

    const selections = customSelectionsOf(hot);

    expect(selections).toHaveLength(1);
    expect((selections[0].settings.border as { color: string }).color).toBe('red');

    adapter.destroy();
  });

  it('gives the ephemeral highlight a fill class by default', () => {
    const { adapter, hot } = makeAdapter();

    adapter.highlightRange(range(2, 2, 3, 3), 'blue');

    expect(typeof customSelectionsOf(hot)[0].settings.className).toBe('string');

    adapter.destroy();
  });

  it('leaves foreign custom selections untouched on clear and destroy', () => {
    const { adapter, hot } = makeAdapter();
    const highlight = (hot as unknown as {
      selection: {
        highlight: {
          addCustomSelection: (config: Record<string, unknown>) => void;
          customSelections: CustomSelectionStub[];
        };
      };
    }).selection.highlight;

    highlight.addCustomSelection({ border: { width: 1, color: 'green' } });

    const [foreign] = highlight.customSelections;

    adapter.setHighlights([{ range: range(0, 0, 0, 0), color: 'red' }]);
    adapter.clearHighlights();

    expect(highlight.customSelections).toEqual([foreign]);
    expect(foreign.destroy).not.toHaveBeenCalled();

    adapter.destroy();

    expect(highlight.customSelections).toEqual([foreign]);
  });

  it('destroy removes every owned selection and the generated style element', () => {
    const { adapter, hot } = makeAdapter();

    adapter.setHighlights([{ range: range(0, 0, 0, 0), color: 'red', fill: true }]);
    adapter.highlightRange(range(2, 2, 3, 3), 'blue');

    expect(document.head.querySelector('[data-hot-formula-ref-fills]')).not.toBeNull();

    adapter.destroy();

    expect(customSelectionsOf(hot)).toHaveLength(0);
    expect(document.head.querySelector('[data-hot-formula-ref-fills]')).toBeNull();
  });

  it('drops highlights whose ranges cannot be mapped to visual space', () => {
    const { adapter, hot } = makeAdapter({
      mapping: { hfToVisualRow: () => -1 },
    });

    adapter.setHighlights([{ range: range(0, 0, 1, 1), color: 'red' }]);

    expect(customSelectionsOf(hot)).toHaveLength(0);

    adapter.destroy();
  });
});
