import { warn } from './../../../../helpers/console';
import { toSingleLine } from './../../../../helpers/templateLiteralTag';
import { OrderView } from './../utils/orderView';
import BaseRenderer from './_base';
import { setAttributes } from '../../../../helpers/dom/element';

const ACCESSIBILITY_ATTR_ROWGROUP = ['role', 'rowgroup'];
const ACCESSIBILITY_ATTR_ROW = ['role', 'row'];
const ACCESSIBILITY_ATTR_ROWINDEX = ['aria-rowindex'];

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
   * Get a set of accessibility-related attributes to be added to the table.
   *
   * @param {number|null} rowIndex Row index or `null` if used for the root element.
   * @returns {Array[]}
   */
  #getAccessibilityAttributes(rowIndex) {
    if (!this.table.isAriaEnabled()) {
      return [];
    }

    // Root node
    if (rowIndex === null) {
      return [ACCESSIBILITY_ATTR_ROWGROUP];
    }

    return [
      ACCESSIBILITY_ATTR_ROW,
      [ACCESSIBILITY_ATTR_ROWINDEX[0], rowIndex + 1]
    ];
  }

  /**
   * Get the list of all attributes to be added to the row elements.
   *
   * @param {number} rowIndex The row index.
   * @returns {Array[]}
   */
  #getAttributes(rowIndex) {
    return [
      ...this.#getAccessibilityAttributes(rowIndex)
    ];
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
      warn(toSingleLine`Performance tip: Handsontable rendered more than 1000 visible rows. Consider limiting\x20
        the number of rendered rows by specifying the table height and/or turning off the "renderAllRows" option.`);
    }

    setAttributes(this.rootNode, this.#getAttributes(null));

    this.orderView
      .setSize(rowsToRender)
      .setOffset(this.table.renderedRowToSource(0))
      .start();

    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
      this.orderView.render();

      const TR = this.orderView.getCurrentNode();

      setAttributes(TR, this.#getAttributes(visibleRowIndex));
    }

    this.orderView.end();
  }
}
