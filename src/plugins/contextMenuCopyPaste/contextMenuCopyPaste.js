
import {removeClass} from './../../helpers/dom/element';
import {arrayEach} from './../../helpers/array';
import {EventManager} from './../../eventManager';
import {registerPlugin} from './../../plugins';
import BasePlugin from './../_base';
import ZeroClipboard from 'zeroclipboard';

/**
 * @description
 * This plugin adds a copy/paste functionality to the context menu. Due to browser restrictions, it uses ZeroClipboard to allow
 * copying data with a click.
 *
 * @plugin ContextMenuCopyPaste
 * @dependencies ContextMenu zeroclipboard
 */
class ContextMenuCopyPaste extends BasePlugin {
  /**
   * @param {Object} hotInstance
   */
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Instance of {@link EventManager}.
     *
     * @type {EventManager}
     */
    this.eventManager = new EventManager(this);
    /**
     * Path to swf file which is necessary for ZeroClipboard.
     *
     * @type {String}
     */
    this.swfPath = null;
    /**
     * outsideClickDeselectsCache setting cache.
     *
     * @type {Boolean}
     */
    this.outsideClickDeselectsCache = null;
  }

  /**
   * Check if the plugin is enabled in the handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return this.hot.getSettings().contextMenuCopyPaste;
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }
    if (typeof this.hot.getSettings().contextMenuCopyPaste === 'object') {
      this.swfPath = this.hot.getSettings().contextMenuCopyPaste.swfPath;
    }
    if (typeof ZeroClipboard === 'undefined') {
      console.error('To be able to use the Copy/Paste feature from the context menu, you need to manually include ZeroClipboard.js file to your website.');
    }
    try {
      /* jshint -W031 */
      new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
    } catch (exception) {
      if (typeof navigator.mimeTypes['application/x-shockwave-flash'] == 'undefined') {
        console.error('To be able to use the Copy/Paste feature from the context menu, your browser needs to have Flash Plugin installed.');
      }
    }
    if (this.swfPath) {
      ZeroClipboard.config({
        swfPath: this.swfPath
      });
    }
    this.hot.addHook('afterContextMenuShow', () => this.onAfterContextMenuShow());
    this.hot.addHook('afterContextMenuDefaultOptions', (options) => this.onAfterContextMenuDefaultOptions(options));
    this.registerEvents();
    super.enablePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(document, 'mouseenter', () => this.removeCurrentClass());
    this.eventManager.addEventListener(document, 'mouseleave', () => this.removeZeroClipboardClass());
  }

  /**
   * Get a value to copy.
   *
   * @returns {String}
   */
  getCopyValue() {
    this.hot.copyPaste.setCopyableText();

    return this.hot.copyPaste.copyPasteInstance.elTextarea.value;
  }

  /**
   * Add Copy and Paste functionality to the context menu.
   *
   * @private
   * @param {Object} defaultOptions
   */
  onAfterContextMenuDefaultOptions(defaultOptions) {
    defaultOptions.items.unshift({
        key: 'copy',
        name: 'Copy'
      }, {
        key: 'paste',
        name: 'Paste',
        callback: function() {
          this.copyPaste.triggerPaste();
        }
      },
      Handsontable.plugins.ContextMenu.SEPARATOR
    );
  }

  /**
   * After context menu show listener.
   *
   * @private
   */
  onAfterContextMenuShow() {
    const contextMenu = this.hot.getPlugin('contextMenu');
    const data = contextMenu.menu.hotMenu.getSourceData();

    // find position of 'copy' option.
    arrayEach(data, (item, index) => {
      if (item.key === 'copy') {
        let zeroClipboardInstance = new ZeroClipboard(contextMenu.menu.hotMenu.getCell(index, 0));

        zeroClipboardInstance.off();
        zeroClipboardInstance.on('copy', (event) => {
          let clipboard = event.clipboardData;

          clipboard.setData('text/plain', this.getCopyValue());
          this.hot.getSettings().outsideClickDeselects = this.outsideClickDeselectsCache;
        });

        return false;
      }
    });
  }

  /**
   * @private
   */
  removeCurrentClass() {
    const contextMenu = this.hot.getPlugin('contextMenu');

    if (contextMenu.menu.isOpened()) {
      let element = contextMenu.menu.hotMenu.rootElement.querySelector('td.current');

      if (element) {
        removeClass(element, 'current');
      }
    }
    this.outsideClickDeselectsCache = this.hot.getSettings().outsideClickDeselects;
    this.hot.getSettings().outsideClickDeselects = false;
  }

  /**
   * @private
   */
  removeZeroClipboardClass() {
    const contextMenu = this.hot.getPlugin('contextMenu');

    if (contextMenu.menu.isOpened()) {
      let element = contextMenu.menu.hotMenu.rootElement.querySelector('td.zeroclipboard-is-hover');

      if (element) {
        removeClass(element, 'zeroclipboard-is-hover');
      }
    }
    this.hot.getSettings().outsideClickDeselects = this.outsideClickDeselectsCache;
  }
}

export {ContextMenuCopyPaste};

registerPlugin('contextMenuCopyPaste', ContextMenuCopyPaste);
