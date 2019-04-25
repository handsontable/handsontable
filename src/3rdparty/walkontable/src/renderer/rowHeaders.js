import OrderView from '../utils/orderView';
import NodesPool from '../utils/nodesPool';
import BaseRenderer from './_base';

export default class RowHeadersRenderer extends BaseRenderer {
  constructor() {
    super();
    this.nodesPool = new NodesPool('th');
    this.orderViews = new Map();
    this.sourceRowIndex = 0;
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

  render() {
    const { rowsToRender, rows, rowHeaderFunctions, rowHeadersCount } = this.table;

    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
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
}
