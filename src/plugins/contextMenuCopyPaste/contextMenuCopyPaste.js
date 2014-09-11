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
   * Configure and initialize ZeroClipboard
   */
  ContextMenuCopyPaste.prototype.prepareZeroClipboard = function () {

    ZeroClipboard.config({
      swfPath: this.swfPath
    });

    this.zeroClipboardInstance = new ZeroClipboard();
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
   * Paste action
   */
  ContextMenuCopyPaste.prototype.paste = function () {
    this.copyPaste.triggerPaste();
  };

  /**
   * Prepare copy and paste context menu entries and their callbacks
   */
  ContextMenuCopyPaste.prototype.prepareEntries = function () {
    var entries = {
      'copy': {
        name: 'Copy'
      },
      'paste': {
        name: 'Paste',
        callback: this.paste
      }
    };

    return entries;
  };

  /**
   * Adds copy/paste items to context menu at specified index
   * @param index Index at which the items are supposed to be placed (if negative - beggining of the context menu, if not specified - end of the context menu)
   */
  ContextMenuCopyPaste.prototype.addToContextMenu = function (index) {
    var entries = this.prepareEntries()
      , contextMenu = this.instance.contextMenu
      , newCMEntries = {}
      , newSeparator
      , propCount = 0
      , contextMenuEntryCount = 0;

    function constructSeparator(double) {
      var separatorCount = 0;
      for (var prop in contextMenu.options.items) {
        if (prop.indexOf('hsep') != -1) {
          separatorCount++;
        }
        contextMenuEntryCount++;
      }
      var sepName = 'hsep' + parseInt(separatorCount + 1, 10);

      if (double) {
        return [
          [sepName, Handsontable.ContextMenu.SEPARATOR],
          ['hsep' + parseInt(separatorCount + 2, 10), Handsontable.ContextMenu.SEPARATOR]
        ];
      } else {
        return [sepName, Handsontable.ContextMenu.SEPARATOR];
      }
    }

    newSeparator = constructSeparator();

    if (index < 0) {
      newCMEntries.items = entries;
      newCMEntries.items[newSeparator[0]] = newSeparator[1];
      Handsontable.helper.extend(newCMEntries.items, contextMenu.options.items);
    } else if (!index) {
      newCMEntries.items = contextMenu.options.items;
      newCMEntries.items[newSeparator[0]] = newSeparator[1];
      Handsontable.helper.extend(newCMEntries.items, entries);
    } else {
      for (var prop in contextMenu.options.items) {
        if (prop.indexOf('hsep') == -1) {
          propCount++;
        }
        if (propCount - 1 == index) {
          if (index == 0) {
            Handsontable.helper.extend(newCMEntries.items, entries);
            newCMEntries.items[newSeparator[0]] = newSeparator[1];
          } else {
            newSeparator = constructSeparator(true);
            newCMEntries.items[newSeparator[0][0]] = newSeparator[0][1];
            Handsontable.helper.extend(newCMEntries.items, entries);
            newCMEntries.items[newSeparator[1][0]] = newSeparator[1][1];
          }
        }

        if (!newCMEntries.items) {
          newCMEntries.items = {};
        }
        newCMEntries.items[prop] = contextMenu.options.items[prop];
      }
    }

    this.cmEntryIndex = index ? index > 0 ? index : 0 : contextMenuEntryCount + 1;

    contextMenu.updateOptions(newCMEntries);
  };

  /**
   * Setup ZeroClipboard swf clip position and event handlers
   * @param cmInstance Current context menu instance
   */
  ContextMenuCopyPaste.prototype.setupZeroClipboard = function (cmInstance) {
    var plugin = this;
    this.cmInstance = cmInstance;

    this.zeroClipboardInstance = new ZeroClipboard(cmInstance.getCell(this.cmEntryIndex, 0));

    this.zeroClipboardInstance.off();
    this.zeroClipboardInstance.on("copy", function (event) {
      var clipboard = event.clipboardData;
      clipboard.setData("text/plain", plugin.copy());
      plugin.instance.getSettings().outsideClickDeselects = plugin.outsideClickDeselectsCache;
    });

    cmCopyPaste.bindEvents();
  };

  /**
   * Bind all the standard events
   */
  ContextMenuCopyPaste.prototype.bindEvents = function () {
    var plugin = this;

    // Workaround for 'current' and 'zeroclipboard-is-hover' classes being stuck when moving the cursor over the context menu
    if (plugin.cmInstance) {
      $(document).off('mouseenter.' + plugin.cmInstance.guid).on('mouseenter.' + plugin.cmInstance.guid, '#global-zeroclipboard-flash-bridge', function (event) {
        var hadClass = plugin.cmInstance.rootElement[0].querySelector('td.current');
        if (hadClass) {
          Handsontable.Dom.removeClass(hadClass, 'current');
        }
        plugin.outsideClickDeselectsCache = plugin.instance.getSettings().outsideClickDeselects;
        plugin.instance.getSettings().outsideClickDeselects = false;
      });

      $(document).off('mouseleave.' + plugin.cmInstance.guid).on('mouseleave.' + plugin.cmInstance.guid, '#global-zeroclipboard-flash-bridge', function (event) {
        var hadClass = plugin.cmInstance.rootElement[0].querySelector('td.zeroclipboard-is-hover');
        if (hadClass) {
          Handsontable.Dom.removeClass(hadClass, 'zeroclipboard-is-hover');
        }
        plugin.instance.getSettings().outsideClickDeselects = plugin.outsideClickDeselectsCache;
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
      cmCopyPaste.entryIndex = this.getSettings().contextMenuCopyPaste.entryIndex;
    }

    if (typeof ZeroClipboard === 'undefined') {
      throw new Error("To be able to use the Copy/Paste feature from the context menu, you need to manualy include ZeroClipboard.js file to your website.");

      return false;
    }

    cmCopyPaste.instance = this;
    cmCopyPaste.prepareZeroClipboard();

    cmCopyPaste.addToContextMenu(cmCopyPaste.entryIndex);
  };

  var cmCopyPaste = new ContextMenuCopyPaste();

  Handsontable.hooks.add('afterRender', function () {

    if (cmCopyPaste.instance && cmCopyPaste.instance.contextMenu.menus.length > 0 && this.guid === cmCopyPaste.instance.contextMenu.menus[0].id) {
      cmCopyPaste.cmInstance = this;
      cmCopyPaste.setupZeroClipboard(this);
    }
  });

  Handsontable.hooks.add('afterInit', cmCopyPaste.init);
  Handsontable.ContextMenuCopyPaste = ContextMenuCopyPaste;

})(Handsontable);
