import type { CellRange } from 'hyperformula-ui';
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
    document.body.querySelector('[data-hot-formula-ref-fills]')?.remove();
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

  it('drops a highlight whose color opens a CSS comment, and keeps a slash or an asterisk alone', () => {
    const { adapter, hot } = makeAdapter();

    // The browser's `CSS.supports('color', 'red /* x')` answers `true`: it drops the comment first.
    adapter.setHighlights([{ range: range(0, 0, 0, 0), color: 'red /* x', fill: true }]);

    expect(customSelectionsOf(hot)).toHaveLength(0);

    adapter.setHighlights([
      { range: range(0, 0, 0, 0), color: 'hsl(210 80% 55% / 0.9)' },
      { range: range(1, 1, 1, 1), color: 'rgb(calc(255 * 0.5) 0 0)' },
    ]);

    expect(customSelectionsOf(hot)).toHaveLength(2);

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

    expect(filled.settings.className).toMatch(/^ht-formula-ref-fill-ht_teststub-\d+$/);
    expect(borderOnly.settings.className).toMatch(/^ht-formula-ref-line-ht_teststub-\d+$/);

    const styleEl = document.body.querySelector('[data-hot-formula-ref-fills]');
    const rules = styleEl instanceof HTMLStyleElement && styleEl.sheet ?
      [...styleEl.sheet.cssRules].map(rule => rule.cssText).join('') : '';

    // The fill class paints the tint as a background image (layered over row
    // striping); both classes mask the border strips into dashes.
    expect(rules).toContain(`td.${filled.settings.className as string} {background-image:`);
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

    adapter.setHighlights([{ range: range(1, 1, 1, 1), color: 'blue' }]);

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

    // In the grid's wrapper, never the document head, which a grid in a shadow root does not read.
    expect(hot.rootWrapperElement.querySelector('[data-hot-formula-ref-fills]')).not.toBeNull();
    expect(document.head.querySelector('[data-hot-formula-ref-fills]')).toBeNull();

    adapter.destroy();

    expect(customSelectionsOf(hot)).toHaveLength(0);
    expect(document.body.querySelector('[data-hot-formula-ref-fills]')).toBeNull();
  });

  it('keeps the generated rules when the grid is detached and attached again', () => {
    const { adapter, hot } = makeAdapter();

    adapter.setHighlights([{ range: range(0, 0, 0, 0), color: 'red', fill: true }]);

    const [filled] = customSelectionsOf(hot);
    const styleEl = hot.rootWrapperElement.querySelector('[data-hot-formula-ref-fills]');
    const parent = hot.rootWrapperElement.parentElement as HTMLElement;

    // A framework that moves the grid between tabs or portals takes it out of the document.
    hot.rootWrapperElement.remove();
    parent.appendChild(hot.rootWrapperElement);

    const rules = styleEl instanceof HTMLStyleElement && styleEl.sheet ?
      [...styleEl.sheet.cssRules].map(rule => rule.cssText).join('') : '';

    expect(rules).toContain(`td.${filled.settings.className as string} {background-image:`);
    expect(rules).toContain(`.wtBorder.${filled.settings.className as string}`);

    adapter.destroy();
  });

  it('scopes generated class names per grid instance', () => {
    const hotA = makeHotStub();
    const hotB = makeHotStub({ guid: 'ht_other' } as Parameters<typeof makeHotStub>[0]);
    const hostA = document.createElement('div');
    const hostB = document.createElement('div');

    document.body.append(hostA, hostB);

    const adapterA = new HandsontableAdapter(makeAdapterOptions(hotA, hostA), makePluginStub());
    const adapterB = new HandsontableAdapter(makeAdapterOptions(hotB, hostB), makePluginStub());

    adapterA.setHighlights([{ range: range(0, 0, 0, 0), color: 'red', fill: true }]);
    adapterB.setHighlights([{ range: range(0, 0, 0, 0), color: 'blue', fill: true }]);

    const classA = customSelectionsOf(hotA)[0].settings.className;
    const classB = customSelectionsOf(hotB)[0].settings.className;

    expect(classA).not.toBe(classB);

    adapterA.destroy();
    adapterB.destroy();
  });

  it('keeps the ephemeral selection after re-registered persistent ones', () => {
    const { adapter, hot } = makeAdapter();

    adapter.highlightRange(range(2, 2, 3, 3), 'blue');
    adapter.setHighlights([{ range: range(0, 0, 0, 0), color: 'red' }]);

    const selections = customSelectionsOf(hot);

    expect(selections).toHaveLength(2);
    expect((selections[selections.length - 1].settings.border as { color: string }).color)
      .toBe('blue');

    adapter.destroy();
  });

  it('updates ranges in place when only coordinates changed', () => {
    const { adapter, hot } = makeAdapter();

    adapter.setHighlights([{ range: range(0, 0, 0, 0), color: 'red' }]);

    const [first] = customSelectionsOf(hot);

    adapter.setHighlights([{ range: range(0, 0, 2, 2), color: 'red' }]);

    const selections = customSelectionsOf(hot);

    expect(selections).toHaveLength(1);
    expect(selections[0]).toBe(first);
    expect(first.destroy).not.toHaveBeenCalled();
    expect((first.visualCellRange as { to: { row: number } }).to.row).toBe(2);

    adapter.destroy();
  });

  it('skips spec derivation entirely for an unchanged highlight set', () => {
    const createRange = jest.fn(
      (highlight: { row: number; col: number }) => ({ highlight, from: highlight, to: highlight }),
    );
    const hot = makeHotStub({
      _createCellRange: createRange as unknown as Parameters<typeof makeHotStub>[0]['_createCellRange'],
    } as Parameters<typeof makeHotStub>[0]);
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(
      makeAdapterOptions(hot, overlayHost),
      makePluginStub(),
    );

    adapter.setHighlights([{ range: range(0, 0, 1, 1), color: 'red' }]);
    createRange.mockClear();
    adapter.setHighlights([{ range: range(0, 0, 1, 1), color: 'red' }]);

    expect(createRange).not.toHaveBeenCalled();

    adapter.destroy();
  });

  it('re-derives the highlights before the next draw after an index mapper rebuilt its cache', () => {
    const hooks: Record<string, ((...args: unknown[]) => void)[]> = {};
    let colShift = 0;
    const hot = makeHotStub({
      addHook: (name: string, callback: (...args: unknown[]) => void) => {
        (hooks[name] ??= []).push(callback);
      },
      removeHook: () => undefined,
    } as Parameters<typeof makeHotStub>[0]);
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(
      makeAdapterOptions(hot, overlayHost, { hfToVisualCol: hfCol => hfCol + colShift }),
      makePluginStub(),
    );
    const columnIndexMapper = hot.columnIndexMapper as unknown as { runLocalHooks(name: string): void };

    adapter.setHighlights([{ range: range(0, 0, 0, 0), color: 'red' }]);

    // A move, a filter, an insert, a page change: any of them rebuilds the mapper's cache.
    colShift = 3;
    columnIndexMapper.runLocalHooks('cacheUpdated');

    const selections = customSelectionsOf(hot);

    // Nothing changes inside the cache update, which can run in the middle of a batch.
    expect((selections[0].visualCellRange as { from: { col: number } }).from.col).toBe(0);

    hooks.beforeViewRender?.forEach(listener => listener());

    expect(customSelectionsOf(hot)).toHaveLength(1);
    expect((customSelectionsOf(hot)[0].visualCellRange as { from: { col: number } }).from.col).toBe(3);

    adapter.destroy();
  });

  it('stops listening to the index mappers when destroyed', () => {
    const hot = makeHotStub();
    const overlayHost = document.createElement('div');
    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());
    const rowIndexMapper = hot.rowIndexMapper as unknown as { localHooks: Map<string, Set<unknown>> };

    expect(rowIndexMapper.localHooks.get('cacheUpdated')?.size).toBe(1);

    adapter.destroy();

    expect(rowIndexMapper.localHooks.get('cacheUpdated')?.size).toBe(0);
  });

  it('drops highlights carrying a color able to break out of the stylesheet', () => {
    const { adapter, hot } = makeAdapter();

    adapter.setHighlights([
      { range: range(0, 0, 0, 0), color: 'red)}td{background:url(//evil)}', fill: true },
    ]);

    expect(customSelectionsOf(hot)).toHaveLength(0);

    const styleEl = document.body.querySelector('[data-hot-formula-ref-fills]');
    const rules = styleEl instanceof HTMLStyleElement && styleEl.sheet ?
      [...styleEl.sheet.cssRules].map(rule => rule.cssText).join('') : '';

    expect(rules).not.toContain('evil');

    adapter.destroy();
  });

  it('re-probes the border width until the theme variable resolves', () => {
    let cssValue = '';
    const hot = makeHotStub({
      rootWindow: {
        ...window,
        getComputedStyle: () => ({ getPropertyValue: () => cssValue }),
      } as unknown as Window & typeof globalThis,
    } as Parameters<typeof makeHotStub>[0]);
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(
      makeAdapterOptions(hot, overlayHost),
      makePluginStub(),
    );

    adapter.setHighlights([{ range: range(0, 0, 0, 0), color: 'red' }]);

    expect((customSelectionsOf(hot)[0].settings.border as { width: number }).width).toBe(2);

    cssValue = '3px';
    // A different color forces a full re-registration (the in-place fast path
    // reuses the existing border config).
    adapter.setHighlights([{ range: range(1, 1, 1, 1), color: 'blue' }]);

    expect((customSelectionsOf(hot)[0].settings.border as { width: number }).width).toBe(3);

    adapter.destroy();
  });

  it('reads the border width again after `resetBorderWidth()`', () => {
    let cssValue = '1px';
    const hot = makeHotStub({
      rootWindow: {
        ...window,
        getComputedStyle: () => ({ getPropertyValue: () => cssValue }),
      } as unknown as Window & typeof globalThis,
    } as Parameters<typeof makeHotStub>[0]);
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(
      makeAdapterOptions(hot, overlayHost),
      makePluginStub(),
    );
    const width = () => (customSelectionsOf(hot)[0].settings.border as { width: number }).width;

    adapter.setHighlights([{ range: range(0, 0, 0, 0), color: 'red' }]);

    expect(width()).toBe(1);

    // A theme switched to one that declares another width: the cache keeps the old one...
    cssValue = '2px';
    adapter.setHighlights([{ range: range(1, 1, 1, 1), color: 'blue' }]);

    expect(width()).toBe(1);

    // ...until the plugin resets it on `afterSetTheme`.
    adapter.resetBorderWidth();
    adapter.setHighlights([{ range: range(0, 0, 0, 0), color: 'red' }]);

    expect(width()).toBe(2);

    adapter.destroy();
  });

  it.each([
    ['color', { color: 'blue' }],
    ['fill', { fill: true }],
  ])('re-registers the selection when only the %s changes on the same range', (_label, change) => {
    const { adapter, hot } = makeAdapter();

    adapter.setHighlights([{ range: range(1, 1, 2, 2), color: 'red', fill: false }]);

    const [first] = customSelectionsOf(hot);

    adapter.setHighlights([{ range: range(1, 1, 2, 2), color: 'red', fill: false, ...change }]);

    const selections = customSelectionsOf(hot);

    // An in-place range update would keep the old border color and class.
    expect(first.destroy).toHaveBeenCalledTimes(1);
    expect(selections).toHaveLength(1);
    expect(selections[0]).not.toBe(first);
    expect((selections[0].settings.border as { color: string }).color).toBe(change.color ?? 'red');
    expect(selections[0].settings.className).toMatch(
      change.fill ? /^ht-formula-ref-fill-/ : /^ht-formula-ref-line-/,
    );

    adapter.destroy();
  });

  it('accepts a strict var() reference even where CSS.supports rejects it', () => {
    const hot = makeHotStub({
      rootWindow: {
        ...window,
        getComputedStyle: window.getComputedStyle.bind(window),
        CSS: { supports: () => false },
      } as unknown as Window & typeof globalThis,
    } as Parameters<typeof makeHotStub>[0]);
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

    adapter.setHighlights([{ range: range(0, 0, 0, 0), color: 'var(--x)' }]);

    expect(customSelectionsOf(hot)).toHaveLength(1);

    adapter.setHighlights([{ range: range(0, 0, 0, 0), color: 'rgb(1, 2, 3)' }]);

    // A non-var() color is left to CSS.supports, which rejects it here.
    expect(customSelectionsOf(hot)).toHaveLength(0);

    adapter.destroy();
  });

  it('rejects a var() reference followed by a declaration break-out', () => {
    const hot = makeHotStub({
      rootWindow: {
        ...window,
        getComputedStyle: window.getComputedStyle.bind(window),
        CSS: { supports: () => true },
      } as unknown as Window & typeof globalThis,
    } as Parameters<typeof makeHotStub>[0]);
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

    adapter.setHighlights([{ range: range(0, 0, 0, 0), color: 'var(--x);}' }]);

    expect(customSelectionsOf(hot)).toHaveLength(0);

    adapter.destroy();
  });

  it.each(['0px', '-2px', 'thick'])(
    'falls back to the default border width for %p and re-probes on the next registration',
    (unusable) => {
      let cssValue = unusable;
      const hot = makeHotStub({
        rootWindow: {
          ...window,
          getComputedStyle: () => ({ getPropertyValue: () => cssValue }),
        } as unknown as Window & typeof globalThis,
      } as Parameters<typeof makeHotStub>[0]);
      const overlayHost = document.createElement('div');

      document.body.appendChild(overlayHost);

      const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

      adapter.setHighlights([{ range: range(0, 0, 0, 0), color: 'red' }]);

      expect((customSelectionsOf(hot)[0].settings.border as { width: number }).width).toBe(2);

      cssValue = '4px';
      adapter.setHighlights([{ range: range(1, 1, 1, 1), color: 'blue' }]);

      expect((customSelectionsOf(hot)[0].settings.border as { width: number }).width).toBe(4);

      adapter.destroy();
    },
  );

  it('keeps a whole-column span whose last HyperFormula row is trimmed', () => {
    // A1:A10000 spans more than the per-index scan limit; a filter trimmed the last 10 rows,
    // so the run ends on the last row that still has a visual index.
    const { adapter, hot } = makeAdapter({
      mapping: { hfToVisualRow: hfRow => (hfRow >= 9990 ? -1 : hfRow) },
    });

    adapter.setHighlights([{ range: range(0, 0, 9999, 0), color: 'red' }]);

    const selections = customSelectionsOf(hot);

    expect(selections).toHaveLength(1);
    expect(selections[0].visualCellRange).toEqual({
      highlight: { row: 0, col: 0 },
      from: { row: 0, col: 0 },
      to: { row: 9989, col: 0 },
    });

    adapter.destroy();
  });

  it('walks inward past trimmed rows at both ends of a wide span', () => {
    const { adapter, hot } = makeAdapter({
      mapping: { hfToVisualRow: hfRow => (hfRow < 3 || hfRow > 4000 ? -1 : hfRow - 3) },
    });

    adapter.setHighlights([{ range: range(0, 0, 9999, 0), color: 'red' }]);

    const selections = customSelectionsOf(hot);

    expect(selections).toHaveLength(1);
    expect(selections[0].visualCellRange).toEqual({
      highlight: { row: 0, col: 0 },
      from: { row: 0, col: 0 },
      to: { row: 3997, col: 0 },
    });

    adapter.destroy();
  });

  it('draws a wide span without a fill when its endpoints map back in reverse order', () => {
    // Only the endpoints of a span past the scan limit are mapped. Reversed, they prove the engine
    // order does not follow the grid, so the band between them is not the referenced rows.
    const reversed = makeAdapter({ mapping: { hfToVisualRow: hfRow => 4999 - hfRow } });

    reversed.adapter.setHighlights([{ range: range(0, 0, 2999, 0), color: 'red', fill: true }]);

    const [approximate] = customSelectionsOf(reversed.hot);

    expect(approximate.visualCellRange.from).toEqual({ row: 2000, col: 0 });
    expect(approximate.visualCellRange.to).toEqual({ row: 4999, col: 0 });
    expect(approximate.settings.className).toMatch(/^ht-formula-ref-line-/);
    reversed.adapter.destroy();

    // The same span in the engine order the Formulas plugin keeps in step with the grid stays filled.
    const inOrder = makeAdapter();

    inOrder.adapter.setHighlights([{ range: range(0, 0, 2999, 0), color: 'red', fill: true }]);

    expect(customSelectionsOf(inOrder.hot)[0].settings.className).toMatch(/^ht-formula-ref-fill-/);
    inOrder.adapter.destroy();
  });

  it('drops a wide span whose every row is trimmed', () => {
    const { adapter, hot } = makeAdapter({ mapping: { hfToVisualRow: () => -1 } });

    adapter.setHighlights([{ range: range(0, 0, 2500, 0), color: 'red' }]);

    expect(customSelectionsOf(hot)).toHaveLength(0);

    adapter.destroy();
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
