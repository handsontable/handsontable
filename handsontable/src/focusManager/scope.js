import { installFocusDetector } from './utils/focusDetector';
import { SCOPE_TYPES, FOCUS_SOURCES, DEFAULT_SHORTCUTS_CONTEXT } from './constants';

/**
 * Creates a focus scope with its own lifecycle and boundaries.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @param {HTMLElement} container Container element for the scope.
 * @param {Object} options Configuration options.
 * @returns {Object} Focus scope object with methods.
 */
export function createFocusScope(hotInstance, container, options = {}) {
  const mergedOptions = {
    installFocusDetector: true,
    shortcutsContextName: DEFAULT_SHORTCUTS_CONTEXT,
    type: SCOPE_TYPES.CONTAINER,
    detached: () => !hotInstance.rootWrapperElement.contains(container),
    runOnlyIf: () => true,
    ...options,
  };
  const focusCatchers = mergedOptions.installFocusDetector
    ? installFocusDetector(hotInstance, container) : null;

  let isActivated = false;
  let isDisabled = false;

  /**
   * Checks if the target element is within the scope.
   *
   * @param {HTMLElement} target The target element to check.
   * @returns {boolean}
   */
  const contains = (target) => {
    if (mergedOptions.type === SCOPE_TYPES.MODAL) {
      return hotInstance.rootWrapperElement.contains(target);
    }

    return container.contains(target);
  };

  /**
   * Activates the scope.
   *
   * @param {string} activationSource The source of the activation.
   */
  const activate = (activationSource = FOCUS_SOURCES.UNKNOWN) => {
    console.log('scope activate()', activationSource);

    isActivated = true;
    focusCatchers?.deactivate();
    mergedOptions.onActivation?.(activationSource);
  };

  /**
   * Deactivates the scope.
   */
  const deactivate = () => {
    focusCatchers?.activate();
    mergedOptions.onDeactivation?.();
  };

  /**
   * Disables the scope. Disabled scope can't be focused.
   */
  const disable = () => {
    isDisabled = true;
    container.setAttribute('inert', true);
  };

  /**
   * Enables the scope.
   */
  const enable = () => {
    isDisabled = false;
    container.removeAttribute('inert');
  };

  return {
    getType: () => mergedOptions.type,
    hasContainerDetached: () => mergedOptions.detached(),
    getShortcutsContextName: () => mergedOptions.shortcutsContextName,
    isActive: () => isActivated,
    isDisabled: () => isDisabled,
    runOnlyIf: () => mergedOptions.runOnlyIf(),
    contains,
    activate,
    deactivate,
    disable,
    enable,
  };
}
