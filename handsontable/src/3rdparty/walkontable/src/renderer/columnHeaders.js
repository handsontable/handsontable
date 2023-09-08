import {
  empty,
  setAttributes
} from './../../../../helpers/dom/element';
import BaseRenderer from './_base';

const ACCESSIBILITY_ATTR_ROWGROUP = ['role', 'rowgroup'];
const ACCESSIBILITY_ATTR_HIDDEN = ['aria-hidden', 'true'];
const ACCESSIBILITY_ATTR_COLUMNHEADER = ['role', 'columnheader'];
const ACCESSIBILITY_ATTR_SCOPE_COL = ['scope', 'col'];
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
   * @param {number|null} columnIndex The column index or `null` if used for the root element.
   * @returns {Array[]}
   */
  #getAccessibilityAttributes(columnIndex) {
    if (!this.table.isAriaEnabled()) {
      return [];
    }

    // Root node
    if (columnIndex === null) {
      return [ACCESSIBILITY_ATTR_ROWGROUP];
    }

    const attributesList = [ACCESSIBILITY_ATTR_TABINDEX];

    if (columnIndex < 0) {
      attributesList.push(ACCESSIBILITY_ATTR_HIDDEN);

    } else {
      attributesList.push(...[
        ACCESSIBILITY_ATTR_COLUMNHEADER,
        ACCESSIBILITY_ATTR_SCOPE_COL
      ]);
    }

    return attributesList;
  }

  /**
   * Get the list of all attributes to be added to the column headers.
   *
   * @param {number} columnIndex The column index.
   * @returns {Array[]}
   */
  #getAttributes(columnIndex) {
    return [
      ...this.#getAccessibilityAttributes(columnIndex)
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

    setAttributes(this.rootNode, this.#getAccessibilityAttributes(null));

    for (let rowHeaderIndex = 0; rowHeaderIndex < columnHeadersCount; rowHeaderIndex += 1) {
      const { columnHeaderFunctions, columnsToRender, rowHeadersCount } = this.table;
      const TR = this.rootNode.childNodes[rowHeaderIndex];

      for (let renderedColumnIndex = (-1) * rowHeadersCount; renderedColumnIndex < columnsToRender; renderedColumnIndex += 1) { // eslint-disable-line max-len
        const sourceColumnIndex = this.table.renderedColumnToSource(renderedColumnIndex);
        const TH = TR.childNodes[renderedColumnIndex + rowHeadersCount];

        TH.className = '';
        TH.removeAttribute('style');

        setAttributes(TH, this.#getAttributes(renderedColumnIndex));

        columnHeaderFunctions[rowHeaderIndex](sourceColumnIndex, TH, rowHeaderIndex);
      }
    }
  }
}
