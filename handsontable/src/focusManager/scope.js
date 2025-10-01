import { installFocusDetector } from './utils/focusDetector';
import { SCOPE_TYPES, FOCUS_SOURCES, DEFAULT_SHORTCUTS_CONTEXT } from './constants';

/**
 * Creates a focus scope with its own lifecycle and boundaries.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @param {HTMLElement} container Container element for the scope.
 * @param {object} options Configuration options.
 * @param {boolean} options.installFocusDetector Whether to install a focus detector.
 * @param {string} options.shortcutsContextName The name of the shortcuts context to switch to when the scope is activated.
 * @param {'modal' | 'container'} options.type The type of the scope.
 * @param {function(): boolean} options.detached Whether the container is detached.
 * @param {function(): boolean} options.runOnlyIf Whether the scope is enabled or not depends on the custom logic.
 * @returns {object} Focus scope object with methods.
 */
export function createFocusScope(hotInstance, container, options = {}) {
  const mergedOptions = {
    installFocusDetector: true,
    shortcutsContextName: DEFAULT_SHORTCUTS_CONTEXT,
    type: SCOPE_TYPES.CONTAINER,
    detached: () => !hotInstance.rootWrapperElement.contains(container),
    contains: target => target === container || container.contains(target),
    runOnlyIf: () => true,
    ...options,
  };
  const focusCatchers = mergedOptions.installFocusDetector
    ? installFocusDetector(hotInstance, container) : null;

  /**
   * Disables the scope. Disabled scope can't be focused.
   */
  const deactivateFocusCatchers = () => {
    focusCatchers?.deactivate();
  };

  /**
   * Enables the scope.
   */
  const activateFocusCatchers = () => {
    focusCatchers?.activate();
  };

  /**
   * Checks if the target element is within the scope.
   *
   * @param {HTMLElement} target The target element to check.
   * @returns {boolean}
   */
  const contains = (target) => {
    return mergedOptions.contains(target);
  };

  /**
   * Activates the scope.
   *
   * @param {string} activationSource The source of the activation.
   */
  const activate = (activationSource = FOCUS_SOURCES.UNKNOWN) => {
    // deactivateFocusCatchers(); // todo: may not be needed
    mergedOptions.callback?.(activationSource);
  };

  /**
   * Deactivates the scope.
   */
  const deactivate = () => {
    // activateFocusCatchers(); // todo: may not be needed
  };

  const disable = () => {
    container.setAttribute('inert', 'true');
  };

  const enable = () => {
    container.removeAttribute('inert');
  };

  const destroy = () => {
    focusCatchers?.destroy();
  };

  return {
    getType: () => mergedOptions.type,
    hasContainerDetached: () => mergedOptions.detached(),
    getShortcutsContextName: () => mergedOptions.shortcutsContextName,
    runOnlyIf: () => mergedOptions.runOnlyIf(),
    contains,
    activate,
    deactivate,
    deactivateFocusCatchers,
    activateFocusCatchers,
    disable,
    enable,
    destroy,
  };
}
