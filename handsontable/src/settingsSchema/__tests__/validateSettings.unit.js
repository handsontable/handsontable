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
        severity: 'error',
        message: 'Unknown option \'colHeader\'. Did you mean \'colHeaders\'?',
      },
      {
        path: 'columnSort',
        code: 'unknownOption',
        severity: 'error',
        message: 'Unknown option \'columnSort\'. Did you mean \'columnSorting\'?',
      },
    ]);
  });

  it('should report an unknown option with no close match without a suggestion', () => {
    expect(validateSettings({ qwertyuiop: 1 }).problems).toEqual([
      { path: 'qwertyuiop', code: 'unknownOption', severity: 'error', message: 'Unknown option \'qwertyuiop\'.' },
    ]);
  });

  it('should report a value of the wrong type', () => {
    expect(validateSettings({ rowHeaders: 5 }).problems).toEqual([
      {
        path: 'rowHeaders',
        code: 'invalidType',
        severity: 'error',
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
        severity: 'error',
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

  describe('unknown keys inside a plugin settings object', () => {
    it.each([
      [{ filters: { serchMode: 'apply' } }, 'filters.serchMode', 'searchMode'],
      [{ dropdownMenu: { itemz: ['undo'] } }, 'dropdownMenu.itemz', 'items'],
      [{ pagination: { pageSzie: 10 } }, 'pagination.pageSzie', 'pageSize'],
      [{ autoLink: { targett: '_blank' } }, 'autoLink.targett', 'target'],
      [{ asyncValues: { concurrancy: 2 } }, 'asyncValues.concurrancy', 'concurrency'],
      [{ dataProvider: { fetchRow() {} } }, 'dataProvider.fetchRow', 'fetchRows'],
      [{ dragToScroll: { rampDistanse: 5 } }, 'dragToScroll.rampDistanse', 'rampDistance'],
      [{ fillHandle: { directon: 'vertical' } }, 'fillHandle.directon', 'direction'],
      [{ manualColumnFreeze: { restoreColumnPostion: true } }, 'manualColumnFreeze.restoreColumnPostion',
        'restoreColumnPosition'],
      [{ rowSelection: { selectAl: true } }, 'rowSelection.selectAl', 'selectAll'],
      [{ sheetsBar: { postion: 'top' } }, 'sheetsBar.postion', 'position'],
    ])('should report %j with a suggestion', (settings, path, suggestion) => {
      const key = path.split('.')[1];

      expect(validateSettings(settings)).toEqual({
        valid: false,
        problems: [
          {
            path,
            code: 'unknownOption',
            severity: 'error',
            message: `Unknown option '${key}'. Did you mean '${suggestion}'?`,
          },
        ],
      });
    });

    it('should report an unknown key with no close match without a suggestion', () => {
      expect(validateSettings({ pagination: { qwertyuiop: 1 } }).problems).toEqual([
        {
          path: 'pagination.qwertyuiop',
          code: 'unknownOption',
          severity: 'error',
          message: 'Unknown option \'qwertyuiop\'.',
        },
      ]);
    });

    it('should report the unknown key and still check the known ones', () => {
      expect(brief(validateSettings({ filters: { serchMode: 'apply', searchMode: 'everywhere' } }))).toEqual([
        { path: 'filters.searchMode', code: 'invalidValue' },
        { path: 'filters.serchMode', code: 'unknownOption' },
      ]);
    });

    it.each([
      ['filters', { searchMode: 'apply', filterFixedRows: false, availableConditions: ['eq'] }],
      ['dropdownMenu', { items: ['undo'], callback() {}, uiContainer: document.createElement('div') }],
      ['dropdownMenu', { items: ['filter_by_value', '---------', { key: 'custom', name: 'Custom' }] }],
      ['dropdownMenu', { items: { filter_by_value: {}, filter_action_bar: {} }, uiContainer: null }],
      ['pagination', {
        pageSize: 'auto',
        pageSizeList: ['auto', 5, 10],
        initialPage: 1,
        showPageSize: true,
        showCounter: true,
        showNavigation: true,
        uiContainer: document.createElement('div'),
      }],
      ['autoLink', { target: '_blank', schemes: ['https'], inline: true, strict: false, className: 'link' }],
      ['asyncValues', { flush: 'frame', concurrency: 2, copyPendingAs: 'empty', saveToDataProvider: true }],
      ['dataProvider', { fetchRows() {},
        onRowsCreate() {},
        onRowsRemove() {},
        onRowsUpdate() {},
        rowId: 'id',
        refetchAfterCreate: true }],
      ['dataProvider', { fetchRows() {},
        onRowsCreate() {},
        onRowsRemove() {},
        onRowsUpdate() {},
        rowId: row => row.id }],
      ['dragToScroll', { interval: { min: 10, max: 50 }, rampDistance: 30 }],
      ['fillHandle', { direction: 'vertical', autoInsertRow: false }],
      ['manualColumnFreeze', { restoreColumnPosition: true }],
      ['rowSelection', { mode: 'multiRow',
        checkboxes: true,
        headerCheckbox: true,
        selectAll: 'all',
        enableClickSelection: true,
        isRowSelectable() { return true; },
        hideDisabledCheckboxes: false,
        checkboxLocation: 'rowHeader',
        groupSelects: 'self' }],
      ['sheetsBar', { sheets: [{ name: 'One', data: [[1]] }],
        activeSheet: 0,
        controls: true,
        paging: true,
        position: 'top',
        uiContainer: null,
        animation: { add: true } }],
    ])('should accept every documented form of %s: %j', (option, value) => {
      expect(validateSettings({ [option]: value }).problems).toEqual([]);
    });

    it.each([
      ['filters', true], ['dropdownMenu', true], ['dropdownMenu', ['undo']], ['pagination', true],
      ['autoLink', false], ['asyncValues', true], ['dataProvider', null], ['dragToScroll', true],
      ['fillHandle', 'vertical'], ['fillHandle', true], ['manualColumnFreeze', true], ['rowSelection', true],
      ['sheetsBar', true],
    ])('should accept the short form of %s: %j', (option, value) => {
      expect(validateSettings({ [option]: value }).problems).toEqual([]);
    });

    it.each([
      'pagination', 'filters', 'columnSorting', 'hiddenColumns', 'dropdownMenu', 'undo', 'fillHandle', 'sheetsBar',
    ])('should accept `null` for the plugin option %s', (option) => {
      expect(validateSettings({ [option]: null })).toEqual({ valid: true, problems: [] });
    });

    it('should accept `null` for a plugin option on a column', () => {
      expect(validateSettings({ columns: [{ columnSorting: null, filters: null }] }))
        .toEqual({ valid: true, problems: [] });
    });

    it('should still report a wrong type for a plugin option that accepts `null`', () => {
      expect(brief(validateSettings({ pagination: 42 }))).toEqual([{ path: 'pagination', code: 'invalidType' }]);
    });

    it('should accept the closed options inside `columns` and a `cell` entry', () => {
      expect(validateSettings({
        columns: [{ autoLink: { target: '_self' }, filters: { availableConditions: ['eq'] } }],
        cell: [{ row: 0, col: 0, autoLink: { inline: true } }],
      }).problems).toEqual([]);
      expect(brief(validateSettings({ columns: [{ autoLink: { targett: '_self' } }] }))).toEqual([
        { path: 'columns[0].autoLink.targett', code: 'unknownOption' },
      ]);
    });

    it('should not report a key of a settings object the schema leaves open', () => {
      expect(validateSettings({ columnSorting: { whatever: 1 }, contextMenu: { whatever: 1 } }).problems)
        .toEqual([]);
    });

    it('should report a throwing getter of an unknown key without reading it', () => {
      expect(brief(validateSettings({ filters: { get serchMode() { throw new Error('boom'); } } }))).toEqual([
        { path: 'filters.serchMode', code: 'unknownOption' },
      ]);
    });

    it('should report an unreadable settings object and keep checking the other options', () => {
      const unlistable = new Proxy({ pageSize: 5 }, { ownKeys() { throw new Error('boom'); } });

      expect(brief(validateSettings({ pagination: unlistable, rowHeaders: 5 }))).toEqual([
        { path: 'pagination', code: 'invalidValue' },
        { path: 'rowHeaders', code: 'invalidType' },
      ]);
    });

    it('should report an unreadable settings object and go on when a Proxy throws on every trap', () => {
      const proxy = new Proxy({}, {
        ownKeys() { throw new Error('boom'); },
        getOwnPropertyDescriptor() { throw new Error('boom'); },
        get() { throw new Error('boom'); },
      });

      expect(brief(validateSettings({ pagination: proxy, rowHeaders: 5 }))).toEqual([
        { path: 'pagination', code: 'invalidValue' },
        { path: 'rowHeaders', code: 'invalidType' },
      ]);
    });

    it('should skip a key that is set to `undefined`, as the top level does', () => {
      expect(validateSettings({ filters: { serchMode: undefined }, notAnOption: undefined }).problems).toEqual([]);
      expect(brief(validateSettings({ filters: { serchMode: undefined, serchMod: 'apply' } }))).toEqual([
        { path: 'filters.serchMod', code: 'unknownOption' },
      ]);
    });

    it('should say that a key is read at the grid level when it is set per column', () => {
      expect(validateSettings({ columns: [{ filters: { searchMode: 'apply' } }] }).problems).toEqual([
        {
          path: 'columns[0].filters.searchMode',
          code: 'wrongLevel',
          severity: 'error',
          message: '\'searchMode\' can be set at the grid level only.',
        },
      ]);
    });

    it('should not check the fields of a class instance, as for any other check of its contents', () => {
      class Provider {
        constructor() {
          this.baseUrl = 'https://example.com';
        }

        fetchRows() {}

        onRowsCreate() {}

        onRowsRemove() {}

        onRowsUpdate() {}
      }

      expect(validateSettings({ dataProvider: new Provider() }).problems).toEqual([]);
    });

    it('should accept `null` for the callback and the items of the dropdown menu', () => {
      expect(validateSettings({ dropdownMenu: { callback: null, items: null } }).problems).toEqual([]);
    });

    it('should report an own `__proto__` key and ignore the prototype', () => {
      const settings = { pagination: JSON.parse('{"__proto__": 1, "pageSize": 5}') };

      expect(brief(validateSettings(settings))).toEqual([
        { path: 'pagination.__proto__', code: 'unknownOption' },
      ]);
      expect(validateSettings({ pagination: Object.create({ pageSzie: 1 }) }).problems).toEqual([]);
    });

    it('should report an unknown key of the column-level filters', () => {
      expect(brief(validateSettings({ columns: [{ filters: { availableConditions: ['eq'] } }] }))).toEqual([]);
      expect(brief(validateSettings({ columns: [{ filters: { availableConditionz: ['eq'] } }] }))).toEqual([
        { path: 'columns[0].filters.availableConditionz', code: 'unknownOption' },
      ]);
    });
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
        severity: 'error',
        message: '\'currency\' is not a registered cell type.',
      },
      {
        path: 'columns[4].editor',
        code: 'unknownEditor',
        severity: 'error',
        message: '\'fancy\' is not a registered editor.',
      },
      {
        path: 'columns[4].renderer',
        code: 'unknownRenderer',
        severity: 'error',
        message: '\'fancy\' is not a registered renderer.',
      },
      {
        path: 'columns[4].validator',
        code: 'unknownValidator',
        severity: 'error',
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
        severity: 'error',
        message: '\'title\' can be set inside \'columns\' only.',
      },
      {
        path: 'columns[0].fixedRowsTop',
        code: 'wrongLevel',
        severity: 'error',
        message: '\'fixedRowsTop\' can be set at the grid level only.',
      },
      {
        path: 'columns[0].afterChange',
        code: 'wrongLevel',
        severity: 'error',
        message: 'Hooks such as \'afterChange\' can be set at the grid level only.',
      },
      {
        path: 'cell[0].colHeaders',
        code: 'wrongLevel',
        severity: 'error',
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
        severity: 'warning',
        message: 'No row of \'data\' has the property \'nmae\'. Did you mean \'name\'?',
      },
      {
        path: 'columns[3].data',
        code: 'unknownDataProperty',
        severity: 'warning',
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
        severity: 'warning',
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
    expect(brief(validateSettings({ type: 'numeric', colHeaders: true }, { level: 'columns' }))).toEqual([
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
        severity: 'warning',
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

  it.each([
    ['filters', { searchMode: 'apply' }],
    ['dropdownMenu', { items: ['col_left'] }],
    ['pagination', { pageSize: 10 }],
    ['autoLink', { target: '_blank' }],
    ['asyncValues', { flush: 'microtask' }],
    ['dragToScroll', { rampDistance: 30 }],
    ['fillHandle', { direction: 'vertical' }],
    ['manualColumnFreeze', { restoreColumnPosition: true }],
    ['rowSelection', { mode: 'multiRow' }],
    ['sheetsBar', { sheets: [{ name: 'One', data: [[1, 2, 3]] }] }],
  ])('should report no unknown key for the settings of a live grid with %s enabled', (option, value) => {
    const container = document.createElement('div');

    document.body.appendChild(container);

    const hot = new Handsontable(container, {
      // A sheets bar that declares its sheets takes the data from them and warns about `data`.
      ...(option === 'sheetsBar' ? {} : { data: Handsontable.helper.createSpreadsheetData(30, 3) }),
      colHeaders: true,
      [option]: value,
      licenseKey: 'non-commercial-and-evaluation',
    });
    const ownSettings = {};

    // eslint-disable-next-line guard-for-in
    for (const key in hot.getSettings()) {
      ownSettings[key] = hot.getSettings()[key];
    }

    expect(typeof ownSettings[option]).toBe('object');
    expect(validateSettings(ownSettings).problems.filter(({ path }) => path.startsWith(`${option}.`))).toEqual([]);

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
      problems: [
        { path: '', code: 'invalidSettings', severity: 'error', message: 'Expected a settings object, got null.' },
      ],
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
    expect(settingsSchema.properties.afterChange.enum).toEqual([null, false]);
    expect(settingsSchema.$id).toBeUndefined();
    expect(settingsSchema['x-handsontable']).toBeUndefined();
    expect(settingsSchema.properties.afterChange['x-handsontable']).toEqual({
      levels: ['grid'],
      hook: true,
      runtimeTypes: ['function'],
    });
    expect(Object.isFrozen(settingsSchema.properties.stretchH)).toBe(true);
  });

  it('should report a problem of a cyclic settings object once', () => {
    const cyclic = { colHeader: true };

    cyclic.handsontable = cyclic;

    expect(brief(validateSettings(cyclic))).toEqual([{ path: 'colHeader', code: 'unknownOption' }]);
  });

  it('should stop following nested grids after eight levels', () => {
    let settings = { colHeader: true };

    for (let level = 0; level < 20; level += 1) {
      settings = { colHeader: true, handsontable: settings };
    }

    expect(validateSettings(settings).problems.length).toBe(9);
  });

  it('should not throw on bad options, and report an unknown level', () => {
    expect(() => validateSettings({}, null)).not.toThrow();
    expect(validateSettings({ colHeaders: true }, null).problems).toEqual([]);
    expect(validateSettings({}, { level: 'row' }).problems).toEqual([
      {
        path: '',
        code: 'invalidSettings',
        severity: 'error',
        message: 'Unknown level \'row\'. Expected \'grid\', \'columns\', \'cells\', or \'cell\'.',
      },
    ]);
    expect(brief(validateSettings({}, { level: 'toString' }))).toEqual([{ path: '', code: 'invalidSettings' }]);
  });

  it('should keep the problems found before a read that throws deep inside', () => {
    const throwingRow = new Proxy({}, { ownKeys() { throw new Error('boom'); } });

    expect(brief(validateSettings({
      colHeader: true,
      filters: { get searchMode() { throw new Error('boom'); } },
      data: [throwingRow],
      columns: [{ data: 'name' }],
    }))).toEqual([
      { path: 'colHeader', code: 'unknownOption' },
      { path: 'filters.searchMode', code: 'invalidValue' },
      // The row's keys cannot be listed, so it has no `name` the check can find.
      { path: 'columns[0].data', code: 'unknownDataProperty' },
    ]);
  });

  it('should accept a hook set to undefined, null, or false, at any level', () => {
    expect(validateSettings({
      afterChange: undefined,
      beforeChange: null,
      afterSelection: false,
      columns: [{ afterChange: undefined }],
    }).problems).toEqual([]);
  });

  it('should report a hook array that holds something other than a function', () => {
    expect(validateSettings({ afterChange: [() => {}, 1] }).problems).toEqual([
      {
        path: 'afterChange',
        code: 'invalidType',
        severity: 'error',
        message: 'Expected a function or an array of functions, got an array that holds something else.',
      },
    ]);
  });

  it('should suggest an option for a removed hook name that is close to one', () => {
    expect(validateSettings({ hiddenColumn: true }).problems[0].message)
      .toBe('\'hiddenColumn\' is a hook that was removed in 8.0.0. Did you mean \'hiddenColumns\'?');
  });

  it('should report a removed hook with the version it was removed in', () => {
    expect(validateSettings({ modifyRow() {} }).problems).toEqual([
      {
        path: 'modifyRow',
        code: 'unknownOption',
        severity: 'error',
        message: '\'modifyRow\' is a hook that was removed in 8.0.0. Did you mean \'modifyRowData\'?',
      },
    ]);
  });

  it('should report only the wrong rows of mixed data, judged against the shape most rows have', () => {
    const data = Array.from({ length: 40 }, (_, row) => ({ name: `Ana ${row}` }));

    data[3] = 'Ana';

    expect(validateSettings({ data }).problems).toEqual([
      { path: 'data[3]', code: 'invalidType', severity: 'error', message: 'Expected an object, got a string.' },
    ]);
  });

  it('should type-check only a sample of a long data set', () => {
    const data = Array.from({ length: 200000 }, () => ({ name: 'Ana' }));

    data[100] = 'Ana';
    data[199999] = 'Ana';

    expect(validateSettings({ data }).problems).toEqual([]);

    data[10] = 'Ana';

    expect(brief(validateSettings({ data }))).toEqual([{ path: 'data[10]', code: 'invalidType' }]);
  });

  it('should check a plain object or an array given where a class instance is also accepted', () => {
    class Builder {}

    expect(validateSettings({ theme: new Builder() }).problems).toEqual([]);
    expect(validateSettings({ theme: 'ht-theme-main' }).problems).toEqual([]);
    expect(brief(validateSettings({ theme: [] }))).toEqual([{ path: 'theme', code: 'invalidType' }]);
  });

  it('should report the key of a built-in plugin that is not one of its options', () => {
    expect(brief(validateSettings({ undoRedo: true, autofill: true, columns: [{ undoRedo: false }] }))).toEqual([
      { path: 'undoRedo', code: 'unknownOption' },
      { path: 'autofill', code: 'unknownOption' },
      { path: 'columns[0].undoRedo', code: 'unknownOption' },
    ]);
    expect(validateSettings({ undo: true, fillHandle: true }).problems).toEqual([]);
  });

  it('should read a column property the way the grid does: own key first, getters along a path', () => {
    class Employee {
      get fullName() {
        return 'Ana Garcia';
      }

      get address() {
        return { city: 'Lisbon' };
      }
    }

    // The grid reads a plain key only when the row owns it, so `fullName` renders an empty cell.
    expect(brief(validateSettings({
      data: [new Employee()],
      columns: [{ data: 'fullName' }, { data: 'address.city' }],
    }))).toEqual([{ path: 'columns[0].data', code: 'unknownDataProperty' }]);
    expect(brief(validateSettings({ data: [{ name: 'Ana' }], columns: [{ data: 'toString' }] }))).toEqual([
      { path: 'columns[0].data', code: 'unknownDataProperty' },
    ]);
  });

  it('should report a value of the wrong type once, not again for its plugin or registry', () => {
    expect(brief(validateSettings({ filterValueComparator: 42, type: 7 }))).toEqual([
      { path: 'filterValueComparator', code: 'invalidType' },
      { path: 'type', code: 'invalidType' },
    ]);
  });

  it('should read a dotted column property as a key when dataDotNotation is off', () => {
    expect(brief(validateSettings({
      dataDotNotation: false,
      data: [{ 'address.city': 'Lisbon', address: { zip: '1000' } }],
      columns: [{ data: 'address.city' }, { data: 'address.zip' }],
    }))).toEqual([{ path: 'columns[1].data', code: 'unknownDataProperty' }]);
  });

  it('should not check column properties against data that is not an array', () => {
    expect(validateSettings({ data: 'rows', columns: [{ data: 'name' }] }).problems.map(({ path }) => path))
      .toEqual(['data']);
  });

  it('should report a negative cell position', () => {
    expect(validateSettings({ cell: [{ row: -1, col: 0, readOnly: true }] }).problems).toEqual([
      {
        path: 'cell[0].row',
        code: 'invalidValue',
        severity: 'error',
        message: 'Expected a number of at least 0, got -1.',
      },
    ]);
  });

  it('should accept an array as the data schema', () => {
    expect(validateSettings({ dataSchema: [null, null] }).problems).toEqual([]);
  });

  it('should not report a plugin as off for one column checked on its own', () => {
    expect(validateSettings({ filterValueComparator: () => 0 }, { level: 'columns' }).problems).toEqual([]);
    expect(brief(validateSettings({ columns: [{ filterValueComparator: () => 0 }] }))).toEqual([
      { path: 'columns[0].filterValueComparator', code: 'pluginDisabled' },
    ]);
  });

  it('should treat a destroyed instance as one with no rows', () => {
    const container = document.createElement('div');

    document.body.appendChild(container);

    const hot = new Handsontable(container, { data: [{ name: 'A' }], licenseKey: 'non-commercial-and-evaluation' });

    hot.destroy();
    container.remove();

    expect(validateSettings({ columns: [{ data: 'agee' }], filterValueComparator: () => 0 }, { hot }).problems)
      .toEqual([]);
  });

  it('should not take a key of Object.prototype for an option', () => {
    expect(brief(validateSettings(JSON.parse('{"__proto__": {}, "constructor": 1, "toString": 2}')))).toEqual([
      { path: '__proto__', code: 'unknownOption' },
      { path: 'constructor', code: 'unknownOption' },
      { path: 'toString', code: 'unknownOption' },
    ]);
    expect(brief(validateSettings({ columns: [{ hasOwnProperty: 1 }] }))).toEqual([
      { path: 'columns[0].hasOwnProperty', code: 'unknownOption' },
    ]);
  });

  it('should keep the settings valid when only warnings are found', () => {
    const result = validateSettings({
      data: [{ name: 'Ana' }],
      columns: [{ data: 'nmae' }],
      filterValueComparator: () => 0,
    });

    expect(result.valid).toBe(true);
    expect(result.problems.map(({ code, severity }) => ({ code, severity }))).toEqual([
      { code: 'unknownDataProperty', severity: 'warning' },
      { code: 'pluginDisabled', severity: 'warning' },
    ]);
  });

  it('should accept ariaTags set per column', () => {
    expect(validateSettings({ columns: [{ ariaTags: false }] }).problems).toEqual([]);
  });

  it('should check the object a cells function returns with the cells level', () => {
    expect(validateSettings({ readOnly: true, comment: { value: 'Checked' } }, { level: 'cells' }).problems)
      .toEqual([]);
    expect(brief(validateSettings({ colHeaders: true }, { level: 'cells' }))).toEqual([
      { path: 'colHeaders', code: 'wrongLevel' },
    ]);
  });

  it('should not report an object option given as an array, except the data schema', () => {
    expect(brief(validateSettings({ hiddenColumns: [1, 2] }))).toEqual([
      { path: 'hiddenColumns', code: 'invalidType' },
    ]);
    expect(validateSettings({ dataSchema: [null, null] }).problems).toEqual([]);
  });

  it('should not check column properties against a data schema function', () => {
    expect(validateSettings({
      data: [{ a: 1 }],
      dataSchema: () => ({ a: null, b: null }),
      columns: [{ data: 'a' }, { data: 'b' }],
    }).problems).toEqual([]);
  });

  it('should follow a column property through an array and past an empty step', () => {
    expect(validateSettings({
      data: [{ items: [{ name: 'Mouse' }], address: null }],
      columns: [{ data: 'items.0.name' }, { data: 'address.city' }],
    }).problems).toEqual([]);
  });
  it('should accept the keys of a plugin that declares only its setting keys', () => {
    class OptionsOnlyPlugin extends BasePlugin {
      static get SETTING_KEYS() {
        return ['optionsOnlyOption'];
      }
    }

    registerPlugin('optionsOnly', OptionsOnlyPlugin);

    expect(validateSettings({ optionsOnlyOption: true }).problems).toEqual([]);
  });

  it('should skip a hole in an array, as the grid does', () => {
    expect(validateSettings({ colWidths: [100, undefined, 200] }).problems).toEqual([]);
  });
});
