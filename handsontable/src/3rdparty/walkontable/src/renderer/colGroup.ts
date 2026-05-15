import { BaseRenderer } from './_base';
import { warn } from '../../../../helpers/console';
import { toSingleLine } from '../../../../helpers/templateLiteralTag';
import { addClass } from '../../../../helpers/dom/element';
import { OrderView } from '../utils/orderView';

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
  /**
   * OrderView instance responsible for managing COL elements in the COLGROUP.
   *
   * @type {OrderView}
   */
  orderView;

  constructor(rootNode: HTMLElement) {
    super('COL', rootNode);

    this.orderView = new OrderView(
      rootNode,
      (sourceColumnIndex: number) => this.nodesPool.obtain(sourceColumnIndex),
      this.nodeType,
    );
  }

  /**
   * Renders the col group elements.
   */
  render() {
    const { columnsToRender, rowHeadersCount } = this.table;
    const allColumnsToRender = columnsToRender + rowHeadersCount;

    if (!performanceWarningAppeared && columnsToRender > 1000) {
      performanceWarningAppeared = true;
      warn(toSingleLine`Performance tip: Handsontable rendered more than 1000 visible columns.\x20
        Consider limiting the number of rendered columns by specifying the table width and/or\x20
        turning off the "renderAllColumns" option.`);
    }

    this.orderView
      .setSize(allColumnsToRender)
      .setOffset(0)
      .start();

    for (let visibleColumnIndex = 0; visibleColumnIndex < allColumnsToRender; visibleColumnIndex++) {
      this.orderView.render();

      const COL = this.orderView.getCurrentNode();

      if (visibleColumnIndex < rowHeadersCount) {
        const sourceColumnIndex = this.table.renderedColumnToSource(visibleColumnIndex);

        COL.style.width = `${this.table.columnUtils.getHeaderWidth(sourceColumnIndex)}px`;
      } else {
        const sourceColumnIndex = this.table.renderedColumnToSource(visibleColumnIndex - rowHeadersCount);

        COL.style.width = `${this.table.columnUtils.getWidth(sourceColumnIndex)}px`;
      }
    }

    this.orderView.end();

    const firstChild = this.rootNode.firstChild as HTMLElement;

    if (firstChild) {
      addClass(firstChild, 'rowHeader');
    }
  }
}
