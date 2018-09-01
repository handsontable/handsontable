import { arrayEach } from 'handsontable/helpers/array';
import { rangeEach } from 'handsontable/helpers/number';
import { addClass } from 'handsontable/helpers/dom/element';
import BaseUI from './_base';

/**
 * Class responsible for the UI in the Nested Rows' row headers.
 *
 * @class HeadersUI
 * @util
 * @extends BaseUI
 */
class HeadersUI extends BaseUI {
  /**
   * CSS classes used in the row headers.
   *
   * @type {Object}
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

  constructor(nestedRowsPlugin, hotInstance) {
    super(nestedRowsPlugin, hotInstance);
    /**
     * Reference to the DataManager instance connected with the Nested Rows plugin.
     *
     * @type {DataManager}
     */
    this.dataManager = this.plugin.dataManager;
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
    this.collapsingUI = this.plugin.collapsingUI;
    /**
     * Cache for the row headers width.
     *
     * @type {null|Number}
     */
    this.rowHeaderWidthCache = null;
    /**
     * Reference to the TrimRows instance connected with the Nested Rows plugin.
     *
     * @type {TrimRows}
     */
    this.trimRowsPlugin = nestedRowsPlugin.trimRowsPlugin;
  }

  /**
   * Append nesting indicators and buttons to the row headers.
   *
   * @private
   * @param {Number} row Row index.
   * @param {HTMLElement} TH TH 3element.
   */
  appendLevelIndicators(row, TH) {
    const rowIndex = this.trimRowsPlugin.rowsMapper.getValueByIndex(row);
    const rowLevel = this.dataManager.getRowLevel(rowIndex);
    const rowObject = this.dataManager.getDataObject(rowIndex);
    const innerDiv = TH.getElementsByTagName('DIV')[0];
    const innerSpan = innerDiv.querySelector('span.rowHeader');
    const previousIndicators = innerDiv.querySelectorAll('[class^="ht_nesting"]');

    arrayEach(previousIndicators, (elem) => {
      if (elem) {
        innerDiv.removeChild(elem);
      }
    });

    addClass(TH, HeadersUI.CSS_CLASSES.indicatorContainer);

    if (rowLevel) {
      const initialContent = innerSpan.cloneNode(true);
      innerDiv.innerHTML = '';

      rangeEach(0, rowLevel - 1, () => {
        const levelIndicator = document.createElement('SPAN');
        addClass(levelIndicator, HeadersUI.CSS_CLASSES.emptyIndicator);
        innerDiv.appendChild(levelIndicator);
      });

      innerDiv.appendChild(initialContent);
    }

    if (this.dataManager.hasChildren(rowObject)) {
      const buttonsContainer = document.createElement('DIV');
      addClass(TH, HeadersUI.CSS_CLASSES.parent);

      if (this.collapsingUI.areChildrenCollapsed(rowIndex)) {
        addClass(buttonsContainer, `${HeadersUI.CSS_CLASSES.button} ${HeadersUI.CSS_CLASSES.expandButton}`);

      } else {
        addClass(buttonsContainer, `${HeadersUI.CSS_CLASSES.button} ${HeadersUI.CSS_CLASSES.collapseButton}`);
      }

      innerDiv.appendChild(buttonsContainer);
    }
  }

  /**
   * Update the row header width according to number of levels in the dataset.
   *
   * @private
   * @param {Number} deepestLevel Cached deepest level of nesting.
   */
  updateRowHeaderWidth(deepestLevel) {
    let deepestLevelIndex = deepestLevel;

    if (!deepestLevelIndex) {
      deepestLevelIndex = this.dataManager.cache.levelCount;
    }

    this.rowHeaderWidthCache = Math.max(50, 11 + (10 * deepestLevelIndex) + 25);

    this.hot.render();
  }
}

export default HeadersUI;
