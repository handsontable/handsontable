import { GridSettings } from 'handsontable/settings';
import {
  prepareSettings,
  propFactory
} from '../src/helpers';

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
});
