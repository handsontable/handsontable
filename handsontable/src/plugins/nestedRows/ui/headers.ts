import type { HotInstance } from '../../../core/types';
import type { NestedRows } from '../nestedRows';
import { arrayEach } from '../../../helpers/array';
import { rangeEach } from '../../../helpers/number';
import { addClass, setAttribute } from '../../../helpers/dom/element';
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
    const previousIndicators = innerDiv.querySelectorAll('[class^="ht_nesting"]');
    const ariaEnabled = this.hot.getSettings().ariaTags;

    arrayEach(previousIndicators, (elem) => {
      if (elem) {
        innerDiv.removeChild(elem as Node);
      }
    });

    addClass(TH, HeadersUI.CSS_CLASSES.indicatorContainer);

    if (rowLevel) {
      const { rootDocument } = this.hot;
      const initialContent = innerSpan.cloneNode(true);

      innerDiv.innerHTML = '';

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
   * Update the row header width according to number of levels in the dataset.
   *
   * @private
   * @param {number} deepestLevel Cached deepest level of nesting.
   */
  updateRowHeaderWidth(deepestLevel?: unknown) {
    let deepestLevelIndex = deepestLevel;

    if (!deepestLevelIndex) {
      deepestLevelIndex = this.dataManager!.cache.levelCount;
    }

    let completeVerticalPadding = 11;

    const verticalPadding = this.hot.stylesHandler.getCSSVariableValue('cell-horizontal-padding');

    completeVerticalPadding = (verticalPadding as number) * 2;

    this.rowHeaderWidthCache = Math.max(50, completeVerticalPadding + (10 * (deepestLevelIndex as number)) + 25);

    this.hot.render();
  }
}

export default HeadersUI;
