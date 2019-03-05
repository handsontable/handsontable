import {
  addClass,
  hasClass,
} from './../../../../helpers/dom/element';
import OrderView from '../utils/orderView';
import NodesPool from '../utils/nodesPool';

export default class CellsRenderer {
  constructor() {
    this.rootNode = null;
    this.table = null;
    this.nodesPool = new NodesPool('td');
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
    const { rowsToRender, columnsToRender, rows } = this.table;
    let orderViewSherer;

    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
    // for (let visibleRowIndex = 0; visibleRowIndex < 1; visibleRowIndex++) {
      const sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);
      const hasStaleRowContent = rows.hasStaleContent(sourceRowIndex);
      const TR = rows.getRenderedNode(visibleRowIndex);

      this.sourceRowIndex = sourceRowIndex;

      const orderView = this.obtainOrderView(sourceRowIndex, TR);

      // if (visibleRowIndex === 0) {
      //   orderView.markAsPatternSharer();
      //   orderViewSherer = orderView;
      // } else {
      //   orderViewSherer.sharePatternWith(orderView);
      // }

      orderView
        .setSize(columnsToRender)
        .setOffset(this.table.renderedColumnToSource(0))
        .start();

      for (let visibleColIndex = 0; visibleColIndex < columnsToRender; visibleColIndex++) {
        const sourceColIndex = this.table.renderedColumnToSource(visibleColIndex);

        orderView.render(sourceColIndex);

        const TD = orderView.getCurrentNode();
        const hasStaleContent = hasStaleRowContent || orderView.hasStaleContent(sourceColIndex);
        // const hasStaleContent = true;

        if (hasStaleContent) {
          if (!hasClass(TD, 'hide')) {
            TD.className = '';
          }
          TD.removeAttribute('style');
        }

        this.table.cellRenderer(sourceRowIndex, sourceColIndex, TD, hasStaleContent);
      }

      orderView.end();
    }
  }

  refresh() {

  }
}
