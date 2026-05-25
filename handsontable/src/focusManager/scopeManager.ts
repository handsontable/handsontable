import type { HotInstance } from '../core/types';
import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { throwWithCause } from '../helpers/errors';
import { createFocusScope } from './scope';
import { useEventListener } from './eventListener';
import { FOCUS_SOURCES } from './constants';
import { eventTargetEl, isVisible } from '../helpers/dom/element';

type FocusScopeType = 'modal' | 'inline';
type FocusScopeActivationSource = 'unknown' | 'click' | 'tab_from_above' | 'tab_from_below';

export type FocusScopeOptions = {
  shortcutsContextName?: string;
  type?: FocusScopeType;
  contains?: (target: HTMLElement) => boolean;
  runOnlyIf?: () => boolean;
  enableFocusCatchers?: boolean;
  onActivate?: (focusSource: FocusScopeActivationSource) => void;
  onDeactivate?: () => void;
};

export interface FocusScopeManager {
  getActiveScopeId(): string | null;
  registerScope(scopeId: string, container: HTMLElement, options?: FocusScopeOptions): void;
  unregisterScope(scopeId: string): void;
  activateScope(scopeId: string, focusSource?: string): void;
  deactivateScope(scopeId: string): void;
  destroy(): void;
}

/**
 * @typedef {object} FocusScopeManager
 * @property {function(): string | null} getActiveScopeId Returns the ID of the active scope.
 * @property {function(string, HTMLElement, object): void} registerScope Registers a new focus scope.
 * @property {function(string): void} unregisterScope Unregisters a scope by its ID.
 * @property {function(string, ('unknown' | 'click' | 'tab_from_above' | 'tab_from_below')?): void} activateScope Activates a focus scope by its ID.
 * @property {function(string): void} deactivateScope Deactivates a scope by its ID.
 * @property {function(): void} destroy Destroys the focus scope manager.
 */

/**
 * Creates a focus scope manager for a Handsontable instance. The manager handles focus
 * scopes by listening to keydown, focusin, and click events on the document. Based on
 * the currently focused element, it activates or deactivates the appropriate scope.
 * Focus scope contains its own boundaries and logic that once activated allows to focus
 * specific focusable element within the scope container element and/or switch to specific
 * shortcuts context.
 *
 * The manager also automatically updates the {@link Core#isListening} state of the Handsontable
 * instance based on the current state of the scopes.
 *
 * @alias FocusScopeManager
 * @class FocusScopeManager
 * @param {Core} hotInstance The Handsontable instance.
 */
export function createFocusScopeManager(hotInstance: HotInstance): FocusScopeManager {
  const SCOPES = createUniqueMap({
    errorIdExists: (name: string) => `The "${name}" focus scope is already registered.`
  });

  const shortcutManager = hotInstance.getShortcutManager();
  let activeScope: ReturnType<typeof createFocusScope> | null = null;

  /**
   * Returns the ID of the active scope.
   *
   * @memberof FocusScopeManager#
   * @returns {string | null} The ID of the active scope.
   */
  function getActiveScopeId(): string | null {
    if (!activeScope) {
      return null;
    }

    return SCOPES.getId(activeScope);
  }

  /**
   * Registers a new focus scope.
   *
   * @memberof FocusScopeManager#
   * @param {string} scopeId Unique identifier for the scope.
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
   *
   * @example
   * For regular element (inline scope)
   *
   * ```js
   * hot.getFocusScopeManager().registerScope('myPluginName', containerElement, {
   *   shortcutsContextName: 'plugin:myPluginName',
   *   onActivate: (focusSource) => {
   *     // Focus the internal focusable element within the plugin UI element
   *   },
   * });
   * ```
   *
   * or for modal scope
   *
   * ```js
   * hot.getFocusScopeManager().registerScope('myPluginName', containerElement, {
   *   shortcutsContextName: 'plugin:myPluginName',
   *   type: 'modal',
   *   runOnlyIf: () => isDialogOpened(),
   *   onActivate: (focusSource) => {
   *     // Focus the internal focusable element within the plugin UI element
   *   },
   * });
   * ```
   */
  function registerScope(scopeId: string, container: HTMLElement, options: FocusScopeOptions = {}): void {
    if (SCOPES.hasItem(scopeId)) {
      throwWithCause(`Scope with id "${scopeId}" already registered`);
    }

    const scope = createFocusScope(hotInstance, container, options);

    SCOPES.addItem(scopeId, scope);

    shortcutManager.getOrCreateContext(scope.getShortcutsContextName());
  }

  /**
   * Unregisters a scope completely.
   *
   * @memberof FocusScopeManager#
   * @param {string} scopeId The scope to remove.
   */
  function unregisterScope(scopeId: string): void {
    if (!SCOPES.hasItem(scopeId)) {
      throwWithCause(`Scope with id "${scopeId}" not found`);
    }

    const scope = SCOPES.getItem(scopeId);

    scope.destroy();
    SCOPES.removeItem(scopeId);
  }

  /**
   * Activates a focus scope by its ID.
   *
   * @memberof FocusScopeManager#
   * @alias FocusScopeManager#activateScope
   * @param {string} scopeId The ID of the scope to activate.
   * @param {'unknown' | 'click' | 'tab_from_above' | 'tab_from_below'} [focusSource='unknown'] Passed to the scope's `onActivate` callback (same values as document `htFocusSource`).
   */
  function activateScopeById(scopeId: string, focusSource: string = FOCUS_SOURCES.UNKNOWN): void {
    if (!SCOPES.hasItem(scopeId)) {
      throwWithCause(`Scope with id "${scopeId}" not found`);
    }

    const resolvedSource = focusSource ?? FOCUS_SOURCES.UNKNOWN;

    activateScope(SCOPES.getItem(scopeId), resolvedSource);
  }

  /**
   * Deactivates a scope by its ID.
   *
   * @memberof FocusScopeManager#
   * @alias FocusScopeManager#deactivateScope
   * @param {string} scopeId The ID of the scope to deactivate.
   */
  function deactivateScopeById(scopeId: string): void {
    if (!SCOPES.hasItem(scopeId)) {
      throwWithCause(`Scope with id "${scopeId}" not found`);
    }

    deactivateScope(SCOPES.getItem(scopeId));
  }

  /**
   * Activates a specific scope.
   *
   * @param {object} scope The scope to activate.
   * @param {'unknown' | 'click' | 'tab_from_above' | 'tab_from_below'} focusSource The source of the focus event.
   */
  function activateScope(
    scope: ReturnType<typeof createFocusScope>, focusSource: string = FOCUS_SOURCES.UNKNOWN): void {
    if (activeScope === scope) {
      return;
    }

    if (activeScope !== null) {
      deactivateScope(activeScope);
    }

    activeScope = scope;
    activeScope.activate(focusSource);

    shortcutManager.setActiveContextName(scope.getShortcutsContextName());
  }

  /**
   * Deactivates a scope by its ID.
   *
   * @param {object} scope The scope to deactivate.
   */
  function deactivateScope(scope: ReturnType<typeof createFocusScope>): void {
    updateScopesFocusVisibilityState();

    if (activeScope !== scope) {
      return;
    }

    activeScope = null;
    scope.deactivate();
  }

  /**
   * Updates the focus scopes state by enabling or disabling them or their focus catchers to make sure
   * that the next native focus move won't be disturbed.
   */
  function updateScopesFocusVisibilityState(): void {
    const scopes = SCOPES.getValues();
    const modalScopes = scopes.filter(
      (scope: ReturnType<typeof createFocusScope>) => scope.runOnlyIf() && scope.getType() === 'modal');

    scopes.forEach((scope: ReturnType<typeof createFocusScope>) => {
      if (
        modalScopes.length > 0 && modalScopes.includes(scope) ||
        modalScopes.length === 0 ||
        scope.hasContainerDetached()
      ) {
        scope.enable();
      } else {
        scope.disable();
      }

      if (scope === activeScope) {
        if (scope.contains(hotInstance.rootDocument.activeElement as HTMLElement)) {
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
   * Activates or deactivates the appropriate scope based on the target element that was
   * triggered by the focus or click event.
   *
   * @param {HTMLElement} target The target element.
   * @param {'unknown' | 'click' | 'tab_from_above' | 'tab_from_below'} focusSource The source of the focus event.
   */
  function processScopes(target: HTMLElement, focusSource: string): void {
    if (!target.isConnected || !isVisible(target)) {
      return;
    }

    const allEnabledScopes = SCOPES.getValues().filter(
      (scope: ReturnType<typeof createFocusScope>) => scope.runOnlyIf());
    let hasActiveScope = false;

    allEnabledScopes.forEach((scope: ReturnType<typeof createFocusScope>) => {
      if (!hasActiveScope && scope.contains(target)) {
        hasActiveScope = true;

        if (focusSource !== FOCUS_SOURCES.UNKNOWN) {
          hotInstance.listen();
        }

        activateScope(scope, focusSource);
      }
    });

    if (!hasActiveScope && activeScope) {
      deactivateScope(activeScope);
      hotInstance.unlisten();
    }
  }

  const eventListener = useEventListener(
    hotInstance.rootWindow,
    {
      onFocus: (event) => {
        processScopes(eventTargetEl(event)!, eventTargetEl(event)!.dataset.htFocusSource ?? FOCUS_SOURCES.UNKNOWN);
      },
      onClick: (event) => {
        processScopes(eventTargetEl(event)!, FOCUS_SOURCES.CLICK);
      },
      onTabKeyDown: () => {
        updateScopesFocusVisibilityState();
      },
    }
  );

  eventListener.mount();

  return {
    getActiveScopeId,
    registerScope,
    unregisterScope,
    activateScope: (scopeId: string, focusSource?: string) => activateScopeById(scopeId, focusSource),
    deactivateScope: scopeId => deactivateScopeById(scopeId),
    destroy: () => eventListener.unmount(),
  };
}
