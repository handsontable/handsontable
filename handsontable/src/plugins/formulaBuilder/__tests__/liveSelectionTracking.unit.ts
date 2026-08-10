import { HyperFormula } from 'hyperformula';
import type { HotInstance } from '../../../core/types';
import { FormulaBuilder } from '../formulaBuilder';

/**
 * Builds a Handsontable stub rich enough for the plugin to enable: `formulaBuilder`
 * settings carrying the injected `@hfe/core` module, a Formulas plugin stub with an
 * empty HyperFormula engine and identity axis syncers, and a movable selection
 * highlight exposed through `getSelectedRangeLast`.
 *
 * @param {{ row: number, col: number } | undefined} highlight The initial highlight cell.
 * @returns {{ highlightRef: object, hot: object }}
 */
function makeLiveSelectionHotStub(highlight: { row: number; col: number } | undefined) {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const core = require('@hfe/core');
  const engine = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });
  const identitySyncer = {
    getHfIndexFromVisualIndex: (visualIndex: number) => visualIndex,
    getVisualIndexFromHfIndex: (hfIndex: number) => hfIndex,
  };
  const formulas = {
    enabled: true,
    engine,
    sheetId: 0,
    rowAxisSyncer: identitySyncer,
    columnAxisSyncer: identitySyncer,
  };
  const settings: Record<string, unknown> = { formulaBuilder: { builder: core } };
  const highlightRef = { current: highlight };

  return {
    highlightRef,
    hot: {
      rootElement: document.createElement('div'),
      rootDocument: document,
      rootWindow: window,
      getSettings: () => settings,
      getPlugin: (name: string) => (name === 'formulas' ? formulas : undefined),
      addHook: jest.fn(),
      removeHook: jest.fn(),
      getActiveEditor: jest.fn(),
      getCell: () => document.createElement('td'),
      getCoords: () => null,
      countRows: () => 0,
      countCols: () => 0,
      render: jest.fn(),
      getFirstRenderedVisibleRow: () => 0,
      getLastRenderedVisibleRow: () => 100,
      getFirstRenderedVisibleColumn: () => 0,
      getLastRenderedVisibleColumn: () => 100,
      setDataAtCell: jest.fn(),
      getCellMetaTransient: () => ({ editor: 'formula' }),
      getSelectedRangeLast: () =>
        (highlightRef.current ? { highlight: highlightRef.current } : undefined),
      view: { getOverlayByName: () => null },
      getCurrentThemeName: () => null,
      isRtl: () => false,
    },
  };
}

/**
 * Builds the plugin over a live-selection stub, cast through the real instance type.
 *
 * @param {ReturnType<typeof makeLiveSelectionHotStub>} stub The Handsontable stub bundle.
 * @returns {FormulaBuilder}
 */
function makePlugin(stub: ReturnType<typeof makeLiveSelectionHotStub>): FormulaBuilder {
  return new FormulaBuilder(stub.hot as unknown as HotInstance);
}

/**
 * Returns the hook listener registered on the stub under the given hook name.
 *
 * @param {ReturnType<typeof makeLiveSelectionHotStub>} stub The Handsontable stub bundle.
 * @param {string} name The hook name.
 * @returns {Function}
 */
function findHook(
  stub: ReturnType<typeof makeLiveSelectionHotStub>,
  name: string,
): (...args: never[]) => void {
  const call = (stub.hot.addHook as jest.Mock).mock.calls.find(entry => entry[0] === name);

  if (!call) {
    throw new Error(`hook ${name} not registered`);
  }

  return call[1] as (...args: never[]) => void;
}

describe('FormulaBuilder plugin live selection tracking', () => {
  it('emits the normalized selection on each distinct afterSelection fire during a drag', () => {
    const stub = makeLiveSelectionHotStub({ row: 1, col: 1 });
    const plugin = makePlugin(stub);

    plugin.enablePlugin();

    const received: unknown[] = [];

    plugin.onFormulaCellSelection(selection => received.push(selection));
    const afterSelection = findHook(stub, 'afterSelection');

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
    const afterSelection = findHook(stub, 'afterSelection');

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
      const selectionEnd = findHook(stub, 'afterSelectionEnd');

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
    const selectionEnd = findHook(stub, 'afterSelectionEnd');

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
    const focusSet = findHook(stub, 'afterSelectionFocusSet');

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
    const afterSelection = findHook(stub, 'afterSelection');

    (afterSelection as (...args: number[]) => void)(1, 1, 2, 1);

    expect(selectionMoves).toHaveLength(0);
  });
});
