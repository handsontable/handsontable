import {
  empty,
  setAttribute
} from './../../../../helpers/dom/element';
import BaseRenderer from './_base';

const ACCESSIBILITY_ATTR_COLUMNHEADER = ['role', 'columnheader'];
const ACCESSIBILITY_ATTR_PRESENTATION = ['role', 'presentation'];
const ACCESSIBILITY_ATTR_ROW = ['role', 'row'];
const ACCESSIBILITY_ATTR_SCOPE_COL = ['scope', 'col'];
const ACCESSIBILITY_ATTR_COLINDEX = ['aria-colindex'];
const ACCESSIBILITY_ATTR_ROWINDEX = ['aria-rowindex'];
const ACCESSIBILITY_ATTR_TABINDEX = ['tabindex', '-1'];

/**
 * Column headers renderer responsible for managing (inserting, tracking, rendering) TR and TH elements.
 *
 *   <thead> (root node)
 *     ├ <tr>   \
 *     ├ <tr>    \
 *     ├ <tr>     - ColumnHeadersRenderer
 *     ├ <tr>    /
 *     └ <tr>   /.
 *
 * @class {ColumnHeadersRenderer}
 */
export default class ColumnHeadersRenderer extends BaseRenderer {
  constructor(rootNode) {
    super(null, rootNode); // NodePool is not implemented for this renderer yet
  }

  /**
   * Get a set of accessibility-related attributes to be added to the table.
   *
   * @param {object} settings Object containing additional settings used to determine how the attributes should be
   * constructed.
   * @param {string} settings.elementIdentifier String identifying the element to be processed.
   * @param {number} [settings.rowIndex] The row index.
   * @param {number} [settings.columnIndex] The column index.
   * @returns {Array[]}
   */
  #getAccessibilityAttributes(settings) {
    if (!this.table.isAriaEnabled()) {
      return [];
    }

    const {
      elementIdentifier,
      rowIndex,
      columnIndex
    } = settings;
    const attributesList = [];

    switch (elementIdentifier) {
      case 'rowgroup':
        attributesList.push(ACCESSIBILITY_ATTR_PRESENTATION);

        break;
      case 'row':
        attributesList.push(...[
          ACCESSIBILITY_ATTR_ROW,
          [ACCESSIBILITY_ATTR_ROWINDEX[0], rowIndex + 1]
        ]);

        break;
      case 'cell':
        attributesList.push(...[
          // `aria-colindex` is incremented by both tbody and thead rows.
          [ACCESSIBILITY_ATTR_COLINDEX[0], columnIndex + 1 + this.table.rowHeadersCount],
          ACCESSIBILITY_ATTR_TABINDEX,
        ]);

        if (columnIndex < 0) {
          attributesList.push(ACCESSIBILITY_ATTR_PRESENTATION);

        } else {
          attributesList.push(...[
            ACCESSIBILITY_ATTR_COLUMNHEADER,
            ACCESSIBILITY_ATTR_SCOPE_COL,
          ]);
        }

        break;
      default:
    }

    return attributesList;
  }

  /**
   * Get the list of all attributes to be added to the column headers.
   *
   * @param {object} settings Object containing additional settings used to determine how the attributes should be
   * constructed.
   * @param {string} settings.elementIdentifier String identifying the element to be processed.
   * @param {number} [settings.rowIndex] The row index.
   * @param {number} [settings.columnIndex] The column index.
   * @returns {Array[]}
   */
  #getAttributes(settings) {
    return [
      ...this.#getAccessibilityAttributes(settings)
    ];
  }

  /**
   * Adjusts the number of the rendered elements.
   */
  adjust() {
    const { columnHeadersCount, rowHeadersCount } = this.table;
    let TR = this.rootNode.firstChild;

    if (columnHeadersCount) {
      const { columnsToRender } = this.table;
      const allColumnsToRender = columnsToRender + rowHeadersCount;

      for (let i = 0, len = columnHeadersCount; i < len; i++) {
        TR = this.rootNode.childNodes[i];

        if (!TR) {
          TR = this.table.rootDocument.createElement('tr');
          this.rootNode.appendChild(TR);
        }
        this.renderedNodes = TR.childNodes.length;

        while (this.renderedNodes < allColumnsToRender) {
          TR.appendChild(this.table.rootDocument.createElement('th'));
          this.renderedNodes += 1;
        }
        while (this.renderedNodes > allColumnsToRender) {
          TR.removeChild(TR.lastChild);
          this.renderedNodes -= 1;
        }
      }
      const theadChildrenLength = this.rootNode.childNodes.length;

      if (theadChildrenLength > columnHeadersCount) {
        for (let i = columnHeadersCount; i < theadChildrenLength; i++) {
          this.rootNode.removeChild(this.rootNode.lastChild);
        }
      }
    } else if (TR) {
      empty(TR);
    }
  }

  /**
   * Renders the TH elements.
   */
  render() {
    const { columnHeadersCount } = this.table;

    setAttribute(this.rootNode, this.#getAttributes({
      elementIdentifier: 'rowgroup'
    }));

    for (let rowHeaderIndex = 0; rowHeaderIndex < columnHeadersCount; rowHeaderIndex += 1) {
      const { columnHeaderFunctions, columnsToRender, rowHeadersCount } = this.table;
      const TR = this.rootNode.childNodes[rowHeaderIndex];

      setAttribute(TR, this.#getAttributes({
        elementIdentifier: 'row',
        rowIndex: rowHeaderIndex
      }));

      for (let renderedColumnIndex = (-1) * rowHeadersCount; renderedColumnIndex < columnsToRender; renderedColumnIndex += 1) { // eslint-disable-line max-len
        const sourceColumnIndex = this.table.renderedColumnToSource(renderedColumnIndex);
        const TH = TR.childNodes[renderedColumnIndex + rowHeadersCount];

        TH.className = '';
        TH.removeAttribute('style');

        setAttribute(TH, this.#getAttributes({
          elementIdentifier: 'cell',
          columnIndex: renderedColumnIndex,
        }));

        columnHeaderFunctions[rowHeaderIndex](sourceColumnIndex, TH, rowHeaderIndex);
      }
    }
  }
}
