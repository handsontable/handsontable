import { warn } from './../../../../helpers/console';
import { toSingleLine } from './../../../../helpers/templateLiteralTag';
import { OrderView } from './../utils/orderView';
import BaseRenderer from './_base';

// TODO: After moving class to one instance check if this warning works!
let performanceWarningAppeared = false;

export default class RowsRenderer extends BaseRenderer {
  constructor(rootNode) {
    super('TR', rootNode);
    this.orderView = new OrderView(rootNode, (sourceRowIndex) => {
      return this.nodesPool.obtain(sourceRowIndex);
    });
  }

  getRenderedNode(visualIndex) {
    return this.orderView.getNode(visualIndex);
  }

  hasStaleContent(visualIndex) {
    return this.orderView.hasStaleContent(visualIndex);
  }

  render() {
    const { totalRows, rowsToRender } = this.table;
    let visibleRowIndex = 0;
    let sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);

    this.orderView
      .setSize(rowsToRender)
      .setOffset(sourceRowIndex)
      .start();

    while (sourceRowIndex < totalRows && sourceRowIndex >= 0) {
      if (!performanceWarningAppeared && visibleRowIndex > 1000) {
        performanceWarningAppeared = true;
        warn(toSingleLine`Performance tip: Handsontable rendered more than 1000 visible rows. Consider limiting the number\x20
          of rendered rows by specifying the table height and/or turning off the "renderAllRows" option.`);
      }
      if (visibleRowIndex === rowsToRender) {
        // We have as much rows as needed for this clone
        break;
      }

      this.orderView.render();

      visibleRowIndex += 1;
      sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);
    }

    this.orderView.end();
  }
}
