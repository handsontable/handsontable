import type { HotInstance } from '../../../core/types';
import type { NestedRows } from '../nestedRows';
import { arrayEach } from '../../../helpers/array';
import { rangeEach } from '../../../helpers/number';
import { addClass, setAttribute, empty } from '../../../helpers/dom/element';
import BaseUI from './_base';
import {
  A11Y_EXPANDED,
  A11Y_HIDDEN,
  A11Y_LEVEL,
  A11Y_POSINSET,
  A11Y_SETSIZE,
} from '../../../helpers/a11y';
import { createIcon } from '../../../themes/engine/icons';
import type { RowSetPosition } from '../data/dataManager';

/**
 * The treegrid attributes this plugin writes on a row's `TR`. Walkontable recycles `TR` elements
 * across rows and never strips these, so every write has to cover all of them.
 */
const ROW_ARIA_ATTRIBUTES = ['aria-level', 'aria-posinset', 'aria-setsize'];

/**
 * Writes the row attributes that differ from what the `TR` already carries. The writer runs on
 * every row header paint, in every overlay copy, and an unchanged value written again still counts
 * as a DOM mutation that assistive technologies re-read, so a repaint of an unchanged row writes
 * nothing.
 *
 * @param {HTMLElement} TR The row element.
 * @param {Array} attributes The `[name, value]` pairs to write.
 */
function writeRowAttributes(TR: HTMLElement, attributes: [string, number][]) {
  attributes.forEach(([name, value]) => {
    const text = `${value}`;

    if (TR.getAttribute(name) !== text) {
      TR.setAttribute(name, text);
    }
  });
}

/**
 * Removes the row attributes the `TR` carries, and touches nothing when it carries none.
 *
 * @param {HTMLElement} TR The row element.
 */
function clearRowAttributes(TR: HTMLElement) {
  ROW_ARIA_ATTRIBUTES.forEach((name) => {
    if (TR.hasAttribute(name)) {
      TR.removeAttribute(name);
    }
  });
}

/**
 * Minimal interface for DataManager methods used by HeadersUI.
 */
interface NestedRowsDataManager {
  getDataObject(rowIndex: number): Record<string, unknown> | null;
  getRowLevel(rowIndex: number): number;
  getRowSetPosition(rowIndex: number): RowSetPosition | null;
  hasChildren(rowObject: Record<string, unknown>): boolean;
  cache: { levelCount: number };
}

/**
 * Minimal interface for CollapsingUI methods used by HeadersUI.
 */
interface NestedRowsCollapsingUI {
  areChildrenCollapsed(rowIndex: number): boolean;
}

/**
 * Class responsible for the UI in the Nested Rows' row headers.
 *
 * @private
 * @class HeadersUI
 * @augments BaseUI
 */
class HeadersUI extends BaseUI {
  /**
   * Reference to the DataManager instance connected with the Nested Rows plugin.
   *
   * @type {object}
   */
  declare dataManager: NestedRowsDataManager | null;
  /**
   * Reference to the CollapsingUI instance connected with the Nested Rows plugin.
   *
   * @type {object}
   */
  declare collapsingUI: NestedRowsCollapsingUI | null;
  /**
   * Cache for the row headers width.
   *
   * @type {null|number}
   */
  declare rowHeaderWidthCache: number | null;

  /**
   * CSS classes used in the row headers.
   *
   * @type {object}
   */
  static get CSS_CLASSES() {
    return {
      indicatorContainer: 'ht_nestingLevels',
      parent: 'ht_nestingParent',
      indicator: 'ht_nestingLevel',
      emptyIndicator: 'ht_nestingLevel_empty',
      button: 'ht_nestingButton',
      expandButton: 'ht_nestingExpand',
      collapseButton: 'ht_nestingCollapse'
    };
  }

  /**
   * Initializes the headers UI component and sets up the data manager reference used to determine nesting levels for each row header.
   */
  constructor(nestedRowsPlugin: NestedRows, hotInstance: HotInstance) {
    super(nestedRowsPlugin, hotInstance);
    /**
     * Reference to the DataManager instance connected with the Nested Rows plugin.
     *
     * @type {DataManager}
     */
    this.dataManager = this.plugin.dataManager as NestedRowsDataManager | null;
    // /**
    //  * Level cache array.
    //  *
    //  * @type {Array}
    //  */
    // this.levelCache = this.dataManager.cache.levels;
    /**
     * Reference to the CollapsingUI instance connected with the Nested Rows plugin.
     *
     * @type {CollapsingUI}
     */
    this.collapsingUI = this.plugin.collapsingUI as NestedRowsCollapsingUI | null;
    /**
     * Cache for the row headers width.
     *
     * @type {null|number}
     */
    this.rowHeaderWidthCache = null;
  }

  /**
   * Append nesting indicators and buttons to the row headers.
   *
   * @private
   * @param {number} row Row index.
   * @param {HTMLElement} TH TH 3element.
   */
  appendLevelIndicators(row: number, TH: HTMLTableCellElement) {
    const rowIndex = this.hot.toPhysicalRow(row);
    const rowObject = this.dataManager!.getDataObject(rowIndex);

    this.updateRowAttributes(TH, rowObject ? rowIndex : null);

    if (!rowObject) {
      return;
    }

    const rowLevel = this.dataManager!.getRowLevel(rowIndex);
    const innerDiv = TH.getElementsByTagName('DIV')[0];
    const innerSpan = innerDiv.querySelector('span.rowHeader');
    const ariaEnabled = this.hot.getSettings().ariaTags;

    this.removeLevelIndicators(TH);

    addClass(TH, HeadersUI.CSS_CLASSES.indicatorContainer);

    if (rowLevel) {
      const { rootDocument } = this.hot;
      const initialContent = innerSpan!.cloneNode(true);

      empty(innerDiv);

      rangeEach(0, rowLevel - 1, () => {
        const levelIndicator = rootDocument.createElement('SPAN');

        addClass(levelIndicator, HeadersUI.CSS_CLASSES.emptyIndicator);
        innerDiv.appendChild(levelIndicator);
      });

      innerDiv.appendChild(initialContent);
    }

    if (this.dataManager!.hasChildren(rowObject)) {
      const buttonsContainer = this.hot.rootDocument.createElement('DIV');

      if (ariaEnabled) {
        setAttribute(buttonsContainer, [
          A11Y_HIDDEN(),
        ]);
      }

      addClass(TH, HeadersUI.CSS_CLASSES.parent);

      const collapsed = this.collapsingUI!.areChildrenCollapsed(rowIndex);
      const stateButtonClass = collapsed ? HeadersUI.CSS_CLASSES.expandButton : HeadersUI.CSS_CLASSES.collapseButton;

      addClass(buttonsContainer, `${HeadersUI.CSS_CLASSES.button} ${stateButtonClass}`);

      if (ariaEnabled) {
        setAttribute(TH, [
          A11Y_EXPANDED(!collapsed)
        ]);
      }

      // `buttonsContainer` is a brand-new `DIV` created a few lines above (never reused across
      // draws - `removeLevelIndicators()` at the top of this method tears down the previous one),
      // so a plain `appendChild()` can never stack a second icon: each render starts
      // from an empty container. `collapsed` mirrors `CollapsibleColumns#onAfterGetColHeader`'s
      // `isCollapsed` branch - children collapsed (the `+`/expand button, `ht_nestingExpand`) gets
      // `collapseOn`, children expanded (the `-`/collapse button, `ht_nestingCollapse`) gets
      // `collapseOff`.
      buttonsContainer.appendChild(createIcon(this.hot, collapsed ? 'collapseOn' : 'collapseOff'));

      innerDiv.appendChild(buttonsContainer);
    }
  }

  /**
   * Writes the treegrid row attributes (`aria-level`, `aria-posinset` and `aria-setsize`) on the
   * `TR` that holds the row header.
   *
   * They go on the row because none of them is supported on a `rowheader`. `aria-expanded` stays on
   * the header alone: the WAI-ARIA treegrid pattern puts it on the row or on a cell of the row, and
   * the header is the cell that takes the keyboard focus, so a second copy on the row would only be
   * read twice. A row is painted in the master table and in every overlay that covers it, and each
   * copy gets the same attributes.
   *
   * @private
   * @param {HTMLTableCellElement} TH Row header element.
   * @param {number|null} physicalRow Physical row index, or `null` to only clear the attributes.
   */
  updateRowAttributes(TH: HTMLTableCellElement, physicalRow: number | null) {
    const TR = TH.parentElement;

    if (!TR || TR.tagName !== 'TR') {
      return;
    }

    const setPosition = physicalRow === null ? null : this.dataManager!.getRowSetPosition(physicalRow);

    if (!setPosition || !this.hot.getSettings().ariaTags) {
      clearRowAttributes(TR);

      return;
    }

    writeRowAttributes(TR, [
      A11Y_LEVEL(this.dataManager!.getRowLevel(physicalRow!) + 1),
      A11Y_POSINSET(setPosition.position),
      A11Y_SETSIZE(setPosition.setSize),
    ]);
  }

  /**
   * Removes the treegrid row attributes from every row this instance has rendered.
   *
   * Walks the `TR` elements, not the row headers: the attributes are written from
   * `afterGetRowHeader`, which stops firing once `rowHeaders` is switched off, and Walkontable keeps
   * recycling the `TR` elements that still carry them.
   *
   * @private
   */
  removeRenderedRowAttributes() {
    const rows = this.hot.rootElement.querySelectorAll<HTMLTableRowElement>('tbody tr');

    rows.forEach((TR) => {
      if (this.#isOwnRenderedElement(TR)) {
        clearRowAttributes(TR);
      }
    });
  }

  /**
   * Tells whether a rendered table element belongs to this instance: the nearest `handsontable`
   * ancestor above its table is this instance's root. `ht_master` and every `ht_clone_*` carry that
   * class, as does the root, while on a window-scrolled grid an overlay sits inside a rail element
   * that carries neither. That is what keeps a grid rendered inside a cell out of the walks.
   *
   * @param {HTMLElement} element An element inside a rendered table.
   * @returns {boolean}
   */
  #isOwnRenderedElement(element: HTMLElement): boolean {
    const table = element.closest('.handsontable');

    return table?.parentElement?.closest('.handsontable') === this.hot.rootElement;
  }

  /**
   * Removes the nesting-level indicator nodes (the collapse/expand button and the indent spacers)
   * appended to a row header's inner container. Only direct children of that container are taken,
   * which is where `appendLevelIndicators()` puts them; a deeper node with a matching class belongs
   * to someone else's markup.
   *
   * @private
   * @param {HTMLTableCellElement} TH TH element.
   */
  removeLevelIndicators(TH: HTMLTableCellElement) {
    const innerDiv = TH.getElementsByTagName('DIV')[0];

    if (!innerDiv) {
      return;
    }

    const previousIndicators = innerDiv.querySelectorAll(':scope > [class^="ht_nesting"]');

    arrayEach(previousIndicators, (elem) => {
      if (elem) {
        innerDiv.removeChild(elem as Node);
      }
    });
  }

  /**
   * Removes the nesting-level indicators from every row header this instance has rendered.
   *
   * Walks the DOM rather than resolving coordinates. A row header is painted in the master table and
   * in every overlay that covers its row - up to four copies for a frozen row - and `getCell()` can
   * name only two of them. The walk also has to work with no grid state at all: the plugin disables
   * itself from `beforeLoadData` on invalid data, which at construction fires before the view exists
   * and on a later `loadData()` fires after `replaceData()` destroyed the previous DataMap, so
   * anything that reaches `countRows()` - `getCell()` does, through the `fixedRowsTop` setting -
   * throws there.
   *
   * Only the headers of this instance are taken, never those of a grid rendered inside a cell.
   *
   * @private
   */
  removeRenderedLevelIndicators() {
    const rowHeaders = this.hot.rootElement.querySelectorAll<HTMLTableCellElement>('tbody th');

    rowHeaders.forEach((TH) => {
      if (this.#isOwnRenderedElement(TH)) {
        this.removeLevelIndicators(TH);
      }
    });
  }

  /**
   * Update the row header width according to number of levels in the dataset.
   *
   * @private
   * @param {number} deepestLevel Cached deepest level of nesting.
   * @param {boolean} [shouldRender=true] `false` only sizes the header, for a caller the Core is
   * about to render anyway - `updatePlugin()` runs on every `updateSettings()` carrying the
   * `nestedRows` key, which in React is every re-render, and a render here would double each one.
   */
  updateRowHeaderWidth(deepestLevel?: unknown, shouldRender = true) {
    let deepestLevelIndex = deepestLevel;

    if (!deepestLevelIndex) {
      deepestLevelIndex = this.dataManager!.cache.levelCount;
    }

    let completeVerticalPadding = 11;

    const verticalPadding = this.hot.stylesHandler.getCSSVariableValue('cell-horizontal-padding');

    completeVerticalPadding = (verticalPadding as number) * 2;

    this.rowHeaderWidthCache = Math.max(50, completeVerticalPadding + (10 * (deepestLevelIndex as number)) + 25);

    if (shouldRender) {
      this.hot.render();
    }
  }
}

export default HeadersUI;
