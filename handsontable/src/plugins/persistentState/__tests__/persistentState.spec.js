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

  it('should save data, when persistentStateSave is run', async() => {
    handsontable({
      persistentState: true
    });

    runHooks('persistentStateSave', 'testData', 100);

    const rawStoredData = window.localStorage[`${id}_testData`];

    expect(rawStoredData).toBeDefined();

    const storedData = JSON.parse(rawStoredData);

    expect(storedData).toEqual(100);
  });

  it('should NOT save data, when persistentStateSave is run, if plugin is not enabled', async() => {
    handsontable({
      persistentState: false
    });

    runHooks('persistentStateSave', 'testData', 100);

    const rawStoredData = window.localStorage[`${id}_testData`];

    expect(rawStoredData).toBeUndefined();

  });

  it('should load data, when persistentStateLoad is run', async() => {
    handsontable({
      persistentState: true
    });

    runHooks('persistentStateSave', 'testData', 100);

    const storedData = {};

    runHooks('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toEqual(100);

  });

  it('should NOT load data, when persistentStateLoad is run, if plugin is not enabled', async() => {
    handsontable({
      persistentState: false
    });

    // We have to manually save data, as persistentStateSave won't work when the plugin is disabled
    window.localStorage[`${id}_testData`] = JSON.stringify(100);

    const storedData = {};

    runHooks('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toBeUndefined();

  });

  it('should clear the data under the given key, when persistentStateReset is run', async() => {
    handsontable({
      persistentState: true
    });

    runHooks('persistentStateSave', 'testData', 100);

    let storedData = {};

    runHooks('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toEqual(100);

    runHooks('persistentStateReset', 'testData');

    storedData = {};
    runHooks('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toBeUndefined();
  });

  it('should NOT clear the data under the given key, when persistentStateReset is run', async() => {
    handsontable({
      persistentState: false
    });

    // We have to manually save data, as persistentStateSave won't work when the plugin is disabled
    window.localStorage[`${id}_testData`] = JSON.stringify(100);

    runHooks('persistentStateReset', 'testData');

    expect(JSON.parse(window.localStorage[`${id}_testData`])).toEqual(100);

  });

  it('should clear all data, when persistentStateReset is run without specifying a key to reset', async() => {
    handsontable({
      persistentState: true
    });

    runHooks('persistentStateSave', 'testData0', 100);
    runHooks('persistentStateSave', 'testData1', 'foo');
    runHooks('persistentStateSave', 'testData2', 200);

    let storedData = [
      {},
      {},
      {}
    ];

    runHooks('persistentStateLoad', 'testData0', storedData[0]);
    runHooks('persistentStateLoad', 'testData1', storedData[1]);
    runHooks('persistentStateLoad', 'testData2', storedData[2]);

    expect(storedData[0].value).toEqual(100);
    expect(storedData[1].value).toEqual('foo');
    expect(storedData[2].value).toEqual(200);

    runHooks('persistentStateReset');

    storedData = [
      {},
      {},
      {}
    ];
    runHooks('persistentStateLoad', 'testData0', storedData[0]);
    runHooks('persistentStateLoad', 'testData1', storedData[1]);
    runHooks('persistentStateLoad', 'testData2', storedData[2]);

    expect(storedData[0].value).toBeUndefined();
    expect(storedData[1].value).toBeUndefined();
    expect(storedData[2].value).toBeUndefined();
  });

  it('should allow to DISABLE plugin with updateSettings', async() => {
    handsontable({
      persistentState: true
    });

    runHooks('persistentStateSave', 'testData', 100);

    let storedData = {};

    runHooks('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toEqual(100);

    await updateSettings({
      persistentState: false
    });

    storedData = {};
    runHooks('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toBeUndefined();
  });

  it('should allow to ENABLE plugin with updateSettings', async() => {
    handsontable({
      persistentState: false
    });

    runHooks('persistentStateSave', 'testData', 100);

    let storedData = {};

    runHooks('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toBeUndefined();

    await updateSettings({
      persistentState: true
    });

    runHooks('persistentStateSave', 'testData', 100);

    storedData = {};
    runHooks('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toEqual(100);

  });

  it('should show the deprecation warning once per Handsontable instance when enabling the plugin', async() => {
    const spy = spyOn(console, 'warn').and.callThrough();

    handsontable({
      persistentState: true
    });

    expect(spy.calls.allArgs().filter(args => args[0] === 'Deprecated: The PersistentState plugin is deprecated and will be removed in version 17.0. ' +
      'Please update your settings to ensure compatibility with future versions.').length).toBe(1);

    spy.calls.reset();

    destroy();

    handsontable({});

    await updateSettings({
      persistentState: true
    });

    expect(spy.calls.allArgs().filter(args => args[0] === 'Deprecated: The PersistentState plugin is deprecated and will be removed in version 17.0. ' +
      'Please update your settings to ensure compatibility with future versions.').length).toBe(1);
  });
});
