import { createShortcutManager } from '../manager';

describe('Manager', () => {
  describe('`setActiveContextName` method', () => {
    it('should set the context to a new name', () => {
      const manager = createShortcutManager({});

      expect(manager.getActiveContextName()).toBe('grid');

      manager.setActiveContextName('test');

      expect(manager.getActiveContextName()).toBe('test');
    });
  });

  describe('`activatePreviouslyUsedContextName` method', () => {
    it('should be possible to activate previously used context name', () => {
      const manager = createShortcutManager({});

      manager.setActiveContextName('test1');
      manager.setActiveContextName('test2');
      manager.activatePreviouslyUsedContextName();

      expect(manager.getActiveContextName()).toBe('test1');
    });

    it('should not activate context name that was set using `setUntrackedActiveContextName` method', () => {
      const manager = createShortcutManager({});

      manager.setActiveContextName('test1');
      manager.setActiveContextName('test2');
      manager.setUntrackedActiveContextName('test3');
      manager.setUntrackedActiveContextName('test4');
      manager.setUntrackedActiveContextName('test5');
      manager.activatePreviouslyUsedContextName();

      expect(manager.getActiveContextName()).toBe('test1');
    });
  });

  describe('`setUntrackedActiveContextName` method', () => {
    it('should set the context to a new name', () => {
      const manager = createShortcutManager({});

      expect(manager.getActiveContextName()).toBe('grid');

      manager.setUntrackedActiveContextName('test');

      expect(manager.getActiveContextName()).toBe('test');
    });
  });
});
