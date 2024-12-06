import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { deepClone } from '../../helpers/object';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { warn } from '../../helpers/console';
import { registerActions } from './actions';

const SHORTCUTS_GROUP = 'undoRedo';

export const PLUGIN_KEY = 'undoRedo';
export const PLUGIN_PRIORITY = 1000;

Hooks.getSingleton().register('beforeUndo');
Hooks.getSingleton().register('afterUndo');
Hooks.getSingleton().register('beforeRedo');
Hooks.getSingleton().register('afterRedo');

const deprecationWarns = new Set();

/**
 * @description
 * Handsontable UndoRedo plugin allows to undo and redo certain actions done in the table.
 *
 * __Note__, that not all actions are currently undo-able. The UndoRedo plugin is enabled by default.
 * @example
 * ```js
 * undo: true
 * ```
 * @class UndoRedo
 * @plugin UndoRedo
 */
export class UndoRedo extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get SETTING_KEYS() {
    return true;
  }

  /**
   * The list of registered action do undo.
   *
   * @private
   * @type {Array}
   */
  doneActions = [];

  /**
   * The list of registered action do redo.
   *
   * @private
   * @type {Array}
   */
  undoneActions = [];

  /**
   * The flag that determines if new actions should be ignored.
   *
   * @private
   * @type {boolean}
   */
  ignoreNewActions = false;

  constructor(hotInstance) {
    super(hotInstance);
    registerActions(hotInstance, this);
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link UndoRedo#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().undo;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('afterChange', (...args) => this.#onAfterChange(...args));
    this.registerShortcuts();
    this.#exposeAPIToCore();

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
    this.clear();
    this.unregisterShortcuts();
    this.#removeAPIFromCore();
  }

  /**
   * Registers shortcuts responsible for performing undo/redo.
   *
   * @private
   */
  registerShortcuts() {
    const shortcutManager = this.hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');
    const runOnlyIf = (event) => {
      return !event.altKey; // right ALT in some systems triggers ALT+CTR
    };
    const config = {
      runOnlyIf,
      group: SHORTCUTS_GROUP,
    };

    gridContext.addShortcuts([{
      keys: [['Control/Meta', 'z']],
      callback: () => {
        this.undo();
      },
    }, {
      keys: [['Control/Meta', 'y'], ['Control/Meta', 'Shift', 'z']],
      callback: () => {
        this.redo();
      },
    }], config);
  }

  /**
   * Unregister shortcuts responsible for performing undo/redo.
   *
   * @private
   */
  unregisterShortcuts() {
    const shortcutManager = this.hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');

    gridContext.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Stash information about performed actions.
   *
   * @fires Hooks#beforeUndoStackChange
   * @fires Hooks#afterUndoStackChange
   * @fires Hooks#beforeRedoStackChange
   * @fires Hooks#afterRedoStackChange
   * @param {Function} wrappedAction The action descriptor wrapped in a closure.
   * @param {string} [source] Source of the action. It is defined just for more general actions (not related to plugins).
   */
  done(wrappedAction, source) {
    if (this.ignoreNewActions) {
      return;
    }

    const isBlockedByDefault = source === 'UndoRedo.undo' || source === 'UndoRedo.redo' || source === 'auto';

    if (isBlockedByDefault) {
      return;
    }

    const doneActionsCopy = this.doneActions.slice();
    const continueAction = this.hot.runHooks('beforeUndoStackChange', doneActionsCopy, source);

    if (continueAction === false) {
      return;
    }

    const newAction = wrappedAction();
    const undoneActionsCopy = this.undoneActions.slice();

    this.doneActions.push(newAction);

    this.hot.runHooks('afterUndoStackChange', doneActionsCopy, this.doneActions.slice());
    this.hot.runHooks('beforeRedoStackChange', undoneActionsCopy);

    this.undoneActions.length = 0;

    this.hot.runHooks('afterRedoStackChange', undoneActionsCopy, this.undoneActions.slice());
  }

  /**
   * Undo the last action performed to the table.
   *
   * @fires Hooks#beforeUndoStackChange
   * @fires Hooks#afterUndoStackChange
   * @fires Hooks#beforeRedoStackChange
   * @fires Hooks#afterRedoStackChange
   * @fires Hooks#beforeUndo
   * @fires Hooks#afterUndo
   */
  undo() {
    if (!this.isUndoAvailable()) {
      return;
    }

    const doneActionsCopy = this.doneActions.slice();

    this.hot.runHooks('beforeUndoStackChange', doneActionsCopy);

    const action = this.doneActions.pop();

    this.hot.runHooks('afterUndoStackChange', doneActionsCopy, this.doneActions.slice());

    const actionClone = deepClone(action);
    const continueAction = this.hot.runHooks('beforeUndo', actionClone);

    if (continueAction === false) {
      return;
    }

    this.ignoreNewActions = true;

    const undoneActionsCopy = this.undoneActions.slice();

    this.hot.runHooks('beforeRedoStackChange', undoneActionsCopy);

    action.undo(this.hot, () => {
      this.ignoreNewActions = false;
      this.undoneActions.push(action);
    });

    this.hot.runHooks('afterRedoStackChange', undoneActionsCopy, this.undoneActions.slice());
    this.hot.runHooks('afterUndo', actionClone);
  }

  /**
   * Redo the previous action performed to the table (used to reverse an undo).
   *
   * @fires Hooks#beforeUndoStackChange
   * @fires Hooks#afterUndoStackChange
   * @fires Hooks#beforeRedoStackChange
   * @fires Hooks#afterRedoStackChange
   * @fires Hooks#beforeRedo
   * @fires Hooks#afterRedo
   */
  redo() {
    if (!this.isRedoAvailable()) {
      return;
    }

    const undoneActionsCopy = this.undoneActions.slice();

    this.hot.runHooks('beforeRedoStackChange', undoneActionsCopy);

    const action = this.undoneActions.pop();

    this.hot.runHooks('afterRedoStackChange', undoneActionsCopy, this.undoneActions.slice());

    const actionClone = deepClone(action);

    const continueAction = this.hot.runHooks('beforeRedo', actionClone);

    if (continueAction === false) {
      return;
    }

    this.ignoreNewActions = true;

    const doneActionsCopy = this.doneActions.slice();

    this.hot.runHooks('beforeUndoStackChange', doneActionsCopy);

    action.redo(this.hot, () => {
      this.ignoreNewActions = false;
      this.doneActions.push(action);
    });

    this.hot.runHooks('afterUndoStackChange', doneActionsCopy, this.doneActions.slice());
    this.hot.runHooks('afterRedo', actionClone);
  }

  /**
   * Checks if undo action is available.
   *
   * @returns {boolean} Return `true` if undo can be performed, `false` otherwise.
   */
  isUndoAvailable() {
    return this.doneActions.length > 0;
  }

  /**
   * Checks if redo action is available.
   *
   * @returns {boolean} Return `true` if redo can be performed, `false` otherwise.
   */
  isRedoAvailable() {
    return this.undoneActions.length > 0;
  }

  /**
   * Clears undo and redo history.
   */
  clear() {
    this.doneActions.length = 0;
    this.undoneActions.length = 0;
  }

  /**
   * Listens to the data change and if the source is `loadData` then clears the undo and redo history.
   *
   * @param {Array} changes The data changes.
   * @param {string} source The source of the change.
   */
  #onAfterChange(changes, source) {
    if (source === 'loadData') {
      this.clear();
    }
  }

  /**
   * Expose the plugin API to the Core. It is for backward compatibility and it should be removed in the future.
   */
  #exposeAPIToCore() {
    const deprecatedWarn = (methodName) => {
      if (!deprecationWarns.has(methodName)) {
        warn(toSingleLine`The "${methodName}" method is deprecated and it will be removed\x20
          from the Core API in the future. Please use the method from the UndoRedo plugin\x20
          (e.g. \`hotInstance.getPlugin("undoRedo").${methodName}()\`).`);

        deprecationWarns.add(methodName);
      }
    };

    /**
     * {@link UndoRedo#undo}.
     *
     * @alias undo
     * @memberof! Core#
     */
    this.hot.undo = () => {
      deprecatedWarn('undo');
      this.undo();
    };
    /**
     * {@link UndoRedo#redo}.
     *
     * @alias redo
     * @memberof! Core#
     */
    this.hot.redo = () => {
      deprecatedWarn('redo');
      this.redo();
    };
    /**
     * {@link UndoRedo#isUndoAvailable}.
     *
     * @alias isUndoAvailable
     * @memberof! Core#
     * @returns {boolean}
     */
    this.hot.isUndoAvailable = () => {
      deprecatedWarn('isUndoAvailable');

      return this.isUndoAvailable();
    };
    /**
     * {@link UndoRedo#isRedoAvailable}.
     *
     * @alias isRedoAvailable
     * @memberof! Core#
     * @returns {boolean}
     */
    this.hot.isRedoAvailable = () => {
      deprecatedWarn('isRedoAvailable');

      return this.isRedoAvailable();
    };
    /**
     * {@link UndoRedo#clear}.
     *
     * @alias clearUndo
     * @memberof! Core#
     */
    this.hot.clearUndo = () => {
      deprecatedWarn('clear');
      this.clear();
    };
    this.hot.undoRedo = this;
  }

  /**
   * Removes the plugin API from the Core. It is for backward compatibility and it should be removed in the future.
   */
  #removeAPIFromCore() {
    delete this.hot.undo;
    delete this.hot.redo;
    delete this.hot.isUndoAvailable;
    delete this.hot.isRedoAvailable;
    delete this.hot.clearUndo;
    delete this.hot.undoRedo;
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.clear();
    this.doneActions = null;
    this.undoneActions = null;
    super.destroy();
  }
}
