import { html } from '../../helpers/templateLiteralTag';
import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';
import * as C from '../../i18n/constants';
import {
  addClass,
  removeClass,
  removeAttribute,
  setAttribute,
} from '../../helpers/dom/element';
import { A11Y_DISABLED, A11Y_LABEL } from '../../helpers/a11y';

const TEMPLATE = `
<div data-ref="container" class="ht-pagination-container">
  <div class="ht-pagination-container__inner">
  <div data-ref="pageSizeSection" class="ht-page-size-section" style="display: none">
    <span data-ref="pageSizeLabel"></span>
    <div class="ht-page-size-section__select-wrapper">
      <select data-ref="pageSizeSelect" name="pageSize"></select>
    </div>
  </div>
  <div data-ref="pageCounterSection" class="ht-page-counter-section" style="display: none"></div>
  <nav data-ref="pageNavSection" class="ht-page-navigation-section" style="display: none">
    <button data-ref="first" class="ht-page-first"></button>
    <button data-ref="prev" class="ht-page-prev"></button>
    <span data-ref="pageNavLabel"></span>
    <button data-ref="next" class="ht-page-next"></button>
      <button data-ref="last" class="ht-page-last"></button>
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
   * @type {HTMLElement} The root element where the pagination UI will be installed.
   */
  #rootElement;
  /**
   * @type {object} The references to the UI elements.
   */
  #refs;
  /**
   * @type {function(string): string} A function to translate phrases used in the UI.
   */
  #phraseTranslator;
  /**
   * @type {function(): void} A function that determines whether the pagination should have a border.
   */
  #shouldHaveBorder;
  /**
   * @type {function(string): void} A function allowing to announce accessibility messages.
   */
  #a11yAnnouncer;

  constructor({ rootElement, phraseTranslator, shouldHaveBorder, a11yAnnouncer }) {
    this.#rootElement = rootElement;
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
      first,
      prev,
      next,
      last,
      pageSizeSelect,
    } = elements.refs;

    this.#refs = elements.refs;

    first.addEventListener('click', () => this.runLocalHooks('firstPageClick'));
    prev.addEventListener('click', () => this.runLocalHooks('prevPageClick'));
    next.addEventListener('click', () => this.runLocalHooks('nextPageClick'));
    last.addEventListener('click', () => this.runLocalHooks('lastPageClick'));
    pageSizeSelect.addEventListener('change',
      () => this.runLocalHooks('pageSizeChange', parseInt(pageSizeSelect.value, 10)));

    this.#rootElement.after(elements.fragment);
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
   * Refreshes the border state of the pagination container based on the external condition.
   *
   * @returns {PaginationUI} The instance of the PaginationUI for method chaining.
   */
  refreshBorderState() {
    const { container } = this.#refs;

    if (this.#shouldHaveBorder()) {
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
   * @param {number} state.numberOfRenderedRows The number of rows rendered on the current page.
   * @param {number} state.totalRenderedRows The total number of renderable rows.
   * @param {number[]} state.pageSizeList The list of available page sizes.
   * @param {number} state.pageSize The current page size.
   * @returns {PaginationUI} The instance of the PaginationUI for method chaining.
   */
  updateState({
    currentPage,
    totalPages,
    numberOfRenderedRows,
    totalRenderedRows,
    pageSizeList,
    pageSize,
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

    const firstRenderedRow = (pageSize * (currentPage - 1)) + 1;
    const lastRenderedRow = firstRenderedRow + numberOfRenderedRows - 1;

    const counterSectionText = this.#phraseTranslator(C.PAGINATION_COUNTER_SECTION, {
      start: firstRenderedRow,
      end: lastRenderedRow,
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
    ]);

    this.#a11yAnnouncer(navLabelText);
    this.refreshBorderState();

    pageSizeList.forEach((pageSizeItem) => {
      const option = new Option(pageSizeItem, pageSizeItem);

      if (pageSizeItem === pageSize) {
        option.selected = true;
      }

      pageSizeSelect.add(option);
    });

    const isFirstPage = currentPage === 1;
    const isLastPage = currentPage === totalPages;

    if (isFirstPage) {
      setAttribute(first, 'disabled', true);
      setAttribute(prev, 'disabled', true);
    } else {
      removeAttribute(first, 'disabled');
      removeAttribute(prev, 'disabled');
    }

    if (isLastPage) {
      setAttribute(next, 'disabled', true);
      setAttribute(last, 'disabled', true);
    } else {
      removeAttribute(next, 'disabled');
      removeAttribute(last, 'disabled');
    }

    setAttribute(first, [
      ...[A11Y_LABEL(this.#phraseTranslator(C.PAGINATION_FIRST_PAGE))],
      ...([A11Y_DISABLED(isFirstPage)]),
    ]);
    setAttribute(prev, [
      ...[A11Y_LABEL(this.#phraseTranslator(C.PAGINATION_PREV_PAGE))],
      ...([A11Y_DISABLED(isFirstPage)]),
    ]);
    setAttribute(next, [
      ...[A11Y_LABEL(this.#phraseTranslator(C.PAGINATION_NEXT_PAGE))],
      ...([A11Y_DISABLED(isLastPage)]),
    ]);
    setAttribute(last, [
      ...[A11Y_LABEL(this.#phraseTranslator(C.PAGINATION_LAST_PAGE))],
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
    if (isSectionVisible) {
      addClass(this.#rootElement, 'htPagination');
    } else {
      removeClass(this.#rootElement, 'htPagination');
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
