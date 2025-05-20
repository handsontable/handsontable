import { html } from '../../helpers/templateLiteralTag';
import { mixin } from '../../helpers/object';
import { addClass, removeClass } from '../../helpers/dom/element';
import localHooks from '../../mixins/localHooks';

const TEMPLATE = `
<div data-ref="container" class="ht-pagination-container">
  <div data-ref="pageSizeSection" class="ht-page-size-section" style="display: none">
    <span data-ref="pageSizeLabel">Page size:</span>
    <select data-ref="pageSizeSelect" name="pageSize"></select>
  </div>
  <div data-ref="pageCounterSection" class="ht-page-counter-section" style="display: none"></div>
  <div data-ref="pageNavSection" class="ht-page-navigation-section" style="display: none">
    <button data-ref="first" class="ht-page-first"></button>
    <button data-ref="prev" class="ht-page-prev"></button>
    <span data-ref="pageNavLabel"></span>
    <button data-ref="next" class="ht-page-next"></button>
    <button data-ref="last" class="ht-page-last"></button>
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
   * @param {HTMLElement} rootElement The root element where the pagination UI will be installed.
   */
  #rootElement;
  /**
   * @param {object} refs The references to the UI elements.
   */
  #refs;

  constructor(rootElement) {
    this.#rootElement = rootElement;
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
   * @param {number[]} state.pageList The list of available page sizes.
   * @param {number} state.pageSize The current page size.
   */
  updateState({
    currentPage,
    totalPages,
    numberOfRenderedRows,
    totalRenderedRows,
    pageList,
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

    pageCounterSection.textContent = `${firstRenderedRow} - ${lastRenderedRow} of ${totalRenderedRows}`;
    pageNavLabel.textContent = `Page ${currentPage} of ${totalPages}`;
    pageSizeSelect.innerHTML = '';

    pageList.forEach((pageSizeItem) => {
      const option = new Option(pageSizeItem, pageSizeItem);

      if (pageSizeItem === pageSize) {
        option.selected = true;
      }

      pageSizeSelect.add(option);
    });

    if (currentPage === 1) {
      addClass(first, 'disabled');
      addClass(prev, 'disabled');
      first.setAttribute('disabled', true);
      prev.setAttribute('disabled', true);
    } else {
      removeClass(first, 'disabled');
      removeClass(prev, 'disabled');
      first.removeAttribute('disabled');
      prev.removeAttribute('disabled');
    }

    if (currentPage === totalPages) {
      addClass(next, 'disabled');
      addClass(last, 'disabled');
      next.setAttribute('disabled', true);
      last.setAttribute('disabled', true);
    } else {
      removeClass(next, 'disabled');
      removeClass(last, 'disabled');
      next.removeAttribute('disabled');
      last.removeAttribute('disabled');
    }
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
