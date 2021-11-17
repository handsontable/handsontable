/* eslint-disable @typescript-eslint/no-empty-function */
import {
  prepareSettings,
  propFactory
} from '../src/helpers';

describe('propFactory', () => {
  it('should generate an object containing all the available Handsontable properties and plugin hooks', () => {
    const props: any = propFactory('HotTable');

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
      afterChange: () => 'afterChangeResult',
      settings: {
        rowHeaders: true,
        data: [[1, 2], [3, 4]],
        afterUpdateSettings: () => 'afterUpdateSettingsResult'
      }
    };

    const preparedSettings = prepareSettings(propsMock);

    expect(preparedSettings.readOnly).toBe(true);
    expect(preparedSettings.colHeaders).toBe(true);
    expect(preparedSettings.rowHeaders).toBe(true);
    expect(preparedSettings.data).toEqual([[1, 2], [3, 4]]);
    expect(preparedSettings.afterUpdateSettings(preparedSettings)).toBe('afterUpdateSettingsResult');
    expect(preparedSettings.afterChange([[1, 1, 1, 1]], 'auto')).toBe('afterChangeResult');
    expect(preparedSettings.id).toBe(void 0);
    expect(preparedSettings.settings).toBe(void 0);
    expect(preparedSettings.wrapperRendererCacheSize).toBe(void 0);
  });
});
