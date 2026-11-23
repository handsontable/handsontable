import { BaseRenderer } from './_base';
import { OrderView } from '../utils/orderView';
import { setAttribute } from '../../../../helpers/dom/element';
import {
  A11Y_ROW,
  A11Y_ROWINDEX,
} from '../../../../helpers/a11y';
import { dropRowGroupRole, dropRowRole, giveRowGroupRole } from './ariaAttributes';

/**
 * Column header rows renderer responsible for managing (inserting, tracking, rendering) TR elements belongs to THEAD.
 *
 *   <thead> (root node)
 *     ├ <tr>   \
 *     ├ <tr>    \
 *     ├ <tr>     - ColumnHeaderRowsRenderer
 *     ├ <tr>    /
 *     └ <tr>   /.
 *
 * @class {ColumnHeaderRowsRenderer}
 */
export class ColumnHeaderRowsRenderer extends BaseRenderer {
  /**
   * OrderView instance responsible for managing TR elements in the THEAD.
   *
   * @type {OrderView}
   */
  orderView: OrderView;

  /**
   * Creates a new ColumnHeaderRowsRenderer instance.
   *
   * @param {HTMLElement} rootNode - The root HTML element (THEAD) to manage TR elements within.
   */
  constructor(rootNode: HTMLElement) {
    super('TR', rootNode);

    this.orderView = new OrderView(
      rootNode,
      () => this.nodesPool!.obtain() as HTMLElement,
      this.nodeType!,
    );
  }

  /**
   * Returns currently rendered node.
   *
   * @param {number} visualIndex Visual index of the rendered node (it always goes from 0 to N).
   * @returns {HTMLTableRowElement}
   */
  getRenderedNode(visualIndex: number): HTMLElement | null {
    return this.orderView.getNode(visualIndex);
  }

  /**
   * Renders the TR elements.
   */
  render() {
    const { columnHeadersCount } = this.table;

    // As in the body (`RowsRenderer`): a head row is a `row` only while it holds a cell.
    const rowsHoldCells = this.table.columnsToRender + this.table.rowHeadersCount > 0;

    if (this.table.isAriaEnabled()) {
      if (columnHeadersCount > 0 && rowsHoldCells) {
        giveRowGroupRole(this.rootNode);
      } else {
        dropRowGroupRole(this.rootNode);
      }
    }

    this.orderView
      .setSize(columnHeadersCount)
      .setOffset(0)
      .start();

    for (let visibleRowIndex = 0; visibleRowIndex < columnHeadersCount; visibleRowIndex++) {
      this.orderView.render();

      const TR = this.orderView.getCurrentNode();

      if (TR && this.table.isAriaEnabled() && rowsHoldCells) {
        setAttribute(TR, [
          A11Y_ROW(),
          A11Y_ROWINDEX(visibleRowIndex + 1),
        ]);

      } else if (TR && this.table.isAriaEnabled()) {
        dropRowRole(TR);
      }
    }

    this.orderView.end();
  }
}
