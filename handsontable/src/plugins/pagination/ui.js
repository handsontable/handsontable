import { html } from '../../helpers/templateLiteralTag';
import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';
import * as C from '../../i18n/constants';
import {
  addClass,
  removeClass,
  setAttribute,
} from '../../helpers/dom/element';
import { A11Y_DISABLED, A11Y_LABEL, A11Y_TABINDEX } from '../../helpers/a11y';

const TEMPLATE = `
<div data-ref="container" class="ht-pagination-container handsontable">
  <div class="ht-pagination-container__inner">
    <div data-ref="pageSizeSection" class="ht-page-size-section">
      <span data-ref="pageSizeLabel" class="ht-page-size-section__label"></span>
      <div class="ht-page-size-section__select-wrapper">
        <select data-ref="pageSizeSelect" name="pageSize"></select>
      </div>
    </div>
    <div data-ref="pageCounterSection" class="ht-page-counter-section"></div>
    <nav data-ref="pageNavSection" class="ht-page-navigation-section">
      <button data-ref="first" class="ht-page-navigation-section__button ht-page-first"></button>
      <button data-ref="prev" class="ht-page-navigation-section__button ht-page-prev"></button>
      <span data-ref="pageNavLabel" class="ht-page-navigation-section__label"></span>
      <button data-ref="next" class="ht-page-navigation-section__button ht-page-next"></button>
      <button data-ref="last" class="ht-page-navigation-section__button ht-page-last"></button>
    </nav>
  </div>
</div>
`;

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
   * The root element where the pagination UI will be installed.
   *
   * @type {HTMLElement}
   */
  #rootElement;
  /**
   * The container element where the pagination UI will be installed.
   * If not provided, the pagination container will be injected after the root element.
   *
   * @type {HTMLElement}
   */
  #uiContainer;
  /**
   * Indicates if the UI is in RTL mode.
   *
   * @type {boolean}
   */
  #isRtl = false;
  /**
   * The references to the UI elements.
   *
   * @type {object}
   */
  #refs;
  /**
   * The name of the current theme.
   *
   * @type {string | undefined}
   */
  #themeName;
  /**
   * A function to translate phrases used in the UI.
   *
   * @type {function(string): string}
   */
  #phraseTranslator;
  /**
   * A function that determines whether the pagination should have a border.
   *
   * @type {function(): void}
   */
  #shouldHaveBorder;
  /**
   * A function allowing to announce accessibility messages.
   *
   * @type {function(string): void}
   */
  #a11yAnnouncer;
  /**
   * The focusable elements.
   *
   * @type {number | null}
   */
  focusableElements = null;

  constructor({
    rootElement,
    uiContainer,
    isRtl,
    themeName,
    phraseTranslator,
    shouldHaveBorder,
    a11yAnnouncer,
  }) {
    this.#rootElement = rootElement;
    this.#uiContainer = uiContainer;
    this.#isRtl = isRtl;
    this.#themeName = themeName;
    this.#phraseTranslator = phraseTranslator;
    this.#shouldHaveBorder = shouldHaveBorder;
    this.#a11yAnnouncer = a11yAnnouncer;

    this.install();
  }

  /**
   * Creates the pagination UI elements and sets up event listeners.
   */
  install() {
    if (this.#refs?.container) {
      return;
    }

    const elements = html`${TEMPLATE}`;
    const {
      container,
      first,
      prev,
      next,
      last,
      pageSizeSelect,
    } = elements.refs;

    this.focusableElements = [
      pageSizeSelect,
      first,
      prev,
      next,
      last,
    ];

    this.#refs = elements.refs;

    container.setAttribute('dir', this.#isRtl ? 'rtl' : 'ltr');

    const isDisabled = event => event.currentTarget.disabled;

    first.addEventListener('click', (event) => {
      if (!isDisabled(event)) {
        this.runLocalHooks('firstPageClick');
      }
    });
    prev.addEventListener('click', (event) => {
      if (!isDisabled(event)) {
        this.runLocalHooks('prevPageClick');
      }
    });
    next.addEventListener('click', (event) => {
      if (!isDisabled(event)) {
        this.runLocalHooks('nextPageClick');
      }
    });
    last.addEventListener('click', (event) => {
      if (!isDisabled(event)) {
        this.runLocalHooks('lastPageClick');
      }
    });
    pageSizeSelect.addEventListener('change', () => {
      const value = pageSizeSelect.value === 'auto' ? 'auto' : Number.parseInt(pageSizeSelect.value, 10);

      this.runLocalHooks('pageSizeChange', value);
    });

    this.setCounterSectionVisibility(false);
    this.setNavigationSectionVisibility(false);
    this.setPageSizeSectionVisibility(false);

    if (this.#uiContainer) {
      this.#uiContainer.appendChild(elements.fragment);

      addClass(container, [this.#themeName, 'handsontable']);
    } else {
      this.#rootElement.after(elements.fragment);
    }
  }

  /**
   * Updates the width of the pagination container.
   *
   * @param {number} width The new width of the pagination container.
   * @returns {PaginationUI} The instance of the PaginationUI for method chaining.
   */
  updateWidth(width) {
    this.#refs.container.style.width = `${width}px`;

    return this;
  }

  /**
   * Updates the theme of the pagination container.
   *
   * @param {string | false | undefined} themeName The name of the theme to use.
   * @returns {PaginationUI} The instance of the PaginationUI for method chaining.
   */
  updateTheme(themeName) {
    this.#themeName = themeName;

    if (this.#uiContainer) {
      const { container } = this.#refs;

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
  getHeight() {
    return this.#refs.container.offsetHeight;
  }

  /**
   * Refreshes the border state of the pagination container based on the external condition.
   *
   * @returns {PaginationUI} The instance of the PaginationUI for method chaining.
   */
  refreshBorderState() {
    const { container } = this.#refs;

    if (this.#uiContainer || this.#shouldHaveBorder()) {
      addClass(container, 'ht-pagination-container--bordered');
    } else {
      removeClass(container, 'ht-pagination-container--bordered');
    }

    return this;
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
  }) {
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
    } = this.#refs;

    const counterSectionText = this.#phraseTranslator(C.PAGINATION_COUNTER_SECTION, {
      start: firstVisibleRowIndex + 1,
      end: lastVisibleRowIndex + 1,
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
      ...[A11Y_LABEL(this.#phraseTranslator(C.PAGINATION_SECTION))],
    ]);
    setAttribute(pageSizeSelect, [
      ...[A11Y_LABEL(this.#phraseTranslator(C.PAGINATION_PAGE_SIZE_SECTION))],
      ...([A11Y_TABINDEX(-1)]),
    ]);

    this.#a11yAnnouncer(navLabelText);
    this.refreshBorderState();

    pageSizeList.forEach((pageSizeItem) => {
      const label = pageSizeItem === 'auto' ?
        this.#phraseTranslator(C.PAGINATION_PAGE_SIZE_AUTO) : pageSizeItem;
      const option = new Option(label, pageSizeItem);

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

    if ([first, prev, next, last].includes(activeElement)) {
      if (prev.disabled) {
        next.focus();

      } else if (next.disabled) {
        prev.focus();
      }
    }

    setAttribute(first, [
      ...[A11Y_LABEL(this.#phraseTranslator(C.PAGINATION_FIRST_PAGE))],
      ...([A11Y_DISABLED(isFirstPage)]),
      ...([A11Y_TABINDEX(-1)]),
    ]);
    setAttribute(prev, [
      ...[A11Y_LABEL(this.#phraseTranslator(C.PAGINATION_PREV_PAGE))],
      ...([A11Y_DISABLED(isFirstPage)]),
      ...([A11Y_TABINDEX(-1)]),
    ]);
    setAttribute(next, [
      ...[A11Y_LABEL(this.#phraseTranslator(C.PAGINATION_NEXT_PAGE))],
      ...([A11Y_DISABLED(isLastPage)]),
      ...([A11Y_TABINDEX(-1)]),
    ]);
    setAttribute(last, [
      ...[A11Y_LABEL(this.#phraseTranslator(C.PAGINATION_LAST_PAGE))],
      ...([A11Y_DISABLED(isLastPage)]),
      ...([A11Y_TABINDEX(-1)]),
    ]);

    return this;
  }

  /**
   * Sets the visibility of the page size section.
   *
   * @param {boolean} isVisible True to show the page size section, false to hide it.
   * @returns {PaginationUI} The instance of the PaginationUI for method chaining.
   */
  setPageSizeSectionVisibility(isVisible) {
    this.#refs.pageSizeSection.style.display = isVisible ? '' : 'none';
    this.#updateContainerVisibility();

    return this;
  }

  /**
   * Sets the visibility of the page counter section.
   *
   * @param {boolean} isVisible True to show the page size section, false to hide it.
   * @returns {PaginationUI} The instance of the PaginationUI for method chaining.
   */
  setCounterSectionVisibility(isVisible) {
    this.#refs.pageCounterSection.style.display = isVisible ? '' : 'none';
    this.#updateContainerVisibility();

    return this;
  }

  /**
   * Sets the visibility of the page navigation section.
   *
   * @param {boolean} isVisible True to show the page size section, false to hide it.
   * @returns {PaginationUI} The instance of the PaginationUI for method chaining.
   */
  setNavigationSectionVisibility(isVisible) {
    this.#refs.pageNavSection.style.display = isVisible ? '' : 'none';
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
    } = this.#refs;

    const isSectionVisible = (
      pageSizeSection.style.display !== 'none' ||
      pageCounterSection.style.display !== 'none' ||
      pageNavSection.style.display !== 'none'
    );

    // adds or removes the corner around the Handsontable root element
    if (!this.#uiContainer) {
      if (isSectionVisible) {
        addClass(this.#rootElement, 'htPagination');
      } else {
        removeClass(this.#rootElement, 'htPagination');
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
