import ClipboardData from './clipboardData';

/**
 * @private
 */
export default class PasteEvent {
  declare clipboardData: ClipboardData;
  constructor() {
    this.clipboardData = new ClipboardData();
  }
  preventDefault() { // intentionally empty
  }
  composedPath(): unknown[] {
    return [];
  }
}
