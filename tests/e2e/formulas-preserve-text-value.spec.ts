import { test, expect } from '../fixtures/test';
import { FormulasMoveCellsPage } from '../fixtures/pages/FormulasMoveCellsPage';

/**
 * Formulas: `preserveTextValue` rendered output (review: demtario, budnix).
 *
 * The Formulas plugin escapes a preserved `text` cell with a leading apostrophe before
 * handing it to HyperFormula, then strips that apostrophe back out on every read path –
 * a stray `'` reaching the DOM is the highest-risk user-visible failure of this feature.
 * Every existing case for `preserveTextValue` asserts engine state or a data-layer getter,
 * never rendered cell text, so none of them would catch the unescape step being skipped.
 * These cases assert through the page object's `expectCell` (rendered `textContent`) –
 * never `cellValue`/`getDataAtCell` – for exactly that reason.
 */
test.describe('Formulas: preserveTextValue rendered output', () => {
  let grid: FormulasMoveCellsPage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new FormulasMoveCellsPage(page, theme);
    await grid.goto();
  });

  test('renders a preserved text value with no leading apostrophe after initial load', async () => {
    // A1 keeps its leading zero as TEXT (no preserveTextValue would coerce it to the number
    // 123456). A2/A3 depend on A1 through the engine, proving the dependent formulas also see
    // the unescaped string, not the raw apostrophe-prefixed one HyperFormula stores.
    await grid.initGrid(
      [['0123456'], ['=LEN(A1)'], ['="ID"&"_"&A1']],
      { columns: [{ type: 'text', preserveTextValue: true }] },
    );

    await grid.expectCell(0, 0, '0123456');
    await grid.expectCell(1, 0, '7');
    await grid.expectCell(2, 0, 'ID_0123456');
  });

  test('renders a preserved text value with no leading apostrophe after an edit', async () => {
    await grid.initGrid(
      [['0123456'], ['=LEN(A1)'], ['="ID"&"_"&A1']],
      { columns: [{ type: 'text', preserveTextValue: true }] },
    );

    await grid.editCell(0, 0, '0999');

    await grid.expectCell(0, 0, '0999');
    await grid.expectCell(1, 0, '4');

    // A value that already carries the user's OWN leading apostrophe – the case that
    // distinguishes a user's literal apostrophe from the plugin's internal escape marker.
    // The Jasmine case `should preserve a value that already starts with an apostrophe`
    // (formulas.spec.js:3409) pins the equivalent engine-level expectation for `'0123` –
    // stored doubled ("''0123"), read back through HyperFormula's own (unrelated) native
    // escape convention as the user's original `'0123`, LEN 5. This edit never touches
    // `unescapeEngineBoundValue` either (same #onModifyData VALUE-cell path as the `0999`
    // case above), so the rendered text is exactly what HOT's own dataMap holds – the
    // user's apostrophe rendered verbatim, matching the Jasmine pattern's round-trip fidelity.
    await grid.editCell(0, 0, '\'0777');

    await grid.expectCell(0, 0, '\'0777');
    await grid.expectCell(1, 0, '5');
  });

  test('renders a preserved text value with no leading apostrophe after a moveCells relocation', async () => {
    // The plugin's own moveCells plugin API is required here, not a bare engine.moveCells():
    // the HOT-data sync runs off state captured in the plugin's beforeMoveCells hook, so
    // driving the engine directly fires no Handsontable hook and never exercises this path.
    await grid.initGrid(
      [['0123456'], [null]],
      { columns: [{ type: 'text', preserveTextValue: true }] },
    );

    await grid.moveRange([0, 0, 0, 0], [1, 0]);

    await grid.expectCell(1, 0, '0123456');
    expect(await grid.cellValue(0, 0)).toBe(null);
  });
});
