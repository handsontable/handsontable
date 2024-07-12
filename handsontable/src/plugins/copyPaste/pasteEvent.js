import ClipboardData from './clipboardData';

/**
 * @private
 */
export default class PasteEvent {
  constructor() {
    this.clipboardData = new ClipboardData();
  }
  preventDefault() {}
}
