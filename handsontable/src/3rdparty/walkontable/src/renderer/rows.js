import BaseRenderer from './_base';
import { warn } from './../../../../helpers/console';
import { toSingleLine } from './../../../../helpers/templateLiteralTag';
import { OrderView } from './../utils/orderView';
import { setAttribute } from '../../../../helpers/dom/element';
import {
  A11Y_ROW,
  A11Y_ROWGROUP,
  A11Y_ROWINDEX
} from '../../../../helpers/a11y';

let performanceWarningAppeared = false;

/**
 * Rows renderer responsible for managing (inserting, tracking, rendering) TR elements belongs to TBODY.
 *
 *   <tbody> (root node)
 *     ├ <tr>   \
 *     ├ <tr>    \
 *     ├ <tr>     - RowsRenderer
 *     ├ <tr>    /
 *     └ <tr>   /.
 *
 * @class {RowsRenderer}
 */
export default class RowsRenderer extends BaseRenderer {
  /**
   * Cache for OrderView classes connected to specified node.
   *
   * @type {WeakMap}
   */
  orderView;

  constructor(rootNode) {
    super('TR', rootNode);

    this.orderView = new OrderView(
      rootNode,
      sourceRowIndex => this.nodesPool.obtain(sourceRowIndex),
      this.nodeType,
    );
  }

  /**
   * Returns currently rendered node.
   *
   * @param {string} visualIndex Visual index of the rendered node (it always goeas from 0 to N).
   * @returns {HTMLTableRowElement}
   */
  getRenderedNode(visualIndex) {
    return this.orderView.getNode(visualIndex);
  }

  /**
   * Renders the cells.
   */
  render() {
    const { rowsToRender } = this.table;

    if (!performanceWarningAppeared && rowsToRender > 1000) {
      performanceWarningAppeared = true;
      warn(toSingleLine`Performance tip: Handsontable rendered more than 1000 visible rows.\x20
        Consider limiting the number of rendered rows by specifying the table height and/or\x20
        turning off the "renderAllRows" option.`);
    }

    if (this.table.isAriaEnabled()) {
      setAttribute(this.rootNode, [
        A11Y_ROWGROUP()
      ]);
    }

    this.orderView
      .setSize(rowsToRender)
      .setOffset(this.table.renderedRowToSource(0))
      .start();

    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
      this.orderView.render();

      const TR = this.orderView.getCurrentNode();
      const sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);

      if (this.table.isAriaEnabled()) {
        setAttribute(TR, [
          A11Y_ROW(),
          // `aria-rowindex` is incremented by both tbody and thead rows.
          A11Y_ROWINDEX(sourceRowIndex + (this.table.rowUtils?.dataAccessObject?.columnHeaders.length ?? 0) + 1),
        ]);
      }
    }

    this.orderView.end();
  }
}
