import * as hfeCore from '@hfe/core';
import { HyperFormula } from 'hyperformula';
import type { HotInstance } from '../../../core/types';
import { FormulaBuilder } from '../formulaBuilder';

/**
 * Builds an identity visual/HyperFormula axis syncer for the Formulas plugin fake.
 *
 * @returns {{ getHfIndexFromVisualIndex: Function, getVisualIndexFromHfIndex: Function }}
 */
function makeAxisSyncer() {
  return {
    getHfIndexFromVisualIndex: (visualIndex: number) => visualIndex,
    getVisualIndexFromHfIndex: (hfIndex: number) => hfIndex,
  };
}

/**
 * Builds a Handsontable stub whose selection reports the given highlight cell.
 *
 * @param {{ row: number, col: number } | undefined} highlight The highlight cell, or `undefined`.
 * @returns {{ hot: Record<string, unknown> }}
 */
function makeHighlightHotStub(highlight: { row: number; col: number } | undefined) {
  const engine = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });
  const settings: Record<string, unknown> = { formulaBuilder: { builder: hfeCore } };
  const formulas = {
    enabled: true,
    engine,
    sheetId: 0,
    rowAxisSyncer: makeAxisSyncer(),
    columnAxisSyncer: makeAxisSyncer(),
  };

  return {
    hot: {
      rootElement: document.createElement('div'),
      rootDocument: document,
      rootWindow: window,
      getSettings: () => settings,
      getPlugin: (name: string) => (name === 'formulas' ? formulas : undefined),
      updateSettings: jest.fn(),
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
      getSelectedRangeLast: () => (highlight ? { highlight } : undefined),
      getCurrentThemeName: () => null,
      isRtl: () => false,
    },
  };
}

/**
 * Returns the hook callback the plugin registered on the stub under the given name.
 *
 * @param {ReturnType<typeof makeHighlightHotStub>} stub The Handsontable stub.
 * @param {string} name The hook name.
 * @returns {Function}
 */
function findHook(
  stub: ReturnType<typeof makeHighlightHotStub>,
  name: string,
): (...args: never[]) => void {
  const call = (stub.hot.addHook as jest.Mock).mock.calls.find(entry => entry[0] === name);

  if (!call) {
    throw new Error(`hook ${name} not registered`);
  }

  return call[1] as (...args: never[]) => void;
}

describe('FormulaBuilder plugin highlight-cell active tracking', () => {
  it('emits the highlight cell as active while range still comes from anchor+focus', () => {
    const stub = makeHighlightHotStub({ row: 3, col: 2 });
    const plugin = new FormulaBuilder(stub.hot as unknown as HotInstance);

    plugin.enablePlugin();

    const received: unknown[] = [];

    plugin.onFormulaCellSelection(selection => received.push(selection));
    const selectionEnd = findHook(stub, 'afterSelectionEnd');

    (selectionEnd as (...args: number[]) => void)(1, 1, 3, 2);

    expect(received[0]).toEqual({
      active: { row: 3, col: 2 },
      range: { startRow: 1, startCol: 1, endRow: 3, endCol: 2 },
    });
  });

  it('falls back to the anchor as active when no highlight is available', () => {
    const stub = makeHighlightHotStub(undefined);
    const plugin = new FormulaBuilder(stub.hot as unknown as HotInstance);

    plugin.enablePlugin();

    const received: unknown[] = [];

    plugin.onFormulaCellSelection(selection => received.push(selection));
    const selectionEnd = findHook(stub, 'afterSelectionEnd');

    (selectionEnd as (...args: number[]) => void)(4, 2, 4, 2);

    expect(received[0]).toEqual({
      active: { row: 4, col: 2 },
      range: { startRow: 4, startCol: 2, endRow: 4, endCol: 2 },
    });
  });
});
