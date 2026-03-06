import { OrderView } from './view';

/**
 * Executive model for TR root nodes.
 *
 * @class {SharedOrderView}
 */
export class SharedOrderView extends OrderView {
  /**
   * The method results in merging external order view into the current order. This happens only for order views which
   * operate on the same root node.
   *
   * In the table, there is only one scenario when this happens. TR root element
   * has a common root node with cells order view and row headers order view. Both classes have to share
   * information about their order sizes to make proper diff calculations.
   *
   * @param {OrderView} orderView The order view to merging with. The view will be added at the beginning of the list.
   * @returns {SharedOrderView}
   */
  prependView(orderView) {
    this.sizeSet.prepend(orderView.sizeSet);
    orderView.sizeSet.append(this.sizeSet);

    return this;
  }

  /**
   * The method results in merging external order view into the current order. This happens only for order views which
   * operate on the same root node.
   *
   * In the table, there is only one scenario when this happens. TR root element
   * has a common root node with cells order view and row headers order view. Both classes have to share
   * information about their order sizes to make proper diff calculations.
   *
   * @param {OrderView} orderView The order view to merging with. The view will be added at the end of the list.
   * @returns {SharedOrderView}
   */
  appendView(orderView) {
    this.sizeSet.append(orderView.sizeSet);
    orderView.sizeSet.prepend(this.sizeSet);

    return this;
  }
}
