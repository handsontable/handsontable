import { SharedOrderView } from './../utils/orderView';
import BaseRenderer from './_base';
import { setAttribute } from '../../../../helpers/dom/element';

const ACCESSIBILITY_ATTR_ROWHEADER = ['role', 'rowheader'];
const ACCESSIBILITY_ATTR_COLINDEX = ['aria-colindex'];
const ACCESSIBILITY_ATTR_SCOPE_ROW = ['scope', 'row'];
const ACCESSIBILITY_ATTR_TABINDEX = ['tabindex', '-1'];

/**
 * Row headers renderer responsible for managing (inserting, tracking, rendering) TR elements belongs to TR.
 *
 *   <tr> (root node)
 *     ├ <th>   --- RowHeadersRenderer
 *     ├ <td>   \
 *     ├ <td>    \
 *     ├ <td>     - CellsRenderer
 *     ├ <td>    /
 *     └ <td>   /.
 *
 * @class {CellsRenderer}
 */
export default class RowHeadersRenderer extends BaseRenderer {
  constructor() {
    super('TH');
    /**
     * Cache for OrderView classes connected to specified node.
     *
     * @type {WeakMap}
     */
    this.orderViews = new WeakMap();
    /**
     * Row index which specifies the row position of the processed row header.
     *
     * @type {number}
     */
    this.sourceRowIndex = 0;
  }

  /**
   * Get a set of accessibility-related attributes to be added to the table.
   *
   * @param {object} settings Object containing additional settings used to determine how the attributes should be
   * constructed.
   * @param {string} settings.elementIdentifier String identifying the element to be processed.
   * @param {number} [settings.columnIndex] The column index.
   * @returns {Array[]}
   */
  #getAccessibilityAttributes(settings) {
    if (!this.table.isAriaEnabled()) {
      return [];
    }

    const {
      elementIdentifier,
      columnIndex,
    } = settings;

    switch (elementIdentifier) {
      case 'rowheader':
        return [
          ACCESSIBILITY_ATTR_ROWHEADER,
          ACCESSIBILITY_ATTR_SCOPE_ROW,
          [ACCESSIBILITY_ATTR_COLINDEX[0], columnIndex + 1],
          ACCESSIBILITY_ATTR_TABINDEX
        ];

      default:
        return [];
    }
  }

  /**
   * Get the list of all attributes to be added to the row headers.
   *
   * @param {object} settings Object containing additional settings used to determine how the attributes should be
   * constructed.
   * @param {string} settings.elementIdentifier String identifying the element to be processed.
   * @param {number} [settings.columnIndex] The column index.
   * @returns {Array[]}
   */
  #getAttributes(settings) {
    return [
      ...this.#getAccessibilityAttributes(settings)
    ];
  }

  /**
   * Obtains the instance of the SharedOrderView class which is responsible for rendering the nodes to the root node.
   *
   * @param {HTMLTableRowElement} rootNode The TR element, which is root element for row headers (TH).
   * @returns {SharedOrderView}
   */
  obtainOrderView(rootNode) {
    let orderView;

    if (this.orderViews.has(rootNode)) {
      orderView = this.orderViews.get(rootNode);
    } else {
      orderView = new SharedOrderView(
        rootNode,
        sourceColumnIndex => this.nodesPool.obtain(this.sourceRowIndex, sourceColumnIndex),
        this.nodeType,
      );
      this.orderViews.set(rootNode, orderView);
    }

    return orderView;
  }

  /**
   * Renders the cells.
   */
  render() {
    const { rowsToRender, rowHeaderFunctions, rowHeadersCount, rows, cells } = this.table;

    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
      const sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);
      const TR = rows.getRenderedNode(visibleRowIndex);

      this.sourceRowIndex = sourceRowIndex;

      const orderView = this.obtainOrderView(TR);
      const cellsView = cells.obtainOrderView(TR);

      orderView
        .appendView(cellsView)
        .setSize(rowHeadersCount)
        .setOffset(this.table.renderedColumnToSource(0))
        .start();

      for (let visibleColumnIndex = 0; visibleColumnIndex < rowHeadersCount; visibleColumnIndex++) {
        orderView.render();

        const TH = orderView.getCurrentNode();

        TH.className = '';
        TH.removeAttribute('style');

        setAttribute(TH, this.#getAttributes({
          elementIdentifier: 'rowheader',
          columnIndex: visibleColumnIndex
        }));

        rowHeaderFunctions[visibleColumnIndex](sourceRowIndex, TH, visibleColumnIndex);
      }

      orderView.end();
    }
  }
}
