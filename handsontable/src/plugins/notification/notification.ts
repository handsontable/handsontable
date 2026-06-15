import { BasePlugin } from '../base';
import { throwWithCause } from '../../helpers/errors';
import { isObject } from '../../helpers/object';
import { randomString } from '../../helpers/string';
import * as C from '../../i18n/constants';
import { NotificationUI } from './ui';
import { FOCUS_SOURCES } from '../../focusManager/constants';
import { GRID_SCOPE } from '../../shortcuts/contexts/constants';
import {
  NOTIFICATION_CLASS_NAME,
  NOTIFICATION_POSITIONS,
  NOTIFICATION_VARIANTS,
  type NotificationPosition,
  type NotificationVariant,
} from './constants';

export type { NotificationPosition, NotificationVariant } from './constants';

export interface NotificationAction {
  label: string;
  type?: 'primary' | 'secondary';
  callback: () => void;
}

export interface NotificationMessageOptions {
  variant?: NotificationVariant;
  title?: string;
  message: string | HTMLElement;
  duration?: number;
  position?: NotificationPosition;
  closable?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationNormalizedOptions {
  id: string;
  variant: NotificationVariant;
  title?: string;
  message: string | HTMLElement;
  duration: number;
  position: NotificationPosition;
  closable: boolean;
  actions: NotificationAction[];
}

export interface NotificationConfig {
  stackLimit?: number;
  animation?: boolean;
}

interface ToastState {
  id: string;
  options: NotificationNormalizedOptions;
  element: HTMLElement;
  durationMs: number;
  remainingMs: number;
  paused: boolean;
  toastEventDisposers?: Array<() => void> | null;
}

export const PLUGIN_KEY = 'notification';

export const PLUGIN_PRIORITY = 375;

const SHORTCUTS_CONTEXT_NAME = `plugin:${PLUGIN_KEY}`;
const SHORTCUTS_GLOBAL_CONTEXT_NAME = `plugin:${PLUGIN_KEY}:global`;
const SHORTCUTS_GROUP = PLUGIN_KEY;

const POSITION_SET = new Set(NOTIFICATION_POSITIONS);
const VARIANT_SET = new Set(NOTIFICATION_VARIANTS);
const TICK_MS = 200;

/**
 * @typedef {object} NotificationActionSpec
 * @property {string} label Text shown on the button.
 * @property {'primary'|'secondary'} [type] Visual style. Omit for secondary.
 * @property {function(): void} callback Invoked when the button is activated.
 */

/**
 * @plugin Notification
 * @class Notification
 *
 * @description
 * The Notification plugin shows non-blocking toast messages anchored to the Handsontable root.
 * Enable it with the {@link Options#notification} option. Toasts are exposed to assistive technologies with
 * `aria-live` and do not take keyboard focus when they appear; use **F6** to move focus into the notification region
 * for the grid that currently contains keyboard focus (with several instances on one page, each grid only handles **F6**
 * for its own focus scope, except when a single grid is on the page and focus is outside every grid).
 * **Tab** / **Shift+Tab** between controls, **Escape** to leave, and programmatic `hide` restores focus like **Escape**
 * when the last toast closes while focus is in the region.
 *
 * @example
 * ```js
 * const hot = new Handsontable(container, {
 *   data: data,
 *   notification: true,
 *   licenseKey: 'non-commercial-and-evaluation',
 * });
 * const notification = hot.getPlugin('notification');
 * notification.showMessage({ message: 'Saved.' });
 * ```
 */
export class Notification extends BasePlugin {
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Returns the default settings applied when the plugin is enabled without explicit configuration.
   */
  static get DEFAULT_SETTINGS() {
    return {
      stackLimit: 10,
      animation: true,
    };
  }

  /**
   * Returns an object of validator functions used to type-check each settings property at runtime.
   */
  static get SETTINGS_VALIDATORS() {
    return {
      stackLimit: (value: unknown) => typeof value === 'number' && value > 0 && Number.isInteger(value),
      animation: (value: unknown) => typeof value === 'boolean',
    };
  }

  /**
   * @type {NotificationUI | null}
   */
  #ui: NotificationUI | null = null;

  /**
   * @type {Map<string, object>}
   */
  readonly #toasts: Map<string, ToastState> = new Map();

  /**
   * @type {Record<string, object[]>}
   */
  readonly #queues: Record<NotificationPosition, NotificationNormalizedOptions[]> = {
    'top-start': [],
    'top-end': [],
    'bottom-start': [],
    'bottom-end': [],
  };

  /**
   * Element focused before the user moved into the notification region (F6, click, or relatedTarget).
   *
   * @type {HTMLElement | null}
   */
  #focusBeforeRegion: HTMLElement | null = null;

  /**
   * Whether notification controls use sequential tab order (after F6 or focus inside the region).
   *
   * @type {boolean}
   */
  #regionTabOrderActive: boolean = false;

  /**
   * @type {boolean}
   */
  #tickQueued: boolean = false;

  /**
   * @type {boolean}
   */
  #focusScopeActive: boolean = false;

  /**
   * When true, {@link Notification#registerFocusScope} `onDeactivate` restores `#focusBeforeRegion` after clearing tab order.
   *
   * @type {boolean}
   */
  #notificationDeactivateRestorePrior: boolean = false;

  /**
   * Effective {@link Notification.DEFAULT_SETTINGS} after the last full enable or rebuild, used to skip tearing down
   * the UI when `updateSettings` includes `notification` but those options did not change (for example a spread of
   * `getSettings()` with unrelated keys).
   *
   * @type {{ stackLimit: number, animation: boolean } | null}
   */
  #lastEffectiveNotificationOptions: { stackLimit: number; animation: boolean } | null = null;

  /**
   * Returns whether the `notification` setting is enabled for this instance.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Installs the notification host, document `focusin` listener (tab order + prior-focus for click paths), shortcuts
   * (**F6** via grid + global shortcut contexts, Escape, Tab, Shift+Tab), and the focus scope.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    if (!this.#ui) {
      this.#ui = new NotificationUI({
        rootElement: this.hot.rootGridElement,
        sanitizer: this.hot.getSettings().sanitizer,
        isRtl: this.hot.isRtl(),
      });
    }

    this.#ui.install();
    this.#registerFocusScope();
    this.#registerNotificationShortcuts();

    this.eventManager.addEventListener(
      this.hot.rootDocument,
      'focusin',
      this.#onDocumentFocusInForNotificationTabOrder,
      true
    );

    this.addHook('afterUpdateSettings', this.#onAfterUpdateSettings);
    this.eventManager.addEventListener(this.hot.rootDocument, 'visibilitychange', () => {
      if (this.#hasActiveCountdowns()) {
        this.#queueTick();
      }
    });

    super.enablePlugin();
    this.#lastEffectiveNotificationOptions = this.#captureEffectiveNotificationOptions();
  }

  /**
   * Rebuilds the plugin after settings change when notification options actually change.
   *
   * @param {object} [newSettings] Settings object passed to `updateSettings` (partial).
   */
  updatePlugin(newSettings?: object): void {
    const nextEffective = this.#captureEffectiveNotificationOptions();
    const notificationKeyPresent =
      newSettings &&
      typeof newSettings === 'object' &&
      Object.prototype.hasOwnProperty.call(newSettings, PLUGIN_KEY);

    if (
      notificationKeyPresent &&
      this.#lastEffectiveNotificationOptions !== null &&
      this.#effectiveNotificationOptionsEqual(this.#lastEffectiveNotificationOptions, nextEffective)
    ) {
      super.updatePlugin();

      return;
    }

    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Hides all toasts, removes shortcuts and listeners, and destroys the UI host.
   *
   * `hideAll()` must run before `super.disablePlugin()` because `BasePlugin.disablePlugin()` clears
   * `this.enabled` first, and `hideAll()` relies on the plugin still being enabled. The superclass
   * call then removes hooks and clears the shared `EventManager`.
   */
  disablePlugin() {
    this.hideAll();
    this.#unregisterNotificationShortcuts();
    this.#unregisterFocusScope();
    super.disablePlugin();
    this.#ui?.destroy();
    this.#ui = null;
    this.#focusBeforeRegion = null;
    this.#regionTabOrderActive = false;
    this.#lastEffectiveNotificationOptions = null;
  }

  /**
   * Displays a toast. Returns the toast id, or an empty string when the toast is not shown.
   *
   * @param {object} options Toast options.
   * @param {'info' | 'success' | 'warning' | 'error'} [options.variant] Visual variant.
   * @param {string} [options.title] Optional title.
   * @param {string | HTMLElement} options.message Main message body.
   * @param {number} [options.duration] Auto-dismiss delay in ms. `0` keeps the toast until dismissed manually.
   * @param {'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'} [options.position] Corner stack.
   * @param {boolean} [options.closable] Whether the close control is shown.
   * @param {NotificationActionSpec[]} [options.actions] Action buttons.
   * @returns {string}
   * @throws {Error} When `options` is invalid or actions are malformed.
   */
  showMessage(options: NotificationMessageOptions): string {
    if (!this.enabled) {
      return '';
    }

    const normalized = this.#normalizeOptions(options);

    if (this.hot.runHooks('beforeNotificationShow', normalized) === false) {
      return '';
    }

    const limit = this.getSetting<number>('stackLimit');
    const visibleAtPosition = this.#countVisibleAt(normalized.position);

    if (visibleAtPosition >= limit) {
      this.#queues[normalized.position as NotificationPosition].push(normalized);

      return normalized.id;
    }

    this.#mountToast(normalized);

    return normalized.id;
  }

  /**
   * Hides a toast by id.
   *
   * @param {string} id Toast id returned from {@link Notification#showMessage}.
   */
  hide(id: string): void {
    if (!this.enabled || !id) {
      return;
    }

    const state = this.#toasts.get(id);

    if (!state) {
      this.#removeFromQueue(id);

      return;
    }

    if (this.hot.runHooks('beforeNotificationHide', id) === false) {
      if (state.durationMs > 0 && state.remainingMs <= 0) {
        state.remainingMs = state.durationMs;
      }

      return;
    }

    const doc = this.hot.rootDocument;
    const activeBeforeRemove = doc.activeElement;
    const focusInClosingToast =
      activeBeforeRemove instanceof this.hot.rootWindow.HTMLElement &&
      state.element.contains(activeBeforeRemove);

    this.#removeToastState(state, true);
    this.hot.runHooks('afterNotificationHide', id);
    this.#drainQueueForPosition(state.options.position);
    this.#restoreFocusIfIdle(focusInClosingToast);
  }

  /**
   * Hides every visible toast and clears all per-position queues.
   */
  hideAll() {
    if (!this.enabled) {
      return;
    }

    NOTIFICATION_POSITIONS.forEach((p) => {
      this.#queues[p].length = 0;
    });

    const ids = [...this.#toasts.keys()];

    ids.forEach(toastId => this.hide(toastId));
  }

  /**
   * Returns whether a toast is visible, or whether any toast is visible when `id` is omitted.
   *
   * @param {string} [id] Toast id.
   * @returns {boolean}
   */
  isVisible(id?: string): boolean {
    if (id === undefined) {
      return this.#toasts.size > 0;
    }

    return this.#toasts.has(id);
  }

  /**
   * Returns how many toasts are waiting in per-position queues.
   *
   * @returns {number}
   */
  getQueueSize(): number {
    return NOTIFICATION_POSITIONS.reduce((sum, p) => sum + this.#queues[p].length, 0);
  }

  /**
   * Clears queues and toast state, unregisters shortcuts and focus scope, and removes the host from the DOM.
   */
  destroy() {
    NOTIFICATION_POSITIONS.forEach((p) => {
      this.#queues[p].length = 0;
    });
    this.#toasts.clear();
    this.#unregisterNotificationShortcuts();
    this.#unregisterFocusScope();
    this.#ui?.destroy();
    this.#ui = null;
    this.#focusBeforeRegion = null;
    this.#regionTabOrderActive = false;
    this.#lastEffectiveNotificationOptions = null;

    super.destroy();
  }

  /**
   * @returns {{ stackLimit: number, animation: boolean }}
   */
  #captureEffectiveNotificationOptions(): { stackLimit: number; animation: boolean } {
    return {
      stackLimit: this.getSetting<number>('stackLimit'),
      animation: this.getSetting<boolean>('animation'),
    };
  }

  /**
   * @param {{ stackLimit: number, animation: boolean }} a First snapshot.
   * @param {{ stackLimit: number, animation: boolean }} b Second snapshot.
   * @returns {boolean}
   */
  #effectiveNotificationOptionsEqual(
    a: { stackLimit: number; animation: boolean }, b: { stackLimit: number; animation: boolean }
  ): boolean {
    return a.stackLimit === b.stackLimit && a.animation === b.animation;
  }

  /**
   * Aligns toast host `dir` and message sanitizer with the grid after any `updateSettings` call.
   */
  readonly #onAfterUpdateSettings = () => {
    if (!this.enabled || !this.#ui) {
      return;
    }

    const root = this.hot.rootElement;
    const dirAttr = root.getAttribute('dir');

    if (dirAttr === 'rtl' || dirAttr === 'ltr') {
      this.#ui.setRtl(dirAttr === 'rtl');
    } else {
      this.#ui.setRtl(this.hot.isRtl());
    }

    this.#ui.setSanitizer(this.hot.getSettings().sanitizer);
  };

  /**
   * Builds the internal toast payload used by hooks and the UI layer.
   *
   * @param {object} raw User options passed to {@link Notification#showMessage}.
   * @returns {object} Normalized options including `id`, `variant`, `position`, `duration`, `closable`, and `actions`.
   * @throws {Error} When `message` or action entries are invalid.
   */
  #normalizeOptions(raw: NotificationMessageOptions): NotificationNormalizedOptions {
    if (!isObject(raw) || (typeof raw.message !== 'string' &&
      !(typeof HTMLElement !== 'undefined' && raw.message instanceof HTMLElement))) {
      throwWithCause('Notification.showMessage expects an object with a `message` string or HTMLElement.');
    }

    const id = `htn-${randomString()}`;
    const variant: NotificationVariant =
      (raw.variant && VARIANT_SET.has(raw.variant)) ? raw.variant : 'info';
    const position: NotificationPosition =
      (raw.position && POSITION_SET.has(raw.position)) ? raw.position : 'bottom-end';
    const duration = typeof raw.duration === 'number' && raw.duration >= 0 ? raw.duration : 4000;
    const closable = typeof raw.closable === 'boolean' ? raw.closable : true;
    const actions = Array.isArray(raw.actions) ? raw.actions.map((a) => {
      if (!isObject(a) || typeof a.label !== 'string' || typeof a.callback !== 'function') {
        throwWithCause('Each notification action needs `label` (string) and `callback` (function).');
      }

      const type: 'primary' | 'secondary' = a.type === 'primary' ? 'primary' : 'secondary';

      return { label: a.label as string, type, callback: a.callback as () => void };
    }) : [];

    return {
      id,
      variant,
      title: typeof raw.title === 'string' ? raw.title : undefined,
      message: raw.message,
      duration,
      position,
      closable,
      actions,
    };
  }

  /**
   * @param {string} position Stack key.
   * @returns {number}
   */
  #countVisibleAt(position: string): number {
    let n = 0;

    this.#toasts.forEach((state) => {
      if (state.options.position === position) {
        n += 1;
      }
    });

    return n;
  }

  /**
   * Inserts a toast into the DOM, binds hover pause for timed toasts, and runs `afterNotificationShow`.
   *
   * @param {object} normalized Validated toast options including `id` and `position`.
   */
  #mountToast(normalized: NotificationNormalizedOptions): void {
    const closeLabel = this.hot.getTranslatedPhrase(C.NOTIFICATION_BUTTONS_CLOSE);
    const animation = this.getSetting<boolean>('animation');
    const { element } = this.#ui!.createToastElement(normalized, closeLabel, animation);
    const stack = this.#ui!.getStack(normalized.position);

    if (!stack) {
      throwWithCause(`Unknown notification position "${normalized.position}".`);
    }

    if (normalized.position.startsWith('top')) {
      stack.prepend(element);
    } else {
      stack.appendChild(element);
    }

    if (normalized.position.startsWith('bottom')) {
      const win = this.hot.rootWindow;

      win.requestAnimationFrame(() => {
        if (!this.enabled) {
          return;
        }

        stack.scrollTop = stack.scrollHeight;
      });
    }

    const durationMs = normalized.duration;

    const state = {
      id: normalized.id,
      options: normalized,
      element,
      durationMs,
      remainingMs: durationMs,
      paused: false,
    };

    this.#toasts.set(normalized.id, state);
    this.#bindToastEvents(state);

    if (this.#regionTabOrderActive) {
      this.#reapplySequentialTabOrderInNotificationHost();
    }

    this.hot.runHooks('afterNotificationShow', normalized.id, normalized);

    if (durationMs > 0) {
      this.#queueTick();
    }
  }

  /**
   * Wires click handling for close and action buttons and hover pause for timed dismiss.
   *
   * @param {object} state Toast state.
   */
  #bindToastEvents(state: ToastState): void {
    state.toastEventDisposers = [
      this.eventManager.addEventListener(state.element, 'click', (event) => {
        this.#onToastClick(event as MouseEvent, state);
      }),
      this.eventManager.addEventListener(state.element, 'mouseenter', () => {
        state.paused = true;
      }),
      this.eventManager.addEventListener(state.element, 'mouseleave', () => {
        state.paused = false;

        if (state.durationMs > 0 && !this.hot.rootDocument.hidden) {
          this.#queueTick();
        }
      }),
    ];
  }

  /**
   * Delegates clicks on the close control or action buttons.
   *
   * @param {MouseEvent} event Click event.
   * @param {object} state Toast state.
   */
  #onToastClick(event: MouseEvent, state: ToastState): void {
    const target = event.target;

    if (!(target instanceof this.hot.rootWindow.HTMLElement)) {
      return;
    }

    if (target.closest(`.${NOTIFICATION_CLASS_NAME}__close`)) {
      this.hide(state.id);

      return;
    }

    const actionHost = target.closest('[data-ht-notification-action]');

    if (!actionHost || !state.element.contains(actionHost)) {
      return;
    }

    const index = Number.parseInt((actionHost as HTMLElement).dataset.htNotificationAction ?? '', 10);
    const action = state.options.actions[index];

    if (action) {
      action.callback();
    }
  }

  /**
   * Sets `tabIndex` on toast controls to `-1` and clears the in-region keyboard flag.
   */
  #clearNotificationRegionTabOrder(): void {
    const host = this.#ui?.getHost();

    if (host) {
      NotificationUI.setSequentialFocusWithinHost(host, false);
    }

    this.#regionTabOrderActive = false;
  }

  /**
   * Puts every visible toast control back in the tab order after programmatic refocus (for example closing a toast).
   * Without this, controls stay at `tabIndex = -1` and **Tab** skips to the next element in the document, often
   * outside the grid.
   */
  #reapplySequentialTabOrderInNotificationHost(): void {
    const host = this.#ui?.getHost();

    if (!host || this.#toasts.size === 0) {
      return;
    }

    NotificationUI.setSequentialFocusWithinHost(host, true);
    this.#regionTabOrderActive = true;
  }

  /**
   * Moves keyboard focus into the notification region (F6). Does not run when a toast opens.
   * Stores the previous `activeElement` whenever it lies outside the notification host so Escape can restore it.
   */
  #enterNotificationRegion(): void {
    const host = this.#ui?.getHost();

    if (!host || this.#toasts.size === 0) {
      return;
    }

    const doc = this.hot.rootDocument;
    const active = doc.activeElement;

    if (active instanceof this.hot.rootWindow.HTMLElement && !host.contains(active)) {
      this.#focusBeforeRegion = active;
    }

    this.hot.listen();
    this.hot.getFocusScopeManager().activateScope(PLUGIN_KEY);
  }

  /**
   * If the grid focus scope is not already active, activates it so shortcut context matches the table after leaving
   * the notification region. `FocusScopeManager#processScopes` usually does this when focus moves; this covers cases
   * where there is no prior element or focus did not leave notification chrome.
   */
  #ensureGridScopeActiveForShortcuts(): void {
    const fsm = this.hot.getFocusScopeManager();

    if (fsm.getActiveScopeId() !== GRID_SCOPE) {
      fsm.activateScope(GRID_SCOPE);
    }
  }

  /**
   * Deactivates the notification focus scope (runs `onDeactivate` tab-order cleanup) and restores `#focusBeforeRegion`
   * when it is still connected (via `onDeactivate` when the scope was active).
   */
  #leaveNotificationRegionRestoringPriorFocus(): void {
    const fsm = this.hot.getFocusScopeManager();

    this.#notificationDeactivateRestorePrior = true;

    if (fsm.getActiveScopeId() === PLUGIN_KEY) {
      fsm.deactivateScope(PLUGIN_KEY);
    } else {
      this.#notificationDeactivateRestorePrior = false;
      this.#clearNotificationRegionTabOrder();

      const prev = this.#focusBeforeRegion;

      this.#focusBeforeRegion = null;

      if (prev?.isConnected) {
        this.hot.getFocusManager().focusElement(prev, { preventScroll: true });
      }

      this.#ensureGridScopeActiveForShortcuts();
    }
  }

  /**
   * Leaves the notification region when focus is inside the host (**Escape**, or **Shift+Tab** from the first control).
   */
  #exitNotificationRegion(): void {
    const doc = this.hot.rootDocument;
    const host = this.#ui?.getHost();

    if (!host?.contains(doc.activeElement)) {
      return;
    }

    this.#leaveNotificationRegionRestoringPriorFocus();
  }

  /**
   * Registers the notification region with the focus scope manager when toasts are present.
   */
  #registerFocusScope(): void {
    if (this.#focusScopeActive) {
      return;
    }

    this.hot.getFocusScopeManager()
      .registerScope(PLUGIN_KEY, this.#ui!.getHost()!, {
        shortcutsContextName: SHORTCUTS_CONTEXT_NAME,
        runOnlyIf: () => this.#toasts.size > 0,
        enableFocusCatchers: false,
        onActivate: () => {
          const host = this.#ui?.getHost();

          if (!host) {
            return;
          }

          this.#reapplySequentialTabOrderInNotificationHost();
          this.#focusFirstInNotificationRegionUnlessAlreadyFocused();
        },
        onDeactivate: () => {
          this.#clearNotificationRegionTabOrder();

          const restorePrior = this.#notificationDeactivateRestorePrior;

          if (restorePrior) {
            this.#notificationDeactivateRestorePrior = false;

            const prev = this.#focusBeforeRegion;

            this.#focusBeforeRegion = null;

            if (prev?.isConnected) {
              this.hot.getFocusManager().focusElement(prev, { preventScroll: true });
            }

            this.#ensureGridScopeActiveForShortcuts();
          }
        },
      });
    this.#focusScopeActive = true;
  }

  /**
   * Registers Escape, Tab, and Shift+Tab inside the notification shortcuts context.
   */
  #registerNotificationShortcuts(): void {
    const manager = this.hot.getShortcutManager();
    const pluginContext = manager.getContext(SHORTCUTS_CONTEXT_NAME) ??
      manager.addContext(SHORTCUTS_CONTEXT_NAME);
    const globalContext = manager.getOrCreateContext(SHORTCUTS_GLOBAL_CONTEXT_NAME, 'global');
    const gridContext = manager.getContext(GRID_SCOPE);

    const f6Shortcut = {
      keys: [['f6']],
      preventDefault: true,
      callback: () => {
        this.#enterNotificationRegion();
      },
      runOnlyIf: () => this.#shouldRunNotificationF6Shortcut(),
      group: SHORTCUTS_GROUP,
    };

    globalContext.addShortcut(f6Shortcut);

    if (gridContext) {
      gridContext.addShortcut(f6Shortcut);
    }

    pluginContext.addShortcut({
      keys: [['Escape']],
      callback: () => this.#exitNotificationRegion(),
      runOnlyIf: () => this.#ui?.getHost()?.contains(this.hot.rootDocument.activeElement) === true,
      group: SHORTCUTS_GROUP,
    });

    pluginContext.addShortcut({
      keys: [['Tab']],
      preventDefault: true,
      callback: () => this.#onTabForwardExitNotificationRegionToGrid(),
      runOnlyIf: () => this.#shouldHandleTabForwardExitFromNotificationRegion(),
      group: SHORTCUTS_GROUP,
    });

    pluginContext.addShortcut({
      keys: [['Shift', 'Tab']],
      preventDefault: true,
      callback: () => this.#exitNotificationRegion(),
      runOnlyIf: () => this.#shouldHandleShiftTabExitFromNotificationRegion(),
      group: SHORTCUTS_GROUP,
    });
  }

  /**
   * Unregisters notification shortcut group from the plugin context.
   */
  #unregisterNotificationShortcuts(): void {
    const sm = this.hot.getShortcutManager();

    sm.getContext(SHORTCUTS_CONTEXT_NAME)?.removeShortcutsByGroup(SHORTCUTS_GROUP);
    sm.getContext(SHORTCUTS_GLOBAL_CONTEXT_NAME)?.removeShortcutsByGroup(SHORTCUTS_GROUP);
    sm.getContext(GRID_SCOPE)?.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Document-level `focusin` (capture): (1) when focus moves **into** the notification host from elsewhere in the
   * wrapper, stores `#focusBeforeRegion` using `FocusEvent.relatedTarget` so **Escape** can restore after a
   * click-focused control. `FocusScopeManager` skips forwarding `focusin` while `mousedown` is down, and
   * programmatic `onActivate` from `click` runs after `activeElement` already moved into the host, so neither path
   * exposes `relatedTarget`. (2) when focus lands **outside** the host, clears sequential tab order (host `focusout`
   * misses moves via the grid in the same wrapper).
   *
   * @param {FocusEvent} event Focusin event on the root document (capture phase).
   */
  readonly #onDocumentFocusInForNotificationTabOrder = (event: FocusEvent) => {
    if (this.#toasts.size === 0) {
      return;
    }

    const host = this.#ui?.getHost();
    const target = event.target;

    if (!(target instanceof this.hot.rootWindow.HTMLElement) || !host) {
      return;
    }

    if (host.contains(target)) {
      if (this.#focusBeforeRegion !== null) {
        return;
      }

      const related = event.relatedTarget;

      if (
        related instanceof this.hot.rootWindow.HTMLElement &&
        this.hot.rootWrapperElement.contains(related) &&
        !host.contains(related)
      ) {
        this.#focusBeforeRegion = related;
      }

      return;
    }

    this.#clearNotificationRegionTabOrder();
  };

  /**
   * Lists focusable controls in host DOM order (stack positions, then toasts in document order).
   *
   * @returns {HTMLElement[]}
   */
  #getAllFocusablesInNotificationRegion(): HTMLElement[] {
    const host = this.#ui?.getHost();

    if (!host) {
      return [];
    }

    const toasts = [...host.querySelectorAll(`.${NOTIFICATION_CLASS_NAME}__toast`)];
    const results = [];

    for (let i = 0; i < toasts.length; i += 1) {
      results.push(...NotificationUI.getFocusables(toasts[i] as HTMLElement));
    }

    return results;
  }

  /**
   * @returns {HTMLElement | undefined}
   */
  #getFirstFocusableInNotificationRegion(): HTMLElement | undefined {
    const all = this.#getAllFocusablesInNotificationRegion();

    return all[0];
  }

  /**
   * When sequential tab order is active, returns in-region focusables and the index of the focused control, or `null`.
   *
   * @returns {{ list: HTMLElement[], idx: number } | null}
   */
  #getNotificationRegionFocusableContext(): { list: HTMLElement[]; idx: number } | null {
    if (this.#toasts.size === 0) {
      return null;
    }

    const active = this.hot.rootDocument.activeElement;
    const host = this.#ui?.getHost();

    if (!(active instanceof this.hot.rootWindow.HTMLElement) || !host?.contains(active)) {
      return null;
    }

    const list = this.#getAllFocusablesInNotificationRegion();

    if (list.length === 0) {
      return null;
    }

    const idx = list.indexOf(active);

    if (idx === -1) {
      return null;
    }

    if (!this.#regionTabOrderActive) {
      this.#reapplySequentialTabOrderInNotificationHost();
    }

    return { list, idx };
  }

  /**
   * @returns {boolean}
   */
  #shouldHandleTabForwardExitFromNotificationRegion(): boolean {
    const ctx = this.#getNotificationRegionFocusableContext();

    return ctx !== null && ctx.idx === ctx.list.length - 1;
  }

  /**
   * @returns {boolean}
   */
  #shouldHandleShiftTabExitFromNotificationRegion(): boolean {
    const ctx = this.#getNotificationRegionFocusableContext();

    return ctx !== null && ctx.idx === 0;
  }

  /**
   * The notification host sits after the grid in the DOM; default **Tab** from the last control would leave the table.
   * Deactivates the notification scope (so `onDeactivate` clears tab order), then activates the grid scope with
   * `tab_from_above` so {@link focusGridScope} selects the cell, moves keyboard focus, and aligns shortcut context.
   *
   * Clears `#focusBeforeRegion` after the transition so a later click into a toast stores a new prior for **Escape**.
   */
  #onTabForwardExitNotificationRegionToGrid(): void {
    const fsm = this.hot.getFocusScopeManager();

    this.#notificationDeactivateRestorePrior = false;

    if (fsm.getActiveScopeId() === PLUGIN_KEY) {
      fsm.deactivateScope(PLUGIN_KEY);
    } else {
      this.#clearNotificationRegionTabOrder();
    }

    this.hot.listen();
    fsm.activateScope(GRID_SCOPE, FOCUS_SOURCES.TAB_FROM_ABOVE);
    this.#focusBeforeRegion = null;
  }

  /**
   * Unregisters the notification focus scope.
   */
  #unregisterFocusScope(): void {
    if (!this.#focusScopeActive) {
      return;
    }

    this.hot.getFocusScopeManager().unregisterScope(PLUGIN_KEY);
    this.#focusScopeActive = false;
  }

  /**
   * Removes toast state from the plugin map and optionally removes the toast element from the DOM.
   *
   * @param {object} state Toast state.
   * @param {boolean} removeDom Whether to remove the DOM node.
   */
  #removeToastState(state: ToastState, removeDom: boolean): void {
    if (state.toastEventDisposers) {
      state.toastEventDisposers.forEach((dispose: () => void) => dispose());
      state.toastEventDisposers = null;
    }

    this.#toasts.delete(state.id);

    if (removeDom) {
      state.element.remove();
    }
  }

  /**
   * @param {EventTarget | null} node DOM node to test.
   * @returns {boolean}
   */
  #isElementInsideNotificationHost(node: EventTarget | null): boolean {
    const host = this.#ui?.getHost();

    if (!host) {
      return false;
    }

    return (
      node instanceof this.hot.rootWindow.HTMLElement &&
      host.contains(node)
    );
  }

  /**
   * @param {HTMLElement} active Currently focused element.
   * @returns {boolean} Whether `active` lies inside a visible toast element.
   */
  #isActiveInsideAnyRemainingToast(active: Element | null): boolean {
    let inside = false;

    this.#toasts.forEach((state) => {
      if (state.element.contains(active)) {
        inside = true;
      }
    });

    return inside;
  }

  /**
   * After a toast is removed while others remain: re-sync listening, toggle the notification focus scope so `onActivate`
   * runs again (including first-focusable when focus is on empty host chrome).
   */
  #refocusFirstOpenToastAfterPartialHide(): void {
    this.hot.listen();

    const fsm = this.hot.getFocusScopeManager();

    if (fsm.getActiveScopeId() === PLUGIN_KEY) {
      fsm.deactivateScope(PLUGIN_KEY);
    }

    fsm.activateScope(PLUGIN_KEY);
  }

  /**
   * Focuses the first notification control when focus is not already inside a visible toast.
   */
  #focusFirstInNotificationRegionUnlessAlreadyFocused(): void {
    const doc = this.hot.rootDocument;

    if (!this.enabled || this.#toasts.size === 0) {
      return;
    }

    if (this.#isActiveInsideAnyRemainingToast(doc.activeElement)) {
      return;
    }

    const first = this.#getFirstFocusableInNotificationRegion();

    if (first) {
      this.hot.getFocusManager().focusElement(first);
    }
  }

  /**
   * Whether this instance should handle document-level **F6** for the current `activeElement`.
   * When focus is inside a grid, only that instance's plugin may move focus into its notification region.
   * When focus is outside every `.ht-root-wrapper`, only a single Handsontable on the page may claim **F6** so
   * multi-instance pages do not all activate at once; with multiple roots, **F6** does nothing until focus is in a grid.
   *
   * @param {Element | null} active `document.activeElement`.
   * @returns {boolean}
   */
  #shouldThisInstanceHandleF6ForActiveElement(active: Element | null): boolean {
    if (!(active instanceof this.hot.rootWindow.HTMLElement)) {
      return false;
    }

    const ownerWrapper = active.closest('.ht-root-wrapper');

    if (ownerWrapper !== null) {
      return ownerWrapper === this.hot.rootWrapperElement;
    }

    const roots = this.hot.rootDocument.querySelectorAll('.ht-root-wrapper');

    return roots.length <= 1;
  }

  /**
   * `runOnlyIf` guard for **F6** shortcuts on the grid and `scope: 'global'` contexts (see {@link ShortcutManager}).
   * The manager only calls this after the registered `[['f6']]` combo matches (exact pressed key set, no extra modifiers).
   *
   * @returns {boolean}
   */
  #shouldRunNotificationF6Shortcut(): boolean {
    if (!this.enabled || this.#toasts.size === 0) {
      return false;
    }

    const host = this.#ui?.getHost();

    if (!host) {
      return false;
    }

    const active = this.hot.rootDocument.activeElement;

    if (active instanceof this.hot.rootWindow.HTMLElement && host.contains(active)) {
      return false;
    }

    return this.#shouldThisInstanceHandleF6ForActiveElement(active);
  }

  /**
   * When the last toast is removed: same prior-focus restoration as **Escape** via the focus scope pipeline.
   * Further focus alignment is left to `FocusScopeManager#processScopes` after the DOM update.
   */
  #restoreFocusAfterLastToastLikeEscape(): void {
    this.#leaveNotificationRegionRestoringPriorFocus();
  }

  /**
   * After a toast is removed, moves focus to another toast if needed. When the last toast is removed, restores focus
   * the same way as **Escape** when focus was in the notification region or on the closing toast.
   *
   * @param {boolean} focusInClosingToast Whether `document.activeElement` was inside the removed toast before DOM removal.
   */
  #restoreFocusIfIdle(focusInClosingToast: boolean = false): void {
    const doc = this.hot.rootDocument;
    const host = this.#ui?.getHost();
    const active = doc.activeElement;

    if (this.#toasts.size > 0) {
      const activeInHost =
        active instanceof this.hot.rootWindow.HTMLElement &&
        host?.contains(active) === true;

      if (activeInHost && !this.#isActiveInsideAnyRemainingToast(active)) {
        this.#refocusFirstOpenToastAfterPartialHide();
      } else if (!activeInHost && focusInClosingToast) {
        this.#refocusFirstOpenToastAfterPartialHide();
      }

      return;
    }

    const hadRegionFocus = this.#regionTabOrderActive;
    const focusStillInNotificationChrome = this.#isElementInsideNotificationHost(doc.activeElement);

    const shouldRestoreLikeEscape =
      hadRegionFocus || focusInClosingToast || focusStillInNotificationChrome;

    if (!shouldRestoreLikeEscape) {
      return;
    }

    this.#restoreFocusAfterLastToastLikeEscape();
  }

  /**
   * Mounts queued toasts for one corner when a slot opens after `hide` or `stackLimit` changes.
   * `beforeNotificationShow` already ran for each queued entry in {@link Notification#showMessage}.
   *
   * @param {string} position Stack key.
   */
  #drainQueueForPosition(position: string): void {
    const limit = this.getSetting<number>('stackLimit');
    const pos = position as NotificationPosition;

    while (this.#queues[pos].length > 0 && this.#countVisibleAt(position) < limit) {
      const next = this.#queues[pos].shift();

      this.#mountToast(next!);
    }
  }

  /**
   * Drops a toast id from all per-position queues when it was never mounted.
   *
   * @param {string} toastId Toast id.
   */
  #removeFromQueue(toastId: string): void {
    NOTIFICATION_POSITIONS.forEach((p) => {
      const q = this.#queues[p];
      const idx = q.findIndex(entry => entry.id === toastId);

      if (idx >= 0) {
        q.splice(idx, 1);
      }
    });
  }

  /**
   * Schedules a single timer pass that decrements visible countdown toasts.
   */
  #queueTick(): void {
    if (this.#tickQueued || !this.enabled) {
      return;
    }

    this.#tickQueued = true;

    this.hot._registerTimeout(() => {
      this.#tickQueued = false;

      if (!this.enabled) {
        return;
      }

      this.#runTick();

      if (this.#hasActiveCountdowns()) {
        this.#queueTick();
      }
    }, TICK_MS);
  }

  /**
   * Decrements `remainingMs` for timed toasts and calls `hide` when a countdown reaches zero.
   */
  #runTick(): void {
    const doc = this.hot.rootDocument;
    const tabActive = !doc.hidden;
    const toHide: string[] = [];

    this.#toasts.forEach((state) => {
      if (state.durationMs <= 0) {
        return;
      }

      if (state.paused || !tabActive) {
        return;
      }

      state.remainingMs -= TICK_MS;

      if (state.remainingMs <= 0) {
        toHide.push(state.id);
      }
    });

    toHide.forEach(id => this.hide(id));
  }

  /**
   * @returns {boolean} Whether any visible toast has a positive duration and is not paused while the tab is visible.
   */
  #hasActiveCountdowns(): boolean {
    const doc = this.hot.rootDocument;

    if (doc.hidden) {
      return false;
    }

    let active = false;

    this.#toasts.forEach((s) => {
      if (s.durationMs > 0 && !s.paused) {
        active = true;
      }
    });

    return active;
  }

}
