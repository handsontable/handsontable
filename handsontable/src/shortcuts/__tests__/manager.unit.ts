import { createShortcutManager } from '../manager';

/**
 * @param {object} [overrides] - Optional overrides for the shortcut manager configuration.
 */
function createTestManager(overrides = {}) {
  const manager = createShortcutManager({
    ownerWindow: window,
    handleEvent: () => true,
    beforeKeyDown: () => {},
    afterKeyDown: () => {},
    ...overrides,
  });

  manager.addContext('grid');

  return manager;
}

describe('Shortcut Manager', () => {
  describe('`setActiveContextName`', () => {
    it('should throw an error when the context has been not registered yet', () => {
      const manager = createTestManager();

      expect(() => {
        manager.setActiveContextName('not_existed_context');
      }).toThrowWithCause([
        'You\'ve tried to activate the "not_existed_context" shortcut context that does not exist. ',
        'Before activation, register the context using the "addContext" method.',
      ].join(''), { handsontable: true });

      manager.destroy();
    });
  });

  describe('fallback context chain', () => {
    /**
     * Dispatches a key on the document, the way the recorder receives it.
     *
     * @param {string} key - The `KeyboardEvent.key` value to send.
     */
    function pressKey(key: string) {
      document.documentElement.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    }

    it('should run the fallback context\'s shortcut when the active one does not define the keys', () => {
      const gridSpy = jasmine.createSpy('gridUndo');
      const manager = createTestManager();
      const pluginContext = manager.addContext('plugin:overlay');

      manager.getContext('grid').addShortcut({
        keys: [['a']],
        callback: gridSpy,
        group: 'gridGroup',
      });
      pluginContext.setFallbackContext(manager.getContext('grid'));
      manager.setActiveContextName('plugin:overlay');

      pressKey('a');

      expect(gridSpy).toHaveBeenCalledTimes(1);

      manager.destroy();
    });

    it('should prefer the active context\'s own shortcut over the fallback\'s', () => {
      const gridSpy = jasmine.createSpy('gridA');
      const pluginSpy = jasmine.createSpy('pluginA');
      const manager = createTestManager();
      const pluginContext = manager.addContext('plugin:overlay');

      manager.getContext('grid').addShortcut({
        keys: [['a']],
        callback: gridSpy,
        group: 'gridGroup',
      });
      pluginContext.addShortcut({
        keys: [['a']],
        callback: pluginSpy,
        group: 'pluginGroup',
      });
      pluginContext.setFallbackContext(manager.getContext('grid'));
      manager.setActiveContextName('plugin:overlay');

      pressKey('a');

      expect(pluginSpy).toHaveBeenCalledTimes(1);
      expect(gridSpy).not.toHaveBeenCalled();

      manager.destroy();
    });

    it('should walk a chain of fallbacks', () => {
      const gridSpy = jasmine.createSpy('gridA');
      const manager = createTestManager();
      const middleContext = manager.addContext('plugin:middle');
      const outerContext = manager.addContext('plugin:outer');

      manager.getContext('grid').addShortcut({
        keys: [['a']],
        callback: gridSpy,
        group: 'gridGroup',
      });
      middleContext.setFallbackContext(manager.getContext('grid'));
      outerContext.setFallbackContext(middleContext);
      manager.setActiveContextName('plugin:outer');

      pressKey('a');

      expect(gridSpy).toHaveBeenCalledTimes(1);

      manager.destroy();
    });

    it('should not loop forever when the fallbacks form a cycle', () => {
      const manager = createTestManager();
      const firstContext = manager.addContext('plugin:first');
      const secondContext = manager.addContext('plugin:second');

      firstContext.setFallbackContext(secondContext);
      secondContext.setFallbackContext(firstContext);
      manager.setActiveContextName('plugin:first');

      expect(() => pressKey('a')).not.toThrow();

      manager.destroy();
    });

    it('should leave `hasShortcut` answering for a single context', () => {
      const manager = createTestManager();
      const pluginContext = manager.addContext('plugin:overlay');

      manager.getContext('grid').addShortcut({
        keys: [['a']],
        callback: () => {},
        group: 'gridGroup',
      });
      pluginContext.setFallbackContext(manager.getContext('grid'));

      expect(pluginContext.hasShortcut(['a'])).toBe(false);
      expect(pluginContext.getShortcuts(['a'])).toEqual([]);

      manager.destroy();
    });
  });

  describe('global scope shortcuts when the table shortcut pipeline is blocked', () => {
    it('should run shortcuts on global contexts when handleEvent returns false', () => {
      const spy = jasmine.createSpy('globalF6');
      const manager = createTestManager({
        handleEvent: () => false,
      });

      const globalContext = manager.addContext('testGlobal', 'global');

      globalContext.addShortcut({
        keys: [['f6']],
        callback: spy,
        group: 'testGlobalGroup',
      });

      const event = new KeyboardEvent('keydown', { key: 'F6', bubbles: true });

      document.documentElement.dispatchEvent(event);

      expect(spy).toHaveBeenCalledTimes(1);

      manager.destroy();
    });

    it('should not run table-scoped shortcuts when handleEvent returns false', () => {
      const spy = jasmine.createSpy('gridA');
      const manager = createTestManager({
        handleEvent: () => false,
      });

      manager.getContext('grid').addShortcut({
        keys: [['a']],
        callback: spy,
        group: 'gridSpyGroup',
      });

      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });

      document.documentElement.dispatchEvent(event);

      expect(spy).not.toHaveBeenCalled();

      manager.destroy();
    });

    it('should run table-scoped shortcuts when handleEvent returns true', () => {
      const spy = jasmine.createSpy('gridA');
      const manager = createTestManager({
        handleEvent: () => true,
      });

      manager.getContext('grid').addShortcut({
        keys: [['a']],
        callback: spy,
        group: 'gridSpyGroup2',
      });

      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });

      document.documentElement.dispatchEvent(event);

      expect(spy).toHaveBeenCalledTimes(1);

      manager.destroy();
    });
  });
});
