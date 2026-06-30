import Handsontable from 'handsontable/base';
import {
  prepareSettings,
  propFactory
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
    expect(typeof props.randomProp).toBe('undefined');
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
    expect(preparedSettings.id).toBe(void 0);
    expect(preparedSettings.settings).toBe(void 0);
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

    expect(preparedSettings.renderAllRows).toBe(void 0);
    expect(preparedSettings.renderAllColumns).toBe(void 0);
    expect(preparedSettings.layoutDirection).toBe(void 0);
    expect(preparedSettings.ariaTags).toBe(void 0);
    expect(preparedSettings.width).toBe(500);
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
});
