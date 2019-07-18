import { empty } from './../../../../helpers/dom/element';
import BaseRenderer from './_base';

/**
 * Column headers renderer responsible for managing (inserting, tracking, rendering) TR and TH elements.
 *
 *   <thead> (root node)
 *     ├ <tr>   \
 *     ├ <tr>    \
 *     ├ <tr>     - ColumnHeadersRenderer
 *     ├ <tr>    /
 *     └ <tr>   /
 *
 * @class {ColumnHeadersRenderer}
 */
export default class ColumnHeadersRenderer extends BaseRenderer {
  constructor(rootNode) {
    super(null, rootNode); // NodePool is not implemented for this renderer yet
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

    for (let visibleRowIndex = 0; visibleRowIndex < columnHeadersCount; visibleRowIndex++) {
      const { columnHeaderFunctions, columnsToRender, rowHeadersCount } = this.table;
      const TR = this.rootNode.childNodes[visibleRowIndex];

      for (let renderedColumnIndex = (-1) * rowHeadersCount; renderedColumnIndex < columnsToRender; renderedColumnIndex++) {
        const sourceColumnIndex = this.table.renderedColumnToSource(renderedColumnIndex);
        const TH = TR.childNodes[renderedColumnIndex + rowHeadersCount];

        TH.className = '';
        TH.removeAttribute('style');

        columnHeaderFunctions[visibleRowIndex](sourceColumnIndex, TH, visibleRowIndex);
      }
    }
  }
}
