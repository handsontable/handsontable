import { isFunction } from './helpers/function';
import { hasClass } from './helpers/dom/element';

const IRRELEVANT_ARGUMENT = null;

/**
 * Manages the ARIA tags being added to the table structure.
 */
export class AriaManager {
  /**
   * The Handsontable instance.
   *
   * @type {Handsontable}
   */
  #hot = null;

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * List of the aria tags to be added to the table, categorized by the elements.
   *
   * If the aria tag value is dependent on an argument it should be declared as a function with the following arguments:
   * ```
   * (scope, rowInformation, columnInformation, element) => { return // value }
   *
   * // scope: Either 'row' or 'column'
   * // rowInformation: A row-related number appropriate for the context, for example: row index, row count, rowspan etc
   * // columnInformation: A column-related number appropriate for the context, for example: column index, column count,
   * colspan etc
   * // element: the HTML element being processed
   * ```
   *
   * @type {object}
   */
  /* eslint-enable jsdoc/require-description-complete-sentence */
  #ariaTags = {
    root: {
      role: 'treegrid',
      'aria-multiselectable': 'true',
      'aria-rowcount': (scope, rowcount) => rowcount,
      'aria-colcount': (scope, colcount) => colcount,
    },
    table: {
      role: 'presentation',
    },
    holder: {
      role: 'presentation',
    },
    hider: {
      role: 'presentation',
    },
    spreader: {
      role: 'presentation',
    },
    overlayRoot: {
      role: 'presentation',
    },
    thead: {
      role: 'rowgroup',
    },
    tbody: {
      role: 'rowgroup',
    },
    tr: {
      role: 'row',
      'aria-rowindex': (scope, rowIndex) => (rowIndex !== null ? rowIndex + 1 : null),
    },
    td: {
      role: 'gridcell',
      tabindex: -1,
      'aria-colindex': (scope, rowIndex, colIndex) => (colIndex !== null ? colIndex + 1 : colIndex),
    },
    th: {
      role: scope => `${scope}header`,
      scope: scope => scope,
      tabindex: -1,
      'aria-colindex': (scope, rowIndex, colIndex) => (scope === 'column' ? colIndex + 1 : null),
      'aria-hidden': (scope, rowIndex, colIndex, element) => (hasClass(element, 'hiddenHeader') || null),
    },
    colgroup: {
      'aria-hidden': 'true',
    },
    mergedElement: {
      'aria-rowspan': (scope, rowSpan) => rowSpan,
      'aria-colspan': (scope, rowSpan, colSpan) => colSpan,
    },
    theadCovered: {
      'aria-hidden': 'true',
    },
    misc: {
      role: 'presentation'
    },
    miscHidden: {
      'aria-hidden': true
    }
  }

  /**
   * `true` if the processed Handsontable instance has row headers enabled.
   *
   * @type {boolean|null}
   */
  #hasRowHeaders = null;

  /**
   * `true` if the processed Handsontable instance has row headers enabled.
   *
   * @type {boolean|null}
   */
  #hasColumnHeaders = null;

  constructor(hotInstance) {
    this.#hot = hotInstance;

    this.#hasRowHeaders = !!this.#hot.getSettings().rowHeaders;
    this.#hasColumnHeaders = !!this.#hot.getSettings().colHeaders;

    this.#hot.addHook('afterRenderer', (...args) => this.#onAfterRenderer(...args));
    this.#hot.addHook('afterInit', (...args) => this.#onAfterInit(...args));
    this.#hot.addHook('afterGetRowHeader', (...args) => this.#onAfterGetRowHeader(...args));
    this.#hot.addHook('afterGetColHeader', (...args) => this.#onAfterGetColHeader(...args));
  }

  /**
   * `afterRenderer` hook callback.
   *
   * @param {HTMLTableElement} TD The cell element.
   * @param {number} visualRowIndex The visual row index.
   * @param {number} visualColumnIndex The visual column index.
   */
  #onAfterRenderer(TD, visualRowIndex, visualColumnIndex) {
    // Don't add aria tags to the ghost table.
    if (TD.getAttribute('ghost-table')) {
      return;
    }

    const firstRenderedColumn = this.#hot.view._wt.wtTable.getFirstRenderedColumn();
    const cellMeta = this.#hot.getCellMeta(visualRowIndex, visualColumnIndex);

    // Add tags to the parent TR element only once per row
    if (
      !this.#hasRowHeaders &&
      (
        visualColumnIndex === firstRenderedColumn ||
        visualColumnIndex === 0
      )
    ) {
      this.#applyAriaInformation(
        this.#ariaTags.tr,
        TD.parentElement,
        IRRELEVANT_ARGUMENT,
        visualRowIndex,
        visualColumnIndex
      );
    }

    this.#applyAriaInformation(this.#ariaTags.td, TD, IRRELEVANT_ARGUMENT, visualRowIndex, visualColumnIndex);

    if (cellMeta.colspan || cellMeta.rowspan) {
      this.#applyAriaInformation(
        this.#ariaTags.mergedElement,
        TD,
        IRRELEVANT_ARGUMENT,
        cellMeta.rowspan,
        cellMeta.colspan
      );
    }
  }

  /**
   * `afterInit` hook callback.
   */
  #onAfterInit() {
    const elementsToGetAria = [
      'THEAD',
      'TBODY',
      'TABLE',
      'COLGROUP',
      'holder',
      'hider',
      'spreader',
      ['wtRootElement', 'overlayRoot']
    ];
    const overlays = this.#hot.view._wt.wtOverlays;
    const getOverlayElement = (overlayName, elementName) => {
      return overlayName !== 'main' ?
        this.#hot.view._wt.wtOverlays[overlayName].clone.wtTable[elementName] :
        overlays.wtTable[elementName];
    };
    const forAllOverlays = (callback) => {
      const overlayList = [
        'main',
        'topInlineStartCornerOverlay',
        'topOverlay',
        'inlineStartOverlay',
        'bottomInlineStartCornerOverlay',
        'bottomOverlay',
      ];
      const result = [];

      overlayList.forEach((overlayName) => {
        result.push(callback(overlayName));
      });

      return result;
    };

    this.#applyAriaInformation(
      this.#ariaTags.root,
      this.#hot.rootElement,
      IRRELEVANT_ARGUMENT,
      this.#hot.countRows(),
      this.#hot.countCols()
    );

    elementsToGetAria.forEach((element) => {
      let [overlayElementProp, ariaTagsEntry] = [null, null];

      if (Array.isArray(element)) {
        overlayElementProp = element[0];
        ariaTagsEntry = element[1];

      } else {
        overlayElementProp = element;
        ariaTagsEntry = element.toLowerCase();
      }

      forAllOverlays((overlayName) => {
        return [getOverlayElement(overlayName, overlayElementProp), overlayName];

      }).forEach(([domElement, overlayName]) => {

        // Add aria-hidden to the `THEAD` elements on the main overlay.
        if (overlayName === 'main' && overlayElementProp === 'THEAD') {
          this.#applyAriaInformation(this.#ariaTags.theadCovered, domElement);
        }

        this.#applyAriaInformation(this.#ariaTags[ariaTagsEntry], domElement);
      });
    });

    this.#hot.rootElement.querySelectorAll('.htFocusCatcher').forEach((focusCatcherElement) => {
      this.#applyAriaInformation(this.#ariaTags.misc, focusCatcherElement);
    });

    this.#hot.rootElement.querySelectorAll('.htBorders').forEach((htBordersElement) => {
      this.#applyAriaInformation(this.#ariaTags.miscHidden, htBordersElement);
    });
  }

  /**
   * `afterGetRowHeader` hook callback.
   *
   * @param {number} rowIndex Row index.
   * @param {HTMLElement} thElement The header's HTML element.
   */
  #onAfterGetRowHeader(rowIndex, thElement) {
    // Don't add aria tags to the ghost table.
    if (!thElement.parentElement) {
      return;
    }

    // Add tags to the parent TR element only once per row
    if (this.#hasRowHeaders) {
      this.#applyAriaInformation(
        this.#ariaTags.tr,
        thElement.parentElement,
        IRRELEVANT_ARGUMENT,
        rowIndex
      );
    }

    this.#applyAriaInformation(this.#ariaTags.th, thElement, 'row', rowIndex);
  }

  /**
   * `afterGetColHeader` hook callback.
   *
   * @param {number} colIndex Column index.
   * @param {HTMLElement} thElement The header's HTML element.
   */
  #onAfterGetColHeader(colIndex, thElement) {
    // Don't add aria tags to the ghost table.
    if (!thElement.parentElement) {
      return;
    }

    // Add tags to the parent TR element only once per row
    if (this.#hasColumnHeaders) {
      this.#applyAriaInformation(
        this.#ariaTags.th,
        thElement,
        'column',
        IRRELEVANT_ARGUMENT,
        colIndex
      );

      this.#applyAriaInformation(
        this.#ariaTags.tr,
        thElement.parentElement,
        'column',
        IRRELEVANT_ARGUMENT,
        colIndex
      );
    }
  }

  /**
   * Apply the aria tags based on the provided arguments.
   *
   * @param {object} tagSet Entry from the aria tags list appropriate to the processed element.
   * @param {HTMLElement} element The processed HTML element.
   * @param {string|null} [scope] Scope value - "row" or "col".
   * @param {number|null} [rowInfo] Either a row index, row count or rowspan, depending on the aria tag being added.
   * @param {number|null} [columnInfo] Either a column index, column count or colspan, depending on the aria tag being
   * added.
   */
  #applyAriaInformation(tagSet, element, scope, rowInfo, columnInfo) {
    Object.keys(tagSet).forEach((tag) => {
      const ariaValue = isFunction(tagSet[tag]) ? tagSet[tag](scope, rowInfo, columnInfo, element) : tagSet[tag];

      if (ariaValue !== null) {
        element.setAttribute(
          tag,
          ariaValue,
        );
      }
    });
  }
}
