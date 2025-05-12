import { html } from '../../helpers/templateLiteralTag';
import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';

const TEMPLATE = `
<div data-ref="container" class="htPaginationContainer">
  <div data-ref="pageSizeSection" class="htPageSizeSection" style="display: none">
    <span data-ref="pageSizeLabel">Page size:</span>
    <select data-ref="pageSizeSelect" name="pageSize"></select>
  </div>
  <div data-ref="pageCounterSection" class="htPageCounterSection" style="display: none"></div>
  <div data-ref="pageNavSection" class="htPageNavigationSection" style="display: none">
    <button data-ref="first">&laquo;</button>
    <button data-ref="prev">&lsaquo;</button>
    <span data-ref="pageNavLabel"></span>
    <button data-ref="next">&rsaquo;</button>
    <button data-ref="last">&raquo;</button>
  </div>
</div>`;

/**
 * PaginationUI is a UI component that renders and manages pagination controls.
 * It handles user interactions (navigation and page size changes), and exposes methods to
 * toggle visibility of pagination sections and update the state of the pagination controls.
 *
 * @private
 * @class PaginationUI
 */
export class PaginationUI {
  #rootWrapperElement;
  #refs;

  constructor(rootWrapperElement) {
    this.#rootWrapperElement = rootWrapperElement;

    this.create();
  }

  /**
   * Creates the pagination UI elements and sets up event listeners.
   */
  create() {
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

    this.#rootWrapperElement.appendChild(elements.fragment);
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
   * @param {number} state.firstVisibleRow The first visible row number.
   * @param {number} state.lastVisibleRow The last visible row number.
   * @param {number} state.totalRows The total number of rows.
   * @param {number[]} state.pageSizeList The list of available page sizes.
   * @param {number} state.pageSize The current page size.
   */
  updateState({
    currentPage,
    totalPages,
    firstVisibleRow,
    lastVisibleRow,
    totalRows,
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

    pageCounterSection.textContent = `${firstVisibleRow} - ${lastVisibleRow} of ${totalRows}`;
    pageNavLabel.textContent = `Page ${currentPage} of ${totalPages}`;
    pageSizeSelect.innerHTML = '';

    pageSizeList.forEach((pageSizeItem) => {
      const option = new Option(pageSizeItem, pageSizeItem);

      if (pageSizeItem === pageSize) {
        option.selected = true;
      }

      pageSizeSelect.add(option);
    });

    if (currentPage === 1) {
      first.setAttribute('disabled', true);
      prev.setAttribute('disabled', true);
    } else {
      first.removeAttribute('disabled');
      prev.removeAttribute('disabled');
    }

    if (currentPage === totalPages) {
      next.setAttribute('disabled', true);
      last.setAttribute('disabled', true);
    } else {
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
