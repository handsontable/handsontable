(function (Handsontable) {
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
   * @param cmInstance Current context menu instance
   */
  ContextMenuCopyPaste.prototype.setupZeroClipboard = function (cmInstance) {
    var plugin = this;
    this.cmInstance = cmInstance;

    if (!Handsontable.Dom.hasClass(this.cmInstance.rootElement, 'htContextMenu')) {
      return;
    }

    var data = cmInstance.getData();
    for (var i = 0, ilen = data.length; i < ilen; i++) { //find position of 'copy' option
      /*jshint -W083 */
      if (data[i].key === 'copy') {
        this.zeroClipboardInstance = new ZeroClipboard(cmInstance.getCell(i, 0));

        this.zeroClipboardInstance.off();
        this.zeroClipboardInstance.on("copy", function (event) {
          var clipboard = event.clipboardData;
          clipboard.setData("text/plain", plugin.copy());
          plugin.instance.getSettings().outsideClickDeselects = plugin.outsideClickDeselectsCache;
        });

        cmCopyPaste.bindEvents();
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

      var eventManager = new Handsontable.eventManager(this.instance);

      var removeCurrenClass = function (event) {
        var hadClass = plugin.cmInstance.rootElement.querySelector('td.current');
        if (hadClass) {
          Handsontable.Dom.removeClass(hadClass, 'current');
        }
        plugin.outsideClickDeselectsCache = plugin.instance.getSettings().outsideClickDeselects;
        plugin.instance.getSettings().outsideClickDeselects = false;
      };

      var removeZeroClipboardClass = function (event) {
        var hadClass = plugin.cmInstance.rootElement.querySelector('td.zeroclipboard-is-hover');
        if (hadClass) {
          Handsontable.Dom.removeClass(hadClass, 'zeroclipboard-is-hover');
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

  /**
   * Initialize plugin
   * @returns {boolean} Returns false if ZeroClipboard is not properly included
   */
  ContextMenuCopyPaste.prototype.init = function () {
    if (!this.getSettings().contextMenuCopyPaste) {
      return;
    } else if (typeof this.getSettings().contextMenuCopyPaste == "object") {
      cmCopyPaste.swfPath = this.getSettings().contextMenuCopyPaste.swfPath;
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

    cmCopyPaste.instance = this;
    cmCopyPaste.prepareZeroClipboard();
  };

  var cmCopyPaste = new ContextMenuCopyPaste();

  Handsontable.hooks.add('afterRender', function () {
    cmCopyPaste.setupZeroClipboard(this);
  });

  Handsontable.hooks.add('afterInit', cmCopyPaste.init);
  Handsontable.hooks.add('afterContextMenuDefaultOptions', cmCopyPaste.addToContextMenu);
  Handsontable.ContextMenuCopyPaste = ContextMenuCopyPaste;

})(Handsontable);
