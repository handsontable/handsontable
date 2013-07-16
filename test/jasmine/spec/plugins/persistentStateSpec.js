describe('persistentState', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }

    window.localStorage.clear();
  });

  it("should save data, when persistentStateSave is run", function () {
    var hot = handsontable({
      persistentState: true
    });

    hot.PluginHooks.run('persistentStateSave', 'testData', 100);

    var rawStoredData = window.localStorage[id + '_testData'];

    expect(rawStoredData).toBeDefined();

    var storedData = JSON.parse(rawStoredData);

    expect(storedData).toEqual(100)

  });

  it("should NOT save data, when persistentStateSave is run, if plugin is not enabled", function () {
    var hot = handsontable({
      persistentState: false
    });

    hot.PluginHooks.run('persistentStateSave', 'testData', 100);

    var rawStoredData = window.localStorage[id + '_testData'];

    expect(rawStoredData).toBeUndefined();

  });

  it("should load data, when persistentStateLoad is run", function () {
    var hot = handsontable({
      persistentState: true
    });

    hot.PluginHooks.run('persistentStateSave', 'testData', 100);

    var storedData = {};
    hot.PluginHooks.run('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toEqual(100);

  });

  it("should NOT load data, when persistentStateLoad is run, if plugin is not enabled", function () {
    var hot = handsontable({
      persistentState: false
    });

    //We have to manually save data, as persistentStateSave won't work when the plugin is disabled
    window.localStorage[id + '_testData'] = JSON.stringify(100);

    var storedData = {};
    hot.PluginHooks.run('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toBeUndefined();

  });

  it("should clear the data under the given key, when persistentStateReset is run", function () {
    var hot = handsontable({
      persistentState: true
    });

    hot.PluginHooks.run('persistentStateSave', 'testData', 100);

    var storedData = {};
    hot.PluginHooks.run('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toEqual(100);

    hot.PluginHooks.run('persistentStateReset', 'testData');

    storedData = {};
    hot.PluginHooks.run('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toBeUndefined();


  });

  it("should NOT clear the data under the given key, when persistentStateReset is run", function () {
    var hot = handsontable({
      persistentState: false
    });

    //We have to manually save data, as persistentStateSave won't work when the plugin is disabled
    window.localStorage[id + '_testData'] = JSON.stringify(100);

    var storedData = {};
    hot.PluginHooks.run('persistentStateReset', 'testData');

    expect(JSON.parse(window.localStorage[id + '_testData'])).toEqual(100);

  });

  it("should clear all data, when persistentStateReset is run without specifying a key to reset", function () {
    var hot = handsontable({
      persistentState: true
    });

    hot.PluginHooks.run('persistentStateSave', 'testData0', 100);
    hot.PluginHooks.run('persistentStateSave', 'testData1', 'foo');
    hot.PluginHooks.run('persistentStateSave', 'testData2', 200);

    var storedData = [
      {},
      {},
      {}
    ];
    hot.PluginHooks.run('persistentStateLoad', 'testData0', storedData[0]);
    hot.PluginHooks.run('persistentStateLoad', 'testData1', storedData[1]);
    hot.PluginHooks.run('persistentStateLoad', 'testData2', storedData[2]);

    expect(storedData[0].value).toEqual(100);
    expect(storedData[1].value).toEqual('foo');
    expect(storedData[2].value).toEqual(200);

    hot.PluginHooks.run('persistentStateReset');

    storedData = [
      {},
      {},
      {}
    ];
    hot.PluginHooks.run('persistentStateLoad', 'testData0', storedData[0]);
    hot.PluginHooks.run('persistentStateLoad', 'testData1', storedData[1]);
    hot.PluginHooks.run('persistentStateLoad', 'testData2', storedData[2]);

    expect(storedData[0].value).toBeUndefined();
    expect(storedData[1].value).toBeUndefined();
    expect(storedData[2].value).toBeUndefined();


  });

  it("should allow to DISABLE plugin with updateSettings", function () {
    var hot = handsontable({
      persistentState: true
    });

    hot.PluginHooks.run('persistentStateSave', 'testData', 100);

    var storedData = {};
    hot.PluginHooks.run('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toEqual(100);

    updateSettings({
      persistentState: false
    });

    storedData = {};
    hot.PluginHooks.run('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toBeUndefined();

  });

  it("should allow to ENABLE plugin with updateSettings", function () {
    var hot = handsontable({
      persistentState: false
    });

    hot.PluginHooks.run('persistentStateSave', 'testData', 100);

    var storedData = {};
    hot.PluginHooks.run('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toBeUndefined();

    updateSettings({
      persistentState: true
    });

    hot.PluginHooks.run('persistentStateSave', 'testData', 100);

    storedData = {};
    hot.PluginHooks.run('persistentStateLoad', 'testData', storedData);

    expect(storedData.value).toEqual(100);

  });
});