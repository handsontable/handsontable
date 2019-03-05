import { warn } from './../../../../helpers/console';
import { toSingleLine } from './../../../../helpers/templateLiteralTag';
import OrderView from '../utils/orderView';
import NodesPool from '../utils/nodesPool';

let performanceWarningAppeared = false;

export default class RowsRenderer {
  constructor(rootNode) {
    this.rootNode = rootNode;
    this.table = null;
    this.nodesPool = new NodesPool('tr');
    this.orderView = new OrderView(rootNode, (sourceRowIndex) => {
      return this.nodesPool.obtain(sourceRowIndex);
    });
  }

  setTable(table) {
    this.table = table;
  }

  getRenderedNode(visualIndex) {
    return this.orderView.getNode(visualIndex);
  }

  hasStaleContent(visualIndex) {
    return this.orderView.hasStaleContent(visualIndex);
  }

  adjust() {
    // this.orderView.setSize(this.table.rowsToRender);
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
        warn(toSingleLine`Performance tip: Handsontable rendered more than 1000 visible rows. Consider limiting the number
          of rendered rows by specifying the table height and/or turning off the "renderAllRows" option.`);
      }
      if (visibleRowIndex === rowsToRender) {
        // We have as much rows as needed for this clone
        break;
      }

      this.orderView.render(sourceRowIndex);

      visibleRowIndex += 1;
      sourceRowIndex = this.table.renderedRowToSource(visibleRowIndex);
    }

    this.orderView.end();

    // @TODO This can be optimalized by reusing mounted elements insted of removing them.
    // while (this.orderView.renderedNodes > rowsToRender) {
      // this.rootNode.removeChild(this.rootNode.lastChild);
      // this.orderView.renderedNodes -= 1;
    // }
    //
  }

  refresh() {

  }
}
