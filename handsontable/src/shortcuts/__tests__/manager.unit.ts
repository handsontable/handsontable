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

  describe('modifier-key tracking across multiple instances and documents', () => {
    it('should track Ctrl keydown for the first manager (regression baseline)', () => {
      const manager = createTestManager();

      document.documentElement.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Control', bubbles: true })
      );

      expect(manager.isCtrlPressed()).toBe(true);

      manager.releasePressedKeys();
      manager.destroy();
    });

    it('should track Ctrl keydown for a second manager that lives in a different document (e.g. an iframe)',
      () => {
        // Manager A on the main document.
        const managerA = createTestManager();

        // Manager B on a separate document, simulating a Handsontable instance hosted in an iframe.
        const otherDocument = document.implementation.createHTMLDocument('iframe');
        // `parent: {}` keeps `getParentWindow()` happy without simulating a real frame chain
        // (it returns `null` because `frameElement` is not an `HTMLIFrameElement`).
        const otherWindow = { document: otherDocument, parent: {} } as unknown as Window;
        const managerB = createTestManager({ ownerWindow: otherWindow });

        // Ctrl is pressed inside the "iframe" document only.
        otherDocument.documentElement.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Control', bubbles: true })
        );

        // Both managers share the module-level observer, so both must report Ctrl pressed.
        // Before the fix, only the FIRST manager attached the modifier-key listeners on its
        // own document chain, so this event was never observed and `isCtrlPressed()` was
        // always `false` for the second manager.
        expect(managerB.isCtrlPressed()).toBe(true);
        expect(managerA.isCtrlPressed()).toBe(true);

        otherDocument.documentElement.dispatchEvent(
          new KeyboardEvent('keyup', { key: 'Control', bubbles: true })
        );

        expect(managerB.isCtrlPressed()).toBe(false);
        expect(managerA.isCtrlPressed()).toBe(false);

        managerA.destroy();
        managerB.destroy();
      });

    it('should keep tracking Ctrl on the main document after a manager from a different document is destroyed',
      () => {
        const managerA = createTestManager();

        const otherDocument = document.implementation.createHTMLDocument('iframe');
        const otherWindow = { document: otherDocument, parent: {} } as unknown as Window;
        const managerB = createTestManager({ ownerWindow: otherWindow });

        managerB.destroy();

        document.documentElement.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Control', bubbles: true })
        );

        expect(managerA.isCtrlPressed()).toBe(true);

        managerA.releasePressedKeys();
        managerA.destroy();
      });

    it('should detach modifier-key listeners from a document once its last manager is destroyed',
      () => {
        const otherDocument = document.implementation.createHTMLDocument('iframe');
        const otherWindow = { document: otherDocument, parent: {} } as unknown as Window;

        // Two managers attached to the same auxiliary document — refcount must hit 0 only after both go away.
        const managerB1 = createTestManager({ ownerWindow: otherWindow });
        const managerB2 = createTestManager({ ownerWindow: otherWindow });

        managerB1.destroy();

        otherDocument.documentElement.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Control', bubbles: true })
        );

        expect(managerB2.isCtrlPressed()).toBe(true);

        managerB2.releasePressedKeys();
        managerB2.destroy();

        // After the last manager for this document is gone, dispatching a Ctrl keydown there
        // must not affect any future manager's pressed-keys state.
        otherDocument.documentElement.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Control', bubbles: true })
        );

        const managerC = createTestManager();

        expect(managerC.isCtrlPressed()).toBe(false);

        managerC.destroy();
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
