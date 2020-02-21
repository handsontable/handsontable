import SourceSettings from './sourceSettings';
import HeadersTree from './headersTree';
import { colspanGenerator } from './colspanGenerator';

export class ColumnStatesManager {
  constructor() {
    this.settings = new SourceSettings();
    this.headersTree = null;
  }

  setState(nestedHeadersSettings) {
    this.settings.setData(nestedHeadersSettings);
    this.headersTree = new HeadersTree(this.settings);

    try {
      this.headersTree.buildTree();
    } catch (ex) {
      console.log(ex);
      this.headersTree.clear();
    }
  }

  getColumnSettings(columnIndex, headerLevel) {
    const rootNode = this.headersTree.getRootByColumn(columnIndex);

    if (rootNode === null) {
      return null;
    }

    rootNode.walk((node) => {
      const { headerLevel: nodeHeaderLevel } = node;


    });
  }

  generateColspanMatrix() {
    return colspanGenerator(this.headersTree.getRoots());
  }

  getLayersCount() {
    return this.settings.getLayersCount();
  }

  getColumnsCount() {
    return this.settings.getColumnsCount();
  }
}
