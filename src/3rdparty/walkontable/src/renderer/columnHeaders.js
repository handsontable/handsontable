import { empty } from './../../../../helpers/dom/element';

export default class ColumnHeadersRenderer {
  constructor(rootNode) {
    this.rootNode = rootNode;
    this.table = null;
    this.renderedNodes = 0;
  }

  setTable(table) {
    this.table = table;
  }

  adjust() {
    const columnHeadersCount = this.table.columnHeadersCount;
    let TR = this.rootNode.firstChild;

    if (columnHeadersCount) {
      const columnCount = this.columnsToRender;

      for (let i = 0, len = columnHeadersCount; i < len; i++) {
        TR = this.rootNode.childNodes[i];

        if (!TR) {
          TR = document.createElement('tr');
          this.rootNode.appendChild(TR);
        }
        this.renderedNodes = TR.childNodes.length;

        while (this.renderedNodes < columnCount) {
          TR.appendChild(document.createElement('th'));
          this.renderedNodes += 1;
        }
        while (this.renderedNodes > columnCount) {
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
    const { columnHeaderCount, columnHeaderFunctions } = this.table;

    for (let i = 0; i < columnHeaderCount; i++) {
      const TR = this.rootNode.childNodes[i];

      for (let renderedColumnIndex = 0; renderedColumnIndex < columnCount; renderedColumnIndex++) {
        const sourceCol = this.table.renderedColumnToSource(renderedColumnIndex);
        const TH = TR.childNodes[renderedColumnIndex];

        TH.className = '';
        TH.removeAttribute('style');

        return columnHeaderFunctions[i](sourceCol, TH, i);
      }
    }
  }

  refresh() {

  }
}
