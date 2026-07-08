import { BaseRenderer } from './_base';
import { OrderView } from '../utils/orderView';
import { setAttribute } from '../../../../helpers/dom/element';
import {
  A11Y_ROW,
  A11Y_ROWGROUP,
  A11Y_ROWINDEX,
} from '../../../../helpers/a11y';

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

    if (this.table.isAriaEnabled()) {
      setAttribute(this.rootNode, [
        A11Y_ROWGROUP()
      ]);
    }

    this.orderView
      .setSize(columnHeadersCount)
      .setOffset(0)
      .start();

    for (let visibleRowIndex = 0; visibleRowIndex < columnHeadersCount; visibleRowIndex++) {
      this.orderView.render();

      const TR = this.orderView.getCurrentNode();

      if (TR && this.table.isAriaEnabled()) {
        setAttribute(TR, [
          A11Y_ROW(),
          A11Y_ROWINDEX(visibleRowIndex + 1),
        ]);
      }
    }

    this.orderView.end();
  }
}
