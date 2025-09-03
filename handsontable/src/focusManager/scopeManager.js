import { FocusScope } from './scope';
import EventManager from '../eventManager';

const KEYBOARD_SHORTCUT_GROUP = 'focusManager';

export class FocusScopeManager {
  #hot;
  #scopes = new Map();
  #activeScope = null;
  #shortcutManager;
  #eventManager;

  constructor(hotInstance) {
    this.#hot = hotInstance;
    this.#shortcutManager = hotInstance.getShortcutManager();
    this.#eventManager = new EventManager(this.#hot);
  }

  init() {
    this.#eventManager.addEventListener(this.#hot.rootDocument, 'focusin', (event) => {
      this.#updateActiveScope(event.target, event.target.dataset.htFocusSource ?? 'unknown');
    });
    this.#eventManager.addEventListener(this.#hot.rootDocument, 'click', (event) => {
      this.#updateActiveScope(event.target, 'click');
    });
  }

  #updateActiveScope(target, focusSource) {
    this.#activeScope = null;

    this.#scopes.forEach((scope) => {
      if (scope.contains(target)) {
        scope.activate(focusSource);
        this.#activeScope = scope;
        this.#shortcutManager
          .setActiveContextName(this.#getKeyboardShortcutContextName(scope.getScopeId()));

      } else {
        scope.deactivate();
      }
    });

    if (this.#activeScope) {
      this.#hot.listen();
    } else {
      this.#hot.unlisten();
    }
  }

  /**
   * Registers a new focus scope.
   *
   * @param {string} scopeId Unique identifier for the scope.
   * @param {HTMLElement} container Container element for the scope.
   * @param {Object} options Configuration options.
   * @returns {FocusScope}
   */
  registerScope(scopeId, container, options = {}) {
    const scope = new FocusScope(scopeId, this.#hot, container, options);

    this.#scopes.set(scopeId, scope);
    this.#registerShortcuts(scopeId);

    return scope;
  }

  /**
   * Unregisters a scope completely
   *
   * @param {string} scopeId The scope to remove
   */
  unregisterScope(scopeId) {

  }

  #registerShortcuts(scopeId) {
    this.#getKeyboardShortcutContext(scopeId).addShortcut({
      keys: [['Shift', 'Tab'], ['Tab']],
      preventDefault: false,
      callback: (event) => {
        // console.log('tab', scopeId, event);
        // event.preventDefault();
      },
      group: KEYBOARD_SHORTCUT_GROUP,
    });
  }

  #getKeyboardShortcutContextName(scopeId) {
    return `focusScope:${scopeId}`;
  }

  #getKeyboardShortcutContext(scopeId) {
    const contextName = this.#getKeyboardShortcutContextName(scopeId);

    return this.#shortcutManager.getContext(contextName) ??
      this.#shortcutManager.addContext(contextName);
  }
}
