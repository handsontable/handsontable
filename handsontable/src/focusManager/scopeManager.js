import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { createFocusScope } from './scope';
import { useEventListener } from './eventListener';
import { FOCUS_SOURCES } from './constants';

/**
 * Creates a focus scope manager for a Handsontable instance.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @returns {object} Focus scope manager object with methods.
 */
export function createFocusScopeManager(hotInstance) {
  const SCOPES = createUniqueMap({
    errorIdExists: name => `The "${name}" focus scope is already registered.`
  });

  const shortcutManager = hotInstance.getShortcutManager();
  let activeScope = null;

  // eslint-disable-next-line
  window.activeScope = () => activeScope;

  /**
   * Registers a new focus scope.
   *
   * @param {string} scopeId Unique identifier for the scope.
   * @param {HTMLElement} container Container element for the scope.
   * @param {object} options Configuration options.
   */
  function registerScope(scopeId, container, options = {}) {
    const scope = createFocusScope(hotInstance, container, options);

    SCOPES.addItem(scopeId, scope);

    scope._scopeId = scopeId; // temporary
    shortcutManager.getOrCreateContext(scope.getShortcutsContextName());
  }

  /**
   * Unregisters a scope completely.
   *
   * @param {string} scopeId The scope to remove.
   */
  function unregisterScope(scopeId) {
    if (!SCOPES.hasItem(scopeId)) {
      throw new Error(`Scope with id ${scopeId} not found`);
    }

    const scope = SCOPES.getItem(scopeId);

    scope.destroy();
    SCOPES.removeItem(scopeId);
  }

  let focusedElement = null;

  /**
   * Activates a focus scope by its ID.
   *
   * @param {string} scopeId The ID of the scope to activate.
   */
  function activateScopeById(scopeId) {
    if (!SCOPES.hasItem(scopeId)) {
      throw new Error(`Scope with id ${scopeId} not found`);
    }

    focusedElement = hotInstance.rootDocument.activeElement;
    activateScope(SCOPES.getItem(scopeId));
  }

  /**
   * Deactivates a scope by its ID.
   *
   * @param {string} scopeId The ID of the scope to deactivate.
   */
  function deactivateScopeById(scopeId) {
    if (!SCOPES.hasItem(scopeId)) {
      throw new Error(`Scope with id ${scopeId} not found`);
    }

    deactivateScope(SCOPES.getItem(scopeId));

    focusedElement?.focus();
    focusedElement = null;
  }

  /**
   * Activates a specific scope.
   *
   * @param {object} scope The scope to activate.
   * @param {string} focusSource The source of the focus event.
   */
  function activateScope(scope, focusSource = FOCUS_SOURCES.UNKNOWN) {
    if (activeScope === scope) {
      return;
    }

    activeScope = scope;
    activeScope.activate(focusSource);
    // updateScopesFocusVisibilityState();

    shortcutManager.setActiveContextName(scope.getShortcutsContextName());
  }

  /**
   * Deactivates a scope by its ID.
   *
   * @param {object} scope The scope to deactivate.
   */
  function deactivateScope(scope) {
    if (activeScope !== scope) {
      return;
    }

    activeScope = null;
    scope.deactivate();
    // updateScopesFocusVisibilityState();
  }

  /**
   * Updates the focus scopes state by enabling or disabling them or their focus catchers to make sure
   * that the next native focus move won't be disturbed.
   */
  function updateScopesFocusVisibilityState() {
    const modalScopes = SCOPES.getValues()
      .filter(scope => scope.runOnlyIf() && scope.getType() === 'modal');

    // console.log('updateScopesFocusVisibilityState', activeScope?._scopeId);

    SCOPES.getValues().forEach((scope) => {
      if (
        modalScopes.length > 0 && modalScopes.includes(scope) ||
        modalScopes.length === 0 ||
        scope.hasContainerDetached()
      ) {
        scope.enable();
      } else {
        scope.disable();
      }
    });

    SCOPES.getValues().forEach((scope) => {
      if (scope === activeScope) {
        if (scope.contains(hotInstance.rootDocument.activeElement)) {
          scope.deactivateFocusCatchers();
        } else {
          scope.activateFocusCatchers();
        }

      } else if (scope.runOnlyIf()) {
        scope.activateFocusCatchers();

      } else {
        scope.deactivateFocusCatchers();
      }
    });
  }

  /**
   * Updates the active scope based on the target element and focus source.
   *
   * @param {HTMLElement} target The target element.
   * @param {string} focusSource The source of the focus event.
   */
  function processScopes(target, focusSource) {
    if (hotInstance.selection.isSelected() && activeScope && activeScope.runOnlyIf() && activeScope.contains(target)) {
      if (focusSource !== FOCUS_SOURCES.UNKNOWN) {
        hotInstance.listen();
      }

      return;
    }

    const allEnabledScopes = SCOPES.getValues().filter(scope => scope.runOnlyIf());

    // if (activeScope) {
    //   deactivateScope(activeScope);
    // }
    // activeScope = null;

    let hasActiveScope = false;

    allEnabledScopes.forEach((scope) => {
      if (!hasActiveScope && scope.contains(target)) {
        hasActiveScope = true;

        if (focusSource !== FOCUS_SOURCES.UNKNOWN) {
          hotInstance.listen();
        }

        activateScope(scope, focusSource);
      }
    });

    if (!hasActiveScope) {
      if (activeScope) {
        deactivateScope(activeScope);
      }

      hotInstance.unlisten();
    }
  }

  const eventListener = useEventListener(
    hotInstance.rootWindow,
    {
      onFocus: (event) => {
        // console.log('onFocus', hotInstance.guid, event.target);
        processScopes(event.target, event.target.dataset.htFocusSource ?? FOCUS_SOURCES.UNKNOWN);
      },
      onClick: (event) => {
        processScopes(event.target, FOCUS_SOURCES.CLICK);
      },
      onTabKeyDown: () => {
        // console.log(Array.from(document.querySelectorAll('.htFocusCatcher')).map(el => el.tabIndex));
        updateScopesFocusVisibilityState();
      },
    }
  );

  eventListener.mount();

  return {
    registerScope,
    unregisterScope,
    activateScope: scopeId => activateScopeById(scopeId),
    deactivateScope: scopeId => deactivateScopeById(scopeId),
    destroy: () => eventListener.unmount(),
  };
}
