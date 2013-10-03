(function(Handsontable){
  function init(){
    var instance = this;
    var pluginEnabled = !!(instance.getSettings().contextMenu);

    if(pluginEnabled){
      createContextMenu.call(instance);
    } else {
      destroyContextMenu.call(instance);
    }
  }

  function createContextMenu() {
    var instance = this
      , selectorId = instance.rootElement[0].id
      , allItems = {
        "row_above": {name: "Insert row above", disabled: isDisabled},
        "row_below": {name: "Insert row below", disabled: isDisabled},
        "hsep1": "---------",
        "col_left": {name: "Insert column on the left", disabled: isDisabled},
        "col_right": {name: "Insert column on the right", disabled: isDisabled},
        "hsep2": "---------",
        "remove_row": {name: "Remove row", disabled: isDisabled},
        "remove_col": {name: "Remove column", disabled: isDisabled},
        "hsep3": "---------",
        "undo": {name: "Undo", disabled: function () {
          return !instance.undoRedo || !instance.isUndoAvailable();
        }},
        "redo": {name: "Redo", disabled: function () {
          return !instance.undoRedo || !instance.isRedoAvailable();
        }}
      }
      , defaultOptions = {
        selector : "#" + selectorId + ' table, #' + selectorId + ' div',
        trigger  : 'right',
        callback : onContextClick
      }
      , options = {}
      , i
      , ilen
      , settings = instance.getSettings();

    function onContextClick(key) {
      var corners = instance.getSelected(); //[selection start row, selection start col, selection end row, selection end col]

      if (!corners) {
        return; //needed when there are 2 grids on a page
      }

      /**
       * `selection` variable contains normalized selection coordinates.
       * selection.start - top left corner of selection area
       * selection.end - bottom right corner of selection area
       */

      var selection = {
        start: new Handsontable.SelectionPoint(),
        end: new Handsontable.SelectionPoint()
      };

      selection.start.row(Math.min(corners[0], corners[2]));
      selection.start.col(Math.min(corners[1], corners[3]));

      selection.end.row(Math.max(corners[0], corners[2]));
      selection.end.col(Math.max(corners[1], corners[3]));

      switch (key) {
        case "row_above":
          instance.alter("insert_row", selection.start.row());
          break;

        case "row_below":
          instance.alter("insert_row", selection.end.row() + 1);
          break;

        case "col_left":
          instance.alter("insert_col", selection.start.col());
          break;

        case "col_right":
          instance.alter("insert_col", selection.end.col() + 1);
          break;

        case "remove_row":
          instance.alter(key, selection.start.row(), (selection.end.row() - selection.start.row()) + 1);
          break;

        case "remove_col":
          instance.alter(key, selection.start.col(), (selection.end.col() - selection.start.col()) + 1);
          break;

        case "undo":
          instance.undo();
          break;

        case "redo":
          instance.redo();
          break;
      }
    }

    function isDisabled(key) {
      //TODO rewrite
      /*if (instance.blockedCols.main.find('th.htRowHeader.active').length && (key === "remove_col" || key === "col_left" || key === "col_right")) {
       return true;
       }
       else if (instance.blockedRows.main.find('th.htColHeader.active').length && (key === "remove_row" || key === "row_above" || key === "row_below")) {
       return true;
       }
       else*/
      if (instance.countRows() >= instance.getSettings().maxRows && (key === "row_above" || key === "row_below")) {
        return true;
      }
      else if (instance.countCols() >= instance.getSettings().maxCols && (key === "col_left" || key === "col_right")) {
        return true;
      }
      else {
        return false;
      }
    }

    if (settings.contextMenu === true) { //contextMenu is true
      options.items = allItems;
    }
    else if (Object.prototype.toString.apply(settings.contextMenu) === '[object Array]') { //contextMenu is an array
      options.items = {};
      for (i = 0, ilen = settings.contextMenu.length; i < ilen; i++) {
        var key = settings.contextMenu[i];
        if (typeof allItems[key] === 'undefined') {
          throw new Error('Context menu key "' + key + '" is not recognised');
        }
        options.items[key] = allItems[key];
      }
    }
    else if (Object.prototype.toString.apply(settings.contextMenu) === '[object Object]') { //contextMenu is an options object as defined in http://medialize.github.com/jQuery-contextMenu/docs.html
      options = settings.contextMenu;
      if (options.items) {
        for (i in options.items) {
          if (options.items.hasOwnProperty(i) && allItems[i]) {
            if (typeof options.items[i] === 'string') {
              options.items[i] = allItems[i];
            }
            else {
              options.items[i] = $.extend(true, allItems[i], options.items[i]);
            }
          }
        }
      }
      else {
        options.items = allItems;
      }

      if (options.callback) {
        var handsontableCallback = defaultOptions.callback;
        var customCallback = options.callback;
        options.callback = function (key, options) {
          handsontableCallback(key, options);
          customCallback(key, options);
        }
      }
    }

    if (!selectorId) {
      throw new Error("Handsontable container must have an id");
    }

    $.contextMenu($.extend(true, defaultOptions, options));
  }

  function destroyContextMenu() {
    var id = this.rootElement[0].id;
    $.contextMenu('destroy', "#" + id + ' table, #' + id + ' div');

    /*
     * There is a bug in $.contextMenu: 'destroy' does not remove layer when selector is provided. When the below line
     * is removed, running the context menu tests in Jasmine will produce invisible layers that are never removed from DOM
     */
    $(document.querySelectorAll('#context-menu-layer')).remove();
  }

  Handsontable.PluginHooks.add('afterInit', init);
  Handsontable.PluginHooks.add('afterUpdateSettings', init);
  Handsontable.PluginHooks.add('afterDestroy', destroyContextMenu);

})(Handsontable);