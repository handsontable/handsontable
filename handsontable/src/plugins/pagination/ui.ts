import { buildTemplate, type TemplateSpec } from '../../helpers/dom/template';
import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';
import * as C from '../../i18n/constants';
import {
  addClass,
  removeClass,
  setAttribute,
} from '../../helpers/dom/element';
import { A11Y_DISABLED, A11Y_LABEL } from '../../helpers/a11y';

const TEMPLATE: TemplateSpec = {
  tag: 'div',
  ref: 'container',
  className: 'ht-pagination handsontable',
  children: [{
    tag: 'div',
    className: 'ht-pagination__inner',
    children: [
      {
        tag: 'div',
        ref: 'pageSizeSection',
        className: 'ht-page-size-section',
        children: [
          { tag: 'span', ref: 'pageSizeLabel', className: 'ht-page-size-section__label' },
          {
            tag: 'div',
            className: 'ht-page-size-section__select-wrapper',
            children: [{
              tag: 'select',
              ref: 'pageSizeSelect',
              attrs: { name: 'pageSize', 'data-hot-input': '' },
            }],
          },
        ],
      },
      { tag: 'div', ref: 'pageCounterSection', className: 'ht-page-counter-section' },
      {
        tag: 'nav',
        ref: 'pageNavSection',
        className: 'ht-page-navigation-section',
        children: [
          { tag: 'button', ref: 'first', className: 'ht-page-navigation-section__button ht-page-first' },
          { tag: 'button', ref: 'prev', className: 'ht-page-navigation-section__button ht-page-prev' },
          { tag: 'span', ref: 'pageNavLabel', className: 'ht-page-navigation-section__label' },
          { tag: 'button', ref: 'next', className: 'ht-page-navigation-section__button ht-page-next' },
          { tag: 'button', ref: 'last', className: 'ht-page-navigation-section__button ht-page-last' },
        ],
      },
    ],
  }],
};

interface PaginationRefs {
  container: HTMLDivElement;
  first: HTMLButtonElement;
  prev: HTMLButtonElement;
  next: HTMLButtonElement;
  last: HTMLButtonElement;
  pageSizeSelect: HTMLSelectElement;
  pageSizeSection: HTMLDivElement;
  pageCounterSection: HTMLDivElement;
  pageNavSection: HTMLElement;
  pageNavLabel: HTMLSpanElement;
  pageSizeLabel: HTMLSpanElement;
}

/**
 * PaginationUI is a UI component that renders and manages pagination controls.
 * It handles user interactions (navigation and page size changes), and exposes methods to
 * toggle visibility of pagination sections and update the state of the pagination controls.
 *
 * @private
 * @class PaginationUI
 */
export class PaginationUI {
  /**
   * Triggers registered local hooks with the given hook name and arguments.
   */
  declare runLocalHooks: (...args: unknown[]) => void;
  /**
   * Registers a callback to be executed when the specified local hook fires.
   */
  declare addLocalHook: (hookName: string, callback: Function) => PaginationUI;
  /**
   * The root element where the pagination UI will be installed.
   *
   * @type {HTMLElement}
   */
  readonly #rootElement: HTMLElement;
  /**
   * The container element where the pagination UI will be installed.
   * If not provided, the pagination container will be injected after the root element.
   *
   * @type {HTMLElement}
   */
  readonly #uiContainer: HTMLElement | null;
  /**
   * Indicates if the UI is in RTL mode.
   *
   * @type {boolean}
   */
  readonly #isRtl: boolean = false;
  /**
   * The references to the UI elements.
   *
   * @type {object}
   */
  #refs: PaginationRefs | null = null;
  /**
   * The name of the current theme.
   *
   * @type {string | undefined}
   */
  #themeName: string | undefined;
  /**
   * A function to translate phrases used in the UI.
   *
   * @type {function(string): string}
   */
  readonly #phraseTranslator: (...args: unknown[]) => string;
  /**
   * A function allowing to announce accessibility messages.
   *
   * @type {function(string): void}
   */
  readonly #a11yAnnouncer: (message: unknown) => void;

  /**
   * Initializes the pagination UI by creating DOM elements, applying layout settings, and registering event listeners.
   */
  constructor({
    rootElement,
    uiContainer,
    isRtl,
    themeName,
    phraseTranslator,
    a11yAnnouncer,
  }: Record<string, unknown>) {
    this.#rootElement = rootElement as HTMLElement;
    this.#uiContainer = uiContainer as HTMLElement | null;
    this.#isRtl = isRtl as boolean;
    this.#themeName = themeName as string | undefined;
    this.#phraseTranslator = phraseTranslator as (...args: unknown[]) => string;
    this.#a11yAnnouncer = a11yAnnouncer as (message: unknown) => void;

    this.install();
  }

  /**
   * Creates the pagination UI elements and sets up event listeners.
   */
  install() {
    if (this.#refs?.container) {
      return;
    }

    const elements = buildTemplate(TEMPLATE, this.#rootElement.ownerDocument);
    const {
      container,
      first,
      prev,
      next,
      last,
      pageSizeSelect,
    } = elements.refs as unknown as PaginationRefs;

    this.#refs = elements.refs as unknown as PaginationRefs;

    container.setAttribute('dir', this.#isRtl ? 'rtl' : 'ltr');
    container.tabIndex = -1;

    const isDisabled = (event: Event) => (event.currentTarget as HTMLButtonElement).disabled;
    const addClickListener = (eventName: string, element: HTMLElement, callback: Function) => {
      element.addEventListener(eventName, (event: Event) => {
        if (!isDisabled(event)) {
          callback();
        }
      });
    };

    addClickListener('click', first, () => this.runLocalHooks('firstPageClick'));
    addClickListener('click', prev, () => this.runLocalHooks('prevPageClick'));
    addClickListener('click', next, () => this.runLocalHooks('nextPageClick'));
    addClickListener('click', last, () => this.runLocalHooks('lastPageClick'));

    pageSizeSelect.addEventListener('change', () => {
      const value = pageSizeSelect.value === 'auto' ? 'auto' : Number.parseInt(pageSizeSelect.value, 10);

      this.runLocalHooks('pageSizeChange', value);
    });

    this.setCounterSectionVisibility(false);
    this.setNavigationSectionVisibility(false);
    this.setPageSizeSectionVisibility(false);

    if (this.#uiContainer) {
      this.#uiContainer.appendChild(elements.fragment);

      addClass(container, [this.#themeName ?? '', 'handsontable']);
    }

    // Without a custom `uiContainer`, the LayoutManager owns placement: it appends the container
    // into the bottom slot when the plugin registers it. The element stays detached until then.
  }

  /**
   * Gets the pagination element.
   *
   * @returns {HTMLElement} The pagination element.
   */
  getContainer(): HTMLDivElement {
    return this.#refs!.container;
  }

  /**
   * Gets the focusable elements.
   *
   * @returns {HTMLElement[]} The focusable elements.
   */
  getFocusableElements(): HTMLElement[] {
    const {
      first,
      prev,
      next,
      last,
      pageSizeSelect,
    } = this.#refs!;

    return [
      pageSizeSelect,
      first,
      prev,
      next,
      last,
    ].filter(element => !element.disabled);
  }

  /**
   * Updates the theme of the pagination container.
   *
   * @param {string | false | undefined} themeName The name of the theme to use.
   * @returns {PaginationUI} The instance of the PaginationUI for method chaining.
   */
  updateTheme(themeName: string | undefined): PaginationUI {
    this.#themeName = themeName;

    if (this.#uiContainer) {
      const { container } = this.#refs!;

      removeClass(container, /ht-theme-.*/g);

      if (this.#themeName) {
        addClass(container, this.#themeName);
      }
    }

    return this;
  }

  /**
   * Gets the height of the pagination container element.
   *
   * @returns {number}
   */
  getHeight(): number {
    return this.#refs!.container.offsetHeight;
  }

  /**
   * Updates the state of the pagination UI.
   *
   * @param {object} state The pagination state.
   * @param {number} state.currentPage The current page number.
   * @param {number} state.totalPages The total number of pages.
   * @param {number} state.firstVisibleRowIndex The index of the first visible row on the current page.
   * @param {number} state.lastVisibleRowIndex The index of the last visible row on the current page.
   * @param {number} state.totalRenderedRows The total number of renderable rows.
   * @param {Array<number | 'auto'>} state.pageSizeList The list of available page sizes.
   * @param {number} state.pageSize The current page size.
   * @param {boolean} state.autoPageSize Indicates if the page size is set to 'auto'.
   * @param {number} [state.counterStartRow] Optional 1-based start row for the counter (e.g. dataProvider mode).
   * @param {number} [state.counterEndRow] Optional 1-based end row for the counter (e.g. dataProvider mode).
   * @returns {PaginationUI} The instance of the PaginationUI for method chaining.
   */
  updateState({
    currentPage,
    totalPages,
    firstVisibleRowIndex,
    lastVisibleRowIndex,
    totalRenderedRows,
    pageSizeList,
    pageSize,
    autoPageSize,
    counterStartRow,
    counterEndRow,
  }: Record<string, unknown>): PaginationUI {
    const {
      first,
      prev,
      next,
      last,
      pageCounterSection,
      pageNavSection,
      pageNavLabel,
      pageSizeSelect,
      pageSizeLabel,
    } = this.#refs!;

    const counterStart = counterStartRow ?? (firstVisibleRowIndex as number) + 1;
    const counterEnd = counterEndRow ?? (lastVisibleRowIndex as number) + 1;

    const counterSectionText = this.#phraseTranslator(C.PAGINATION_COUNTER_SECTION, {
      start: counterStart,
      end: counterEnd,
      total: totalRenderedRows,
    });
    const navLabelText = this.#phraseTranslator(C.PAGINATION_NAV_SECTION, {
      currentPage,
      totalPages,
    });
    const pageSizeLabelText = this.#phraseTranslator(C.PAGINATION_PAGE_SIZE_SECTION);

    pageCounterSection.textContent = counterSectionText;
    pageNavLabel.textContent = navLabelText;
    pageSizeSelect.textContent = '';
    pageSizeLabel.textContent = `${pageSizeLabelText}:`;

    setAttribute(pageNavSection, [
      ...([A11Y_LABEL(this.#phraseTranslator(C.PAGINATION_SECTION))]),
    ]);
    setAttribute(pageSizeSelect, [
      ...([A11Y_LABEL(this.#phraseTranslator(C.PAGINATION_PAGE_SIZE_SECTION))]),
    ]);

    this.#a11yAnnouncer(navLabelText);

    (pageSizeList as unknown[]).forEach((pageSizeItem: unknown) => {
      const label = pageSizeItem === 'auto' ?
        this.#phraseTranslator(C.PAGINATION_PAGE_SIZE_AUTO) : pageSizeItem;
      const option = new Option(String(label ?? ''), String(pageSizeItem ?? ''));

      if (
        (autoPageSize && pageSizeItem === 'auto') ||
        (!autoPageSize && pageSizeItem === pageSize)
      ) {
        option.selected = true;
      }

      pageSizeSelect.add(option);
    });

    const isFirstPage = currentPage === 1;
    const isLastPage = currentPage === totalPages;

    if (pageNavSection.style.display !== 'none') {
      const activeElement = this.#rootElement.ownerDocument.activeElement;

      if (isFirstPage) {
        addClass(first, 'ht-page-navigation-section__button--disabled');
        addClass(prev, 'ht-page-navigation-section__button--disabled');
        first.disabled = true;
        prev.disabled = true;
      } else {
        removeClass(first, 'ht-page-navigation-section__button--disabled');
        removeClass(prev, 'ht-page-navigation-section__button--disabled');
        first.disabled = false;
        prev.disabled = false;
      }

      if (isLastPage) {
        addClass(next, 'ht-page-navigation-section__button--disabled');
        addClass(last, 'ht-page-navigation-section__button--disabled');
        next.disabled = true;
        last.disabled = true;
      } else {
        removeClass(next, 'ht-page-navigation-section__button--disabled');
        removeClass(last, 'ht-page-navigation-section__button--disabled');
        next.disabled = false;
        last.disabled = false;
      }

      if ([first, prev, next, last].includes(activeElement as HTMLButtonElement)) {
        if (prev.disabled) {
          next.focus();

        } else if (next.disabled) {
          prev.focus();
        }
      }
    }

    setAttribute(first, [
      ...([A11Y_LABEL(this.#phraseTranslator(C.PAGINATION_FIRST_PAGE))]),
      ...([A11Y_DISABLED(isFirstPage)]),
    ]);
    setAttribute(prev, [
      ...([A11Y_LABEL(this.#phraseTranslator(C.PAGINATION_PREV_PAGE))]),
      ...([A11Y_DISABLED(isFirstPage)]),
    ]);
    setAttribute(next, [
      ...([A11Y_LABEL(this.#phraseTranslator(C.PAGINATION_NEXT_PAGE))]),
      ...([A11Y_DISABLED(isLastPage)]),
    ]);
    setAttribute(last, [
      ...([A11Y_LABEL(this.#phraseTranslator(C.PAGINATION_LAST_PAGE))]),
      ...([A11Y_DISABLED(isLastPage)]),
    ]);

    return this;
  }

  /**
   * Sets the visibility of the page size section.
   *
   * @param {boolean} isVisible True to show the page size section, false to hide it.
   * @returns {PaginationUI} The instance of the PaginationUI for method chaining.
   */
  setPageSizeSectionVisibility(isVisible: boolean): PaginationUI {
    const {
      pageSizeSection,
      pageSizeSelect,
    } = this.#refs!;

    pageSizeSection.style.display = isVisible ? '' : 'none';
    pageSizeSelect.disabled = !isVisible;

    this.#updateContainerVisibility();

    return this;
  }

  /**
   * Sets the visibility of the page counter section.
   *
   * @param {boolean} isVisible True to show the page size section, false to hide it.
   * @returns {PaginationUI} The instance of the PaginationUI for method chaining.
   */
  setCounterSectionVisibility(isVisible: boolean): PaginationUI {
    this.#refs!.pageCounterSection.style.display = isVisible ? '' : 'none';
    this.#updateContainerVisibility();

    return this;
  }

  /**
   * Sets the visibility of the page navigation section.
   *
   * @param {boolean} isVisible True to show the page size section, false to hide it.
   * @returns {PaginationUI} The instance of the PaginationUI for method chaining.
   */
  setNavigationSectionVisibility(isVisible: boolean): PaginationUI {
    const {
      pageNavSection,
      first,
      prev,
      next,
      last,
    } = this.#refs!;

    pageNavSection.style.display = isVisible ? '' : 'none';
    first.disabled = !isVisible;
    prev.disabled = !isVisible;
    next.disabled = !isVisible;
    last.disabled = !isVisible;

    this.#updateContainerVisibility();

    return this;
  }

  /**
   * Updates the visibility of the pagination container based on the visibility of its sections.
   */
  #updateContainerVisibility() {
    const {
      container,
      pageSizeSection,
      pageCounterSection,
      pageNavSection,
    } = this.#refs!;

    const isSectionVisible = (
      pageSizeSection.style.display !== 'none' ||
      pageCounterSection.style.display !== 'none' ||
      pageNavSection.style.display !== 'none'
    );

    // adds or removes the corner around the Handsontable root element
    if (!this.#uiContainer) {
      if (isSectionVisible) {
        addClass(this.#rootElement.querySelector('.ht-wrapper')!, 'htPagination');
      } else {
        removeClass(this.#rootElement.querySelector('.ht-wrapper')!, 'htPagination');
      }
    }

    container.style.display = isSectionVisible ? '' : 'none';
  }

  /**
   * Removes the pagination UI elements from the DOM and clears the refs.
   */
  destroy() {
    this.#refs?.container.remove();
    this.#refs = null;
  }
}

mixin(PaginationUI, localHooks);
