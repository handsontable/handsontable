function createContextMenu() {
  var instance = this;

  var onContextClick = function (key) {
    var corners = instance.getSelected(); //[top left row, top left col, bottom right row, bottom right col]

    switch (key) {
      case "row_above":
        instance.alter("insert_row", corners[0]);
        break;

      case "row_below":
        instance.alter("insert_row", corners[2] + 1);
        break;

      case "col_left":
        instance.alter("insert_col", corners[0]);
        break;

      case "col_right":
        instance.alter("insert_col", corners[3] + 1);
        break;

      case "remove_row":
        instance.alter(key, corners[0], corners[2]);
        break;

      case "remove_col":
        instance.alter(key, corners[1], corners[3]);
        break;

      case "undo":
        instance.undo();
        break;

      case "redo":
        instance.redo();
        break;
    }
  };

  var isDisabled = function (key) {

    if (instance.blockedCols.main.find('th.htRowHeader.active').length && (key === "remove_col" || key === "col_left" || key === "col_right")) {
      return true;
    }

    if (instance.blockedRows.main.find('th.htColHeader.active').length && (key === "remove_row" || key === "row_above" || key === "row_below")) {
      return true;
    }

    var corners = instance.getSelected(); //[top left row, top left col, bottom right row, bottom right col]
    if (corners) {
      if (((key === "row_above" || key === "remove_row") && corners[0] === 0) || ((key === "col_left" || key === "remove_col") && corners[1] === 0)) {
        if (instance.getCellMeta(corners[0], corners[1]).isWritable) {
          return true;
        }
      }
      return false;
    }

    return true;
  };

  var allItems = {
    "undo": {name: "Undo", disabled: function () {
      return !instance.isUndoAvailable();
    }},
    "redo": {name: "Redo", disabled: function () {
      return !instance.isRedoAvailable();
    }},
    "sep1": "---------",
    "row_above": {name: "Insert row above", disabled: isDisabled},
    "row_below": {name: "Insert row below", disabled: isDisabled},
    "sep2": "---------",
    "col_left": {name: "Insert column on the left", disabled: isDisabled},
    "col_right": {name: "Insert column on the right", disabled: isDisabled},
    "sep3": "---------",
    "remove_row": {name: "Remove row", disabled: isDisabled},
    "remove_col": {name: "Remove column", disabled: isDisabled}
  };

  var settings = instance.getSettings();
  if (!settings.contextMenu) {
    return;
  }
  if (settings.contextMenu === true) { //contextMenu is true, not an array
    settings.contextMenu = ["row_above", "row_below", "sep1", "col_left", "col_right", "sep2", "remove_row", "remove_col", "sep3", "undo", "redo"]; //use default fields array
  }

  var items = {};
  for (var i = 0, ilen = settings.contextMenu.length; i < ilen; i++) {
    items[settings.contextMenu[i]] = allItems[settings.contextMenu[i]];
  }

  if (!instance.rootElement.attr('id')) {
    throw new Error("Handsontable container must have an id");
  }

  $.contextMenu({
    selector: "#" + instance.rootElement.attr('id'),
    trigger: 'right',
    callback: onContextClick,
    items: items
  });
}

Handsontable.PluginHooks.push('afterInit', createContextMenu);