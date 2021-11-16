/* eslint-disable @typescript-eslint/no-empty-function */
import {
  rewriteSettings,
  prepareSettings,
  propFactory
} from '../src/helpers';

describe('rewriteSettings', () => {
  it('should rewrite the settings element passed to the watchers to be a clean object prepared to use withing Handsontable config, when the input element is an object', () => {
    const FakeWatcher = function() {};

    FakeWatcher.prototype.sampleMethod = function() {};
    FakeWatcher.prototype.sampleProperty = null;

    const fakeWatcherInstance = new FakeWatcher();

    fakeWatcherInstance.testedProperty = null;
    fakeWatcherInstance.testedMethod = function() {};

    expect(typeof fakeWatcherInstance.sampleMethod).toBe('function');
    expect(typeof fakeWatcherInstance.testedMethod).toBe('function');
    expect(fakeWatcherInstance.sampleProperty).toBe(null);
    expect(fakeWatcherInstance.testedProperty).toBe(null);

    const cleanObject: any = rewriteSettings(fakeWatcherInstance);

    expect(typeof cleanObject.sampleMethod).toBe('undefined');
    expect(typeof cleanObject.testedMethod).toBe('function');
    expect(cleanObject.sampleProperty).toBe(void 0);
    expect(cleanObject.testedProperty).toBe(null);
    expect(Object.prototype.toString.call(cleanObject)).toBe('[object Object]');
  });
});

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
