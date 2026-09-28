import type { HotInstance } from '../core/types';
import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { throwWithCause } from '../helpers/errors';
import { createFocusScope } from './scope';
import { useEventListener } from './eventListener';
import { FOCUS_SOURCES, DEFAULT_SHORTCUTS_CONTEXT } from './constants';
import {
  getComposedEventTargetEl,
  getDeepActiveElement,
  getShadowHostChain,
  isHTMLElement,
  isVisible,
} from '../helpers/dom/element';

type FocusScopeType = 'modal' | 'inline';
type FocusScopeActivationSource = 'unknown' | 'click' | 'tab_from_above' | 'tab_from_below';

export type FocusScopeOptions = {
  shortcutsContextName?: string;
  fallbackShortcutsContextName?: string;
  coversGridBody?: boolean;
  type?: FocusScopeType;
  contains?: (target: HTMLElement) => boolean;
  runOnlyIf?: () => boolean;
  enableFocusCatchers?: boolean;
  onActivate?: (focusSource: FocusScopeActivationSource) => void;
  onDeactivate?: () => void;
};

export interface FocusScopeManager {
  getActiveScopeId(): string | null;
  isGridBodyCovered(): boolean;
  registerScope(scopeId: string, container: HTMLElement, options?: FocusScopeOptions): void;
  unregisterScope(scopeId: string): void;
  activateScope(scopeId: string, focusSource?: string): void;
  deactivateScope(scopeId: string): void;
  destroy(): void;
}

/**
 * @typedef {object} FocusScopeManager
 * @property {function(): string | null} getActiveScopeId Returns the ID of the active scope.
 * @property {function(): boolean} isGridBodyCovered Whether any enabled scope currently covers the grid body.
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

    return SCOPES.getId(activeScope) as string | null;
  }

  /**
   * Whether any enabled scope currently covers the grid body.
   *
   * Asked of every registered scope rather than only the active one: an overlay is on screen whether or
   * not it holds the keyboard, and that is what puts the cells underneath out of reach. Shortcuts that
   * act on cell content consult this through `canAccessCellContent()` in `../shortcuts/guards.ts`.
   *
   * @memberof FocusScopeManager#
   * @returns {boolean}
   */
  function isGridBodyCovered(): boolean {
    return (SCOPES.getValues() as ReturnType<typeof createFocusScope>[])
      .some((scope: ReturnType<typeof createFocusScope>) => scope.getCoversGridBody() && scope.runOnlyIf());
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
   * @param {string} [options.fallbackShortcutsContextName] The name of a shortcuts context consulted for keys the
   * scope's own context does not define. Pass `'grid'` for a scope that covers the grid without replacing it.
   * It must differ from `shortcutsContextName`, which defaults to `'grid'`.
   * @param {boolean} [options.coversGridBody=false] Whether the scope covers the grid body while it is showing,
   * so the cells underneath are drawn but out of reach. Covering and inheriting are separate questions: a
   * pagination bar may inherit without covering.
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

    const contextName = scope.getShortcutsContextName();
    const scopeContext = shortcutManager.getOrCreateContext(contextName);
    const fallbackContextName = scope.getFallbackShortcutsContextName();

    if (fallbackContextName === contextName) {
      SCOPES.removeItem(scopeId);
      scope.destroy();
      throwWithCause(`The "${scopeId}" focus scope falls back to its own shortcuts context ` +
        `("${contextName}"). \`shortcutsContextName\` defaults to "grid", so a scope that declares only ` +
        '`fallbackShortcutsContextName` names the same context twice.');
    }

    // The fallback lives on the shortcuts CONTEXT, which several scopes may share, so a second scope
    // naming the same context with a different fallback would silently replace the first one's - and
    // `hasOtherScopeWithSameFallback()` below, which matches on the pair, would then let the first
    // scope's teardown clear the fallback the second one still needs. Refuse the pair instead, the
    // same way the self-referencing one above is refused.
    const conflicting = (SCOPES.getValues() as ReturnType<typeof createFocusScope>[]).find(
      (other: ReturnType<typeof createFocusScope>) => other !== scope &&
        other.getShortcutsContextName() === contextName &&
        other.getFallbackShortcutsContextName() !== fallbackContextName);

    if (conflicting) {
      SCOPES.removeItem(scopeId);
      scope.destroy();
      throwWithCause(`The "${scopeId}" focus scope shares the "${contextName}" shortcuts context with a ` +
        'scope that declares a different `fallbackShortcutsContextName`. The fallback is a property of ' +
        'the context, not of the scope, so scopes sharing a context must agree on it.');
    }

    if (fallbackContextName !== null) {
      scopeContext.setFallbackContext(shortcutManager.getOrCreateContext(fallbackContextName));
    }
  }

  /**
   * Whether a scope other than the one given still declares the same context/fallback pair.
   *
   * The fallback lives on the shortcuts CONTEXT, which several scopes may share, so unregistering one
   * of them must not drop a fallback the others still rely on.
   *
   * @param {object} scopeToSkip The scope being unregistered.
   * @returns {boolean}
   */
  function hasOtherScopeWithSameFallback(scopeToSkip: ReturnType<typeof createFocusScope>): boolean {
    return (SCOPES.getValues() as ReturnType<typeof createFocusScope>[]).some(
      (scope: ReturnType<typeof createFocusScope>) => scope !== scopeToSkip &&
        scope.getShortcutsContextName() === scopeToSkip.getShortcutsContextName() &&
        scope.getFallbackShortcutsContextName() === scopeToSkip.getFallbackShortcutsContextName());
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

    const scope = SCOPES.getItem(scopeId) as ReturnType<typeof createFocusScope>;

    // Unregistering is as explicit as `deactivateScope(scopeId)` - the scope is going away - so it
    // restores the same way, and for the same reason it does not check whether this scope is the active
    // one. A focus event may have dropped it already while keeping the context, and destroying it then
    // would leave the manager on a context whose shortcuts and fallback are both gone (DEV-2917).
    deactivateScope(scope, false);
    restoreDisplacedShortcutsContext(scope);

    if (scope.getFallbackShortcutsContextName() !== null && !hasOtherScopeWithSameFallback(scope)) {
      shortcutManager.getContext(scope.getShortcutsContextName())?.setFallbackContext(null);
    }

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

    activateScope(SCOPES.getItem(scopeId) as ReturnType<typeof createFocusScope>, resolvedSource);
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

    const scope = SCOPES.getItem(scopeId) as ReturnType<typeof createFocusScope>;

    deactivateScope(scope, false);
    // Attempted even when this scope was no longer the active one. A focus event may have dropped it
    // already - opening a context menu does exactly that - and the caller still means "I am done, take
    // the keyboard back". `restoreDisplacedShortcutsContext()` is a no-op while another scope holds the
    // keyboard or the context has moved on, so a scope that lost the keyboard cannot clobber who took it.
    restoreDisplacedShortcutsContext(scope);
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

    // Captured and switched BEFORE `activate()`. Its `onActivate` commonly moves DOM focus, which fires
    // `focusin` and re-enters `processScopes()` - and a deactivation in that window would find nothing
    // recorded to restore, leaving the manager on the plugin's context with no active scope: the dead
    // shortcuts of DEV-2917 by another route. The previous scope was already deactivated above, so what
    // is read here is the rolled-back name and nesting still unwinds in order.
    //
    // A scope never records its OWN context as the one it displaced. It can find it there legitimately:
    // deactivation through a focus event leaves the context alone (see `deactivateScope`), so a scope
    // that stood aside and was re-activated reads its own name back. Recording it would make the later
    // rollback a no-op that pins the plugin's context forever.
    //
    // What it keeps instead is whatever it recorded the FIRST time, which that same focus-event path
    // deliberately preserved - overwriting it with the default would send a scope that displaced
    // `editor` back to `grid`. The default is only for a scope that has nothing recorded at all.
    const currentContextName = shortcutManager.getActiveContextName();

    if (currentContextName !== scope.getShortcutsContextName()) {
      scope.setDisplacedShortcutsContextName(currentContextName);
    } else if (scope.getDisplacedShortcutsContextName() === null) {
      scope.setDisplacedShortcutsContextName(DEFAULT_SHORTCUTS_CONTEXT);
    }

    shortcutManager.setActiveContextName(scope.getShortcutsContextName());

    activeScope.activate(focusSource);
  }

  /**
   * Deactivates a scope.
   *
   * @param {object} scope The scope to deactivate.
   * @param {boolean} [restoreShortcutsContext=true] Whether to roll the shortcuts context back to the one
   * the scope displaced. False when a focus event moved the user, which means only "the user is elsewhere
   * now" - the displaced name is KEPT there, so a later explicit deactivation can still use it.
   */
  function deactivateScope(
    scope: ReturnType<typeof createFocusScope>, restoreShortcutsContext: boolean = true): void {
    updateScopesFocusVisibilityState();

    if (activeScope !== scope) {
      return;
    }

    activeScope = null;

    if (restoreShortcutsContext) {
      restoreDisplacedShortcutsContext(scope);
    }

    scope.deactivate();
  }

  /**
   * Rolls the shortcuts context back to whatever the scope displaced when it was activated.
   *
   * Deactivation used to leave the context alone, so nothing but a later focus or click event reaching
   * `processScopes()` ever rolled it back. Undoing a full row removal from the context menu fires
   * neither, so the grid came back full of data, looking completely normal, with every shortcut dead
   * until the user clicked a cell (DEV-2917).
   *
   * Only an EXPLICIT `deactivateScope()` restores. A deactivation driven by a focus event leaves the
   * context alone, because a scope may stand aside while the user is still working inside it: the sheets
   * bar disables its own scope while its menu is open (`runOnlyIf: () => !menus.isOpened()`) precisely so
   * that activating it would not hand the keyboard back to the grid, and rolling the context back there
   * broke every keyboard command in that menu. The stale name that leaves behind is handled where it is
   * created - `activateScope()` never records a scope's own context as the one it displaced.
   *
   * @param {object} scope The scope being deactivated.
   */
  function restoreDisplacedShortcutsContext(scope: ReturnType<typeof createFocusScope>): void {
    const displacedContextName = scope.getDisplacedShortcutsContextName();

    scope.setDisplacedShortcutsContextName(null);

    if (displacedContextName === null) {
      return;
    }

    // Another scope holds the keyboard. Every caller runs after THIS scope stopped being the active one,
    // so a non-null `activeScope` is someone else - and when it shares this scope's shortcuts context,
    // the name check below cannot tell the two apart and would roll the context back from under it.
    if (activeScope !== null) {
      return;
    }

    // Something else took the context over while the scope was active - an open editor, for example.
    // Rolling back then would close over that state instead of this scope's.
    if (shortcutManager.getActiveContextName() !== scope.getShortcutsContextName()) {
      return;
    }

    shortcutManager.setActiveContextName(displacedContextName);
  }

  /**
   * Updates the focus scopes state by enabling or disabling them or their focus catchers to make sure
   * that the next native focus move won't be disturbed.
   */
  function updateScopesFocusVisibilityState(): void {
    const scopes = SCOPES.getValues() as ReturnType<typeof createFocusScope>[];
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
        if (scopeContains(scope, getDeepActiveElement(hotInstance.rootDocument))) {
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
   * Checks whether the scope contains the target element, looking through the shadow boundaries
   * the target is rendered behind.
   *
   * A scope answers containment with `Node.contains()`, which stops at a shadow root, so a target
   * resolved from inside a shadow tree the scope's container merely hosts (a web component rendered
   * in a cell) is reported as outside it. Falling back to the target's shadow hosts asks the same
   * question about the elements the container can actually see.
   *
   * @param {object} scope The focus scope to ask.
   * @param {Element|null} target The target element. `getDeepActiveElement()` reports `null` for a document
   * with no body, and no scope contains a target that is not an element to begin with.
   * @returns {boolean} `true` when the target, or one of the hosts it is rendered behind, is within the scope.
   */
  function scopeContains(scope: ReturnType<typeof createFocusScope>, target: Element | null): boolean {
    if (!isHTMLElement(target)) {
      return false;
    }

    return scope.contains(target) ||
      getShadowHostChain(target).some((host: HTMLElement) => scope.contains(host));
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

    const allEnabledScopes = (SCOPES.getValues() as ReturnType<typeof createFocusScope>[]).filter(
      (scope: ReturnType<typeof createFocusScope>) => scope.runOnlyIf());
    let hasActiveScope = false;

    allEnabledScopes.forEach((scope: ReturnType<typeof createFocusScope>) => {
      if (!hasActiveScope && scopeContains(scope, target)) {
        hasActiveScope = true;

        if (focusSource !== FOCUS_SOURCES.UNKNOWN) {
          hotInstance.listen();
        }

        activateScope(scope, focusSource);
      }
    });

    if (!hasActiveScope && activeScope) {
      deactivateScope(activeScope, false);
      hotInstance.unlisten();
    }
  }

  const eventListener = useEventListener(
    hotInstance.rootWindow,
    {
      onFocus: (event) => {
        const target = getComposedEventTargetEl(event)!;

        processScopes(target, target.dataset.htFocusSource ?? FOCUS_SOURCES.UNKNOWN);
      },
      onClick: (event) => {
        processScopes(getComposedEventTargetEl(event)!, FOCUS_SOURCES.CLICK);
      },
      onTabKeyDown: () => {
        updateScopesFocusVisibilityState();
      },
    }
  );

  eventListener.mount();

  return {
    getActiveScopeId,
    isGridBodyCovered,
    registerScope,
    unregisterScope,
    activateScope: (scopeId: string, focusSource?: string) => activateScopeById(scopeId, focusSource),
    deactivateScope: scopeId => deactivateScopeById(scopeId),
    destroy: () => eventListener.unmount(),
  };
}
