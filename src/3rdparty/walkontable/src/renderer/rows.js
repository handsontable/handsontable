import { warn } from './../../../../helpers/console';
import { toSingleLine } from './../../../../helpers/templateLiteralTag';
import { OrderView } from './../utils/orderView';
import BaseRenderer from './_base';

let performanceWarningAppeared = false;

/**
 * Rows renderer responsible for managing (inserting, tracking, rendering) TR elements belongs to TBODY.
 *
 *   <tbody> (root node)
 *     ├ <tr>   \
 *     ├ <tr>    \
 *     ├ <tr>     - RowsRenderer
 *     ├ <tr>    /
 *     └ <tr>   /
 *
 * @class {RowsRenderer}
 */
export default class RowsRenderer extends BaseRenderer {
  constructor(rootNode) {
    super('TR', rootNode);
    /**
     * Cache for OrderView classes connected to specified node.
     *
     * @type {WeakMap}
     */
    this.orderView = new OrderView(
      rootNode,
      sourceRowIndex => this.nodesPool.obtain(sourceRowIndex),
      this.nodeType,
    );
  }

  /**
   * Returns currently rendered node.
   *
   * @param {String} visualIndex Visual index of the rendered node (it always goeas from 0 to N).
   * @return {HTMLTableRowElement}
   */
  getRenderedNode(visualIndex) {
    return this.orderView.getNode(visualIndex);
  }

  /**
   * Renders the cells.
   */
  render() {
    const { totalRows, rowsToRender } = this.table;
    let visibleRowIndex = 0;
    let sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);

    this.orderView
      .setSize(rowsToRender)
      .setOffset(sourceRowIndex)
      .start();

    while (sourceRowIndex < totalRows && sourceRowIndex >= 0) {
      if (!performanceWarningAppeared && visibleRowIndex > 1000) {
        performanceWarningAppeared = true;
        warn(toSingleLine`Performance tip: Handsontable rendered more than 1000 visible rows. Consider limiting the number\x20
          of rendered rows by specifying the table height and/or turning off the "renderAllRows" option.`);
      }
      if (visibleRowIndex === rowsToRender) {
        // We have as much rows as needed for this clone
        break;
      }

      this.orderView.render();

      visibleRowIndex += 1;
      sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);
    }

    this.orderView.end();
  }
}
