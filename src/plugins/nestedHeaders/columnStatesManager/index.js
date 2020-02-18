import SettingsNormalizer from './settingsNormalizer';
import HeadersTree from './headersTree';

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

  generate() {

  }

  getLayersCount() {
    return this.settings.getLayersCount();
  }

  getColumnsCount() {
    return this.settings.getColumnsCount();
  }
}
