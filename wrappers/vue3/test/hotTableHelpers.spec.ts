import Handsontable from 'handsontable/base';
import {
  getPassedHookKeys,
  prepareSettings,
  propFactory,
  recordSettingBaselines,
  SettingBaselines
} from '../src/helpers';

type GridSettings = Handsontable.GridSettings;

describe('propFactory', () => {
  it('should generate an object containing all the available Handsontable properties and plugin hooks', () => {
    const props = propFactory('HotTable');

    expect(typeof props.startRows).toBe('object');
    expect(typeof props.startCols).toBe('object');
    expect(typeof props.data).toBe('object');
    expect(typeof props.fixedRowsTop).toBe('object');
    expect(typeof props.afterCreateRow).toBe('object');
    expect(typeof props.afterGetCellMeta).toBe('object');
    expect(typeof props.beforeInit).toBe('object');
    expect(typeof (props as Record<string, unknown>).randomProp).toBe('undefined');
  });

  it('should expose the NestedRows collapse and expand hooks as props', () => {
    const props = propFactory('HotTable');

    expect(typeof props.beforeRowCollapse).toBe('object');
    expect(typeof props.afterRowCollapse).toBe('object');
    expect(typeof props.beforeRowExpand).toBe('object');
    expect(typeof props.afterRowExpand).toBe('object');
  });
});

describe('getPassedHookKeys', () => {
  it('should list the hooks passed a callback, directly or through the `settings` prop', () => {
    const callback = jest.fn();

    expect(getPassedHookKeys({
      afterChange: callback,
      beforeChange: callback,
      afterSelection: undefined,
      afterScroll: null,
      width: 300,
      settings: { afterLoadData: callback },
    })).toEqual(['afterLoadData', 'afterChange', 'beforeChange']);
  });
});

describe('prepareSettings', () => {
  it('should prepare the settings passed to the component props to be used within Handsontable', () => {
    const propsMock = {
      id: 'hot-id',
      readOnly: true,
      colHeaders: true,
      beforeRemoveCellClassNames: () => ['beforeRemoveCellClassNamesResult'],
      settings: {
        rowHeaders: true,
        data: [[1, 2], [3, 4]],
        beforeChange: () => true
      }
    };

    const preparedSettings = prepareSettings(propsMock);

    expect(preparedSettings.readOnly).toBe(true);
    expect(preparedSettings.colHeaders).toBe(true);
    expect(preparedSettings.rowHeaders).toBe(true);
    expect(preparedSettings.data).toEqual([[1, 2], [3, 4]]);
    expect(preparedSettings.beforeChange([], 'auto')).toBe(true);
    expect(preparedSettings.beforeRemoveCellClassNames()).toEqual(['beforeRemoveCellClassNamesResult']);
    expect(preparedSettings.id).toBe(undefined);
    expect(preparedSettings.settings).toBe(undefined);
  });

  it('should handle settings with circular structure', () => {
    const circularStructure = { foo: 'bar', myself: {} };

    circularStructure.myself = circularStructure;

    const propsMockCircular = {
      readOnly: true,
      whatever: circularStructure
    };

    const preparedSettings = prepareSettings(propsMockCircular, {});

    expect(preparedSettings.readOnly).toBe(true);
    expect(preparedSettings.whatever.foo).toBe('bar');
    expect(preparedSettings.whatever.myself.foo).toBe('bar');
  });

  it('should not recognize passing of the same array twice as a changed object', () => {
    const settings1: GridSettings = {
      mergeCells: [{ row: 1, col: 1, colspan: 1, rowspan: 1 }],
    };

    const preparedSettings = prepareSettings({ settings: settings1 }, settings1);

    expect(preparedSettings.mergeCells).toBe(undefined);
    expect(Object.keys(preparedSettings).length).toBe(0);
  });

  describe('themeName', () => {
    // Core moves `themeName` into `theme` and keeps `getSettings().themeName` empty.
    const currentSettings = { theme: 'ht-theme-main', themeName: undefined } as GridSettings;

    it('should not send a `themeName` the grid already uses as its `theme`', () => {
      expect(prepareSettings({ themeName: 'ht-theme-main' }, currentSettings)).toEqual({});
      expect(prepareSettings({ settings: { themeName: 'ht-theme-main' } }, currentSettings)).toEqual({});
      expect(prepareSettings({ settings: { colHeaders: true }, themeName: 'ht-theme-main' }, currentSettings))
        .toEqual({ colHeaders: true });
    });

    it('should send a `themeName` that differs from the grid\'s `theme`', () => {
      expect(prepareSettings({ themeName: 'ht-theme-horizon' }, currentSettings))
        .toEqual({ themeName: 'ht-theme-horizon' });
      expect(prepareSettings({ settings: { colHeaders: true }, themeName: 'ht-theme-horizon' }, currentSettings))
        .toEqual({ colHeaders: true, themeName: 'ht-theme-horizon' });
    });

    it('should send `themeName` when the grid\'s `theme` is not a name', () => {
      const themeObjectSettings = { theme: { name: 'custom' }, themeName: undefined } as unknown as GridSettings;

      expect(prepareSettings({ themeName: 'ht-theme-main' }, themeObjectSettings))
        .toEqual({ themeName: 'ht-theme-main' });
    });

    it('should send `themeName` when there are no current settings', () => {
      expect(prepareSettings({ themeName: 'ht-theme-main' })).toEqual({ themeName: 'ht-theme-main' });
    });
  });

  it('should skip init-only settings when current settings contain _initOnlySettings', () => {
    const currentSettings = {
      renderAllRows: false,
      renderAllColumns: false,
      layoutDirection: 'ltr' as const,
      ariaTags: true,
      width: 300,
      _initOnlySettings: ['renderAllRows', 'renderAllColumns', 'layoutDirection', 'ariaTags'],
    } as GridSettings;
    const propsMock = {
      renderAllRows: true,
      renderAllColumns: true,
      layoutDirection: 'rtl' as const,
      ariaTags: false,
      width: 500,
    };

    const preparedSettings = prepareSettings(propsMock, currentSettings);

    expect(preparedSettings.renderAllRows).toBe(undefined);
    expect(preparedSettings.renderAllColumns).toBe(undefined);
    expect(preparedSettings.layoutDirection).toBe(undefined);
    expect(preparedSettings.ariaTags).toBe(undefined);
    expect(preparedSettings.width).toBe(500);
  });

  it('should send `null` for a hook the previous props passed and the current props do not', () => {
    const afterChange = jest.fn();
    const beforeChange = jest.fn();
    const currentSettings = { afterChange, beforeChange, afterSelection: afterChange };

    expect(prepareSettings(
      { beforeChange, afterChange: undefined },
      currentSettings,
      ['afterChange', 'beforeChange']
    )).toEqual({ afterChange: null });
    expect(prepareSettings(
      { settings: { beforeChange } },
      currentSettings,
      ['afterChange', 'beforeChange']
    )).toEqual({ afterChange: null });
    expect(prepareSettings({ width: 300 }, currentSettings)).toEqual({ width: 300 });
  });

  it('should include init-only settings during initial call (no currentSettings)', () => {
    const propsMock = {
      renderAllRows: true,
      width: 300,
    };

    const preparedSettings = prepareSettings(propsMock);

    expect(preparedSettings.renderAllRows).toBe(true);
    expect(preparedSettings.width).toBe(300);
  });

  // Regression: GH #11220 - cell edit threw "Cannot read properties of undefined (reading 'wtTable')"
  // when contextMenu/dropdownMenu had `uiContainer: <DOM element>` and the comparison via
  // JSON.stringify walked into an object whose getter threw.
  it('should not throw when settings contain a DOM element (uiContainer pattern)', () => {
    const el = document.createElement('div');
    const settingsObj = {
      contextMenu: { uiContainer: el, items: ['row_above', 'row_below'] },
    } as GridSettings;

    expect(() => prepareSettings(settingsObj, settingsObj)).not.toThrow();
  });

  it('should not throw when comparing settings that contain a value whose getter throws', () => {
    const obj: { uiContainer?: unknown } = {};

    Object.defineProperty(obj, 'parentTableOffset', {
      enumerable: true,
      get() {
        throw new TypeError('Cannot read properties of undefined (reading \'wtTable\')');
      },
    });

    const propsMock = {
      contextMenu: { uiContainer: obj, items: ['row_above'] },
    } as GridSettings;
    const currentSettings = {
      contextMenu: { uiContainer: obj, items: ['row_above'] },
    } as GridSettings;

    expect(() => prepareSettings(propsMock, currentSettings)).not.toThrow();
  });

  it('should treat settings with the same DOM element reference as unchanged', () => {
    const el = document.createElement('div');
    const cm = { uiContainer: el, items: ['row_above'] };
    const propsMock = { contextMenu: cm } as GridSettings;
    const currentSettings = { contextMenu: cm } as GridSettings;

    const preparedSettings = prepareSettings(propsMock, currentSettings);

    expect(preparedSettings.contextMenu).toBe(undefined);
  });

  it('should treat settings with different DOM element references as changed', () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    const propsMock = { contextMenu: { uiContainer: el1, items: ['row_above'] } } as GridSettings;
    const currentSettings = { contextMenu: { uiContainer: el2, items: ['row_above'] } } as GridSettings;

    const preparedSettings = prepareSettings(propsMock, currentSettings);

    expect(preparedSettings.contextMenu).toEqual(propsMock.contextMenu);
  });

  describe('a setting the app replaced through the instance', () => {
    const syncedHeaders = ['A', 'B'];

    it('should leave out a prop that is the same value the wrapper synced', () => {
      const baselines: SettingBaselines = {};
      const overriddenKeys: string[] = [];

      recordSettingBaselines(baselines, { colHeaders: syncedHeaders } as GridSettings, { colHeaders: syncedHeaders });

      const preparedSettings = prepareSettings(
        { colHeaders: syncedHeaders } as GridSettings,
        { colHeaders: ['X', 'Y'] } as GridSettings,
        [],
        baselines,
        overriddenKeys
      );

      expect(preparedSettings.colHeaders).toBe(undefined);
      expect(overriddenKeys).toEqual(['colHeaders']);
    });

    it('should leave out a new array with the content the wrapper synced', () => {
      const baselines: SettingBaselines = {};

      recordSettingBaselines(baselines, { colHeaders: syncedHeaders } as GridSettings, { colHeaders: syncedHeaders });

      const preparedSettings = prepareSettings(
        { colHeaders: ['A', 'B'] } as GridSettings,
        { colHeaders: ['X', 'Y'] } as GridSettings,
        [],
        baselines
      );

      expect(preparedSettings.colHeaders).toBe(undefined);
    });

    it('should leave out a prop the grid edited in place, as `alter()` does, when the app replaced it', () => {
      const baselines: SettingBaselines = {};
      const headers = ['A', 'B'];

      recordSettingBaselines(baselines, { colHeaders: headers } as GridSettings, { colHeaders: headers });

      headers.splice(2, 0, undefined as unknown as string);

      const preparedSettings = prepareSettings(
        { colHeaders: headers } as GridSettings,
        { colHeaders: ['A', 'B', 'Test'] } as GridSettings,
        [],
        baselines
      );

      expect(preparedSettings.colHeaders).toBe(undefined);
    });

    it('should compare `sheetsBar` by reference only, with no copy of its sheets', () => {
      const baselines: SettingBaselines = {};
      const sheetsBar = { sheets: [{ name: 'One', data: [[1]] }] };

      recordSettingBaselines(baselines, { sheetsBar } as GridSettings, { sheetsBar });

      expect(baselines.sheetsBar.copy).toBe(undefined);

      const preparedSettings = prepareSettings(
        { sheetsBar: { sheets: [{ name: 'One', data: [[1]] }] } } as GridSettings,
        { sheetsBar: { sheets: [] } } as GridSettings,
        [],
        baselines
      );

      expect(preparedSettings.sheetsBar).toBeDefined();
    });

    it('should send a new array whose content differs from what the wrapper synced', () => {
      const baselines: SettingBaselines = {};

      recordSettingBaselines(baselines, { colHeaders: syncedHeaders } as GridSettings, { colHeaders: syncedHeaders });

      const newHeaders = ['A', 'C'];
      const preparedSettings = prepareSettings(
        { colHeaders: newHeaders } as GridSettings,
        { colHeaders: ['X', 'Y'] } as GridSettings,
        [],
        baselines
      );

      expect(preparedSettings.colHeaders).toBe(newHeaders);
    });

    it('should send a prop whose value changed since the wrapper synced it', () => {
      const baselines: SettingBaselines = {};

      recordSettingBaselines(baselines, { colHeaders: syncedHeaders } as GridSettings, { colHeaders: syncedHeaders });

      const newHeaders = ['P', 'Q'];
      const preparedSettings = prepareSettings(
        { colHeaders: newHeaders } as GridSettings,
        { colHeaders: ['X', 'Y'] } as GridSettings,
        [],
        baselines
      );

      expect(preparedSettings.colHeaders).toBe(newHeaders);
    });

    it('should compare a prop with the grid when the grid still holds the value the wrapper synced', () => {
      const baselines: SettingBaselines = {};
      const headers = ['A', 'B'];

      recordSettingBaselines(baselines, { colHeaders: headers } as GridSettings, { colHeaders: headers });

      headers.push('C');

      const preparedSettings = prepareSettings(
        { colHeaders: headers } as GridSettings,
        { colHeaders: headers } as GridSettings,
        [],
        baselines
      );

      expect(preparedSettings.colHeaders).toBe(undefined);
    });

    it('should keep the previous baseline of an overridden setting and refresh the others', () => {
      const baselines: SettingBaselines = {};
      const props = { colHeaders: syncedHeaders, rowHeaders: true } as GridSettings;

      recordSettingBaselines(baselines, props, { colHeaders: syncedHeaders, rowHeaders: true });
      recordSettingBaselines(baselines, props, { colHeaders: ['X', 'Y'], rowHeaders: false }, ['colHeaders']);

      expect(baselines.colHeaders).toEqual({ prop: syncedHeaders, copy: ['A', 'B'], live: syncedHeaders });
      expect(baselines.rowHeaders).toEqual({ prop: true, copy: true, live: false });
    });

    it('should drop the baseline of a prop that is no longer passed', () => {
      const baselines: SettingBaselines = {};

      recordSettingBaselines(baselines, { colHeaders: syncedHeaders } as GridSettings, { colHeaders: syncedHeaders });
      recordSettingBaselines(baselines, {} as GridSettings, { colHeaders: syncedHeaders });

      expect(baselines.colHeaders).toBe(undefined);
    });

    it.each(['colWidths', 'rowHeights', 'minRowHeights', 'data'])(
      'should not hold back `%s`, which is compared with the grid on every change',
      (key) => {
        const baselines: SettingBaselines = {};
        const value = [50, 60];

        recordSettingBaselines(baselines, { [key]: value } as GridSettings, { [key]: value });

        expect(baselines[key]).toBe(undefined);

        // A baseline written by hand shows the rule itself skips these keys, not only the recording.
        baselines[key] = { prop: value, copy: [...value], live: value };

        const preparedSettings = prepareSettings(
          { [key]: value } as GridSettings,
          { [key]: [80, 90] } as GridSettings,
          [],
          baselines
        );

        if (key !== 'data') {
          expect(preparedSettings[key]).toBe(value);
        }

        expect(Object.keys(preparedSettings)).toContain(key);
      }
    );

    it('should judge a key passed both in `settings` and as a direct prop by the value that wins', () => {
      const baselines: SettingBaselines = {};
      const settingsHeaders = ['S1', 'S2'];
      const propHeaders = ['P1', 'P2'];
      const props = { settings: { colHeaders: settingsHeaders }, colHeaders: propHeaders } as unknown as GridSettings;
      const overriddenKeys: string[] = [];

      recordSettingBaselines(baselines, props, { colHeaders: propHeaders });

      const preparedSettings = prepareSettings(
        props,
        { colHeaders: ['X', 'Y'] } as GridSettings,
        [],
        baselines,
        overriddenKeys
      );

      expect(preparedSettings.colHeaders).toBe(undefined);
      expect(overriddenKeys).toEqual(['colHeaders']);
    });
  });
});
