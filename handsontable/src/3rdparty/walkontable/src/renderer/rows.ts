import { BaseRenderer } from './_base';
import { warn } from '../../../../helpers/console';
import { toSingleLine } from '../../../../helpers/templateLiteralTag';
import { OrderView } from '../utils/orderView';
import {
  addClass,
  hasClass,
  removeClass,
  setAttribute
} from '../../../../helpers/dom/element';
import {
  A11Y_ROW,
  A11Y_ROWGROUP,
  A11Y_ROWINDEX
} from '../../../../helpers/a11y';
import { RowsRendererInterface, TableRendererInterface } from './interfaces';

const ROW_CLASSNAMES = {
  rowEven: 'ht__row_even',
  rowOdd: 'ht__row_odd',
};
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
export class RowsRenderer extends BaseRenderer implements RowsRendererInterface {
  /**
   * Cache for OrderView classes connected to specified node.
   *
   * @type {WeakMap}
   */
  orderView: OrderView;
  table: TableRendererInterface;

  constructor(rootNode: HTMLTableSectionElement) {
    super('TR', rootNode);

    this.orderView = new OrderView(
      rootNode,
      sourceRowIndex => this.nodesPool?.obtain(sourceRowIndex) || document.createElement('TR'),
    );
  }

  /**
   * Returns currently rendered node.
   *
   * @param {string} visualIndex Visual index of the rendered node (it always goeas from 0 to N).
   * @returns {HTMLTableRowElement}
   */
  getRenderedNode(visualIndex: number): HTMLTableRowElement {
    return this.orderView.getNode(visualIndex) as HTMLTableRowElement;
  }

  /**
   * Checks if the the row is marked as "stale" and has to be rerendered.
   *
   * @param {number} visualIndex Visual index of the rendered node (it always goeas from 0 to N).
   * @returns {boolean}
   */
  hasStaleContent(visualIndex: number): boolean {
    return this.orderView.hasStaleContent?.(visualIndex) || false;
  }

  /**
   * Get the source index for a rendered row
   * 
   * @param {number} rowIndex Row index.
   * @returns {number}
   */
  renderedRowToSource(rowIndex: number): number {
    return this.table.renderedRowToSource(rowIndex);
  }

  /**
   * Adjusts the number of rendered nodes.
   */
  adjust(): void {
    // This method is implemented in the parent class but overridden with empty implementation.
  }

  /**
   * Renders the cells.
   */
  render(): void {
    if (!this.table) {
      return;
    }

    const rowsToRender = this.table.rowsToRender;

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
      if (!TR) {
        continue;
      }

      const sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);

      if (this.table.isAriaEnabled()) {
        setAttribute(TR, [
          A11Y_ROW(),
          // `aria-rowindex` is incremented by both tbody and thead rows.
          A11Y_ROWINDEX(sourceRowIndex + (this.table.rowUtils?.dataAccessObject?.columnHeaders?.length ?? 0) + 1),
        ]);
      }

      if ((sourceRowIndex + 1) % 2 === 0) {
        if (!hasClass(TR, ROW_CLASSNAMES.rowEven)) {
          removeClass(TR, ROW_CLASSNAMES.rowOdd);
          addClass(TR, ROW_CLASSNAMES.rowEven);
        }
      } else if (!hasClass(TR, ROW_CLASSNAMES.rowOdd)) {
        removeClass(TR, ROW_CLASSNAMES.rowEven);
        addClass(TR, ROW_CLASSNAMES.rowOdd);
      }
    }

    this.orderView.end();
  }
}
