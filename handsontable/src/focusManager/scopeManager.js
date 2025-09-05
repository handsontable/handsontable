import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { createFocusScope } from './scope';
import { useListener } from './focusListener';
import { FOCUS_MANAGER_GROUP, FOCUS_SOURCES } from './constants';

/**
 * Creates a focus scope manager for a Handsontable instance.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @returns {object} Focus scope manager object with methods.
 */
export function createFocusScopeManager(hotInstance) {
  const SCOPES = createUniqueMap({
    errorIdExists: name => `The "${name}" scope is already registered.`
  });

  const shortcutManager = hotInstance.getShortcutManager();
  let activeScope = null;

  /**
   * Registers a new focus scope.
   *
   * @param {string} scopeId Unique identifier for the scope.
   * @param {HTMLElement} container Container element for the scope.
   * @param {object} options Configuration options.
   * @returns {object} The created focus scope.
   */
  function registerScope(scopeId, container, options = {}) {
    const scope = createFocusScope(hotInstance, container, options);

    SCOPES.addItem(scopeId, scope);

    scope._scopeId = scopeId; // temporary

    shortcutManager
      .getOrCreateContext(scope.getShortcutsContextName())
      .addShortcut({
        keys: [['Shift', 'Tab'], ['Tab']],
        preventDefault: false,
        callback: (event) => {
          // console.log('tab', scopeId, event.target, document.activeElement);
        },
        group: FOCUS_MANAGER_GROUP,
      });

    return scope;
  }

  /**
   * Unregisters a scope completely.
   *
   * @param {string} scopeId The scope to remove.
   */
  function unregisterScope(scopeId) {
    // Implementation needed
  }

  /**
   * Activates a scope by its ID.
   *
   * @param {string} scopeId The ID of the scope to activate.
   */
  function enableScope(scopeId) {
    if (!SCOPES.hasItem(scopeId)) {
      throw new Error(`Scope with id ${scopeId} not found`);
    }

    SCOPES.getItem(scopeId).enable();
  }

  /**
   * Deactivates a scope by its ID.
   *
   * @param {string} scopeId The ID of the scope to deactivate.
   */
  function disableScope(scopeId) {
    if (!SCOPES.hasItem(scopeId)) {
      throw new Error(`Scope with id ${scopeId} not found`);
    }

    SCOPES.getItem(scopeId).disable();
  }

  /**
   * Activates a specific scope.
   *
   * @param {object} scope The scope to activate.
   * @param {string} focusSource The source of the focus event.
   */
  function activateScope(scope, focusSource = FOCUS_SOURCES.UNKNOWN) {
    console.log('#activateScope', scope._scopeId, focusSource);

    activeScope = scope;
    activeScope.activate(focusSource);

    shortcutManager.setActiveContextName(scope.getShortcutsContextName());

    // if (activeScope.getType() === 'modal') {
    //   SCOPES.getValues().forEach((scopeItem) => {
    //     if (scopeItem !== activeScope) {
    //       scopeItem.disable();
    //     }
    //   });
    // } else {
    //   SCOPES.getValues().forEach((scopeItem) => {
    //     if (scopeItem !== activeScope) {
    //       scopeItem.enable();
    //     }
    //   });
    // }
  }

  /**
   * Deactivates a scope by its ID.
   *
   * @param {string} scopeId The scope ID to deactivate.
   */
  function deactivateScope(scope) {
    scope.deactivate();

    // SCOPES.getItems().forEach((scope) => {
    //   scope.enable();
    // });
  }

  /**
   * Updates the active scope based on the target element and focus source.
   *
   * @param {HTMLElement} target The target element.
   * @param {string} focusSource The source of the focus event.
   */
  function processScopes(target, focusSource) {
    const allEnabledScopes = SCOPES.getValues().filter(scope => {
      return !scope.isDisabled() &&
        (focusSource === FOCUS_SOURCES.CLICK || focusSource !== FOCUS_SOURCES.CLICK && scope.runOnlyIf());
    });
    const scopesByPriority = new Set([
      // first pass: check detached components
      ...allEnabledScopes
        .filter(scope => scope.hasContainerDetached()),
      // second pass: check scopes with modal type
      ...allEnabledScopes
        .filter(scope => scope.getType() === 'modal'),
      // third pass: check all other scopes
      ...allEnabledScopes,
    ]);

    let hasActiveScope = false;

    console.log(scopesByPriority);

    scopesByPriority.forEach(scope => {
      if (!hasActiveScope && scope.contains(target)) {
        hasActiveScope = true;
        activateScope(scope, focusSource);
      } else {
        deactivateScope(scope);
      }
    });

    if (hasActiveScope) {
      hotInstance.listen();
    } else {
      hotInstance.unlisten();
    }
  }

  const focusListener = useListener(
    hotInstance.rootWindow,
    {
      onFocus: (event) => {
        processScopes(event.target, event.target.dataset.htFocusSource ?? FOCUS_SOURCES.UNKNOWN);
      },
      onClick: (event) => {
        processScopes(event.target, FOCUS_SOURCES.CLICK);
      },
      onKeyDown: (event) => {
        // todo: handle keydown
      },
    }
  );

  focusListener.mount();

  return {
    registerScope,
    unregisterScope,
    enableScope,
    disableScope,
    destroy: () => focusListener.unmount(),
  };
}
