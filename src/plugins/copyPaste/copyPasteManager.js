
export function getInstance() {
  if (!instance) {
    instance = new CopyPasteManager();

  } else if (instance.hasBeenDestroyed()) {
    instance.init();
  }

  instance.refCounter++;

  return instance;
}

let instance = null;

class CopyPasteManager {
  constructor() {
    this.refCounter = 0;
    this.textareaWrapper = void 0;
    this.textarea = void 0;
    this.callbacks = [];
    this.init();
  }

  init() {
    this.createUI();
    this.mountEvents();

    this.refCounter++;
  }

  createUI() {
    if (this.uiIsCreated()) {
      return true;
    }

    this.textarea = document.createElement('textarea');
    this.textarea.id = 'CopyPasteDiv';
    this.textarea.tabIndex = -1;
    // this.textarea.style.position = 'fixed';
    // this.textarea.style.bottom = '100%';

    document.body.appendChild(this.textarea);
  }

  destroyUI() {

  }

  uiIsCreated() {
    return typeof this.textareaWrapper !== 'undefined' && typeof this.textarea !== 'undefined';
  }

  mountEvents() {
    let pasteWasCalled = false;

    this.textarea.addEventListener('copy', () => {

      console.log('CopyPasteManager: copy');

      this.runCallback();

    });
    this.textarea.addEventListener('cut', () => {
      console.log('CopyPasteManager: cut');

      this.runCallback();
    });

    let _that = this;
    this.textarea.addEventListener('paste', () => {
      console.log('CopyPasteManager: paste');

      pasteWasCalled = true;
    });

    this.textarea.addEventListener('input', () => {
      if (!pasteWasCalled) {
        return;
      }

      _that.runCallback(_that.getData());
    });
  }

  setData(data) {
    this.textarea.value = data;
  }

  getData() {
    return this.textarea.value;
  }

  focusTextarea() {
    this.textarea.focus();
    this.textarea.select();
  }

  isActive() {
    return this.textarea === document.activeElement;
  }

  action(callback, action, dataset, ranges, execCommand) {
    this.focusTextarea();

    this.callbacks.push([callback, action, dataset, ranges]);

    if (execCommand) {
      document.execCommand(execCommand);
    }
  }

  runCallback(args) {
    if (this.callbacks.length < 1) {
      return false;
    }

    let [callback, action, dataset, ranges] = this.callbacks.shift();

    if (typeof callback === 'function') {
      if (typeof action === 'undefined') {
        callback(args);
      } else {
        callback(action, dataset, ranges);
      }
    }
  }

  /**
   * Destroy instance
   */
  destroy() {
    if (!this.hasBeenDestroyed() && --this.refCounter === 0) {
      if (this.elDiv && this.elDiv.parentNode) {
        this.destroyUI();
      }
      this.unmountEvents();
    }
  }

  /**
   * Check if instance has been destroyed
   *
   * @returns {Boolean}
   */
  hasBeenDestroyed() {
    return !this.refCounter;
  }
}
