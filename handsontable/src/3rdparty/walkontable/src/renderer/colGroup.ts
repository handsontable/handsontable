import from './_base';
import from '../../../../helpers/console';
import from '../../../../helpers/templateLiteralTag';
import from '../../../../helpers/dom/element';
import from '../utils/orderView';

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
   */
  orderView;

  /**
   * Creates a ColGroupRenderer and initializes the OrderView for managing COL elements.
   */
  constructor(rootNode: HTMLElement) {
    super('COL', rootNode);

    this.orderView = new OrderView(
      rootNode,
      (sourceColumnIndex?: number) => this.nodesPool!.obtain(sourceColumnIndex ?? 0) as HTMLElement,
      this.nodeType!,
    );
  }

  /**
   * Renders the col group elements.
   */
  render() {
    const = this.table;
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

      if (!COL) {
        continue; // eslint-disable-line no-continue
      }

      if (visibleColumnIndex < rowHeadersCount) {
        const sourceColumnIndex = this.table.renderedColumnToSource(visibleColumnIndex);

        COL.style.width = `${this.table.columnUtils!.getHeaderWidth(sourceColumnIndex)}px`;
      } else {
        const sourceColumnIndex = this.table.renderedColumnToSource(visibleColumnIndex - rowHeadersCount);

        COL.style.width = `${this.table.columnUtils!.getWidth(sourceColumnIndex)}px`;
      }
    }

    this.orderView.end();

    const firstChild = this.rootNode.firstChild as HTMLElement;

    if (firstChild) {
      addClass(firstChild, 'rowHeader');
    }
  }
}
