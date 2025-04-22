describe('persistentState', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }

    window.localStorage.clear();
  });

  it('should save data, when persistentStateSave is run', () => {
    const hot = handsontable({
      persistentState: true
    });

    hot.runHooks('persistentStateSave', 'testData', 100);

    const rawStoredData = window.localStorage[`${id}_testData`];

    expect(rawStoredData).toBeDefined();

    const storedData = JSON.parse(rawStoredData);

    expect(storedData).toEqual(100);
  });

  it('should NOT save data, when persistentStateSave is run, if plugin is not enabled', () => {
    const hot = handsontable({
      persistentState: false
    });

    hot.runHooks('persistentStateSave', 'testData', 100);

    const rawStoredData = window.localStorage[`${id}_testData`];

    expect(rawStoredData).toBeUndefined();

  });

  it('should load data, when persistentStateLoad is run', () => {
    const hot = handsontable({
      persistentState: true
    });

    hot.runHooks('persistentStateSave', 'testData', 100);

    const storedData = {};

    hot.runHooks('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toEqual(100);

  });

  it('should NOT load data, when persistentStateLoad is run, if plugin is not enabled', () => {
    const hot = handsontable({
      persistentState: false
    });

    // We have to manually save data, as persistentStateSave won't work when the plugin is disabled
    window.localStorage[`${id}_testData`] = JSON.stringify(100);

    const storedData = {};

    hot.runHooks('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toBeUndefined();

  });

  it('should clear the data under the given key, when persistentStateReset is run', () => {
    const hot = handsontable({
      persistentState: true
    });

    hot.runHooks('persistentStateSave', 'testData', 100);

    let storedData = {};

    hot.runHooks('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toEqual(100);

    hot.runHooks('persistentStateReset', 'testData');

    storedData = {};
    hot.runHooks('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toBeUndefined();
  });

  it('should NOT clear the data under the given key, when persistentStateReset is run', () => {
    const hot = handsontable({
      persistentState: false
    });

    // We have to manually save data, as persistentStateSave won't work when the plugin is disabled
    window.localStorage[`${id}_testData`] = JSON.stringify(100);

    hot.runHooks('persistentStateReset', 'testData');

    expect(JSON.parse(window.localStorage[`${id}_testData`])).toEqual(100);

  });

  it('should clear all data, when persistentStateReset is run without specifying a key to reset', () => {
    const hot = handsontable({
      persistentState: true
    });

    hot.runHooks('persistentStateSave', 'testData0', 100);
    hot.runHooks('persistentStateSave', 'testData1', 'foo');
    hot.runHooks('persistentStateSave', 'testData2', 200);

    let storedData = [
      {},
      {},
      {}
    ];

    hot.runHooks('persistentStateLoad', 'testData0', storedData[0]);
    hot.runHooks('persistentStateLoad', 'testData1', storedData[1]);
    hot.runHooks('persistentStateLoad', 'testData2', storedData[2]);

    expect(storedData[0].value).toEqual(100);
    expect(storedData[1].value).toEqual('foo');
    expect(storedData[2].value).toEqual(200);

    hot.runHooks('persistentStateReset');

    storedData = [
      {},
      {},
      {}
    ];
    hot.runHooks('persistentStateLoad', 'testData0', storedData[0]);
    hot.runHooks('persistentStateLoad', 'testData1', storedData[1]);
    hot.runHooks('persistentStateLoad', 'testData2', storedData[2]);

    expect(storedData[0].value).toBeUndefined();
    expect(storedData[1].value).toBeUndefined();
    expect(storedData[2].value).toBeUndefined();
  });

  it('should allow to DISABLE plugin with updateSettings', () => {
    const hot = handsontable({
      persistentState: true
    });

    hot.runHooks('persistentStateSave', 'testData', 100);

    let storedData = {};

    hot.runHooks('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toEqual(100);

    updateSettings({
      persistentState: false
    });

    storedData = {};
    hot.runHooks('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toBeUndefined();

  });

  it('should allow to ENABLE plugin with updateSettings', () => {
    const hot = handsontable({
      persistentState: false
    });

    hot.runHooks('persistentStateSave', 'testData', 100);

    let storedData = {};

    hot.runHooks('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toBeUndefined();

    updateSettings({
      persistentState: true
    });

    hot.runHooks('persistentStateSave', 'testData', 100);

    storedData = {};
    hot.runHooks('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toEqual(100);

  });
});
