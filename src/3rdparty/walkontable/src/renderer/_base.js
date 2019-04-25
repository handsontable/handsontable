export default class BaseRenderer {
  constructor(rootNode = null) {
    this.rootNode = rootNode;
    this.table = null;
    this.renderedNodes = 0;
  }

  setTable(table) {
    this.table = table;
  }

  adjust() { }
  render() { }
}
