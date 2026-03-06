import { installFocusDetector } from './utils/focusDetector';
import { SCOPE_TYPES, FOCUS_SOURCES, DEFAULT_SHORTCUTS_CONTEXT } from './constants';

/**
 * @typedef {object} FocusScope
 * @property {function(): string} getType The type of the scope.
 * @property {function(): boolean} hasContainerDetached Whether the container is detached from the root Handsontable wrapper element.
 * @property {function(): string} getShortcutsContextName The name of the shortcuts context to switch to when the scope is activated.
 * @property {function(): boolean} runOnlyIf Whether the scope is enabled or not depends on the custom logic.
 * @property {function(): boolean} contains Whether the target element is within the scope.
 * @property {function(): void} activate Activates the scope.
 * @property {function(): void} deactivate Deactivates the scope.
 * @property {function(): void} activateFocusCatchers Activates the focus catchers.
 * @property {function(): void} deactivateFocusCatchers Deactivates the focus catchers.
 * @property {function(): void} enable Enables the scope.
 * @property {function(): void} disable Disables the scope.
 * @property {function(): void} destroy Destroys the scope.
 */
/**
 * Creates a focus scope with its own boundaries.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @param {HTMLElement} container Container element for the scope.
 * @param {object} [options] Configuration options.
 * @param {string} [options.shortcutsContextName='grid'] The name of the shortcuts context to switch to when
 * the scope is activated.
 * @param {'modal' | 'inline'} [options.type='inline'] The type of the scope:<br/>
 *   - `modal`: The scope is modal and blocks the rest of the grid from receiving focus.<br/>
 *   - `inline`: The scope is inline and allows the rest of the grid to receive focus in the order of the rendered elements in the DOM.
 * @param {function(): boolean} [options.runOnlyIf] Whether the scope is enabled or not depends on the custom logic.
 * @param {function(HTMLElement): boolean} [options.contains] Whether the target element is within the scope. If the option is not
 *  provided, the scope will be activated if the target element is within the container element.
 * @param {function(): void} [options.onActivate] Callback function to be called when the scope is activated.
 * The first argument is the source of the activation:<br/>
 *   - `unknown`: The scope is activated by an unknown source.<br/>
 *   - `click`: The scope is activated by a click event.<br/>
 *   - `tab_from_above`: The scope is activated by a tab key press.<br/>
 *   - `tab_from_below`: The scope is activated by a shift+tab key press.
 * @param {function(): void} [options.onDeactivate] Callback function to be called when the scope is deactivated.
 * @returns {FocusScope} Focus scope object with methods.
 */
export function createFocusScope(hotInstance, container, options = {}) {
  const mergedOptions = {
    shortcutsContextName: DEFAULT_SHORTCUTS_CONTEXT,
    type: SCOPE_TYPES.INLINE,
    contains: target => target === container || container.contains(target),
    runOnlyIf: () => true,
    ...options,
  };

  const focusCatchers = installFocusDetector(hotInstance, container);

  /**
   * Checks if the target element is within the scope boundaries.
   *
   * @param {HTMLElement} target The target element to check.
   * @returns {boolean}
   */
  const contains = (target) => {
    return mergedOptions.contains(target);
  };

  /**
   * Disables the focus catchers.
   */
  const deactivateFocusCatchers = () => {
    focusCatchers?.deactivate();
  };

  /**
   * Enables the focus catchers.
   */
  const activateFocusCatchers = () => {
    focusCatchers?.activate();
  };

  /**
   * Activates the scope.
   *
   * @param {'unknown' | 'click' | 'tab_from_above' | 'tab_from_below'} activationSource The source of the activation.
   */
  const activate = (activationSource = FOCUS_SOURCES.UNKNOWN) => {
    mergedOptions.onActivate?.(activationSource);
  };

  /**
   * Deactivates the scope.
   */
  const deactivate = () => {
    mergedOptions.onDeactivate?.();
  };

  /**
   * Enables the scope so the scope container can be focused.
   */
  const enable = () => {
    container.removeAttribute('inert');
  };

  /**
   * Disables the scope so the scope container can't be focused.
   */
  const disable = () => {
    container.setAttribute('inert', 'true');
  };

  /**
   * Destroys the scope.
   */
  const destroy = () => {
    focusCatchers?.destroy();
  };

  return {
    getType: () => mergedOptions.type,
    hasContainerDetached: () => !hotInstance.rootWrapperElement.contains(container),
    getShortcutsContextName: () => mergedOptions.shortcutsContextName,
    runOnlyIf: () => mergedOptions.runOnlyIf(),
    contains,
    activate,
    deactivate,
    activateFocusCatchers,
    deactivateFocusCatchers,
    enable,
    disable,
    destroy,
  };
}
