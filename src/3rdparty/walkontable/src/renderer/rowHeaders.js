import OrderView from '../utils/orderView';
import NodesPool from '../utils/nodesPool';

export default class RowHeadersRenderer {
  constructor() {
    this.rootNode = null;
    this.table = null;
    this.nodesPool = new NodesPool('th');
    this.orderViews = new Map();
    this.sourceRowIndex = 0;
  }

  setTable(table) {
    this.table = table;
  }

  obtainOrderView(sourceIndex, rootNode = null) {
    let orderView;

    if (this.orderViews.has(sourceIndex)) {
      orderView = this.orderViews.get(sourceIndex);
    } else {
      orderView = new OrderView(rootNode, (sourceColumnIndex) => {
        return this.nodesPool.obtain(this.sourceRowIndex, sourceColumnIndex);
      });
      this.orderViews.set(sourceIndex, orderView);
    }

    return orderView;
  }

  adjust() {

  }

  render() {
    const { rowsToRender, columnsToRender, rows, rowHeaderFunctions, rowHeadersCount } = this.table;

    for (let visibleRowIndex = 0; rowHeadersCount && visibleRowIndex < rowsToRender; visibleRowIndex++) {
    // for (let visibleRowIndex = 0; visibleRowIndex < 4; visibleRowIndex++) {
      const sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);
      const TR = rows.getRenderedNode(visibleRowIndex);

      this.sourceRowIndex = sourceRowIndex;

      const orderView = this.obtainOrderView(sourceRowIndex, TR);

      orderView
        .setSize(rowHeadersCount)
        .setOffset(this.table.renderedColumnToSource(0))
        .start();

      for (let visibleColumnIndex = 0; visibleColumnIndex < rowHeadersCount; visibleColumnIndex++) {
        orderView.render();

        const TH = orderView.getCurrentNode();

        TH.className = '';
        TH.removeAttribute('style');

        rowHeaderFunctions[visibleColumnIndex](sourceRowIndex, TH, visibleColumnIndex);
      }

      orderView.end();
    }
  }

  refresh() {

  }
}
