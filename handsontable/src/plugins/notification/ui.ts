import { fastInnerHTML } from '../../helpers/dom/element';
import { stripTags } from '../../helpers/string';
import { NOTIFICATION_CLASS_NAME, NOTIFICATION_POSITIONS } from './constants';
import type { NotificationNormalizedOptions, NotificationAction } from './notification';

/**
 * Renders toast containers and individual notification elements. Used only by the Notification plugin.
 */
export class NotificationUI {
  /**
   * @type {HTMLElement}
   */
  #rootElement: HTMLElement;

  /**
   * @type {function(string, string): string | undefined}
   */
  #sanitizer: ((html: string, context: string) => string | undefined) | null | undefined;

  /**
   * @type {boolean}
   */
  #isRtl: boolean = false;

  /**
   * @type {HTMLElement | null}
   */
  #host: HTMLElement | null = null;

  /**
   * @type {Map<string, HTMLElement>}
   */
  #stacks: Map<string, HTMLElement> = new Map();

  /**
   * @param {object} params Constructor parameters.
   * @param {HTMLElement} params.rootElement Handsontable root grid element.
   * @param {function(string, string): string | undefined} params.sanitizer Sanitizer for HTML strings.
   * @param {boolean} params.isRtl Whether the grid uses RTL layout.
   */
  constructor({ rootElement, sanitizer, isRtl }: {
    rootElement: HTMLElement;
    sanitizer: ((html: string, context: string) => string | undefined) | null | undefined;
    isRtl: boolean;
  }) {
    this.#rootElement = rootElement;
    this.#sanitizer = sanitizer;
    this.#isRtl = isRtl;
  }

  /**
   * Creates the overlay host and four corner stack elements after `rootGridElement`.
   */
  install(): void {
    if (this.#host) {
      return;
    }

    const doc = this.#rootElement.ownerDocument;
    const host = doc.createElement('div');

    host.className = `${NOTIFICATION_CLASS_NAME} handsontable`;
    host.setAttribute('dir', this.#isRtl ? 'rtl' : 'ltr');

    NOTIFICATION_POSITIONS.forEach((position) => {
      const stack = doc.createElement('div');

      stack.className = `${NOTIFICATION_CLASS_NAME}__stack ${NOTIFICATION_CLASS_NAME}__stack--${position}`;
      stack.dataset.htNotificationPosition = position;
      /* Scrollable overflow makes stacks tab-focusable in some browsers; keep them out of the tab order. */
      stack.tabIndex = -1;
      host.appendChild(stack);
      this.#stacks.set(position, stack);
    });

    this.#rootElement.after(host);
    this.#host = host;
  }

  /**
   * @returns {HTMLElement | null}
   */
  getHost(): HTMLElement | null {
    return this.#host;
  }

  /**
   * @param {string} position Stack key.
   * @returns {HTMLElement | undefined}
   */
  getStack(position: string): HTMLElement | undefined {
    return this.#stacks.get(position);
  }

  /**
   * Updates RTL direction on the host.
   *
   * @param {boolean} isRtl Whether the grid uses RTL layout.
   */
  setRtl(isRtl: boolean): void {
    this.#isRtl = isRtl;

    if (this.#host) {
      this.#host.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    }
  }

  /**
   * Updates the HTML sanitizer used for string notification messages.
   *
   * @param {function(string, string): string | undefined} sanitizer Sanitizer from Handsontable settings, if any.
   */
  setSanitizer(sanitizer: ((html: string, context: string) => string | undefined) | null | undefined): void {
    this.#sanitizer = sanitizer;
  }

  /**
   * Builds a toast element from normalized options.
   *
   * @param {object} options Normalized notification options (id, variant, title, message, closable, actions).
   * @param {string} closeLabel Translated label for the close control.
   * @param {boolean} animation Whether enter animation is enabled.
   * @returns {{ element: HTMLElement }}
   */
  createToastElement(options: NotificationNormalizedOptions, closeLabel: string, animation: boolean):
      { element: HTMLElement } {
    const doc = this.#rootElement.ownerDocument;
    const element = doc.createElement('div');
    const isError = options.variant === 'error';

    element.className =
      `${NOTIFICATION_CLASS_NAME}__toast ${NOTIFICATION_CLASS_NAME}__toast--${options.variant}`;
    element.dataset.htNotificationId = options.id;
    element.setAttribute('role', isError ? 'alert' : 'status');
    element.setAttribute('aria-live', isError ? 'assertive' : 'polite');
    element.setAttribute('aria-atomic', 'true');

    if (animation) {
      element.classList.add(`${NOTIFICATION_CLASS_NAME}__toast--animate`);
      element.classList.add(
        options.position.startsWith('top') ?
          `${NOTIFICATION_CLASS_NAME}__toast--stack-top` :
          `${NOTIFICATION_CLASS_NAME}__toast--stack-bottom`
      );
    }

    const inner = doc.createElement('div');

    inner.className = `${NOTIFICATION_CLASS_NAME}__toast-inner`;

    const accent = doc.createElement('div');

    accent.className = `${NOTIFICATION_CLASS_NAME}__accent`;
    accent.setAttribute('aria-hidden', 'true');
    inner.appendChild(accent);

    const body = doc.createElement('div');

    body.className = `${NOTIFICATION_CLASS_NAME}__body`;

    if (options.title) {
      const titleEl = doc.createElement('div');

      titleEl.className = `${NOTIFICATION_CLASS_NAME}__title`;
      titleEl.textContent = stripTags(options.title);
      body.appendChild(titleEl);
    }

    const messageEl = doc.createElement('div');

    messageEl.className = `${NOTIFICATION_CLASS_NAME}__message`;

    if (typeof options.message === 'string') {
      fastInnerHTML(messageEl, options.message, this.#sanitizer as boolean | ((html: string) => string));
    } else {
      messageEl.appendChild(options.message);
    }

    body.appendChild(messageEl);

    if (options.actions?.length) {
      const actionsRow = doc.createElement('div');

      actionsRow.className = `${NOTIFICATION_CLASS_NAME}__actions`;

      options.actions.forEach((action: NotificationAction, index: number) => {
        const btn = doc.createElement('button');

        btn.type = 'button';
        btn.className = `ht-button ht-button--${action.type === 'primary' ? 'primary' : 'secondary'}`;
        btn.textContent = stripTags(action.label);
        btn.dataset.htNotificationAction = String(index);
        actionsRow.appendChild(btn);
      });

      body.appendChild(actionsRow);
    }

    inner.appendChild(body);

    if (options.closable) {
      const closeBtn = doc.createElement('button');

      closeBtn.type = 'button';
      closeBtn.className = `${NOTIFICATION_CLASS_NAME}__close`;
      closeBtn.setAttribute('aria-label', closeLabel);
      inner.appendChild(closeBtn);
    }

    element.appendChild(inner);

    element.tabIndex = -1;

    inner.querySelectorAll('button').forEach((btn) => {
      btn.tabIndex = -1;
    });

    const win = this.#rootElement.ownerDocument.defaultView;

    if (animation) {
      /* Double rAF: first frame paints opacity/transform start; second adds --visible so transition runs. */
      win.requestAnimationFrame(() => {
        win.requestAnimationFrame(() => {
          element.classList.add(`${NOTIFICATION_CLASS_NAME}__toast--visible`);
        });
      });
    } else {
      element.classList.add(`${NOTIFICATION_CLASS_NAME}__toast--visible`);
    }

    return { element };
  }

  /**
   * @param {HTMLElement} toastEl Toast root element.
   * @returns {HTMLElement[]}
   */
  static getFocusables(toastEl: HTMLElement): HTMLElement[] {
    const buttons = Array.from(toastEl.querySelectorAll('button')).filter(btn => !btn.disabled);

    if (buttons.length > 0) {
      return buttons;
    }

    return [toastEl];
  }

  /**
   * Enables or disables sequential keyboard focus for notification controls. When disabled, controls stay
   * out of the tab order so opening a toast does not move focus; screen readers still receive `aria-live` updates.
   *
   * @param {HTMLElement | null} host Notification plugin host element.
   * @param {boolean} enabled Whether controls participate in tab navigation.
   */
  static setSequentialFocusWithinHost(host: HTMLElement | null, enabled: boolean): void {
    if (!host) {
      return;
    }

    const tabIndex = enabled ? 0 : -1;

    host.querySelectorAll(`.${NOTIFICATION_CLASS_NAME}__toast`).forEach((toast) => {
      const toastEl = toast as HTMLElement;
      const buttons = Array.from(toastEl.querySelectorAll('button')).filter(btn => !btn.disabled);

      buttons.forEach((btn) => {
        btn.tabIndex = tabIndex;
      });

      if (buttons.length === 0) {
        toastEl.tabIndex = tabIndex;
      } else {
        toastEl.tabIndex = -1;
      }
    });
  }

  /**
   * Detaches the host from the DOM and clears internal stack references.
   */
  destroy(): void {
    this.#host?.remove();
    this.#host = null;
    this.#stacks.clear();
  }
}
