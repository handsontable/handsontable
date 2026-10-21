import { FormulaBuilder } from '../formulaBuilder';
import { findHook, makePluginHotStub } from './helpers/pluginHotStub';

/**
 * Builds a plugin-ready Handsontable stub whose selection reports the given highlight cell.
 *
 * @param {{ row: number, col: number } | undefined} highlight The highlight cell, or `undefined`.
 * @returns {ReturnType<typeof makePluginHotStub>}
 */
function makeHighlightHotStub(highlight: { row: number; col: number } | undefined) {
  return makePluginHotStub({}, {
    getCellMetaTransient: jest.fn(() => ({ editor: 'formula' })),
    getSelectedRangeLast: () => (highlight ? { highlight } : undefined),
  });
}

describe('FormulaBuilder plugin highlight-cell active tracking', () => {
  it('emits the highlight cell as active while range still comes from anchor+focus', () => {
    const stub = makeHighlightHotStub({ row: 3, col: 2 });
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const received: unknown[] = [];

    plugin.onFormulaCellSelection(selection => received.push(selection));
    const selectionEnd = findHook(stub.hot, 'afterSelectionEnd');

    (selectionEnd as (...args: number[]) => void)(1, 1, 3, 2);

    expect(received[0]).toEqual({
      active: { row: 3, col: 2 },
      range: { startRow: 1, startCol: 1, endRow: 3, endCol: 2 },
    });
  });

  it('falls back to the anchor as active when no highlight is available', () => {
    const stub = makeHighlightHotStub(undefined);
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();

    const received: unknown[] = [];

    plugin.onFormulaCellSelection(selection => received.push(selection));
    const selectionEnd = findHook(stub.hot, 'afterSelectionEnd');

    (selectionEnd as (...args: number[]) => void)(4, 2, 4, 2);

    expect(received[0]).toEqual({
      active: { row: 4, col: 2 },
      range: { startRow: 4, startCol: 2, endRow: 4, endCol: 2 },
    });
  });
});
