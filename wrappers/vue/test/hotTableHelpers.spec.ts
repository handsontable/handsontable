import {
  rewriteSettings,
  prepareSettings,
  propFactory
} from '../src/helpers';

describe('rewriteSettings', () => {
  it('should rewrite the settings element passed to the watchers to be a clean object prepared to use withing Handsontable config, when the input element is an object', () => {
    const fakeWatcher = () => {};
    fakeWatcher.prototype.sampleMethod = () => {};
    fakeWatcher.prototype.sampleProperty = null;

    const fakeWatcherInstance = new fakeWatcher();
    fakeWatcherInstance.testedProperty = null;
    fakeWatcherInstance.testedMethod = () => {};

    expect(typeof fakeWatcherInstance.sampleMethod).toEqual('function');
    expect(typeof fakeWatcherInstance.testedMethod).toEqual('function');
    expect(fakeWatcherInstance.sampleProperty).toEqual(null);
    expect(fakeWatcherInstance.testedProperty).toEqual(null);

    let cleanObject: any = rewriteSettings(fakeWatcherInstance);

    expect(typeof cleanObject.sampleMethod).toEqual('undefined');
    expect(typeof cleanObject.testedMethod).toEqual('function');
    expect(cleanObject.sampleProperty).toEqual(void 0);
    expect(cleanObject.testedProperty).toEqual(null);
    expect(Object.prototype.toString.call(cleanObject)).toEqual('[object Object]');
  });
});

describe('propFactory', () => {
  it('should generate an object containing all the available Handsontable properties and plugin hooks', () => {
    const props: any = propFactory('HotTable');

    expect(typeof props.startRows).toEqual('object');
    expect(typeof props.startCols).toEqual('object');
    expect(typeof props.data).toEqual('object');
    expect(typeof props.fixedRowsTop).toEqual('object');
    expect(typeof props.afterCreateRow).toEqual('object');
    expect(typeof props.afterGetCellMeta).toEqual('object');
    expect(typeof props.beforeInit).toEqual('object');
    expect(typeof props.randomProp).toEqual('undefined');
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
    expect(preparedSettings.afterUpdateSettings()).toBe('afterUpdateSettingsResult');
    expect(preparedSettings.afterChange()).toBe('afterChangeResult');
    expect(preparedSettings.id).toBe(void 0);
    expect(preparedSettings.settings).toBe(void 0);
    expect(preparedSettings.wrapperRendererCacheSize).toBe(void 0);
  });
});
