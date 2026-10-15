import { test, expect, THEMES_TAG, BUNDLES_TAG } from '../fixtures/test';
import { BeforeAutofillPrecedencePage } from '../fixtures/pages/BeforeAutofillPrecedencePage';

/**
 * Which `beforeAutofill` callback decides the fill when the Formulas plugin is
 * on (DEV-3424). Hooks run global bucket first, then the instance bucket, each
 * in registration order, and the last callback that returns a value wins.
 * Formulas registers its own instance hook when it is enabled, so WHEN your
 * callback was registered relative to that moment decides the result.
 *
 * Source row: A1 = 1, B1 = `=A1*2`. A real fill-handle drag of A1:B1 one row
 * down yields `[1, '=A2*2']` when Formulas decides, `['USER', 'USER']` when the
 * user callback returning `[['USER']]` decides, and an untouched row when a
 * callback returning `false` cancels the fill.
 */
const USER_WINS = ['USER', 'USER'];
const FORMULAS_WINS = [1, '=A2*2'];
const CANCELED = [null, null];
const USER_DATA = [['USER']];
// A canceled fill leaves the selection on A1:B1; an applied one grows it to A1:B2.
const SELECTION_UNCHANGED = [0, 0, 0, 1];
const SELECTION_FILLED = [0, 0, 1, 1];

test.describe('beforeAutofill precedence with the Formulas plugin', { tag: [THEMES_TAG, BUNDLES_TAG] }, () => {
  test('baseline: Formulas alone fills with shifted formulas', async({ page, theme, bundle }) => {
    const grid = new BeforeAutofillPrecedencePage(page, theme, bundle);

    await grid.goto();
    await grid.createGrid({ formulas: true });
    await grid.fillRowDown();

    await grid.expectCalls(['afterAutofill']);
    await expect.poll(() => grid.filledRow()).toEqual(FORMULAS_WINS);
    expect(await grid.selection()).toEqual(SELECTION_FILLED);
  });

  test('option at init returning values wins over Formulas', async({ page, theme, bundle }) => {
    const grid = new BeforeAutofillPrecedencePage(page, theme, bundle);

    await grid.goto();
    await grid.createGrid({ formulas: true, beforeAutofill: USER_DATA });
    await grid.fillRowDown();

    await grid.expectCalls(['option', 'afterAutofill']);
    await expect.poll(() => grid.filledRow()).toEqual(USER_WINS);
    expect(await grid.selection()).toEqual(SELECTION_FILLED);
  });

  test('option at init returning false cancels the fill', async({ page, theme, bundle }) => {
    const grid = new BeforeAutofillPrecedencePage(page, theme, bundle);

    await grid.goto();
    await grid.createGrid({ formulas: true, beforeAutofill: false });
    await grid.fillRowDown();

    // Formulas runs first and returns its own data, then the option returns
    // false last: false does not stop anything, it is simply the last value.
    await grid.expectCalls(['option']);
    await expect.poll(() => grid.filledRow()).toEqual(CANCELED);
    expect(await grid.selection()).toEqual(SELECTION_UNCHANGED);
  });

  test('a global hook runs before the option, and the option wins', async({ page, theme, bundle }) => {
    const grid = new BeforeAutofillPrecedencePage(page, theme, bundle);

    await grid.goto();
    await grid.addGlobalHook([['GLOBAL']]);
    await grid.createGrid({ formulas: true, beforeAutofill: USER_DATA });
    await grid.fillRowDown();

    await grid.expectCalls(['global', 'option', 'afterAutofill']);
    await expect.poll(() => grid.filledRow()).toEqual(USER_WINS);
    expect(await grid.selection()).toEqual(SELECTION_FILLED);
  });

  test('hot.addHook before Formulas is enabled loses to Formulas', async({ page, theme, bundle }) => {
    const grid = new BeforeAutofillPrecedencePage(page, theme, bundle);

    await grid.goto();
    await grid.createGrid();
    await grid.addInstanceHook(USER_DATA);
    await grid.updateFormulas();
    await grid.fillRowDown();

    await grid.expectCalls(['instance', 'afterAutofill']);
    await expect.poll(() => grid.filledRow()).toEqual(FORMULAS_WINS);
    expect(await grid.selection()).toEqual(SELECTION_FILLED);
  });

  test('a global hook added before init loses to Formulas', async({ page, theme, bundle }) => {
    const grid = new BeforeAutofillPrecedencePage(page, theme, bundle);

    await grid.goto();
    await grid.addGlobalHook(USER_DATA);
    await grid.createGrid({ formulas: true });
    await grid.fillRowDown();

    await grid.expectCalls(['global', 'afterAutofill']);
    await expect.poll(() => grid.filledRow()).toEqual(FORMULAS_WINS);
    expect(await grid.selection()).toEqual(SELECTION_FILLED);
  });

  test('a global hook returning false does not cancel what Formulas fills', async({ page, theme, bundle }) => {
    const grid = new BeforeAutofillPrecedencePage(page, theme, bundle);

    await grid.goto();
    await grid.addGlobalHook(false);
    await grid.createGrid({ formulas: true });
    await grid.fillRowDown();

    await grid.expectCalls(['global', 'afterAutofill']);
    await expect.poll(() => grid.filledRow()).toEqual(FORMULAS_WINS);
    expect(await grid.selection()).toEqual(SELECTION_FILLED);
  });

  test('hot.addHook after init with Formulas already enabled wins', async({ page, theme, bundle }) => {
    const grid = new BeforeAutofillPrecedencePage(page, theme, bundle);

    await grid.goto();
    await grid.createGrid({ formulas: true });
    await grid.addInstanceHook(USER_DATA);
    await grid.fillRowDown();

    await grid.expectCalls(['instance', 'afterAutofill']);
    await expect.poll(() => grid.filledRow()).toEqual(USER_WINS);
    expect(await grid.selection()).toEqual(SELECTION_FILLED);
  });

  test('hot.addHook returning false after init cancels the fill', async({ page, theme, bundle }) => {
    const grid = new BeforeAutofillPrecedencePage(page, theme, bundle);

    await grid.goto();
    await grid.createGrid({ formulas: true });
    await grid.addInstanceHook(false);
    await grid.fillRowDown();

    await grid.expectCalls(['instance']);
    await expect.poll(() => grid.filledRow()).toEqual(CANCELED);
    expect(await grid.selection()).toEqual(SELECTION_UNCHANGED);
  });

  test('option at init still wins after a later updateSettings of formulas', async({ page, theme, bundle }) => {
    const grid = new BeforeAutofillPrecedencePage(page, theme, bundle);

    await grid.goto();
    await grid.createGrid({ formulas: true, beforeAutofill: USER_DATA });
    await grid.updateFormulas({ sheetName: 'Sheet1' });
    await grid.fillRowDown();

    await grid.expectCalls(['option', 'afterAutofill']);
    await expect.poll(() => grid.filledRow()).toEqual(USER_WINS);
    expect(await grid.selection()).toEqual(SELECTION_FILLED);
  });

  test('option at init loses once Formulas is disabled and enabled again', async({ page, theme, bundle }) => {
    const grid = new BeforeAutofillPrecedencePage(page, theme, bundle);

    await grid.goto();
    await grid.createGrid({ formulas: true, beforeAutofill: USER_DATA });
    await grid.disableFormulas();
    await grid.updateFormulas();
    await grid.fillRowDown();

    // Re-enabling registers the plugin's hook again, at the end of the
    // instance bucket and therefore after the option's callback.
    await grid.expectCalls(['option', 'afterAutofill']);
    await expect.poll(() => grid.filledRow()).toEqual(FORMULAS_WINS);
    expect(await grid.selection()).toEqual(SELECTION_FILLED);
  });

  test('addHook with orderIndex 1 after init wins', async({ page, theme, bundle }) => {
    const grid = new BeforeAutofillPrecedencePage(page, theme, bundle);

    await grid.goto();
    await grid.createGrid({ formulas: true });
    await grid.addInstanceHook(USER_DATA, 1);
    await grid.fillRowDown();

    await grid.expectCalls(['instance', 'afterAutofill']);
    await expect.poll(() => grid.filledRow()).toEqual(USER_WINS);
    expect(await grid.selection()).toEqual(SELECTION_FILLED);
  });

  test('addHook with orderIndex 1 added before Formulas is enabled wins', async({ page, theme, bundle }) => {
    const grid = new BeforeAutofillPrecedencePage(page, theme, bundle);

    await grid.goto();
    await grid.createGrid();
    await grid.addInstanceHook(USER_DATA, 1);
    await grid.updateFormulas();
    await grid.fillRowDown();

    await grid.expectCalls(['instance', 'afterAutofill']);
    await expect.poll(() => grid.filledRow()).toEqual(USER_WINS);
    expect(await grid.selection()).toEqual(SELECTION_FILLED);
  });

  test('addHook with orderIndex 1 still wins after Formulas is disabled and enabled again', async({ page, theme, bundle }) => {
    const grid = new BeforeAutofillPrecedencePage(page, theme, bundle);

    await grid.goto();
    await grid.createGrid({ formulas: true });
    await grid.addInstanceHook(USER_DATA, 1);
    await grid.disableFormulas();
    await grid.updateFormulas();
    await grid.fillRowDown();

    await grid.expectCalls(['instance', 'afterAutofill']);
    await expect.poll(() => grid.filledRow()).toEqual(USER_WINS);
    expect(await grid.selection()).toEqual(SELECTION_FILLED);
  });

  test('option at init loses when Formulas is enabled later with updateSettings', async({ page, theme, bundle }) => {
    const grid = new BeforeAutofillPrecedencePage(page, theme, bundle);

    await grid.goto();
    await grid.createGrid({ beforeAutofill: USER_DATA });
    await grid.updateFormulas();
    await grid.fillRowDown();

    await grid.expectCalls(['option', 'afterAutofill']);
    await expect.poll(() => grid.filledRow()).toEqual(FORMULAS_WINS);
    expect(await grid.selection()).toEqual(SELECTION_FILLED);
  });

  test('re-passing the option through updateSettings keeps its place before Formulas', async({ page, theme, bundle }) => {
    const grid = new BeforeAutofillPrecedencePage(page, theme, bundle);

    await grid.goto();
    await grid.createGrid({ beforeAutofill: USER_DATA });
    await grid.updateFormulas();
    await grid.updateBeforeAutofillOption(USER_DATA);
    await grid.fillRowDown();

    // The new function replaced the old one in place, so it still runs before the plugin's callback.
    await grid.expectCalls(['option', 'afterAutofill']);
    await expect.poll(() => grid.filledRow()).toEqual(FORMULAS_WINS);
    expect(await grid.selection()).toEqual(SELECTION_FILLED);
  });
});
