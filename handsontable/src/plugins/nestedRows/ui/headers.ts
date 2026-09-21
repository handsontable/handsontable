import type { HotInstance } from '../../../core/types';
import type { NestedRows } from '../nestedRows';
import { arrayEach } from '../../../helpers/array';
import { rangeEach } from '../../../helpers/number';
import { addClass, setAttribute, empty } from '../../../helpers/dom/element';
import BaseUI from './_base';
import { A11Y_EXPANDED, A11Y_HIDDEN } from '../../../helpers/a11y';

/**
 * Minimal interface for DataManager methods used by HeadersUI.
 */
interface NestedRowsDataManager {
  getDataObject(rowIndex: number): Record<string, unknown> | null;
  getRowLevel(rowIndex: number): number;
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

      if (this.collapsingUI!.areChildrenCollapsed(rowIndex)) {
        addClass(buttonsContainer, `${HeadersUI.CSS_CLASSES.button} ${HeadersUI.CSS_CLASSES.expandButton}`);

        if (ariaEnabled) {
          setAttribute(TH, [
            A11Y_EXPANDED(false)
          ]);
        }

      } else {
        addClass(buttonsContainer, `${HeadersUI.CSS_CLASSES.button} ${HeadersUI.CSS_CLASSES.collapseButton}`);

        if (ariaEnabled) {
          setAttribute(TH, [
            A11Y_EXPANDED(true)
          ]);
        }
      }

      innerDiv.appendChild(buttonsContainer);
    }
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
   * A header is taken when the nearest `handsontable` ancestor above its table is this instance's
   * root: `ht_master` and every `ht_clone_*` carry that class, as does the root, while on a
   * window-scrolled grid an overlay sits inside a rail element that carries neither. That is what
   * keeps a grid rendered inside a cell out of the walk.
   *
   * @private
   */
  removeRenderedLevelIndicators() {
    const { rootElement } = this.hot;
    const rowHeaders = rootElement.querySelectorAll<HTMLTableCellElement>('tbody th');

    rowHeaders.forEach((TH) => {
      const table = TH.closest('.handsontable');

      if (table?.parentElement?.closest('.handsontable') === rootElement) {
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
