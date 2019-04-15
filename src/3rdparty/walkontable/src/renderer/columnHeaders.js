import { empty } from './../../../../helpers/dom/element';
import BaseRenderer from './_base';

export default class ColumnHeadersRenderer extends BaseRenderer {
  constructor(rootNode) {
    super(rootNode);
    this.renderedNodes = 0;
  }

  adjust() {
    const { columnHeadersCount, rowHeadersCount } = this.table;
    let TR = this.rootNode.firstChild;

    if (columnHeadersCount) {
      const { columnsToRender } = this.table;

      for (let i = 0, len = columnHeadersCount; i < len; i++) {
        TR = this.rootNode.childNodes[i];

        if (!TR) {
          TR = document.createElement('tr');
          this.rootNode.appendChild(TR);
        }
        this.renderedNodes = TR.childNodes.length;

        while (this.renderedNodes < columnsToRender + rowHeadersCount) {
        // while (this.renderedNodes < columnsToRender) {
          TR.appendChild(document.createElement('th'));
          this.renderedNodes += 1;
        }
        while (this.renderedNodes > columnsToRender + rowHeadersCount) {
        // while (this.renderedNodes > columnsToRender) {
          TR.removeChild(TR.lastChild);
          this.renderedNodes -= 1;
        }
      }
      const theadChildrenLength = this.rootNode.childNodes.length;

      if (theadChildrenLength > columnHeadersCount) {
        for (let i = columnHeadersCount; i < theadChildrenLength; i++) {
          this.rootNode.removeChild(this.rootNode.lastChild);
        }
      }
    } else if (TR) {
      empty(TR);
    }
  }

  render() {
    const { columnHeadersCount } = this.table;

    for (let visibleRowIndex = 0; visibleRowIndex < columnHeadersCount; visibleRowIndex++) {
      const { columnHeaderFunctions, columnsToRender, rowHeadersCount } = this.table;
      const TR = this.rootNode.childNodes[visibleRowIndex];

      for (let renderedColumnIndex = (-1) * rowHeadersCount; renderedColumnIndex < columnsToRender; renderedColumnIndex++) {
        const sourceColumnIndex = this.table.renderedColumnToSource(renderedColumnIndex);
        const TH = TR.childNodes[renderedColumnIndex + rowHeadersCount];

        TH.className = '';
        TH.removeAttribute('style');

        columnHeaderFunctions[visibleRowIndex](sourceColumnIndex, TH, visibleRowIndex);
      }

      // ???
      if (TR.firstChild) {
        TR.firstChild.style.height = `25px`;
      }
    }
  }
}
