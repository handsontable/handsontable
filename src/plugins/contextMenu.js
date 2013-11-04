(function (Handsontable) {
  'use strict';

  function ContextMenu(instance, customOptions){
    this.instance = instance;
    var contextMenu = this;

    this.menu = createMenu();
    this.enabled = true;

    this.bindMouseEvents();

    this.instance.addHook('afterDestroy', function () {
       contextMenu.destroy();
    });

    this.defaultOptions = {
      items: {
        'row_above': {
          name: 'Insert row above',
          callback: function(key, selection){
            this.alter("insert_row", selection.start.row());
          },
          disabled: function () {
            return this.countRows() >= this.getSettings().maxRows;
          }
        },
        'row_below': {
          name: 'Insert row below',
          callback: function(key, selection){
            this.alter("insert_row", selection.end.row() + 1);
          },
          disabled: function () {
            return this.countRows() >= this.getSettings().maxRows;
          }
        },
        "hsep1": ContextMenu.SEPARATOR,
        'col_left': {
          name: 'Insert column on the left',
          callback: function(key, selection){
            this.alter("insert_col", selection.start.col());
          },
          disabled: function () {
            return this.countCols() >= this.getSettings().maxCols;
          }
        },
        'col_right': {
          name: 'Insert column on the right',
          callback: function(key, selection){
            this.alter("insert_col", selection.end.col() + 1);
          },
          disabled: function () {
            return this.countCols() >= this.getSettings().maxCols;
          }
        },
        "hsep2": ContextMenu.SEPARATOR,
        'remove_row': {
          name: 'Remove row',
          callback: function(key, selection){
            var amount = selection.end.row() - selection.start.row() + 1;
            this.alter("remove_row", selection.start.row(), amount);
          }
        },
        'remove_col': {
          name: 'Remove column',
          callback: function(key, selection){
            var amount = selection.end.col() - selection.start.col() + 1;
            this.alter("remove_col", selection.start.col(), amount);
          }
        },
        "hsep3": ContextMenu.SEPARATOR,
        'undo': {
          name: 'Undo',
          callback: function(){
            this.undo();
          },
          disabled: function () {
            return this.undoRedo && !this.undoRedo.isUndoAvailable();
          }
        },
        'redo': {
          name: 'Redo',
          callback: function(){
            this.redo();
          },
          disabled: function () {
            return this.undoRedo && !this.undoRedo.isRedoAvailable();
          }
        }

      }
    };

    this.options = {};
    Handsontable.helper.extend(this.options, this.defaultOptions);

    this.updateOptions(customOptions);

    function createMenu(){
      var menu = document.createElement('DIV');
      Handsontable.Dom.addClass(menu, 'htContextMenu');
      instance.rootElement[0].appendChild(menu);

      return menu;
    }
  }

  ContextMenu.prototype.bindMouseEvents = function (){

    function contextMenuOpenListener(event){

      event.preventDefault();

      if(event.target.nodeName != 'TD' && !(Handsontable.Dom.hasClass(event.target, 'current') && Handsontable.Dom.hasClass(event.target, 'wtBorder'))){
        return;
      }

      this.show(event.pageY, event.pageX);

      $(document).on('mousedown.htContextMenu', Handsontable.helper.proxy(contextMenuCloseListener, this));
    }

    function contextMenuCloseListener(event){
      this.hide();
      $(document).off('mousedown.htContextMenu');
    }

    this.instance.rootElement.on('contextmenu.htContextMenu', Handsontable.helper.proxy(contextMenuOpenListener, this));

    $(this.menu).on('mousedown', Handsontable.helper.proxy(this.performAction, this));
  };

  ContextMenu.prototype.performAction = function (){

    var hot = $(this.menu).handsontable('getInstance')
    var selectedItemIndex = hot.getSelected()[0];
    var selectedItem = hot.getData()[selectedItemIndex];

    if (selectedItem.disabled === true || (typeof selectedItem.disabled == 'function' && selectedItem.disabled.call(this.instance) === true)){
      return;
    }

    if(typeof selectedItem.callback != 'function'){
      return;
    }

    var corners = this.instance.getSelected();
    var normalizedSelection = ContextMenu.utils.normalizeSelection(corners);

    selectedItem.callback.call(this.instance, selectedItem.key, normalizedSelection);

  };

  ContextMenu.prototype.unbindMouseEvents = function () {
    this.instance.rootElement.off('contextmenu.htContextMenu');
    $(document).off('mousedown.htContextMenu');
  };

  ContextMenu.prototype.show = function(top, left){

    this.menu.style.display = 'block';

    var parentInstance = this.instance;
    var contextMenu = this;

    $(this.menu).handsontable({
      data: ContextMenu.utils.convertItemsToArray(this.getItems()),
      colHeaders: false,
      colWidths: [160],
      readOnly: true,
      columns: [
        {
          data: 'name',
          renderer: function(instance, TD, row, col, prop, value, cellProperties){

            var item = instance.getData()[row];

            if(RegExp(ContextMenu.SEPARATOR, 'i').test(value)){
              Handsontable.Dom.addClass(TD, 'htSeparator');
            } else {
              Handsontable.TextRenderer.apply(this, arguments);
            }

            if (item.disabled === true || (typeof item.disabled == 'function' && item.disabled.call(parentInstance) === true)){
              Handsontable.Dom.addClass(TD, 'htDisabled');
            } else {
              Handsontable.Dom.removeClass(TD, 'htDisabled');
            }
          }
        }
      ],
      beforeKeyDown: function (event) {
        var instance = this;
        var selection = instance.getSelected();

        switch(event.keyCode){
          case Handsontable.helper.keyCode.ARROW_DOWN:
            if(!selection){

              instance.selectCell(0, 0);
              event.preventDefault();
              event.stopImmediatePropagation();

            } else {

              var nextCell = selection[0] + 1 < this.coutRows() ? this.getCell(selection[0] + 1, selection[1]) : null;

              if(nextCell && ContextMenu.utils.isSeparator(nextCell)){
                if(selection[0] + 2 < this.countRows()){
                  this.selectCell(selection[0] + 2, selection[1]);
                }

                event.preventDefault();
                event.stopImmediatePropagation();

              }

            }


            break;

          case Handsontable.helper.keyCode.ARROW_UP:
            if(!selection){
              instance.selectCell(0, 0);
              event.preventDefault();
              event.stopImmediatePropagation();
            }  else {

              var prevCell = selection[0] - 1 >= 0 ? this.getCell(selection[0] - 1, selection[1]) : null;

              if (!prevCell) {
                event.preventDefault();
                event.stopImmediatePropagation();
              } else if(ContextMenu.utils.isSeparator(prevCell)){
                if(selection[0] - 2 >= 0){
                  this.selectCell(selection[0] - 2, selection[1]);
                }

                event.preventDefault();
                event.stopImmediatePropagation();

              }

            }
            break;

          case Handsontable.helper.keyCode.ENTER:
            if(instance.getSelected()){
              contextMenu.performAction();
              contextMenu.hide();
            }
            break;
        }

      }
    });

    this.setMenuPosition(top, left);

    $(this.menu).handsontable('listen');

  };

  ContextMenu.prototype.getItems = function () {
    var items = {};
    function Item(rawItem){
      if(typeof rawItem == 'string'){
        this.name = rawItem;
      } else {
        Handsontable.helper.extend(this, rawItem);
      }
    }
    Item.prototype = this.options;

    for(var itemName in this.options.items){
      if(this.options.items.hasOwnProperty(itemName) && (!this.itemsFilter || this.itemsFilter.indexOf(itemName) != -1)){
        items[itemName] = new Item(this.options.items[itemName]);
      }
    }

    return items;

  };

  ContextMenu.prototype.updateOptions = function(newOptions){
    newOptions = newOptions || {};

    if(newOptions.items){
      for(var itemName in newOptions.items){
        var item = {};

        if(newOptions.items.hasOwnProperty(itemName)
          && this.defaultOptions.items.hasOwnProperty(itemName)
          && Handsontable.helper.isObject(newOptions.items[itemName])){
          Handsontable.helper.extend(item, this.defaultOptions.items[itemName]);
          Handsontable.helper.extend(item, newOptions.items[itemName]);
          newOptions.items[itemName] = item;
        }

      }
    }

    Handsontable.helper.extend(this.options, newOptions);
  };

  ContextMenu.prototype.setMenuPosition = function (cursorY, cursorX) {

    var cursor = {
      top: cursorY,
      left: cursorX
    };

    if(this.menuFitsBelowCursor(cursor)){
      this.positionMenuBelowCursor(cursor);
    } else {
      this.positionMenuAboveCursor(cursor);
    }

    if(this.menuFitsOnRightOfCursor(cursor)){
      this.positionMenuOnRightOfCursor(cursor);
    } else {
      this.positionMenuOnLeftOfCursor(cursor);
    }

  };

  ContextMenu.prototype.menuFitsBelowCursor = function (cursor) {
    return cursor.top + this.menu.offsetHeight <= document.documentElement.scrollTop + document.documentElement.clientHeight;
  };

  ContextMenu.prototype.menuFitsOnRightOfCursor = function (cursor) {
    return cursor.left + this.menu.offsetWidth <= document.documentElement.scrollLeft + document.documentElement.clientWidth;
  };

  ContextMenu.prototype.positionMenuBelowCursor = function (cursor) {
    this.menu.style.top = this.getCursorRelativeToContainer(cursor).top + 'px';
  };

  ContextMenu.prototype.positionMenuAboveCursor = function (cursor) {
    this.menu.style.top = (this.getCursorRelativeToContainer(cursor).top - this.menu.offsetHeight) + 'px';
  };

  ContextMenu.prototype.positionMenuOnRightOfCursor = function (cursor) {
    this.menu.style.left = this.getCursorRelativeToContainer(cursor).left + 'px';
  };

  ContextMenu.prototype.positionMenuOnLeftOfCursor = function (cursor) {
    this.menu.style.left = (this.getCursorRelativeToContainer(cursor).left - this.menu.offsetWidth) + 'px';
  };

  ContextMenu.prototype.getCursorRelativeToContainer = function (cursor) {
    var containerOffset = Handsontable.Dom.offset(this.instance.rootElement[0]);

    return {
      left: cursor.left - containerOffset.left,
      top: cursor.top - containerOffset.top
    }
  };

  ContextMenu.utils = {};
  ContextMenu.utils.convertItemsToArray = function (items) {
    var itemArray = [];
    var item;
    for(var itemName in items){
      if(items.hasOwnProperty(itemName)){
        if(typeof items[itemName] == 'string'){
          item = {name: items[item]};
        } else if (items[itemName].visible !== false) {
          item = items[itemName];
        } else {
          continue;
        }

        item.key = itemName;
        itemArray.push(item);
      }
    }

    return itemArray;
  };

  ContextMenu.utils.normalizeSelection = function(corners){
    var selection = {
      start: new Handsontable.SelectionPoint(),
      end: new Handsontable.SelectionPoint()
    };

    selection.start.row(Math.min(corners[0], corners[2]));
    selection.start.col(Math.min(corners[1], corners[3]));

    selection.end.row(Math.max(corners[0], corners[2]));
    selection.end.col(Math.max(corners[1], corners[3]));

    return selection;
  };

  ContextMenu.utils.isSeparator = function (cell) {
    return Handsontable.Dom.hasClass(cell, 'htSeparator');
  };

  ContextMenu.prototype.hide = function(){
    this.menu.style.display = 'none';
    $(this.menu).handsontable('destroy');
  };

  ContextMenu.prototype.enable = function () {
    if(!this.enabled){
      this.enabled = true;
      this.bindMouseEvents();
    }
  };

  ContextMenu.prototype.disable = function () {
    if(this.enabled){
      this.enabled = false;
      this.hide();
      this.unbindMouseEvents();
    }
  };

  ContextMenu.prototype.destroy = function () {
    this.hide();
    this.unbindMouseEvents();

    if(this.menu.parentNode){
      this.menu.parentNode.removeChild(this.menu);
    }
  };

  ContextMenu.prototype.filterItems = function(itemsToLeave){
    this.itemsFilter = itemsToLeave;
  };

  ContextMenu.SEPARATOR = "---------";

  function init(){
    var instance = this;
    var contextMenuSetting = instance.getSettings().contextMenu;
    var customOptions = Handsontable.helper.isObject(contextMenuSetting) ? contextMenuSetting : {};

    if(contextMenuSetting){
      if(!instance.contextMenu){
        instance.contextMenu = new ContextMenu(instance, customOptions);
      }

      instance.contextMenu.enable();

      if(Handsontable.helper.isArray(contextMenuSetting)){
        instance.contextMenu.filterItems(contextMenuSetting);
      }

    }  else if(instance.contextMenu){
      instance.contextMenu.destroy();
      delete instance.contextMenu;
    }



  }

  Handsontable.PluginHooks.add('afterInit', init);
  Handsontable.PluginHooks.add('afterUpdateSettings', init);

  Handsontable.ContextMenu = ContextMenu;

})(Handsontable);
