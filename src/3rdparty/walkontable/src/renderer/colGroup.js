import BaseRenderer from './_base';
import { addClass } from './../../../../helpers/dom/element';

export default class ColGroupRenderer extends BaseRenderer {
  constructor(rootNode) {
    super(null, rootNode); // NodePool is not implemented for this renderer yet
  }

  adjust() {
    const { columnsToRender, rowHeadersCount } = this.table;

    while (this.renderedNodes < columnsToRender + rowHeadersCount) {
      this.rootNode.appendChild(this.table.rootDocument.createElement('col'));
      this.renderedNodes += 1;
    }
    while (this.renderedNodes > columnsToRender + rowHeadersCount) {
      this.rootNode.removeChild(this.rootNode.lastChild);
      this.renderedNodes -= 1;
    }
  }

  render() {
    this.adjust();

    const { columnsToRender, rowHeadersCount } = this.table;

    // Render column nodes for row headers
    for (let visibleColumnIndex = 0; visibleColumnIndex < rowHeadersCount; visibleColumnIndex++) {
      const sourceColumnIndex = this.table.renderedColumnToSource(visibleColumnIndex);
      const width = this.table.columnUtils.getHeaderWidth(sourceColumnIndex);

      this.rootNode.childNodes[visibleColumnIndex].style.width = `${width}px`;
    }

    // Render column nodes for cells
    for (let visibleColumnIndex = 0; visibleColumnIndex < columnsToRender; visibleColumnIndex++) {
      const sourceColumnIndex = this.table.renderedColumnToSource(visibleColumnIndex);
      const width = this.table.columnUtils.getStretchedColumnWidth(sourceColumnIndex);

      this.rootNode.childNodes[visibleColumnIndex + rowHeadersCount].style.width = `${width}px`;
    }

    const firstChild = this.rootNode.firstChild;

    if (firstChild) {
      addClass(firstChild, 'rowHeader');
    }
  }
}
