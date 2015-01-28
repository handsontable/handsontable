
import * as dom from './../../dom.js';
import {eventManager as eventManagerObject} from './../../eventManager.js';
import {registerPlugin} from './../../plugins.js';

export {ContextMenuCopyPaste};

registerPlugin('contextMenuCopyPaste', ContextMenuCopyPaste);

// Support for older hot versions
Handsontable.ContextMenuCopyPaste = ContextMenuCopyPaste;

/**
 * Plugin used to allow user to copy and paste from the context menu
 * Currently uses ZeroClipboard due to browser limitations
 * @constructor
 */
function ContextMenuCopyPaste() {
  this.zeroClipboardInstance = null;
  this.instance = null;
}

/**
 * Configure ZeroClipboard
 */
ContextMenuCopyPaste.prototype.prepareZeroClipboard = function () {
  if(this.swfPath) {
    ZeroClipboard.config({
      swfPath: this.swfPath
    });
  }
};

/**
 * Copy action
 * @returns {CopyPasteClass.elTextarea.value|*}
 */
ContextMenuCopyPaste.prototype.copy = function () {
  this.instance.copyPaste.setCopyableText();
  return this.instance.copyPaste.copyPasteInstance.elTextarea.value;
};

/**
 * Adds copy/paste items to context menu
 */
ContextMenuCopyPaste.prototype.addToContextMenu = function (defaultOptions) {
  if (!this.getSettings().contextMenuCopyPaste) {
    return;
  }

  defaultOptions.items.unshift(
    {
      key: 'copy',
      name: 'Copy'
    },
    {
      key: 'paste',
      name: 'Paste',
      callback: function () {
        this.copyPaste.triggerPaste();
      }
    },
    Handsontable.ContextMenu.SEPARATOR
  );
};

/**
 * Setup ZeroClipboard swf clip position and event handlers
 * @param hotInstance Current Handsontable instance
 */
ContextMenuCopyPaste.prototype.setupZeroClipboard = function (hotInstance) {
  var plugin = this;
  this.cmInstance = hotInstance;

  if (!dom.hasClass(this.cmInstance.rootElement, 'htContextMenu')) {
    return;
  }

  var data = hotInstance.getData();
  for (var i = 0, ilen = data.length; i < ilen; i++) { //find position of 'copy' option
    /*jshint -W083 */
    if (data[i].key === 'copy') {
      this.zeroClipboardInstance = new ZeroClipboard(hotInstance.getCell(i, 0));

      this.zeroClipboardInstance.off();
      this.zeroClipboardInstance.on("copy", function (event) {
        var clipboard = event.clipboardData;
        clipboard.setData("text/plain", plugin.copy());
        plugin.instance.getSettings().outsideClickDeselects = plugin.outsideClickDeselectsCache;
      });

      this.bindEvents();
      break;
    }
  }
};

/**
 * Bind all the standard events
 */
ContextMenuCopyPaste.prototype.bindEvents = function () {
  var plugin = this;

  // Workaround for 'current' and 'zeroclipboard-is-hover' classes being stuck when moving the cursor over the context menu
  if (plugin.cmInstance) {

    var eventManager = eventManagerObject(this.instance);

    var removeCurrenClass = function (event) {
      var hadClass = plugin.cmInstance.rootElement.querySelector('td.current');
      if (hadClass) {
        dom.removeClass(hadClass, 'current');
      }
      plugin.outsideClickDeselectsCache = plugin.instance.getSettings().outsideClickDeselects;
      plugin.instance.getSettings().outsideClickDeselects = false;
    };

    var removeZeroClipboardClass = function (event) {
      var hadClass = plugin.cmInstance.rootElement.querySelector('td.zeroclipboard-is-hover');
      if (hadClass) {
        dom.removeClass(hadClass, 'zeroclipboard-is-hover');
      }
      plugin.instance.getSettings().outsideClickDeselects = plugin.outsideClickDeselectsCache;
    };

    eventManager.removeEventListener(document,'mouseenter', function () {
      removeCurrenClass();
    });
    eventManager.addEventListener(document, 'mouseenter', function (e) {
      removeCurrenClass();
    });

    eventManager.removeEventListener(document,'mouseleave', function () {
      removeZeroClipboardClass();
    });
    eventManager.addEventListener(document, 'mouseleave', function (e) {
      removeZeroClipboardClass();
    });


  }
};

ContextMenuCopyPaste.prototype.beforeInit = function(hotInstance) {
  var _this = this;

  // TODO: remove after refactoring plugin
  hotInstance.cmCopyPaste = this;

  Handsontable.hooks.add('afterRender', function () {
    _this.setupZeroClipboard(this);
  });

  Handsontable.hooks.add('afterInit', this.init);
  Handsontable.hooks.add('afterContextMenuDefaultOptions', this.addToContextMenu);
};

/**
 * Initialize plugin
 * @returns {boolean} Returns false if ZeroClipboard is not properly included
 */
ContextMenuCopyPaste.prototype.init = function () {
  if (!this.getSettings().contextMenuCopyPaste) {
    return;
  } else if (typeof this.getSettings().contextMenuCopyPaste == "object") {
    this.cmCopyPaste.swfPath = this.getSettings().contextMenuCopyPaste.swfPath;
  }

  /* jshint ignore:start */
  if (typeof ZeroClipboard === 'undefined') {
    throw new Error("To be able to use the Copy/Paste feature from the context menu, you need to manualy include ZeroClipboard.js file to your website.");

    return false;
  }
  try {
    var flashTest = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
  } catch(exception) {
    if (!('undefined' != typeof navigator.mimeTypes['application/x-shockwave-flash'])) {
      throw new Error("To be able to use the Copy/Paste feature from the context menu, your browser needs to have Flash Plugin installed.");

      return false;
    }
  }
  /* jshint ignore:end */

  this.cmCopyPaste.instance = this;
  this.cmCopyPaste.prepareZeroClipboard();
};
