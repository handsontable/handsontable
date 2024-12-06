import { Hooks } from '../../core/hooks';
import { deepClone } from '../../helpers/object';
import { registerActions } from './actions';

const SHORTCUTS_GROUP = 'undoRedo';

export const PLUGIN_KEY = 'undoRedo';

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
 * @param {Core} hot The Handsontable instance.
 */
function UndoRedo(hot) {
  this.instance = hot;
  this.doneActions = [];
  this.undoneActions = [];
  this.ignoreNewActions = false;
  this.enabled = false;

  registerActions(hot, this);

  // TODO: Why this callback is needed? One test doesn't pass after calling method right
  // after plugin creation (outside the callback).
  hot.addHook('afterInit', () => {
    this.init();
  });
}

/**
 * Stash information about performed actions.
 *
 * @function done
 * @memberof UndoRedo#
 * @fires Hooks#beforeUndoStackChange
 * @fires Hooks#afterUndoStackChange
 * @fires Hooks#beforeRedoStackChange
 * @fires Hooks#afterRedoStackChange
 * @param {Function} wrappedAction The action descriptor wrapped in a closure.
 * @param {string} [source] Source of the action. It is defined just for more general actions (not related to plugins).
 */
UndoRedo.prototype.done = function(wrappedAction, source) {
  if (this.ignoreNewActions) {
    return;
  }

  const isBlockedByDefault = source === 'UndoRedo.undo' || source === 'UndoRedo.redo' || source === 'auto';

  if (isBlockedByDefault) {
    return;
  }

  const doneActionsCopy = this.doneActions.slice();
  const continueAction = this.instance.runHooks('beforeUndoStackChange', doneActionsCopy, source);

  if (continueAction === false) {
    return;
  }

  const newAction = wrappedAction();
  const undoneActionsCopy = this.undoneActions.slice();

  this.doneActions.push(newAction);

  this.instance.runHooks('afterUndoStackChange', doneActionsCopy, this.doneActions.slice());
  this.instance.runHooks('beforeRedoStackChange', undoneActionsCopy);

  this.undoneActions.length = 0;

  this.instance.runHooks('afterRedoStackChange', undoneActionsCopy, this.undoneActions.slice());
};

/**
 * Undo the last action performed to the table.
 *
 * @function undo
 * @memberof UndoRedo#
 * @fires Hooks#beforeUndoStackChange
 * @fires Hooks#afterUndoStackChange
 * @fires Hooks#beforeRedoStackChange
 * @fires Hooks#afterRedoStackChange
 * @fires Hooks#beforeUndo
 * @fires Hooks#afterUndo
 */
UndoRedo.prototype.undo = function() {
  if (this.isUndoAvailable()) {
    const doneActionsCopy = this.doneActions.slice();

    this.instance.runHooks('beforeUndoStackChange', doneActionsCopy);

    const action = this.doneActions.pop();

    this.instance.runHooks('afterUndoStackChange', doneActionsCopy, this.doneActions.slice());

    const actionClone = deepClone(action);

    const continueAction = this.instance.runHooks('beforeUndo', actionClone);

    if (continueAction === false) {
      return;
    }

    this.ignoreNewActions = true;

    const that = this;
    const undoneActionsCopy = this.undoneActions.slice();

    this.instance.runHooks('beforeRedoStackChange', undoneActionsCopy);

    action.undo(this.instance, () => {
      that.ignoreNewActions = false;
      that.undoneActions.push(action);
    });

    this.instance.runHooks('afterRedoStackChange', undoneActionsCopy, this.undoneActions.slice());
    this.instance.runHooks('afterUndo', actionClone);
  }
};

/**
 * Redo the previous action performed to the table (used to reverse an undo).
 *
 * @function redo
 * @memberof UndoRedo#
 * @fires Hooks#beforeUndoStackChange
 * @fires Hooks#afterUndoStackChange
 * @fires Hooks#beforeRedoStackChange
 * @fires Hooks#afterRedoStackChange
 * @fires Hooks#beforeRedo
 * @fires Hooks#afterRedo
 */
UndoRedo.prototype.redo = function() {
  if (this.isRedoAvailable()) {
    const undoneActionsCopy = this.undoneActions.slice();

    this.instance.runHooks('beforeRedoStackChange', undoneActionsCopy);

    const action = this.undoneActions.pop();

    this.instance.runHooks('afterRedoStackChange', undoneActionsCopy, this.undoneActions.slice());

    const actionClone = deepClone(action);

    const continueAction = this.instance.runHooks('beforeRedo', actionClone);

    if (continueAction === false) {
      return;
    }

    this.ignoreNewActions = true;

    const that = this;
    const doneActionsCopy = this.doneActions.slice();

    this.instance.runHooks('beforeUndoStackChange', doneActionsCopy);

    action.redo(this.instance, () => {
      that.ignoreNewActions = false;
      that.doneActions.push(action);
    });

    this.instance.runHooks('afterUndoStackChange', doneActionsCopy, this.doneActions.slice());
    this.instance.runHooks('afterRedo', actionClone);
  }
};

/**
 * Checks if undo action is available.
 *
 * @function isUndoAvailable
 * @memberof UndoRedo#
 * @returns {boolean} Return `true` if undo can be performed, `false` otherwise.
 */
UndoRedo.prototype.isUndoAvailable = function() {
  return this.doneActions.length > 0;
};

/**
 * Checks if redo action is available.
 *
 * @function isRedoAvailable
 * @memberof UndoRedo#
 * @returns {boolean} Return `true` if redo can be performed, `false` otherwise.
 */
UndoRedo.prototype.isRedoAvailable = function() {
  return this.undoneActions.length > 0;
};

/**
 * Clears undo history.
 *
 * @function clear
 * @memberof UndoRedo#
 */
UndoRedo.prototype.clear = function() {
  this.doneActions.length = 0;
  this.undoneActions.length = 0;
};

/**
 * Checks if the plugin is enabled.
 *
 * @function isEnabled
 * @memberof UndoRedo#
 * @returns {boolean}
 */
UndoRedo.prototype.isEnabled = function() {
  return this.enabled;
};

/**
 * Enables the plugin.
 *
 * @function enable
 * @memberof UndoRedo#
 */
UndoRedo.prototype.enable = function() {
  if (this.isEnabled()) {
    return;
  }

  const hot = this.instance;

  this.enabled = true;
  exposeUndoRedoMethods(hot);

  this.registerShortcuts();
  hot.addHook('afterChange', onAfterChange);
};

/**
 * Disables the plugin.
 *
 * @function disable
 * @memberof UndoRedo#
 */
UndoRedo.prototype.disable = function() {
  if (!this.isEnabled()) {
    return;
  }

  const hot = this.instance;

  this.enabled = false;
  removeExposedUndoRedoMethods(hot);

  this.unregisterShortcuts();
  hot.removeHook('afterChange', onAfterChange);
};

/**
 * Destroys the instance.
 *
 * @function destroy
 * @memberof UndoRedo#
 */
UndoRedo.prototype.destroy = function() {
  this.clear();
  this.instance = null;
  this.doneActions = null;
  this.undoneActions = null;
};

/**
 * Enabling and disabling plugin and attaching its to an instance.
 *
 * @private
 */
UndoRedo.prototype.init = function() {
  const settings = this.instance.getSettings().undo;
  const pluginEnabled = typeof settings === 'undefined' || settings;

  if (!this.instance.undoRedo) {
    this.instance.undoRedo = this;
  }

  if (pluginEnabled) {
    this.instance.undoRedo.enable();

  } else {
    this.instance.undoRedo.disable();
  }
};

/**
 * Registers shortcuts responsible for performing undo/redo.
 *
 * @private
 */
UndoRedo.prototype.registerShortcuts = function() {
  const shortcutManager = this.instance.getShortcutManager();
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
};

/**
 * Unregister shortcuts responsible for performing undo/redo.
 *
 * @private
 */
UndoRedo.prototype.unregisterShortcuts = function() {
  const shortcutManager = this.instance.getShortcutManager();
  const gridContext = shortcutManager.getContext('grid');

  gridContext.removeShortcutsByGroup(SHORTCUTS_GROUP);
};

/**
 * @param {Array} changes 2D array containing information about each of the edited cells.
 * @param {string} source String that identifies source of hook call.
 * @returns {boolean}
 */
function onAfterChange(changes, source) {
  const instance = this;

  if (source === 'loadData') {
    return instance.undoRedo.clear();
  }
}

/**
 * @param {Core} instance The Handsontable instance.
 */
function exposeUndoRedoMethods(instance) {
  /**
   * {@link UndoRedo#undo}.
   *
   * @alias undo
   * @memberof! Core#
   * @returns {boolean}
   */
  instance.undo = function() {
    return instance.undoRedo.undo();
  };

  /**
   * {@link UndoRedo#redo}.
   *
   * @alias redo
   * @memberof! Core#
   * @returns {boolean}
   */
  instance.redo = function() {
    return instance.undoRedo.redo();
  };

  /**
   * {@link UndoRedo#isUndoAvailable}.
   *
   * @alias isUndoAvailable
   * @memberof! Core#
   * @returns {boolean}
   */
  instance.isUndoAvailable = function() {
    return instance.undoRedo.isUndoAvailable();
  };

  /**
   * {@link UndoRedo#isRedoAvailable}.
   *
   * @alias isRedoAvailable
   * @memberof! Core#
   * @returns {boolean}
   */
  instance.isRedoAvailable = function() {
    return instance.undoRedo.isRedoAvailable();
  };

  /**
   * {@link UndoRedo#clear}.
   *
   * @alias clearUndo
   * @memberof! Core#
   * @returns {boolean}
   */
  instance.clearUndo = function() {
    return instance.undoRedo.clear();
  };
}

/**
 * @param {Core} instance The Handsontable instance.
 */
function removeExposedUndoRedoMethods(instance) {
  delete instance.undo;
  delete instance.redo;
  delete instance.isUndoAvailable;
  delete instance.isRedoAvailable;
  delete instance.clearUndo;
}

const hook = Hooks.getSingleton();

hook.add('afterUpdateSettings', function() {
  this.getPlugin('undoRedo')?.init();
});

hook.register('beforeUndo');
hook.register('afterUndo');
hook.register('beforeRedo');
hook.register('afterRedo');

UndoRedo.PLUGIN_KEY = PLUGIN_KEY;
UndoRedo.SETTING_KEYS = true;

export default UndoRedo;
