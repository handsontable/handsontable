import { buildTemplate, type TemplateSpec } from '../../../helpers/dom/template';
import { mixin } from '../../../helpers/object';
import localHooks from '../../../mixins/localHooks';
import * as C from '../../../i18n/constants';
import { addClass, setAttribute } from '../../../helpers/dom/element';
import { A11Y_GROUP, A11Y_LABEL } from '../../../helpers/a11y';
import { isKeyboardActivation } from './activation';
import { DISABLED_CLASS } from './overflow';

const TEMPLATE: TemplateSpec = {
  tag: 'div',
  ref: 'container',
  className: 'ht-sheets-bar handsontable',
  children: [{
    tag: 'div',
    className: 'ht-sheets-bar__inner',
    children: [
      {
        tag: 'div',
        ref: 'controls',
        className: 'ht-sheets-bar__controls',
        children: [
          {
            tag: 'button',
            ref: 'addButton',
            className: 'ht-sheets-bar__button ht-sheets-bar__add',
            attrs: { type: 'button' },
          },
          {
            tag: 'button',
            ref: 'allButton',
            className: 'ht-sheets-bar__button ht-sheets-bar__all',
            attrs: { type: 'button' },
          },
        ],
      },
      { tag: 'div', ref: 'tabStrip', className: 'ht-sheets-bar__tabs' },
      {
        tag: 'div',
        ref: 'pagingSection',
        className: 'ht-sheets-bar__paging',
        attrs: { hidden: '' },
        children: [
          {
            tag: 'button',
            ref: 'pagePrev',
            className: 'ht-sheets-bar__button ht-sheets-bar__page-prev',
            attrs: { type: 'button' },
          },
          {
            tag: 'button',
            ref: 'pageNext',
            className: 'ht-sheets-bar__button ht-sheets-bar__page-next',
            attrs: { type: 'button' },
          },
        ],
      },
    ],
  }],
};

/**
 * References to the bar's DOM elements collected from the template's data-ref markers.
 */
export interface SheetsBarRefs {
  container: HTMLDivElement;
  controls: HTMLDivElement;
  addButton: HTMLButtonElement;
  allButton: HTMLButtonElement;
  tabStrip: HTMLDivElement;
  pagingSection: HTMLDivElement;
  pagePrev: HTMLButtonElement;
  pageNext: HTMLButtonElement;
}

/**
 * Renders the sheets-bar container and its `+` / `≡` controls. Owns installation
 * into a custom `uiContainer`; slot placement is owned by the plugin class.
 */
export class SheetsBarUI {
  /**
   * Registers a callback for a local hook.
   */
  declare addLocalHook: (hookName: string, callback: Function) => SheetsBarUI;
  /**
   * Runs callbacks of a local hook.
   */
  declare runLocalHooks: (...args: unknown[]) => void;
  /**
   * Clears local hooks.
   */
  declare clearLocalHooks: () => void;
  /**
   * The collected element references.
   */
  #refs: SheetsBarRefs | null = null;
  /**
   * The document the bar is built in.
   */
  readonly #rootDocument: Document;
  /**
   * Optional custom host element.
   */
  readonly #uiContainer: HTMLElement | null;
  /**
   * RTL flag of the host grid.
   */
  readonly #isRtl: boolean;
  /**
   * Current theme class name.
   */
  #themeName: string | undefined;
  /**
   * Phrase translation callback.
   */
  readonly #phraseTranslator: (...args: unknown[]) => string;
  /**
   * Accessibility announcement callback.
   */
  readonly #a11yAnnouncer: (message: unknown) => void;
  /**
   * Whether the grid emits ARIA attributes.
   */
  readonly #ariaTags: boolean;

  /**
   * Creates the UI and installs it (into `uiContainer` when provided; otherwise the
   * container stays detached for the layout slot to place).
   */
  constructor({ rootDocument, uiContainer, isRtl, themeName, phraseTranslator, a11yAnnouncer, ariaTags }:
    Record<string, unknown>) {
    this.#rootDocument = rootDocument as Document;
    this.#uiContainer = uiContainer as HTMLElement | null;
    this.#isRtl = isRtl as boolean;
    this.#ariaTags = ariaTags !== false;
    this.#themeName = themeName as string | undefined;
    this.#phraseTranslator = phraseTranslator as (...args: unknown[]) => string;
    this.#a11yAnnouncer = a11yAnnouncer as (message: unknown) => void;

    this.#install();
  }

  /**
   * Returns the bar's root container element.
   */
  getContainer(): HTMLElement {
    return (this.#refs as SheetsBarRefs).container;
  }

  /**
   * Returns the tab strip host element (consumed by the TabStrip module).
   */
  getTabStripElement(): HTMLElement {
    return (this.#refs as SheetsBarRefs).tabStrip;
  }

  /**
   * Returns the bar's focusable controls in tab order: the live buttons and the tabs. Hidden
   * sections and spent paging arrows are left out.
   *
   * @returns {HTMLElement[]} The controls the focus can land on.
   */
  getFocusableElements(): HTMLElement[] {
    return Array.from(this.getContainer().querySelectorAll<HTMLElement>('button, .ht-sheets-bar__tab'))
      .filter(element => element.closest('[hidden]') === null && !element.classList.contains(DISABLED_CLASS));
  }

  /**
   * Returns the collected refs for sibling ui/ modules.
   */
  getRefs(): SheetsBarRefs {
    return this.#refs as SheetsBarRefs;
  }

  /**
   * Announces a message to assistive technology.
   */
  announce(message: string): void {
    this.#a11yAnnouncer(message);
  }

  /**
   * Translates a phrase key with optional interpolation arguments.
   */
  translate(key: string, args?: unknown): string {
    return this.#phraseTranslator(key, args);
  }

  /**
   * Re-applies the translated control labels, for a grid whose language changed after the
   * bar was built.
   */
  refreshLabels(): void {
    const { addButton, allButton, tabStrip, pagePrev, pageNext } = this.#refs as SheetsBarRefs;

    setAttribute(addButton, [A11Y_LABEL(this.translate(C.SHEETS_BAR_ADD_SHEET))]);
    setAttribute(allButton, [A11Y_LABEL(this.translate(C.SHEETS_BAR_ALL_SHEETS))]);
    setAttribute(pagePrev, [A11Y_LABEL(this.translate(C.SHEETS_BAR_PAGE_PREV))]);
    setAttribute(pageNext, [A11Y_LABEL(this.translate(C.SHEETS_BAR_PAGE_NEXT))]);

    if (this.#ariaTags) {
      setAttribute(tabStrip, [A11Y_LABEL(this.translate(C.SHEETS_BAR_SECTION))]);
    }
  }

  /**
   * Toggles the `+` / `≡` controls section.
   */
  setControlsVisible(visible: boolean): void {
    (this.#refs as SheetsBarRefs).controls.hidden = !visible;
  }

  /**
   * Swaps the theme class on the container.
   */
  updateTheme(themeName?: string): void {
    const container = this.getContainer();

    if (this.#themeName) {
      container.classList.remove(this.#themeName);
    }
    this.#themeName = themeName;

    if (themeName) {
      addClass(container, themeName);
    }
  }

  /**
   * Removes the UI from the DOM and clears local hooks. Idempotent — a second call is a
   * no-op, since `getContainer()` reads refs the first call already dropped.
   */
  destroy(): void {
    if (this.#refs === null) {
      return;
    }

    this.clearLocalHooks();
    this.getContainer().remove();
    this.#refs = null;
  }

  /**
   * Builds the DOM from the template, labels the controls, wires click listeners,
   * and mounts into the custom container when one was provided. The button icons are
   * mask-image glyphs supplied by the theme stylesheets, with dedicated mirrored
   * variants selected by the `dir` attribute set on the container under RTL.
   */
  #install(): void {
    const elements = buildTemplate(TEMPLATE, this.#rootDocument);

    this.#refs = elements.refs as unknown as SheetsBarRefs;

    const { container, addButton, allButton, tabStrip, pagePrev, pageNext } = this.#refs;

    container.setAttribute('dir', this.#isRtl ? 'rtl' : 'ltr');

    // The icon buttons have no text, so their labels are their names and stay whatever the
    // `ariaTags` setting says; the roles and states are what it switches off.
    setAttribute(addButton, [A11Y_LABEL(this.translate(C.SHEETS_BAR_ADD_SHEET))]);
    setAttribute(allButton, [A11Y_LABEL(this.translate(C.SHEETS_BAR_ALL_SHEETS))]);
    setAttribute(pagePrev, [A11Y_LABEL(this.translate(C.SHEETS_BAR_PAGE_PREV))]);
    setAttribute(pageNext, [A11Y_LABEL(this.translate(C.SHEETS_BAR_PAGE_NEXT))]);

    if (this.#ariaTags) {
      setAttribute(allButton, [['aria-haspopup', 'menu'], ['aria-expanded', 'false']]);
      setAttribute(tabStrip, [A11Y_GROUP(), A11Y_LABEL(this.translate(C.SHEETS_BAR_SECTION))]);
    }

    addButton.addEventListener('click', () => this.runLocalHooks('addSheetClick'));
    allButton.addEventListener('click', event => this.runLocalHooks('allSheetsClick', isKeyboardActivation(event)));

    if (this.#uiContainer) {
      this.#uiContainer.appendChild(elements.fragment);
      addClass(container, [this.#themeName ?? '', 'handsontable']);
    }
  }
}

mixin(SheetsBarUI, localHooks);
