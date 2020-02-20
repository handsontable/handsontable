import SettingsNormalizer from './settingsNormalizer';
import HeadersTree from './headersTree';
import { colspanGenerator } from './colspanGenerator';

export class ColumnStatesManager {
  constructor() {
    this.settings = null;
    this.headersTree = null;
    this.state = null;
  }

  setState(nestedHeadersSettings) {
    this.settings = new SettingsNormalizer(nestedHeadersSettings);
    this.headersTree = new HeadersTree(this.settings);

    try {
      this.headersTree.buildTree();
    } catch (ex) {
      console.log(ex);
    }
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

  clear() {

  }
}
