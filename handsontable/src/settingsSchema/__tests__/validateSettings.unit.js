import Handsontable from 'handsontable';
import { validateSettings, settingsSchema } from 'handsontable/settingsSchema';
import { BasePlugin } from 'handsontable/plugins/base';
import { registerPlugin } from 'handsontable/plugins/registry';
import { Hooks } from 'handsontable/core/hooks';

/**
 * Reduces the problems to their path and code, for the cases that do not pin the wording.
 *
 * @param {object} result The validation result.
 * @returns {object[]}
 */
function brief(result) {
  return result.problems.map(({ path, code }) => ({ path, code }));
}

describe('validateSettings', () => {
  it('should accept a valid configuration', () => {
    const result = validateSettings({
      data: [['A1', 'B1'], ['A2', 'B2']],
      colHeaders: ['A', 'B'],
      rowHeaders: true,
      stretchH: 'all',
      height: 'auto',
      width: 400,
      licenseKey: 'non-commercial-and-evaluation',
      columns: [
        { type: 'text' },
        { type: 'numeric', numericFormat: { pattern: '0,0.00' }, readOnly: true },
      ],
      filters: true,
      dropdownMenu: true,
      afterChange() {},
    });

    expect(result).toEqual({ valid: true, problems: [] });
  });

  it('should report a misspelled option with a suggestion', () => {
    const result = validateSettings({ colHeader: true, columnSort: true });

    expect(result.valid).toBe(false);
    expect(result.problems).toEqual([
      {
        path: 'colHeader',
        code: 'unknownOption',
        message: 'Unknown option \'colHeader\'. Did you mean \'colHeaders\'?',
      },
      {
        path: 'columnSort',
        code: 'unknownOption',
        message: 'Unknown option \'columnSort\'. Did you mean \'columnSorting\'?',
      },
    ]);
  });

  it('should report an unknown option with no close match without a suggestion', () => {
    expect(validateSettings({ qwertyuiop: 1 }).problems).toEqual([
      { path: 'qwertyuiop', code: 'unknownOption', message: 'Unknown option \'qwertyuiop\'.' },
    ]);
  });

  it('should report a value of the wrong type', () => {
    expect(validateSettings({ rowHeaders: 5 }).problems).toEqual([
      {
        path: 'rowHeaders',
        code: 'invalidType',
        message: 'Expected an array, a boolean, or a function, got a number.',
      },
    ]);
    expect(brief(validateSettings({ readOnly: 'yes', fixedRowsTop: '2' }))).toEqual([
      { path: 'readOnly', code: 'invalidType' },
      { path: 'fixedRowsTop', code: 'invalidType' },
    ]);
  });

  it('should report a value outside the allowed set', () => {
    expect(validateSettings({ stretchH: 'full' }).problems).toEqual([
      {
        path: 'stretchH',
        code: 'invalidValue',
        message: 'Expected one of \'none\', \'all\', \'last\', got \'full\'.',
      },
    ]);
  });

  it('should check nested values and point at them', () => {
    expect(brief(validateSettings({ filters: { searchMode: 'everywhere' } }))).toEqual([
      { path: 'filters.searchMode', code: 'invalidValue' },
    ]);
    expect(brief(validateSettings({ colHeaders: ['A', 2] }))).toEqual([
      { path: 'colHeaders[1]', code: 'invalidType' },
    ]);
  });

  it('should accept a function where the option takes one', () => {
    const result = validateSettings({
      renderer(instance, td) { return td; },
      cells() { return {}; },
      columns() { return {}; },
      colHeaders: col => `Column ${col}`,
      validator: /^\d+$/,
    });

    expect(result.problems).toEqual([]);
  });

  it('should report a function where the option takes none', () => {
    expect(brief(validateSettings({ stretchH() {} }))).toEqual([
      { path: 'stretchH', code: 'invalidType' },
    ]);
  });

  it('should report names that are not registered', () => {
    const result = validateSettings({
      columns: [
        { type: 'text' },
        { type: 'numeric' },
        { type: 'date' },
        { type: 'currency' },
        { editor: 'fancy', renderer: 'fancy', validator: 'fancy' },
      ],
    });

    expect(result.problems).toEqual([
      {
        path: 'columns[3].type',
        code: 'unknownCellType',
        message: '\'currency\' is not a registered cell type.',
      },
      {
        path: 'columns[4].editor',
        code: 'unknownEditor',
        message: '\'fancy\' is not a registered editor.',
      },
      {
        path: 'columns[4].renderer',
        code: 'unknownRenderer',
        message: '\'fancy\' is not a registered renderer.',
      },
      {
        path: 'columns[4].validator',
        code: 'unknownValidator',
        message: '\'fancy\' is not a registered validator.',
      },
    ]);
  });

  it('should accept `editor: false`', () => {
    expect(validateSettings({ columns: [{ editor: false }] }).problems).toEqual([]);
  });

  it('should report an option set at a level it is not read at', () => {
    const result = validateSettings({
      title: 'Grid',
      columns: [{ fixedRowsTop: 1, afterChange() {} }],
      cell: [{ row: 0, col: 0, colHeaders: true }],
    });

    expect(result.problems).toEqual([
      {
        path: 'title',
        code: 'wrongLevel',
        message: '\'title\' can be set inside \'columns\' only.',
      },
      {
        path: 'columns[0].fixedRowsTop',
        code: 'wrongLevel',
        message: '\'fixedRowsTop\' can be set at the grid level only.',
      },
      {
        path: 'columns[0].afterChange',
        code: 'wrongLevel',
        message: 'Hooks such as \'afterChange\' can be set at the grid level only.',
      },
      {
        path: 'cell[0].colHeaders',
        code: 'wrongLevel',
        message: '\'colHeaders\' can be set at the grid level only.',
      },
    ]);
  });

  it('should accept the column-level forms of `data` and `filters`', () => {
    expect(validateSettings({
      data: [{ name: 'A', meta: { age: 1 } }],
      filters: true,
      columns: [{ data: 'name', filters: false }, { data: 'meta.age' }],
    }).problems).toEqual([]);
  });

  it('should report a column property that no data row has', () => {
    const result = validateSettings({
      data: [{ name: 'A', address: { city: 'X' } }, { name: 'B' }],
      columns: [{ data: 'name' }, { data: 'nmae' }, { data: 'address.city' }, { data: 'address.zip' }],
    });

    expect(result.problems).toEqual([
      {
        path: 'columns[1].data',
        code: 'unknownDataProperty',
        message: 'No row of \'data\' has the property \'nmae\'. Did you mean \'name\'?',
      },
      {
        path: 'columns[3].data',
        code: 'unknownDataProperty',
        message: 'No row of \'data\' has the property \'address.zip\'.',
      },
    ]);
  });

  it('should report a column index past the data rows', () => {
    expect(brief(validateSettings({
      data: [[1, 2], [3, 4]],
      columns: [{ data: 0 }, { data: 1 }, { data: 5 }],
    }))).toEqual([
      { path: 'columns[2].data', code: 'unknownDataProperty' },
    ]);
  });

  it('should not check column properties without data rows, or against a data schema', () => {
    expect(validateSettings({ columns: [{ data: 'anything' }] }).problems).toEqual([]);
    expect(validateSettings({ data: [], columns: [{ data: 'anything' }] }).problems).toEqual([]);
    expect(validateSettings({
      data: [{ a: 1 }],
      dataSchema: { a: null, b: null },
      columns: [{ data: 'a' }, { data: 'b' }],
    }).problems).toEqual([]);
  });

  it('should report an option of a plugin that is turned off', () => {
    expect(validateSettings({ filterValueComparator: () => 0 }).problems).toEqual([
      {
        path: 'filterValueComparator',
        code: 'pluginDisabled',
        message: '\'filterValueComparator\' has no effect while the Filters plugin is off. ' +
          'Set \'filters\' to enable it.',
      },
    ]);
    expect(validateSettings({ filters: true, filterValueComparator: () => 0 }).problems).toEqual([]);
  });

  it('should check the entries of `cell`', () => {
    expect(brief(validateSettings({ cell: [{ row: 0, col: 0, readOnly: true }, { readOnly: true }] }))).toEqual([
      { path: 'cell[1]', code: 'invalidValue' },
    ]);
  });

  it('should validate a single column or cell with the `level` option', () => {
    expect(brief(validateSettings({ type: 'numeric', colHeaders: true }, { level: 'column' }))).toEqual([
      { path: 'colHeaders', code: 'wrongLevel' },
    ]);
    expect(brief(validateSettings({ readOnly: 1 }, { level: 'cell' }))).toEqual([
      { path: 'readOnly', code: 'invalidType' },
    ]);
  });

  it('should validate the nested grid of the `handsontable` cell type', () => {
    expect(brief(validateSettings({
      columns: [{ type: 'handsontable', handsontable: { colHeader: true, data: [] } }],
    }))).toEqual([
      { path: 'columns[0].handsontable.colHeader', code: 'unknownOption' },
    ]);
  });

  it('should accept the internal keys of a settings object and the license key', () => {
    expect(validateSettings({
      licenseKey: 'non-commercial-and-evaluation',
      preventWheel: false,
      _userDefinedMetaProps: new Set(),
    }).problems).toEqual([]);
  });

  it('should accept every hook at the grid level, and report a hook that is not a function', () => {
    expect(validateSettings({ beforeChange() {}, afterInit() {}, afterOnCellMouseDown: [() => {}] }).problems)
      .toEqual([]);
    expect(brief(validateSettings({ afterChange: true }))).toEqual([
      { path: 'afterChange', code: 'invalidType' },
    ]);
  });

  it('should accept the keys of a registered third-party plugin and a custom hook', () => {
    class MyPlugin extends BasePlugin {
      static get PLUGIN_KEY() {
        return 'myPlugin';
      }

      static get SETTING_KEYS() {
        return ['myPlugin', 'myPluginOption'];
      }
    }

    registerPlugin(MyPlugin);
    Hooks.getSingleton().register('afterMyPluginAction');

    expect(validateSettings({ myPlugin: { anything: 1 }, myPluginOption: 2, afterMyPluginAction() {} }).problems)
      .toEqual([]);
  });

  it('should read the data rows and the plugin state of `hot` for a partial update', () => {
    const container = document.createElement('div');

    document.body.appendChild(container);

    const hot = new Handsontable(container, {
      data: [{ name: 'A', age: 1 }],
      filters: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    expect(validateSettings({ columns: [{ data: 'name' }, { data: 'agee' }] }, { hot }).problems).toEqual([
      {
        path: 'columns[1].data',
        code: 'unknownDataProperty',
        message: 'No row of \'data\' has the property \'agee\'. Did you mean \'age\'?',
      },
    ]);
    expect(validateSettings({ filterValueComparator: () => 0 }, { hot }).problems).toEqual([]);

    hot.destroy();
    container.remove();
  });

  it('should report nothing for the settings of a live grid', () => {
    const container = document.createElement('div');

    document.body.appendChild(container);

    const hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      rowHeaders: true,
      columns: [{}, { type: 'numeric' }, { type: 'checkbox' }],
      licenseKey: 'non-commercial-and-evaluation',
    });
    const settings = hot.getSettings();
    const ownSettings = {};

    // The settings object holds the defaults on its prototype chain; copy them all.
    // eslint-disable-next-line guard-for-in
    for (const key in settings) {
      ownSettings[key] = settings[key];
    }

    expect(validateSettings(ownSettings).problems).toEqual([]);

    hot.destroy();
    container.remove();
  });

  it('should never throw, whatever the input', () => {
    const cyclic = { colHeaders: true };

    cyclic.handsontable = cyclic;

    const throwing = {};

    Object.defineProperty(throwing, 'colHeaders', { enumerable: true, get() { throw new Error('boom'); } });

    const revoked = Proxy.revocable({}, {});

    revoked.revoke();

    [null, undefined, 1, 'text', [], () => {}, new Date(), cyclic, throwing, revoked.proxy,
      { columns: [null, 1, 'x'] }, { cell: 'x' }, { data: [null, 1] }, { columns: [{ data: 'a' }], data: [null] },
    ].forEach((input) => {
      expect(() => validateSettings(input)).not.toThrow();
    });

    expect(validateSettings(null)).toEqual({
      valid: false,
      problems: [{ path: '', code: 'invalidSettings', message: 'Expected a settings object, got null.' }],
    });
    expect(brief(validateSettings(throwing))).toEqual([{ path: 'colHeaders', code: 'invalidValue' }]);
    expect(brief(validateSettings(revoked.proxy))).toEqual([{ path: '', code: 'invalidSettings' }]);
    expect(brief(validateSettings({ columns: [null] }))).toEqual([{ path: 'columns[0]', code: 'invalidType' }]);
  });

  it('should not call functions or change the input', () => {
    const columns = jest.fn(() => ({}));
    const cells = jest.fn(() => ({}));
    const settings = Object.freeze({
      columns,
      cells,
      colHeaders: Object.freeze(['A']),
      filters: Object.freeze({ searchMode: 'apply' }),
    });

    expect(validateSettings(settings).problems).toEqual([]);
    expect(columns).not.toHaveBeenCalled();
    expect(cells).not.toHaveBeenCalled();
  });

  it('should export a JSON-serializable schema with the hooks', () => {
    expect(JSON.parse(JSON.stringify(settingsSchema))).toEqual(settingsSchema);
    expect(settingsSchema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(settingsSchema.properties.stretchH.enum).toEqual(['none', 'all', 'last']);
    expect(settingsSchema.properties.afterChange['x-handsontable']).toEqual({
      levels: ['grid'],
      hook: true,
      runtimeTypes: ['function'],
    });
    expect(Object.isFrozen(settingsSchema.properties.stretchH)).toBe(true);
  });
});
