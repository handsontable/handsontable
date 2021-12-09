describe('Plugins', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('the `updatePlugin` method', () => {
    it('should NOT be triggered if the preceding `updateSettings` call didn\'t contain an object with the plugin' +
      ' main key or additional config keys (plugin not configured as `ALWAYS_UPDATE`)', () => {
      let updatePluginCalls = 0;
      let validUpdatePluginCalls = 0;

      class TestPlugin extends Handsontable.plugins.BasePlugin {
        static get PLUGIN_KEY() {
          return 'testPlugin1';
        }

        static get CONFIG_KEYS() {
          return ['test1', 'test2', 'test3'];
        }

        isEnabled() {
          return this.hot.getSettings()[this.constructor.PLUGIN_KEY];
        }

        updatePlugin() {
          updatePluginCalls += 1;

          super.updatePlugin();
        }
      }

      Handsontable.plugins.registerPlugin('TestPlugin2', TestPlugin);

      handsontable({
        testPlugin1: true
      });

      updateSettings({});

      updateSettings({
        data: [[1, 2, 3]]
      });

      updateSettings({
        rowHeaders: true
      });

      updateSettings({
        testPlugin1: true
      });
      validUpdatePluginCalls += 1;

      updateSettings({
        test1: true
      });
      validUpdatePluginCalls += 1;

      updateSettings({
        test2: true
      });
      validUpdatePluginCalls += 1;

      updateSettings({
        test3: true
      });
      validUpdatePluginCalls += 1;

      expect(updatePluginCalls).toEqual(validUpdatePluginCalls);
    });

    it('should be triggered on every `updateSettings` call if the plugin is configured as `ALWAYS_UPDATE`', () => {
      let updatePluginCalls = 0;

      class TestPlugin extends Handsontable.plugins.BasePlugin {
        static get PLUGIN_KEY() {
          return 'testPlugin2';
        }

        static get ALWAYS_UPDATE() {
          return true;
        }

        isEnabled() {
          return this.hot.getSettings()[this.constructor.PLUGIN_KEY];
        }

        updatePlugin() {
          updatePluginCalls += 1;

          super.updatePlugin();
        }
      }

      Handsontable.plugins.registerPlugin('TestPlugin1', TestPlugin);

      handsontable({
        testPlugin2: true
      });

      updateSettings({});

      updateSettings({
        data: [[1, 2, 3]]
      });

      updateSettings({
        rowHeaders: true
      });

      updateSettings({
        testPlugin2: true
      });

      updateSettings({
        test1: true
      });

      updateSettings({
        test2: true
      });

      updateSettings({
        test3: true
      });

      expect(updatePluginCalls).toEqual(7);
    });
  });
});
