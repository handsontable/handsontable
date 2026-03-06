import { BaseRenderer } from './_base';
import { warn } from '../../../../helpers/console';
import { toSingleLine } from '../../../../helpers/templateLiteralTag';
import { addClass } from '../../../../helpers/dom/element';

let performanceWarningAppeared = false;

/**
 * Colgroup renderer responsible for managing (inserting, tracking, rendering) COL elements.
 *
 *   <colgroup> (root node)
 *     ├ <col>   \
 *     ├ <col>    \
 *     ├ <col>     - ColGroupRenderer
 *     ├ <col>    /
 *     └ <col>   /.
 *
 * @class {ColGroupRenderer}
 */
export class ColGroupRenderer extends BaseRenderer {
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

    if (!performanceWarningAppeared && columnsToRender > 1000) {
      performanceWarningAppeared = true;
      warn(toSingleLine`Performance tip: Handsontable rendered more than 1000 visible columns.\x20
        Consider limiting the number of rendered columns by specifying the table width and/or\x20
        turning off the "renderAllColumns" option.`);
    }

    // Render column nodes for row headers
    for (let visibleColumnIndex = 0; visibleColumnIndex < rowHeadersCount; visibleColumnIndex++) {
      const sourceColumnIndex = this.table.renderedColumnToSource(visibleColumnIndex);
      const width = this.table.columnUtils.getHeaderWidth(sourceColumnIndex);

      this.rootNode.childNodes[visibleColumnIndex].style.width = `${width}px`;
    }

    // Render column nodes for cells
    for (let visibleColumnIndex = 0; visibleColumnIndex < columnsToRender; visibleColumnIndex++) {
      const sourceColumnIndex = this.table.renderedColumnToSource(visibleColumnIndex);
      const width = this.table.columnUtils.getWidth(sourceColumnIndex);

      this.rootNode.childNodes[visibleColumnIndex + rowHeadersCount].style.width = `${width}px`;
    }

    const firstChild = this.rootNode.firstChild;

    if (firstChild) {
      addClass(firstChild, 'rowHeader');
    }
  }
}
