import {
  addClass,
  hasClass,
} from './../../../../helpers/dom/element';
import OrderView from '../utils/orderView';
import NodesPool from '../utils/nodesPool';
import BaseRenderer from './_base';

export default class CellsRenderer extends BaseRenderer {
  constructor() {
    super();
    this.nodesPool = new NodesPool('td');
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
    const { rowsToRender, columnsToRender, rows } = this.table;

    for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
      const sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);
      const hasStaleRowContent = rows.hasStaleContent(sourceRowIndex);
      const TR = rows.getRenderedNode(visibleRowIndex);

      this.sourceRowIndex = sourceRowIndex;

      const orderView = this.obtainOrderView(sourceRowIndex, TR);

      // @TODO(perf-tip): For cells other than "visual 0" generating diff leads can be reused. New order (leads)
      // shoule be shared between previous orderView.
      orderView
        .setSize(columnsToRender)
        .setOffset(this.table.renderedColumnToSource(0))
        .start();

      for (let visibleColumnIndex = 0; visibleColumnIndex < columnsToRender; visibleColumnIndex++) {
        const sourceColumnIndex = this.table.renderedColumnToSource(visibleColumnIndex);

        orderView.render();

        const TD = orderView.getCurrentNode();
        const hasStaleContent = hasStaleRowContent || orderView.hasStaleContent(sourceColumnIndex);

        if (hasStaleContent) {
          if (!hasClass(TD, 'hide')) { // Workaround for hidden columns plugin
            TD.className = '';
          }
          TD.removeAttribute('style');
        }

        this.table.cellRenderer(sourceRowIndex, sourceColumnIndex, TD, hasStaleContent);
      }

      orderView.end();
    }
  }
}
