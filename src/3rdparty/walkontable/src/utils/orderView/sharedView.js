import OrderView from './view';

export default class SharedOrderView extends OrderView {
  /**
   * The method results in merging external order view into the current order. This happens only for order views which
   * operate on the same root node.
   *
   * In the table, there is only one scenario when this happens. TR root element
   * has a common root node with cells order view and row headers order view. Both classes have to share
   * information about their order sizes to make proper diff calculations.
   *
   * @param {OrderView} orderView The order view to merging with. The view will be added at the beginning of the list.
   * @return {SharedOrderView}
   */
  prependView(orderView) {
    this.viewDiffer.prependSize(orderView.viewDiffer.getSizeSet());
    orderView.viewDiffer.appendSize(this.viewDiffer.getSizeSet());

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
   * @return {SharedOrderView}
   */
  appendView(orderView) {
    this.viewDiffer.appendSize(orderView.viewDiffer.getSizeSet());
    orderView.viewDiffer.prependSize(this.viewDiffer.getSizeSet());

    return this;
  }
}
