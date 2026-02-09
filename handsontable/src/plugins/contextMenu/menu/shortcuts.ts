import { createDefaultShortcutsList } from './defaultShortcutsList';

const SHORTCUTS_CONTEXT = 'menu';
const SHORTCUTS_GROUP = SHORTCUTS_CONTEXT;

/**
 * @typedef KeyboardShortcutsMenuController
 * @property {function(KeyboardShortcut[]): void} addCustomShortcuts Adds (by replacing) new keyboard shortcuts to the menu.
 * @property {function(string): number} getContext Gets the keyboard shortcuts context by name.
 * @property {function(string): void} listen Sets the active keyboard shortcuts context of the menu.
 */
/**
 * Creates the controller object that allows extending the keyboard shortcuts of the menu.
 *
 * @param {Menu} menu The menu instance.
 * @param {Array<{ shortcuts: KeyboardShortcut, contextName: string }>} [customKeyboardShortcuts] The list of the custom keyboard shortcuts.
 * @returns {KeyboardShortcutsMenuController}
 */
export function createKeyboardShortcutsCtrl(menu: Record<string, unknown>, customKeyboardShortcuts: { shortcuts: Record<string, unknown>[]; contextName: string }[] = []) {
  const customShortcuts: { shortcuts: Record<string, unknown>[]; contextName: string }[] = [];

  _addShortcuts(createDefaultShortcutsList(menu));

  customKeyboardShortcuts.forEach(({ shortcuts, contextName }) => {
    addCustomShortcuts(shortcuts, contextName);
  });

  /**
   * Adds keyboard shortcuts to the menu.
   *
   * @param {KeyboardShortcut[]} shortcuts Keyboard shortcuts to add.
   * @param {string} [contextName] The context name to create or use.
   */
  function _addShortcuts(shortcuts: Record<string, unknown>[], contextName?: string) {
    getContext(contextName).addShortcuts(shortcuts, {
      group: SHORTCUTS_CONTEXT,
    });
  }

  /**
   * Adds custom keyboard shortcuts to the menu.
   *
   * @param {KeyboardShortcut[]} shortcuts Keyboard shortcuts to add.
   * @param {string} [contextName] The context name to create or use.
   */
  function addCustomShortcuts(shortcuts: Record<string, unknown>[], contextName: string = SHORTCUTS_CONTEXT) {
    const context = getContext(contextName);

    shortcuts.forEach(({ keys }: Record<string, unknown>) => {
      (keys as string[]).forEach((k: string) => context.removeShortcutsByKeys(k));
    });

    customShortcuts.push({
      shortcuts,
      contextName,
    });

    _addShortcuts(shortcuts, contextName);
  }

  /**
   * Gets all registered custom keyboard shortcuts.
   *
   * @returns {Array<{ shortcuts: KeyboardShortcut, contextName: string }>}
   */
  function getCustomShortcuts() {
    return [...customShortcuts];
  }

  /**
   * Gets the context name.
   *
   * @param {string} contextName The context name.
   * @returns {string}
   */
  function _getContextName(contextName?: string) {
    return contextName ? `${SHORTCUTS_GROUP}:${contextName}` : SHORTCUTS_GROUP;
  }

  /**
   * Gets the keyboard shortcut context by its name.
   *
   * @param {string} contextName The context name.
   * @returns {object}
   */
  function getContext(contextName?: string): Record<string, Function> {
    const manager = (menu.hotMenu as { getShortcutManager: () => Record<string, Function> }).getShortcutManager();
    const name = _getContextName(contextName);

    return manager.getContext(name) ?? manager.addContext(name);
  }

  /**
   * Makes the specified context active.
   *
   * @param {string} [contextName] The context name.
   */
  function listen(contextName?: string) {
    (menu.hotMenu as { getShortcutManager: () => Record<string, Function> }).getShortcutManager().setActiveContextName(_getContextName(contextName));
  }

  return {
    addCustomShortcuts,
    getCustomShortcuts,
    getContext,
    listen,
  };
}
