
import * as dom from './../../dom.js';
import {eventManager as eventManagerObject} from './../../eventManager.js';
import {registerPlugin} from './../../plugins.js';
import BasePlugin from './../base.js';

/**
 * @class ContextMenuCopyPaste
 */
class ContextMenuCopyPaste extends BasePlugin {

  /**
   * Concept of Dependency Injection
   */
  static inject() {
    return ['eventManager', 'dom'];
  }

  /**
   * @param {Object} hotInstance
   */
  constructor(hotInstance) {
    super(hotInstance);

    this.metadata = {
      name: 'ContextMenuCopyPaste',
      dependencies: [
        'ContextMenu'
      ]
    };
    this.swfPath = null;
    this.hotParent = null;
    this.zeroClipboardInstance = null;
    this.outsideClickDeselectsCache = null;
    this.eventHandlers = [];

    this.hot.addHook('afterRender', () => this.setupZeroClipboard());
    this.hot.addHook('afterInit', () => this.afterInit());
    this.hot.addHook('afterContextMenuDefaultOptions', options => this.addToContextMenu(options));
  }

  /**
   *
   */
  afterInit() {
    if (!this.hot.getSettings().contextMenuCopyPaste) {
      return;

    } else if (typeof this.hot.getSettings().contextMenuCopyPaste == 'object') {
      this.swfPath = this.hot.getSettings().contextMenuCopyPaste.swfPath;
    }

    if (typeof ZeroClipboard === 'undefined') {
      throw new Error("To be able to use the Copy/Paste feature from the context menu, you need to manualy include ZeroClipboard.js file to your website.");
    }
    try {
      /* jshint -W031 */
      new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
    } catch(exception) {
      if ('undefined' == typeof navigator.mimeTypes['application/x-shockwave-flash']) {
        throw new Error("To be able to use the Copy/Paste feature from the context menu, your browser needs to have Flash Plugin installed.");
      }
    }
    this.prepareZeroClipboard();
  }

  /**
   * Prepare ZeroClipboard config values
   */
  prepareZeroClipboard() {
    if (this.swfPath) {
      ZeroClipboard.config({
        swfPath: this.swfPath
      });
    }
  }

  /**
   * Get value to copy
   *
   * @returns {String}
   */
  getCopyValue() {
    this.hotParent.copyPaste.setCopyableText();

    return this.hotParent.copyPaste.copyPasteInstance.elTextarea.value;
  }

  /**
   * Add Copy and Paste functionality to context menu
   *
   * @param defaultOptions
   */
  addToContextMenu (defaultOptions) {
    if (!this.hot.getSettings().contextMenuCopyPaste) {
      return;
    }
    defaultOptions.items.unshift({
        key: 'copy',
        name: 'Copy'
      }, {
        key: 'paste',
        name: 'Paste',
        callback: function () {
          this.copyPaste.triggerPaste();
        }
      },
      Handsontable.ContextMenu.SEPARATOR
    );
  }

  /**
   *
   */
  setupZeroClipboard() {
    if (!dom.hasClass(this.hot.rootElement, 'htContextMenu')) {
      return;
    }
    var data = this.hot.getData();

    // find position of 'copy' option
    for (var i = 0, ilen = data.length; i < ilen; i++) {
      /*jshint -W083 */
      if (data[i].key === 'copy') {
        this.zeroClipboardInstance = new ZeroClipboard(this.hot.getCell(i, 0));

        this.zeroClipboardInstance.off();
        this.zeroClipboardInstance.on('copy', (event) => {
          var clipboard = event.clipboardData;

          clipboard.setData('text/plain', this.getCopyValue());
          this.hotParent.getSettings().outsideClickDeselects = this.outsideClickDeselectsCache;
        });

        this.bindEvents();
        break;
      }
    }
  }

  removeCurrentClass() {
    var hadClass = this.hot.rootElement.querySelector('td.current');

    if (hadClass) {
      dom.removeClass(hadClass, 'current');
    }
    this.outsideClickDeselectsCache = this.hotParent.getSettings().outsideClickDeselects;
    this.hotParent.getSettings().outsideClickDeselects = false;
  }

  removeZeroClipboardClass() {
    var hadClass = this.hot.rootElement.querySelector('td.zeroclipboard-is-hover');

    if (hadClass) {
      dom.removeClass(hadClass, 'zeroclipboard-is-hover');
    }
    this.hotParent.getSettings().outsideClickDeselects = this.outsideClickDeselectsCache;
  }

  /**
   * Add all necessary event listeners
   */
  bindEvents() {
    var eventManager;

    if (!this.hotParent) {
      return;
    }
    eventManager = eventManagerObject(this.hotParent);

    this.unbindEvents();
    this.eventHandlers.push(eventManager.addEventListener(document, 'mouseenter', () => this.removeCurrentClass()));
    this.eventHandlers.push(eventManager.addEventListener(document, 'mouseleave', () => this.removeZeroClipboardClass()));
  }

  /**
   * Remove all event listeners
   */
  unbindEvents() {
    if (!this.hotParent) {
      return;
    }
    this.eventHandlers.forEach((handler) => handler());
    this.eventHandlers = [];
  }

  /**
   * Destroy plugin
   */
  destroy() {
    this.unbindEvents();
    super();
  }
}

export default ContextMenuCopyPaste;

registerPlugin('contextMenuCopyPaste', ContextMenuCopyPaste);
