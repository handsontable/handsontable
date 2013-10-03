(function (Handsontable) {
  'use strict';

  function ContextMenu(instance){
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
        'insert_above': {
          name: 'Insert row above',
          callback: function(instance, selection){
            instance.alter("insert_row", selection.start.row());
          }
        },
        'insert_below': {
          name: 'Insert row below',
          callback: function(instance, selection){
            instance.alter("insert_row", selection.end.row() + 1);
          }
        },
        "hsep1": "---------",
        'insert_left': {
          name: 'Insert column on the left',
          callback: function(instance, selection){
            instance.alter("insert_col", selection.start.col());
          }
        },
        'insert_right': {
          name: 'Insert column on the right',
          callback: function(instance, selection){
            instance.alter("insert_col", selection.end.col() + 1);
          }
        },
        "hsep2": "---------",
        'remove_row': {
          name: 'Remove row',
          callback: function(instance, selection){
            var amount = selection.end.row() - selection.start.row() + 1;
            instance.alter("remove_row", selection.start.row(), amount);
          }
        },
        'remove_col': {
          name: 'Remove column',
          callback: function(instance, selection){
            var amount = selection.end.col() - selection.start.col() + 1;
            instance.alter("remove_col", selection.start.col(), amount);
          }
        },
        "hsep3": "---------",
        'undo': {
          name: 'Undo',
          callback: function(instance){
            instance.undo();
          },
          disabled: function (instance) {
            return instance.undoRedo && !instance.undoRedo.isUndoAvailable();
          }
        },
        'redo': {
          name: 'Redo',
          callback: function(instance){
            instance.redo();
          },
          disabled: function (instance) {
            return instance.undoRedo && !instance.undoRedo.isRedoAvailable();
          }
        }

      }
    };

    this.options = {};
    Handsontable.helper.extend(this.options, this.defaultOptions);

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

      if(event.target.nodeName != 'TD'){
        return;
      }

      var containerOffset = Handsontable.Dom.offset(this.instance.rootElement[0]);

      this.show(event.pageY - containerOffset.top, event.pageX - containerOffset.left);

      $(document).on('mousedown.htContextMenu', Handsontable.helper.proxy(contextMenuCloseListener, this));
    }

    function contextMenuCloseListener(event){
      this.hide();
      $(document).off('mousedown.htContextMenu');
    }

    this.instance.rootElement.on('contextmenu.htContextMenu', Handsontable.helper.proxy(contextMenuOpenListener, this));


    function contextMenuAction(){

      var hot = $(this.menu).handsontable('getInstance')
      var selectedItemIndex = hot.getSelected()[0];
      var selectedItem = hot.getData()[selectedItemIndex];

      if (selectedItem.disabled === true || (typeof selectedItem.disabled == 'function' && selectedItem.disabled(this.instance) === true)){
        return;
      }

      if(typeof selectedItem.callback != 'function'){
        return;
      }

      var corners = this.instance.getSelected();
      var normalizedSelection = ContextMenu.utils.normalizeSelection(corners);

      selectedItem.callback(this.instance, normalizedSelection);

    }

    $(this.menu).on('mousedown', Handsontable.helper.proxy(contextMenuAction, this));
  };

  ContextMenu.prototype.unbindMouseEvents = function () {
    this.instance.rootElement.off('contextmenu.htContextMenu');
    $(document).off('mousedown.htContextMenu');
  };

  ContextMenu.prototype.show = function(top, left){

    this.menu.style.display = 'block';

    top = typeof top == 'undefined' ? 0 : top;
    left = typeof left == 'undefined' ? 0 : left;

    this.menu.style.left = left + 'px';
    this.menu.style.top = top + 'px';

    var parentInstance = this.instance;

    $(this.menu).handsontable({
      data: ContextMenu.utils.convertItemsToArray(this.options.items),
      colHeaders: false,
      colWidths: [160],
      readOnly: true,
      columns: [
        {
          data: 'name',
          renderer: function(instance, TD, row, col, prop, value, cellProperties){

            var item = instance.getData()[row];

            if(/^-+$/i.test(value)){
              Handsontable.Dom.addClass(TD, 'htSeparator');
            } else {
              Handsontable.TextRenderer.apply(this, arguments);
            }

            if (item.disabled === true || (typeof item.disabled == 'function' && item.disabled(parentInstance) === true)){
              Handsontable.Dom.addClass(TD, 'htDisabled');
            } else {
              Handsontable.Dom.removeClass(TD, 'htDisabled');
            }
          }
        }
      ]
    });

  };

  ContextMenu.utils = {};
  ContextMenu.utils.convertItemsToArray = function (items) {
    var itemArray = [];
    for(var item in items){
      if(items.hasOwnProperty(item)){
        if(typeof items[item] == 'string'){
          itemArray.push({name: items[item]});
        } else {
          itemArray.push(items[item]);
        }
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

  function init(){
    var instance = this;

    if(instance.getSettings().contextMenu){
      if(!instance.contextMenu){
        instance.contextMenu = new ContextMenu(instance);
      }

      instance.contextMenu.enable();

    }  else if(instance.contextMenu){
      instance.contextMenu.destroy();
      delete instance.contextMenu;
    }



  }

  Handsontable.PluginHooks.add('afterInit', init);
  Handsontable.PluginHooks.add('afterUpdateSettings', init);

  Handsontable.ContextMenu = ContextMenu;

})(Handsontable);
