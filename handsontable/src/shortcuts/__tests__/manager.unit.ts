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
