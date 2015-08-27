
import {removeClass} from './../../helpers/dom/element';
import {eventManager as eventManagerObject} from './../../eventManager';
import {registerPlugin} from './../../plugins';
import BasePlugin from './../_base';
import ZeroClipboard from 'zeroclipboard';

/**
 * @plugin ContextMenuCopyPaste
 * @dependencies ContextMenu zeroclipboard
 */
class ContextMenuCopyPaste extends BasePlugin {
  /**
   * @param {Object} hotInstance
   */
  constructor(hotInstance) {
    super(hotInstance);

    this.swfPath = null;
    this.hotContextMenu = null;
    this.outsideClickDeselectsCache = null;

    this.hot.addHook('afterContextMenuShow', (htContextMenu) => this.setupZeroClipboard(htContextMenu));
    this.hot.addHook('afterInit', () => this.afterInit());
    this.hot.addHook('afterContextMenuDefaultOptions', (options) => this.addToContextMenu(options));
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
      console.error('To be able to use the Copy/Paste feature from the context menu, you need to manualy include ZeroClipboard.js file to your website.');
    }
    try {
      /* jshint -W031 */
      new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
    } catch(exception) {
      if ('undefined' == typeof navigator.mimeTypes['application/x-shockwave-flash']) {
        console.error('To be able to use the Copy/Paste feature from the context menu, your browser needs to have Flash Plugin installed.');
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
    this.hot.copyPaste.setCopyableText();

    return this.hot.copyPaste.copyPasteInstance.elTextarea.value;
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
      Handsontable.plugins.ContextMenu.SEPARATOR
    );
  }

  /**
   * @param {Object} hotContextMenu
   */
  setupZeroClipboard(hotContextMenu) {
    var data, zeroClipboardInstance;

    if (!this.hot.getSettings().contextMenuCopyPaste) {
      return;
    }
    this.hotContextMenu = hotContextMenu;
    data = this.hotContextMenu.getData();

    // find position of 'copy' option
    for (var i = 0, ilen = data.length; i < ilen; i++) {
      /*jshint -W083 */
      if (data[i].key === 'copy') {
        zeroClipboardInstance = new ZeroClipboard(this.hotContextMenu.getCell(i, 0));

        zeroClipboardInstance.off();
        zeroClipboardInstance.on('copy', (event) => {
          var clipboard = event.clipboardData;

          clipboard.setData('text/plain', this.getCopyValue());
          this.hot.getSettings().outsideClickDeselects = this.outsideClickDeselectsCache;
        });

        this.bindEvents();
        break;
      }
    }
  }

  removeCurrentClass() {
    if (this.hotContextMenu.rootElement) {
      var element = this.hotContextMenu.rootElement.querySelector('td.current');

      if ( element ) {
        removeClass(element, 'current');
      }
    }
    this.outsideClickDeselectsCache = this.hot.getSettings().outsideClickDeselects;
    this.hot.getSettings().outsideClickDeselects = false;
  }

  removeZeroClipboardClass() {
    if (this.hotContextMenu.rootElement) {
      var element = this.hotContextMenu.rootElement.querySelector('td.zeroclipboard-is-hover');

      if ( element ) {
        removeClass(element, 'zeroclipboard-is-hover');
      }
    }
    this.hot.getSettings().outsideClickDeselects = this.outsideClickDeselectsCache;
  }

  /**
   * Add all necessary event listeners
   */
  bindEvents() {
    var eventManager = eventManagerObject(this.hotContextMenu);

    eventManager.addEventListener(document, 'mouseenter', () => this.removeCurrentClass());
    eventManager.addEventListener(document, 'mouseleave', () => this.removeZeroClipboardClass());
  }
}

export {ContextMenuCopyPaste};

registerPlugin('contextMenuCopyPaste', ContextMenuCopyPaste);
