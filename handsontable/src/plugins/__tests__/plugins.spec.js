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
      ' main key or additional config keys', () => {
      class TestPlugin extends Handsontable.plugins.BasePlugin {
        static get PLUGIN_KEY() {
          return 'testPlugin1';
        }

        static get SETTING_KEYS() {
          return [
            this.PLUGIN_KEY,
            ...['test1', 'test2', 'test3']
          ];
        }

        isEnabled() {
          return this.hot.getSettings()[this.constructor.PLUGIN_KEY];
        }
      }

      spyOn(TestPlugin.prototype, 'updatePlugin');

      Handsontable.plugins.registerPlugin('TestPlugin1', TestPlugin);

      handsontable({
        testPlugin1: true
      });

      // `updateSettings` calls that SHOULD NOT trigger `updatePlugin`:
      updateSettings({});

      updateSettings({
        data: [[1, 2, 3]]
      });

      updateSettings({
        rowHeaders: true
      });

      // `updateSettings` calls that SHOULD trigger `updatePlugin`:
      updateSettings({
        testPlugin1: true
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

      expect(TestPlugin.prototype.updatePlugin).toHaveBeenCalledTimes(4);
    });

    it('should be triggered on every `updateSettings` call if the plugin is configured with `SETTING_KEYS = true`',
      () => {
        class TestPlugin extends Handsontable.plugins.BasePlugin {
          static get PLUGIN_KEY() {
            return 'testPlugin2';
          }

          static get SETTING_KEYS() {
            return true;
          }

          isEnabled() {
            return this.hot.getSettings()[this.constructor.PLUGIN_KEY];
          }
        }

        Handsontable.plugins.registerPlugin('TestPlugin2', TestPlugin);

        spyOn(TestPlugin.prototype, 'updatePlugin');

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

        expect(TestPlugin.prototype.updatePlugin).toHaveBeenCalledTimes(7);
      });

    it('should never be triggered on an `updateSettings` call, regardles of the plugin key being present in the' +
      ' config object if the plugin is configured with `SETTING_KEYS = false`', () => {
      class TestPlugin extends Handsontable.plugins.BasePlugin {
        static get PLUGIN_KEY() {
          return 'testPlugin3';
        }

        static get SETTING_KEYS() {
          return false;
        }

        isEnabled() {
          return this.hot.getSettings()[this.constructor.PLUGIN_KEY];
        }
      }

      Handsontable.plugins.registerPlugin('TestPlugin3', TestPlugin);

      spyOn(TestPlugin.prototype, 'updatePlugin');

      handsontable({
        testPlugin3: true
      });

      updateSettings({});

      updateSettings({
        data: [[1, 2, 3]]
      });

      updateSettings({
        rowHeaders: true
      });

      updateSettings({
        testPlugin3: true
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

      expect(TestPlugin.prototype.updatePlugin).toHaveBeenCalledTimes(0);
    });
  });
});
