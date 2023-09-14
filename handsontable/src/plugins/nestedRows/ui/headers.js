import { arrayEach } from '../../../helpers/array';
import { rangeEach } from '../../../helpers/number';
import { addClass, setAttributes } from '../../../helpers/dom/element';
import BaseUI from './_base';

const ACCESSIBILITY_ATTR_EXPANDED = ['aria-expanded', 'true'];
const ACCESSIBILITY_ATTR_COLLAPSED = ['aria-expanded', 'false'];
const ACCESSIBILITY_ATTR_HIDDEN = ['aria-hidden', 'true'];

/**
 * Class responsible for the UI in the Nested Rows' row headers.
 *
 * @private
 * @class HeadersUI
 * @augments BaseUI
 */
class HeadersUI extends BaseUI {
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
     * @type {null|number}
     */
    this.rowHeaderWidthCache = null;
  }

  /**
   * Get a set of accessibility-related attributes to be added to the table.
   *
   * @param {object} settings Object containing additional settings used to determine how the attributes should be
   * constructed.
   * @param {string} settings.elementIdentifier String identifying the element to be processed.
   * @param {number} [settings.elementState] The state of the elemenet to be processed.
   * @returns {Array[]}
   */
  #getAccessibilityAttributes(settings) {
    if (!this.hot.getSettings().ariaTags) {
      return [];
    }

    const {
      elementIdentifier,
      elementState,
    } = settings;
    const attributeList = [];

    switch (elementIdentifier) {
      case 'button':
        attributeList.push(ACCESSIBILITY_ATTR_HIDDEN);

        break;
      case 'header':
        if (elementState === 'collapsed') {
          attributeList.push(ACCESSIBILITY_ATTR_COLLAPSED);

        } else if (elementState === 'expanded') {
          attributeList.push(ACCESSIBILITY_ATTR_EXPANDED);
        }

        break;

      default:
    }

    return attributeList;
  }

  /**
   * Get the list of all attributes to be added to the row headers.
   *
   * @param {object} settings Object containing additional settings used to determine how the attributes should be
   * constructed.
   * @param {string} settings.elementIdentifier String identifying the element to be processed.
   * @param {number} [settings.elementState] The state of the elemenet to be processed.
   * @returns {Array[]}
   */
  #getAttributes(settings) {
    return [
      ...this.#getAccessibilityAttributes(settings)
    ];
  }

  /**
   * Append nesting indicators and buttons to the row headers.
   *
   * @private
   * @param {number} row Row index.
   * @param {HTMLElement} TH TH 3element.
   */
  appendLevelIndicators(row, TH) {
    const rowIndex = this.hot.toPhysicalRow(row);
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

    if (this.dataManager.hasChildren(rowObject)) {
      const buttonsContainer = this.hot.rootDocument.createElement('DIV');

      setAttributes(buttonsContainer, this.#getAttributes({
        elementIdentifier: 'button'
      }));

      addClass(TH, HeadersUI.CSS_CLASSES.parent);

      if (this.collapsingUI.areChildrenCollapsed(rowIndex)) {
        addClass(buttonsContainer, `${HeadersUI.CSS_CLASSES.button} ${HeadersUI.CSS_CLASSES.expandButton}`);

        setAttributes(TH, this.#getAttributes({
          elementIdentifier: 'header',
          elementState: 'collapsed',
        }));

      } else {
        addClass(buttonsContainer, `${HeadersUI.CSS_CLASSES.button} ${HeadersUI.CSS_CLASSES.collapseButton}`);

        setAttributes(TH, this.#getAttributes({
          elementIdentifier: 'header',
          elementState: 'expanded',
        }));
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
