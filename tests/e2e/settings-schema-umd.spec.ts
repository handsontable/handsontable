import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { FUNCTION, SettingsSchemaUmdPage, type SettingsSchemaLoader } from '../fixtures/pages/SettingsSchemaUmdPage';

/**
 * The CDN file of `handsontable/settingsSchema` (`dist/handsontable.settings-schema.js`) validates settings
 * against the registries of the `Handsontable` that the page loaded, and the main bundles do not carry the
 * schema. A copy of the registries inside the file would read as empty here: every `type` and every plugin
 * option would be reported. `src/settingsSchema/registries.ts` is swapped for `registries.umd.ts` in that build
 * to prevent it, and `./pageHandsontable` is an external there, so the file takes Handsontable from the global,
 * or from the module an AMD or CommonJS loader resolves.
 */
test.describe('settings schema CDN file', { tag: BUNDLES_TAG }, () => {
  let schemaPage: SettingsSchemaUmdPage;
  let pageErrors: Error[];

  test.beforeEach(async ({ page, theme, bundle }) => {
    pageErrors = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    schemaPage = new SettingsSchemaUmdPage(page, theme, bundle);
    await schemaPage.goto();
    expect(pageErrors).toEqual([]);
  });

  test('exposes the schema and the validator on one global', async ({ page }) => {
    expect(await schemaPage.exposedNames()).toEqual(['settingsSchema', 'validateSettings']);
    expect(await page.evaluate(() => Object.keys((window as any).HandsontableSettingsSchema).sort()))
      .toEqual(['settingsSchema', 'validateSettings']);
  });

  test('lists the options and the hooks of the page in the schema', async () => {
    // `afterInit` and `afterContextMenuExecute` come from the page's hook registry when the file loads,
    // the second from a plugin: a schema that read an empty registry would list neither.
    expect(await schemaPage.listedProperties(['colHeaders', 'afterInit', 'afterContextMenuExecute', 'nope']))
      .toEqual(['colHeaders', 'afterInit', 'afterContextMenuExecute']);
  });

  test('accepts the cell types, editors, renderers and validators the page registers', async () => {
    expect(await schemaPage.validate({
      type: 'text',
      editor: 'text',
      renderer: 'text',
      validator: 'numeric',
      columns: [{ type: 'numeric' }, { type: 'date', editor: 'date' }, { type: 'checkbox' }],
    })).toEqual([]);
  });

  test('reports a name the page has not registered', async () => {
    expect(await schemaPage.validate({
      type: 'nope',
      columns: [{ renderer: 'nope' }, { editor: 'nope' }, { validator: 'nope' }],
    })).toEqual([
      { path: 'type', code: 'unknownCellType', severity: 'error' },
      { path: 'columns[0].renderer', code: 'unknownRenderer', severity: 'error' },
      { path: 'columns[1].editor', code: 'unknownEditor', severity: 'error' },
      { path: 'columns[2].validator', code: 'unknownValidator', severity: 'error' },
    ]);
  });

  test('sees a name registered after both scripts loaded', async () => {
    await schemaPage.registerCellType('late');

    expect(await schemaPage.validate({ type: 'late' })).toEqual([]);
  });

  test('accepts the keys of a plugin registered after both scripts loaded', async () => {
    expect(await schemaPage.validate({ lateOption: 1 })).toEqual([
      { path: 'lateOption', code: 'unknownOption', severity: 'error' },
    ]);

    await schemaPage.registerPlugin('latePlugin', ['latePlugin', 'lateOption']);

    expect(await schemaPage.validate({ latePlugin: true, lateOption: 1 })).toEqual([]);
  });

  test('accepts a hook registered after both scripts loaded', async () => {
    expect(await schemaPage.validate({ afterLateAction: FUNCTION })).toEqual([
      { path: 'afterLateAction', code: 'unknownOption', severity: 'error' },
    ]);

    await schemaPage.registerHook('afterLateAction');

    expect(await schemaPage.validate({ afterLateAction: FUNCTION })).toEqual([]);
  });

  test('warns about an option of a plugin that is off, and reads the plugin state from `hot`', async () => {
    expect(await schemaPage.validate({ filterValueComparator: FUNCTION })).toEqual([
      { path: 'filterValueComparator', code: 'pluginDisabled', severity: 'warning' },
    ]);
    expect(await schemaPage.validate({ filters: true, filterValueComparator: FUNCTION })).toEqual([]);
    // The grid has Filters off, so a payload that leaves `filters` out is still off.
    expect(await schemaPage.validate({ filterValueComparator: FUNCTION }, true)).toEqual([
      { path: 'filterValueComparator', code: 'pluginDisabled', severity: 'warning' },
    ]);

    await schemaPage.updateGridSettings({ filters: true });

    // With Filters on in the grid, the same payload passes: the state came from `hot`.
    expect(await schemaPage.validate({ filterValueComparator: FUNCTION }, true)).toEqual([]);
  });

  test('is not in the main bundle', async ({ page, bundle }) => {
    // The file exists so that every CDN page does not carry the ~50 KB schema.
    const file = bundle === 'umd' ? 'handsontable.js' : 'handsontable.full.min.js';
    const response = await page.request.get(`/handsontable/dist/${file}`);

    expect(response.ok()).toBe(true);
    expect(await response.text()).not.toContain('x-handsontable');
  });
});

/**
 * On a page with an AMD loader the Handsontable bundle registers through `define` and sets no global, so the
 * schema file has to get Handsontable from its AMD dependency instead of a global that is not there.
 */
test.describe('settings schema CDN file with an AMD loader', { tag: BUNDLES_TAG }, () => {
  const loader: SettingsSchemaLoader = 'amd';
  let schemaPage: SettingsSchemaUmdPage;
  let pageErrors: Error[];

  test.beforeEach(async ({ page, theme, bundle }) => {
    pageErrors = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    schemaPage = new SettingsSchemaUmdPage(page, theme, bundle, loader);
    await schemaPage.goto();
    expect(pageErrors).toEqual([]);
  });

  test('loads without a Handsontable global and validates against the module it was given', async ({ page }) => {
    expect(await page.evaluate(() => typeof (window as any).Handsontable)).toBe('undefined');
    expect(await schemaPage.exposedNames()).toEqual(['settingsSchema', 'validateSettings']);
    expect(await schemaPage.validate({ type: 'text', columns: [{ type: 'numeric' }] })).toEqual([]);
    expect(await schemaPage.validate({ type: 'nope' })).toEqual([
      { path: 'type', code: 'unknownCellType', severity: 'error' },
    ]);
  });

  test('sees a plugin registered after both scripts loaded', async () => {
    await schemaPage.registerPlugin('latePlugin', ['latePlugin', 'lateOption']);

    expect(await schemaPage.validate({ latePlugin: true, lateOption: 1 })).toEqual([]);
  });
});
