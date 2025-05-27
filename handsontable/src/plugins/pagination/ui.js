import { html } from '../../helpers/templateLiteralTag';
import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';
import * as C from '../../i18n/constants';
import {
  removeAttribute,
  setAttribute,
} from '../../helpers/dom/element';
import { A11Y_DISABLED, A11Y_LABEL } from '../../helpers/a11y';

const TEMPLATE = `
<div data-ref="container" class="ht-pagination-container">
  <div data-ref="pageSizeSection" class="ht-page-size-section" style="display: none">
    <span data-ref="pageSizeLabel"></span>
    <select data-ref="pageSizeSelect" name="pageSize"></select>
  </div>
  <div data-ref="pageCounterSection" class="ht-page-counter-section" style="display: none"></div>
  <nav data-ref="pageNavSection" class="ht-page-navigation-section" aria-label="Pagination" style="display: none">
    <button data-ref="first" class="ht-page-first"></button>
    <button data-ref="prev" class="ht-page-prev"></button>
    <span data-ref="pageNavLabel"></span>
    <button data-ref="next" class="ht-page-next"></button>
    <button data-ref="last" class="ht-page-last"></button>
  </nav>
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
   * @type {function(string): string} The function to translate phrases used in the UI.
   */
  #phraseTranslator;

  constructor(rootElement, phraseTranslator) {
    this.#rootElement = rootElement;
    this.#phraseTranslator = phraseTranslator;
  }

  /**
   * Creates the pagination UI elements and sets up event listeners.
   */
  install() {
    const elements = html`${TEMPLATE}`;
    const {
      first,
      prev,
      next,
      last,
      pageSizeSelect,
      pageNavSection,
      pageSizeLabel,
    } = elements.refs;

    this.#refs = elements.refs;

    setAttribute(pageNavSection, [
      ...[A11Y_LABEL('Pagination')],
    ]);

    pageSizeLabel.textContent = this.#phraseTranslator(C.PAGINATION_PAGE_SIZE);

    first.addEventListener('click', () => this.runLocalHooks('firstPageClick'));
    prev.addEventListener('click', () => this.runLocalHooks('prevPageClick'));
    next.addEventListener('click', () => this.runLocalHooks('nextPageClick'));
    last.addEventListener('click', () => this.runLocalHooks('lastPageClick'));
    pageSizeSelect.addEventListener('change',
      () => this.runLocalHooks('pageSizeChange', parseInt(pageSizeSelect.value, 10)));

    this.#rootElement.after(elements.fragment);
  }

  /**
   * Removes the pagination UI elements from the DOM.
   */
  uninstall() {
    this.#refs?.container.remove();
  }

  /**
   * Updates the width of the pagination container.
   *
   * @param {number} width The new width of the pagination container.
   */
  updateWidth(width) {
    this.#refs.container.style.width = `${width}px`;
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
      pageNavLabel,
      pageSizeSelect,
    } = this.#refs;

    const firstRenderedRow = (pageSize * (currentPage - 1)) + 1;
    const lastRenderedRow = firstRenderedRow + numberOfRenderedRows - 1;

    const ofPhrase = this.#phraseTranslator(C.PAGINATION_OF);
    const pagePhrase = this.#phraseTranslator(C.PAGINATION_PAGE);

    pageCounterSection.textContent = `${firstRenderedRow} - ${lastRenderedRow} ${ofPhrase} ${totalRenderedRows}`;
    pageNavLabel.textContent = `${pagePhrase} ${currentPage} ${ofPhrase} ${totalPages}`;
    pageSizeSelect.innerHTML = '';

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
      setAttribute(first, 'disabled');
      setAttribute(prev, 'disabled');
    } else {
      removeAttribute(first, 'disabled');
      removeAttribute(prev, 'disabled');
    }

    if (isLastPage) {
      setAttribute(next, 'disabled');
      setAttribute(last, 'disabled');
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
  }

  /**
   * Sets the visibility of the page size section.
   *
   * @param {boolean} isVisible True to show the page size section, false to hide it.
   */
  setPageSizeSectionVisibility(isVisible) {
    this.#refs.pageSizeSection.style.display = isVisible ? '' : 'none';
  }

  /**
   * Sets the visibility of the page counter section.
   *
   * @param {boolean} isVisible True to show the page size section, false to hide it.
   */
  setCounterSectionVisibility(isVisible) {
    this.#refs.pageCounterSection.style.display = isVisible ? '' : 'none';
  }

  /**
   * Sets the visibility of the page navigation section.
   *
   * @param {boolean} isVisible True to show the page size section, false to hide it.
   */
  setNavigationSectionVisibility(isVisible) {
    this.#refs.pageNavSection.style.display = isVisible ? '' : 'none';
  }
}

mixin(PaginationUI, localHooks);
