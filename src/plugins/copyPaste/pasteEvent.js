import ClipboardData from './clipboardData';

export default class PasteEvent {
  constructor() {
    this.clipboardData = new ClipboardData();
  }
}
