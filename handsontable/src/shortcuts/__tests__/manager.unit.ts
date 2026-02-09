import { createShortcutManager } from '../manager';

function createManager() {
  return createShortcutManager({
    ownerDocument: window,
  });
}

describe('Shortcut Manager', () => {
  describe('`setActiveContextName`', () => {
    it('should throw an error when the context has been not registered yet', () => {
      const manager = createManager();

      expect(() => {
        manager.setActiveContextName('not_existed_context');
      }).toThrowError([
        'You\'ve tried to activate the "not_existed_context" shortcut context that does not exist. ',
        'Before activation, register the context using the "addContext" method.',
      ].join(''));
    });
  });
});
