export default class BaseRenderer {
  constructor(rootNode = null) {
    this.rootNode = rootNode;
    this.table = null;
  }

  setTable(table) {
    this.table = table;
  }

  adjust() { }
  render() { }
}
