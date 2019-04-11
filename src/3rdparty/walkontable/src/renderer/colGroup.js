export default class ColGroupRenderer {
  constructor(rootNode, columnUtils) {
    this.rootNode = rootNode;
    this.columnUtils = columnUtils;
    this.table = null;
    this.renderedNodes = 0;
  }

  setTable(table) {
    this.table = table;
  }

  adjust() {
    const { columnsToRender, rowHeadersCount } = this.table;

    while (this.renderedNodes < columnsToRender + rowHeadersCount) {
      this.rootNode.appendChild(document.createElement('col'));
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

    for (let renderedColumnIndex = 0; renderedColumnIndex < rowHeadersCount; renderedColumnIndex++) {
      const sourceColumn = this.table.renderedColumnToSource(renderedColumnIndex);
      const width = this.columnUtils.getHeaderWidth(sourceColumn);

      this.rootNode.childNodes[renderedColumnIndex].style.width = `${width}px`;
    }

    for (let renderedColumnIndex = rowHeadersCount; renderedColumnIndex < columnsToRender; renderedColumnIndex++) {
      const sourceColumn = this.table.renderedColumnToSource(renderedColumnIndex);
      const width = this.columnUtils.getWidth(sourceColumn);

      this.rootNode.childNodes[renderedColumnIndex].style.width = `${width}px`;
    }
  }

  refresh() {

  }
}
