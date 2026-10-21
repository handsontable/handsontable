import type { CellPick, HeaderPick, RangePick } from 'hyperformula-ui';
import { HandsontableAdapter } from '../handsontableAdapter';
import type { FormulaBuilderPluginLike } from '../handsontableAdapter';
import { makeAdapterOptions, makeHotStub, makePluginStub } from './helpers/stubs';
import type { CustomSelectionStub } from './helpers/stubs';

/**
 * Builds a plugin stub whose every member is a spy, so delegation can be asserted
 * call by call. The subscription members return a recognisable unsubscribe function.
 *
 * @returns {{ plugin: FormulaBuilderPluginLike, unsubscribe: jest.Mock }}
 */
function makeSpyPlugin(): { plugin: FormulaBuilderPluginLike; unsubscribe: jest.Mock } {
  const unsubscribe = jest.fn();
  const plugin: FormulaBuilderPluginLike = {
    ...makePluginStub(),
    getRawCellText: jest.fn(() => '=B2'),
    onEditorClose: jest.fn(() => unsubscribe),
    onSwitchToInline: jest.fn(() => unsubscribe),
    commitInlineEdit: jest.fn(),
    cancelInlineEdit: jest.fn(),
    selectFirstFormulaCell: jest.fn(),
  };

  return { plugin, unsubscribe };
}

/**
 * Builds an adapter over a bare grid stub and the given plugin.
 *
 * @param {FormulaBuilderPluginLike} plugin The plugin surface.
 * @returns {{ adapter: HandsontableAdapter, customSelections: () => CustomSelectionStub[] }}
 */
function makeAdapter(plugin: FormulaBuilderPluginLike = makePluginStub()) {
  const hot = makeHotStub();
  const overlayHost = document.createElement('div');

  document.body.appendChild(overlayHost);

  const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), plugin);
  const customSelections = () =>
    (hot as unknown as { selection: { highlight: { customSelections: CustomSelectionStub[] } } })
      .selection.highlight.customSelections;

  return { adapter, customSelections };
}

/**
 * Builds a cell range in HyperFormula coordinates.
 *
 * @param {number} startRow The start row.
 * @param {number} startCol The start column.
 * @param {number} endRow The end row.
 * @param {number} endCol The end column.
 * @returns {{ start: { sheet: string, row: number, col: number }, end: { sheet: string, row: number, col: number } }}
 */
function range(startRow: number, startCol: number, endRow: number, endCol: number) {
  return {
    start: { sheet: '', row: startRow, col: startCol },
    end: { sheet: '', row: endRow, col: endCol },
  };
}

describe('HandsontableAdapter pick subscriptions', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('delivers an emitted cell pick to onCellPick listeners until they unsubscribe', () => {
    const { adapter } = makeAdapter();
    const seen: CellPick[] = [];
    const unsubscribe = adapter.onCellPick(pick => seen.push(pick));
    const pick = { address: { sheet: '', row: 1, col: 2 } } as CellPick;

    adapter.emitCellPick(pick);
    unsubscribe();
    adapter.emitCellPick({ address: { sheet: '', row: 5, col: 5 } } as CellPick);

    expect(seen).toEqual([pick]);

    adapter.destroy();
  });

  it('delivers an emitted range pick to onRangePick listeners until they unsubscribe', () => {
    const { adapter } = makeAdapter();
    const seen: RangePick[] = [];
    const unsubscribe = adapter.onRangePick(pick => seen.push(pick));
    const pick = { range: range(0, 0, 2, 2) } as RangePick;

    adapter.emitRangePick(pick);
    unsubscribe();
    adapter.emitRangePick({ range: range(3, 3, 4, 4) } as RangePick);

    expect(seen).toEqual([pick]);

    adapter.destroy();
  });

  it('delivers an emitted header pick to onHeaderPick listeners until they unsubscribe', () => {
    const { adapter } = makeAdapter();
    const seen: HeaderPick[] = [];
    const unsubscribe = adapter.onHeaderPick(pick => seen.push(pick));
    const pick = { axis: 'column', start: 1, end: 3 } as HeaderPick;

    adapter.emitHeaderPick(pick);
    unsubscribe();
    adapter.emitHeaderPick({ axis: 'row', start: 0, end: 0 } as HeaderPick);

    expect(seen).toEqual([pick]);

    adapter.destroy();
  });

  it('keeps cell, range and header listeners apart', () => {
    const { adapter } = makeAdapter();
    const cellListener = jest.fn();
    const rangeListener = jest.fn();
    const headerListener = jest.fn();

    adapter.onCellPick(cellListener);
    adapter.onRangePick(rangeListener);
    adapter.onHeaderPick(headerListener);
    adapter.emitRangePick({ range: range(0, 0, 1, 1) } as RangePick);

    expect(cellListener).not.toHaveBeenCalled();
    expect(headerListener).not.toHaveBeenCalled();
    expect(rangeListener).toHaveBeenCalledTimes(1);

    adapter.destroy();
  });
});

describe('HandsontableAdapter outside-click and reference-selection contract', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('declares native outside-click commits and accepts no outside-click listeners', () => {
    const { adapter } = makeAdapter();
    const listener = jest.fn();

    expect(adapter.outsideClickCommitMode).toBe('native');

    const unsubscribe = adapter.onOutsideCellClick(listener);

    expect(typeof unsubscribe).toBe('function');

    unsubscribe();

    expect(listener).not.toHaveBeenCalled();

    adapter.destroy();
  });

  it('enterRefSelectionMode leaves the highlights as they are', () => {
    const { adapter, customSelections } = makeAdapter();

    adapter.setHighlights([{ range: range(0, 0, 0, 0), color: 'red' }]);
    adapter.highlightRange(range(2, 2, 3, 3), 'blue');

    const before = [...customSelections()];

    adapter.enterRefSelectionMode();

    expect(customSelections()).toEqual(before);

    adapter.destroy();
  });

  it('exitRefSelectionMode drops the drag preview and keeps the persistent highlights', () => {
    const { adapter, customSelections } = makeAdapter();

    adapter.setHighlights([{ range: range(0, 0, 0, 0), color: 'red' }]);
    adapter.highlightRange(range(2, 2, 3, 3), 'blue');

    expect(customSelections()).toHaveLength(2);

    adapter.exitRefSelectionMode();

    const remaining = customSelections();

    expect(remaining).toHaveLength(1);
    expect((remaining[0].settings.border as { color: string }).color).toBe('red');

    adapter.destroy();
  });

  it('formatRef renders addresses and ranges in A1 notation', () => {
    const { adapter } = makeAdapter();

    expect(adapter.formatRef({ sheet: '', row: 0, col: 0 })).toBe('A1');
    expect(adapter.formatRef({ sheet: '', row: 9, col: 26 })).toBe('AA10');
    expect(adapter.formatRef(range(0, 0, 1, 1))).toBe('A1:B2');

    adapter.destroy();
  });
});

describe('HandsontableAdapter delegation to the plugin', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('commit forwards the value and the direction', () => {
    const { plugin } = makeSpyPlugin();
    const { adapter } = makeAdapter(plugin);

    adapter.commit('=A1', 'down');
    adapter.commit('5');

    expect((plugin.commitInlineEdit as jest.Mock).mock.calls).toEqual([['=A1', 'down'], ['5', undefined]]);

    adapter.destroy();
  });

  it('cancel cancels the inline edit', () => {
    const { plugin } = makeSpyPlugin();
    const { adapter } = makeAdapter(plugin);

    adapter.cancel();

    expect(plugin.cancelInlineEdit).toHaveBeenCalledTimes(1);

    adapter.destroy();
  });

  it('onInlineEditClose subscribes to the plugin close event and returns its unsubscribe', () => {
    const { plugin, unsubscribe } = makeSpyPlugin();
    const { adapter } = makeAdapter(plugin);
    const listener = jest.fn();

    expect(adapter.onInlineEditClose(listener)).toBe(unsubscribe);
    expect(plugin.onEditorClose).toHaveBeenCalledWith(listener);

    adapter.destroy();
  });

  it('onSwitchToInline subscribes to the plugin handoff event and returns its unsubscribe', () => {
    const { plugin, unsubscribe } = makeSpyPlugin();
    const { adapter } = makeAdapter(plugin);
    const listener = jest.fn();

    expect(adapter.onSwitchToInline(listener)).toBe(unsubscribe);
    expect(plugin.onSwitchToInline).toHaveBeenCalledWith(listener);

    adapter.destroy();
  });

  it('getCellFormula reads the raw text at the address row and column', () => {
    const { plugin } = makeSpyPlugin();
    const { adapter } = makeAdapter(plugin);

    expect(adapter.getCellFormula({ sheet: '', row: 2, col: 3 })).toBe('=B2');
    expect(plugin.getRawCellText).toHaveBeenCalledWith(2, 3);

    adapter.destroy();
  });

  it('selectFirstCell asks the plugin for the first formula cell', () => {
    const { plugin } = makeSpyPlugin();
    const { adapter } = makeAdapter(plugin);

    adapter.selectFirstCell();

    expect(plugin.selectFirstFormulaCell).toHaveBeenCalledTimes(1);

    adapter.destroy();
  });
});
