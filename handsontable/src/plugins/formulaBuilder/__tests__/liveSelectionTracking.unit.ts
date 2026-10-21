import { FormulaBuilder } from '../formulaBuilder';
import { findHook, makePluginHotStub } from './helpers/pluginHotStub';

/**
 * Builds a plugin-ready Handsontable stub whose every cell uses the formula editor and whose
 * selection highlight is movable through `highlightRef`.
 *
 * @param {{ row: number, col: number } | undefined} highlight The initial highlight cell.
 * @returns {object} The stub bundle plus `highlightRef`.
 */
function makeLiveSelectionHotStub(highlight: { row: number; col: number } | undefined) {
  const highlightRef = { current: highlight };
  const stub = makePluginHotStub({}, {
    getLastRenderedVisibleRow: () => 100,
    getLastRenderedVisibleColumn: () => 100,
    getCellMetaTransient: jest.fn(() => ({ editor: 'formula' })),
    getSelectedRangeLast: () =>
      (highlightRef.current ? { highlight: highlightRef.current } : undefined),
  });

  return { ...stub, highlightRef };
}

/**
 * Builds the plugin over a live-selection stub.
 *
 * @param {ReturnType<typeof makeLiveSelectionHotStub>} stub The Handsontable stub bundle.
 * @returns {FormulaBuilder}
 */
function makePlugin(stub: ReturnType<typeof makeLiveSelectionHotStub>): FormulaBuilder {
  return new FormulaBuilder(stub.instance);
}

describe('FormulaBuilder plugin live selection tracking', () => {
  it('emits the normalized selection on each distinct afterSelection fire during a drag', () => {
    const stub = makeLiveSelectionHotStub({ row: 1, col: 1 });
    const plugin = makePlugin(stub);

    plugin.enablePlugin();

    const received: unknown[] = [];

    plugin.onFormulaCellSelection(selection => received.push(selection));
    const afterSelection = findHook(stub.hot, 'afterSelection');

    (afterSelection as (...args: number[]) => void)(1, 1, 2, 1);
    (afterSelection as (...args: number[]) => void)(1, 1, 3, 1);

    expect(received).toEqual([
      { active: { row: 1, col: 1 }, range: { startRow: 1, startCol: 1, endRow: 2, endCol: 1 } },
      { active: { row: 1, col: 1 }, range: { startRow: 1, startCol: 1, endRow: 3, endCol: 1 } },
    ]);
  });

  it('dedupes a repeated identical afterSelection fire', () => {
    const stub = makeLiveSelectionHotStub({ row: 1, col: 1 });
    const plugin = makePlugin(stub);

    plugin.enablePlugin();

    const received: unknown[] = [];

    plugin.onFormulaCellSelection(selection => received.push(selection));
    const afterSelection = findHook(stub.hot, 'afterSelection');

    (afterSelection as (...args: number[]) => void)(1, 1, 2, 1);
    (afterSelection as (...args: number[]) => void)(1, 1, 2, 1);

    expect(received).toHaveLength(1);
  });

  it(
    'emits on both fires when corners are identical but the highlight cell moves' +
      ' (Tab within a range)',
    () => {
      const stub = makeLiveSelectionHotStub({ row: 1, col: 1 });
      const plugin = makePlugin(stub);

      plugin.enablePlugin();

      const received: unknown[] = [];

      plugin.onFormulaCellSelection(selection => received.push(selection));
      const selectionEnd = findHook(stub.hot, 'afterSelectionEnd');

      (selectionEnd as (...args: number[]) => void)(1, 1, 3, 3);
      stub.highlightRef.current = { row: 1, col: 2 };
      (selectionEnd as (...args: number[]) => void)(1, 1, 3, 3);

      expect(received).toEqual([
        { active: { row: 1, col: 1 }, range: { startRow: 1, startCol: 1, endRow: 3, endCol: 3 } },
        { active: { row: 1, col: 2 }, range: { startRow: 1, startCol: 1, endRow: 3, endCol: 3 } },
      ]);
    },
  );

  it('dedupes a fire with identical corners and identical highlight', () => {
    const stub = makeLiveSelectionHotStub({ row: 1, col: 1 });
    const plugin = makePlugin(stub);

    plugin.enablePlugin();

    const received: unknown[] = [];

    plugin.onFormulaCellSelection(selection => received.push(selection));
    const selectionEnd = findHook(stub.hot, 'afterSelectionEnd');

    (selectionEnd as (...args: number[]) => void)(1, 1, 3, 3);
    (selectionEnd as (...args: number[]) => void)(1, 1, 3, 3);

    expect(received).toHaveLength(1);
  });

  it('emits on afterSelectionFocusSet when Tab moves the highlight within a fixed range', () => {
    const stub = makeLiveSelectionHotStub({ row: 3, col: 3 });

    stub.hot.getSelectedRangeLast = () =>
      (stub.highlightRef.current
        ? {
          from: { row: 3, col: 3 },
          to: { row: 5, col: 4 },
          highlight: stub.highlightRef.current,
        }
        : undefined);

    const plugin = makePlugin(stub);

    plugin.enablePlugin();

    const received: unknown[] = [];

    plugin.onFormulaCellSelection(selection => received.push(selection));
    const focusSet = findHook(stub.hot, 'afterSelectionFocusSet');

    stub.highlightRef.current = { row: 3, col: 4 };
    (focusSet as (...args: number[]) => void)(3, 4);

    expect(received).toEqual([
      { active: { row: 3, col: 4 }, range: { startRow: 3, startCol: 3, endRow: 5, endCol: 4 } },
    ]);
  });

  it('does not move the grid selection on intermediate afterSelection fires', () => {
    const stub = makeLiveSelectionHotStub({ row: 1, col: 1 });
    const plugin = makePlugin(stub);

    plugin.enablePlugin();

    const selectionMoves: unknown[] = [];

    plugin.onSelection(selection => selectionMoves.push(selection));
    const afterSelection = findHook(stub.hot, 'afterSelection');

    (afterSelection as (...args: number[]) => void)(1, 1, 2, 1);

    expect(selectionMoves).toHaveLength(0);
  });
});
