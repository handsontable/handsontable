import BaseRenderer from './_base';
import { addClass } from './../../../../helpers/dom/element';

/**
 * Colgroup renderer responsible for managing (inserting, tracking, rendering) COL elements.
 *
 *   <colgroup> (root node)
 *     ├ <col>   \
 *     ├ <col>    \
 *     ├ <col>     - ColGroupRenderer
 *     ├ <col>    /
 *     └ <col>   /
 *
 * @class {ColGroupRenderer}
 */
export default class ColGroupRenderer extends BaseRenderer {
  constructor(rootNode) {
    super(null, rootNode); // NodePool is not implemented for this renderer yet
  }

  /**
   * Adjusts the number of the rendered elements.
   */
  adjust() {
    const { columnsToRender, rowHeadersCount } = this.table;
    const allColumnsToRender = columnsToRender + rowHeadersCount;

    while (this.renderedNodes < allColumnsToRender) {
      this.rootNode.appendChild(this.table.rootDocument.createElement('col'));
      this.renderedNodes += 1;
    }
    while (this.renderedNodes > allColumnsToRender) {
      this.rootNode.removeChild(this.rootNode.lastChild);
      this.renderedNodes -= 1;
    }
  }

  /**
   * Renders the col group elements.
   */
  render() {
    this.adjust();

    const { columnsToRender, rowHeadersCount } = this.table;

    // Render column nodes for row headers
    for (let visibleColumnIndex = 0; visibleColumnIndex < rowHeadersCount; visibleColumnIndex++) {
      const sourceColumnIndex = this.table.renderedColumnToSource(visibleColumnIndex);
      const width = this.table.columnUtils.getHeaderWidth(sourceColumnIndex);

      this.rootNode.childNodes[visibleColumnIndex].style.width = `${width}px`;
    }

    // Render column nodes for cells
    for (let visibleColumnIndex = 0; visibleColumnIndex < columnsToRender; visibleColumnIndex++) {
      const sourceColumnIndex = this.table.renderedColumnToSource(visibleColumnIndex);
      const width = this.table.columnUtils.getStretchedColumnWidth(sourceColumnIndex);

      this.rootNode.childNodes[visibleColumnIndex + rowHeadersCount].style.width = `${width}px`;
    }

    const firstChild = this.rootNode.firstChild;

    if (firstChild) {
      addClass(firstChild, 'rowHeader');
    }
  }
}
