import {
  getPlugin,
  getPluginsNames,
  registerPlugin,
} from '../registry';

describe('plugins', () => {
  describe('registering', () => {
    it('should register plugin under an alias', () => {
      const pluginName = 'pluginA';
      const pluginRef = jest.fn();

      registerPlugin(pluginName, pluginRef);
      expect(getPlugin(pluginName)).toBe(pluginRef);
    });

    it('should not throw an error if there is already registered plugin at the same name', () => {
      const pluginName = 'pluginA';
      const pluginRef = jest.fn();

      expect(() => {
        registerPlugin(pluginName, pluginRef);
      }).not.toThrowError();
    });

    it('should register plugins in the correct order', () => {
      const pluginRef = jest.fn();

      registerPlugin('pluginB', pluginRef, 10);
      registerPlugin('pluginC', pluginRef);
      registerPlugin('pluginD', pluginRef, 30);
      registerPlugin('pluginE', pluginRef, 20);
      registerPlugin('pluginF', pluginRef);
      registerPlugin('pluginG', pluginRef, 0);

      expect(getPluginsNames()).toEqual([
        'PluginG',
        'PluginB',
        'PluginE',
        'PluginD',
        'PluginA',
        'PluginC',
        'PluginF',
      ]);
    });

    it('should throw an error if there is already registered plugin at the same priority', () => {
      const pluginRef = jest.fn();

      expect(() => {
        registerPlugin('pluginH', pluginRef, 0);
      }).toThrowError('There is already registered plugin on priority "0"');
      expect(() => {
        registerPlugin('pluginI', pluginRef, 0);
      }).toThrowError('There is already registered plugin on priority "0"');
    });

    it('should not throw an error if there is already registered plugin at the same name but different priority', () => {
      const pluginRef = jest.fn();

      registerPlugin('pluginJ', pluginRef, 40);

      expect(() => {
        registerPlugin('pluginJ', pluginRef, 41);
      }).not.toThrowError('There is already registered "PluginJ" plugin.');
    });

    it('should register plugin only once', () => {
      const pluginRef = jest.fn();

      registerPlugin('pluginL', pluginRef);

      expect(() => {
        registerPlugin('pluginL', pluginRef);
      }).not.toThrowError();
    });
  });
});
