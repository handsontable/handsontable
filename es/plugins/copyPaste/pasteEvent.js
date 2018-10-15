function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import ClipboardData from './clipboardData';

var PasteEvent = function PasteEvent() {
  _classCallCheck(this, PasteEvent);

  this.clipboardData = new ClipboardData();
};

export default PasteEvent;