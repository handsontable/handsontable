(function (Handsontable) {
  'use strict';

  function prepareVerticalAlignClass(className, alignment) {
    if (className.indexOf(alignment) != -1) {
      return className;
    }

    className = className
      .replace('htTop', '')
      .replace('htMiddle', '')
      .replace('htBottom', '')
      .replace('  ', '');

    className += " " + alignment;
    return className;
  }

  function prepareHorizontalAlignClass(className, alignment) {
    if (className.indexOf(alignment) != -1) {
      return className;
    }

    className = className
      .replace('htLeft', '')
      .replace('htCenter', '')
      .replace('htRight', '')
      .replace('htJustify', '')
      .replace('  ', '');

    className += " " + alignment;
    return className;
  }

  function doAlign(row, col, type, alignment) {
    /* jshint ignore:start */
    var cellMeta = this.getCellMeta(row, col),
      className = alignment;

    if (cellMeta.className) {
      if (type === 'vertical') {
        className = prepareVerticalAlignClass(cellMeta.className, alignment);
      } else {
        className = prepareHorizontalAlignClass(cellMeta.className, alignment);
      }
    }

    this.setCellMeta(row, col, 'className', className);

  }

  function align(range, type, alignment) {
    /* jshint ignore:start */
    if (range.from.row == range.to.row && range.from.col == range.to.col) {
      doAlign.call(this, range.from.row, range.from.col, type, alignment);
    } else {
      for (var row = range.from.row; row <= range.to.row; row++) {
        for (var col = range.from.col; col <= range.to.col; col++) {
          doAlign.call(this, row, col, type, alignment);
        }
      }
    }

    this.render();
    
    /* jshint ignore:end */
  }

  function ContextMenu(instance, customOptions) {
    this.instance = instance;
    var contextMenu = this;
    contextMenu.menus = [];
    contextMenu.htMenus = {};
    contextMenu.triggerRows = [];

    contextMenu.eventManager = Handsontable.eventManager(contextMenu);


    this.enabled = true;

    this.instance.addHook('afterDestroy', function () {
      contextMenu.destroy();
    });

    this.defaultOptions = {
      items: [
        {
          key: 'row_above',
          name: 'Insert row above',
          callback: function (key, selection) {
            this.alter("insert_row", selection.start.row);
          },
          disabled: function () {
            var selected = this.getSelected(),
              entireColumnSelection = [0, selected[1], this.countRows() - 1, selected[1]],
              columnSelected = entireColumnSelection.join(',') == selected.join(',');

            return selected[0] < 0 || this.countRows() >= this.getSettings().maxRows || columnSelected;
          }
        },
        {
          key: 'row_below',
          name: 'Insert row below',
          callback: function (key, selection) {
            this.alter("insert_row", selection.end.row + 1);
          },
          disabled: function () {
            var selected = this.getSelected(),
              entireColumnSelection = [0, selected[1], this.countRows() - 1, selected[1]],
              columnSelected = entireColumnSelection.join(',') == selected.join(',');

            return this.getSelected()[0] < 0 || this.countRows() >= this.getSettings().maxRows || columnSelected;
          }
        },
        ContextMenu.SEPARATOR,
        {
          key: 'col_left',
          name: 'Insert column on the left',
          callback: function (key, selection) {
            this.alter("insert_col", selection.start.col);
          },
          disabled: function () {
            var selected = this.getSelected(),
              entireRowSelection = [selected[0], 0, selected[0], this.countCols() - 1],
              rowSelected = entireRowSelection.join(',') == selected.join(',');

            return this.getSelected()[1] < 0 || this.countCols() >= this.getSettings().maxCols || rowSelected;
          }
        },
        {
          key: 'col_right',
          name: 'Insert column on the right',
          callback: function (key, selection) {
            this.alter("insert_col", selection.end.col + 1);
          },
          disabled: function () {
            var selected = this.getSelected(),
              entireRowSelection = [selected[0], 0, selected[0], this.countCols() - 1],
              rowSelected = entireRowSelection.join(',') == selected.join(',');

            return selected[1] < 0 || this.countCols() >= this.getSettings().maxCols || rowSelected;
          }
        },
        ContextMenu.SEPARATOR,
        {
          key: 'remove_row',
          name: 'Remove row',
          callback: function (key, selection) {
            var amount = selection.end.row - selection.start.row + 1;
            this.alter("remove_row", selection.start.row, amount);
          },
          disabled: function () {
            var selected = this.getSelected(),
              entireColumnSelection = [0, selected[1], this.countRows() - 1, selected[1]],
              columnSelected = entireColumnSelection.join(',') == selected.join(',');
            return (selected[0] < 0 || columnSelected);
          }
        },
        {
          key: 'remove_col',
          name: 'Remove column',
          callback: function (key, selection) {
            var amount = selection.end.col - selection.start.col + 1;
            this.alter("remove_col", selection.start.col, amount);
          },
          disabled: function () {
            var selected = this.getSelected(),
              entireRowSelection = [selected[0], 0, selected[0], this.countCols() - 1],
              rowSelected = entireRowSelection.join(',') == selected.join(',');
            return (selected[1] < 0 || rowSelected);
          }
        },
        ContextMenu.SEPARATOR,
        {
          key: 'undo',
          name: 'Undo',
          callback: function () {
            this.undo();
          },
          disabled: function () {
            return this.undoRedo && !this.undoRedo.isUndoAvailable();
          }
        },
        {
          key: 'redo',
          name: 'Redo',
          callback: function () {
            this.redo();
          },
          disabled: function () {
            return this.undoRedo && !this.undoRedo.isRedoAvailable();
          }
        },
        ContextMenu.SEPARATOR,
        {
          key: 'make_read_only',
          name: function () {
            var label = "Read only";
            var atLeastOneReadOnly = contextMenu.checkSelectionReadOnlyConsistency(this);
            if (atLeastOneReadOnly) {
              label = contextMenu.markSelected(label);
            }
            return label;
          },
          callback: function () {
            var atLeastOneReadOnly = contextMenu.checkSelectionReadOnlyConsistency(this);

            var that = this;
            this.getSelectedRange().forAll(function (r, c) {
              that.getCellMeta(r, c).readOnly = atLeastOneReadOnly ? false : true;
            });

            this.render();
          }
        },
        ContextMenu.SEPARATOR,
        {
          key: 'alignment',
          name: 'Alignment',
          submenu: {
            items: [
              {
                name: function () {
                  var label = "Left";
                  var hasClass = contextMenu.checkSelectionAlignment(this, 'htLeft');

                  if (hasClass) {
                    label = contextMenu.markSelected(label);
                  }
                  return label;
                },
                callback: function () {
                  align.call(this, this.getSelectedRange(), 'horizontal', 'htLeft');
                },
                disabled: false
              },
              {
                name: function () {
                  var label = "Center";
                  var hasClass = contextMenu.checkSelectionAlignment(this, 'htCenter');

                  if (hasClass) {
                    label = contextMenu.markSelected(label);
                  }
                  return label;
                },
                callback: function () {
                  align.call(this, this.getSelectedRange(), 'horizontal', 'htCenter');
                },
                disabled: false
              },
              {
                name: function () {
                  var label = "Right";
                  var hasClass = contextMenu.checkSelectionAlignment(this, 'htRight');

                  if (hasClass) {
                    label = contextMenu.markSelected(label);
                  }
                  return label;
                },
                callback: function () {
                  align.call(this, this.getSelectedRange(), 'horizontal', 'htRight');
                },
                disabled: false
              },
              {
                name: function () {
                  var label = "Justify";
                  var hasClass = contextMenu.checkSelectionAlignment(this, 'htJustify');

                  if (hasClass) {
                    label = contextMenu.markSelected(label);
                  }
                  return label;
                },
                callback: function () {
                  align.call(this, this.getSelectedRange(), 'horizontal', 'htJustify');
                },
                disabled: false
              },
              ContextMenu.SEPARATOR,
              {
                name: function () {
                  var label = "Top";
                  var hasClass = contextMenu.checkSelectionAlignment(this, 'htTop');

                  if (hasClass) {
                    label = contextMenu.markSelected(label);
                  }
                  return label;
                },
                callback: function () {
                  align.call(this, this.getSelectedRange(), 'vertical', 'htTop');
                },
                disabled: false
              },
              {
                name: function () {
                  var label = "Middle";
                  var hasClass = contextMenu.checkSelectionAlignment(this, 'htMiddle');

                  if (hasClass) {
                    label = contextMenu.markSelected(label);
                  }
                  return label;
                },
                callback: function () {
                  align.call(this, this.getSelectedRange(), 'vertical', 'htMiddle');
                },
                disabled: false
              },
              {
                name: function () {
                  var label = "Bottom";
                  var hasClass = contextMenu.checkSelectionAlignment(this, 'htBottom');

                  if (hasClass) {
                    label = contextMenu.markSelected(label);
                  }
                  return label;
                },
                callback: function () {
                  align.call(this, this.getSelectedRange(), 'vertical', 'htBottom');
                },
                disabled: false
              }
            ]
          }
        }
      ]
    };

    contextMenu.options = {};

    Handsontable.helper.extend(contextMenu.options, this.options);

    this.bindMouseEvents();

    this.markSelected = function (label) {
      return "<span class='selected'>" + String.fromCharCode(10003) + "</span>" + label; // workaround for https://github.com/handsontable/handsontable/issues/1946
    };

    this.checkSelectionAlignment = function (hot, className) {
      var hasAlignment = false;

      hot.getSelectedRange().forAll(function (r, c) {
        var metaClassName = hot.getCellMeta(r, c).className;
        if (metaClassName && metaClassName.indexOf(className) != -1) {
          hasAlignment = true;
          return false;
        }
      });

      return hasAlignment;
    };

		if(!this.instance.getSettings().allowInsertRow) {
      var rowAboveIndex = findIndexByKey(this.defaultOptions.items, 'row_above');
      this.defaultOptions.items.splice(rowAboveIndex,1);
      var rowBelowIndex = findIndexByKey(this.defaultOptions.items, 'row_above');
      this.defaultOptions.items.splice(rowBelowIndex,1);
      this.defaultOptions.items.splice(rowBelowIndex,1); // FOR SEPARATOR

		}

		if(!this.instance.getSettings().allowInsertColumn) {
      var colLeftIndex = findIndexByKey(this.defaultOptions.items, 'col_left');
      this.defaultOptions.items.splice(colLeftIndex,1);
      var colRightIndex = findIndexByKey(this.defaultOptions.items, 'col_right');
      this.defaultOptions.items.splice(colRightIndex,1);
      this.defaultOptions.items.splice(colRightIndex,1); // FOR SEPARATOR

    }

		var removeRow = false;
		var removeCol = false;
    var removeRowIndex, removeColumnIndex;

		if(!this.instance.getSettings().allowRemoveRow) {
      removeRowIndex = findIndexByKey(this.defaultOptions.items, 'remove_row');
      this.defaultOptions.items.splice(removeRowIndex,1);
			removeRow = true;
		}

		if(!this.instance.getSettings().allowRemoveColumn) {
      removeColumnIndex = findIndexByKey(this.defaultOptions.items, 'remove_col');
      this.defaultOptions.items.splice(removeColumnIndex,1);
      removeCol = true;
		}

		if (removeRow && removeCol) {
      this.defaultOptions.items.splice(removeColumnIndex,1); // SEPARATOR
		}

    this.checkSelectionReadOnlyConsistency = function (hot) {
      var atLeastOneReadOnly = false;

      hot.getSelectedRange().forAll(function (r, c) {
        if (hot.getCellMeta(r, c).readOnly) {
          atLeastOneReadOnly = true;
          return false; //breaks forAll
        }
      });

      return atLeastOneReadOnly;
    };

    Handsontable.hooks.run(instance, 'afterContextMenuDefaultOptions', this.defaultOptions);

  }

  /***
   * Create DOM instance of contextMenu
   * @param menuName
   * @param row
   * @return {*}
   */
  ContextMenu.prototype.createMenu = function (menuName, row) {
    if (menuName) {
      menuName = menuName.replace(/ /g, '_'); // replace all spaces in name
      menuName = 'htContextSubMenu_' + menuName;
    }

    var menu;
    if (menuName) {
      menu = document.querySelector('.htContextMenu.' + menuName);
    } else {
      menu = document.querySelector('.htContextMenu');
    }


    if (!menu) {
      menu = document.createElement('DIV');
      Handsontable.Dom.addClass(menu, 'htContextMenu');
      if (menuName) {
        Handsontable.Dom.addClass(menu, menuName);
      }
      document.getElementsByTagName('body')[0].appendChild(menu);
    }

    if (this.menus.indexOf(menu) < 0) {
      this.menus.push(menu);
      row = row || 0;
      this.triggerRows.push(row);
    }

    return menu;
  };

  ContextMenu.prototype.bindMouseEvents = function () {
    /* jshint ignore:start */
    function contextMenuOpenListener(event) {
      var settings = this.instance.getSettings();

      this.closeAll();

      event.preventDefault();
      Handsontable.helper.stopPropagation(event);

      var showRowHeaders = this.instance.getSettings().rowHeaders,
        showColHeaders = this.instance.getSettings().colHeaders;

      if (!(showRowHeaders || showColHeaders)) {
        if (event.target.nodeName != 'TD' && !(Handsontable.Dom.hasClass(event.target, 'current') && Handsontable.Dom.hasClass(event.target, 'wtBorder'))) {
          return;
        }
      }
      var menu = this.createMenu();
      var items = this.getItems(settings.contextMenu);

      this.show(menu, items);

      this.setMenuPosition(event, menu);

      this.eventManager.addEventListener(document.documentElement, 'mousedown', Handsontable.helper.proxy(ContextMenu.prototype.closeAll, this));
    }
    /* jshint ignore:end */
    var eventManager = Handsontable.eventManager(this.instance);

    eventManager.addEventListener(this.instance.rootElement, 'contextmenu', Handsontable.helper.proxy(contextMenuOpenListener, this));
  };

  ContextMenu.prototype.bindTableEvents = function () {
    this._afterScrollCallback = function () {};
    this.instance.addHook('afterScrollVertically', this._afterScrollCallback);
    this.instance.addHook('afterScrollHorizontally', this._afterScrollCallback);
  };

  ContextMenu.prototype.unbindTableEvents = function () {
    if (this._afterScrollCallback) {
      this.instance.removeHook('afterScrollVertically', this._afterScrollCallback);
      this.instance.removeHook('afterScrollHorizontally', this._afterScrollCallback);
      this._afterScrollCallback = null;
    }
  };

  ContextMenu.prototype.performAction = function (event, hot) {
    var contextMenu = this;

    var selectedItemIndex = hot.getSelected()[0];
    var selectedItem = hot.getData()[selectedItemIndex];

    if (selectedItem.disabled === true || (typeof selectedItem.disabled == 'function' && selectedItem.disabled.call(this.instance) === true)) {
      return;
    }

    if (!selectedItem.hasOwnProperty('submenu')) {
      if (typeof selectedItem.callback != 'function') {
        return;
      }
      var selRange = this.instance.getSelectedRange();
      var normalizedSelection = ContextMenu.utils.normalizeSelection(selRange);

      selectedItem.callback.call(this.instance, selectedItem.key, normalizedSelection, event);
      contextMenu.closeAll();
    }
  };

  ContextMenu.prototype.unbindMouseEvents = function () {
    this.eventManager.clear();
    var eventManager = Handsontable.eventManager(this.instance);
    eventManager.removeEventListener(this.instance.rootElement, 'contextmenu');
  };

  ContextMenu.prototype.show = function (menu, items) {
    var that = this;

    menu.removeAttribute('style');
    menu.style.display = 'block';

    var settings = {
      data: items,
      colHeaders: false,
      colWidths: [200],
      readOnly: true,
      copyPaste: false,
      columns: [
        {
          data: 'name',
          renderer: Handsontable.helper.proxy(this.renderer, this)
        }
      ],
      renderAllRows: true,
      beforeKeyDown: function (event) {
        that.onBeforeKeyDown(event, htContextMenu);
      },
      afterOnCellMouseOver: function (event, coords, TD) {
        that.onCellMouseOver(event, coords, TD, htContextMenu);
      }
    };

    var htContextMenu = new Handsontable(menu, settings);


    this.eventManager.removeEventListener(menu, 'mousedown');
    this.eventManager.addEventListener(menu,'mousedown', function (event) {
      that.performAction(event, htContextMenu);
    });

    this.bindTableEvents();
    htContextMenu.listen();

    this.htMenus[htContextMenu.guid] = htContextMenu;
  };

  ContextMenu.prototype.close = function (menu) {
    this.hide(menu);
    this.eventManager.clear();
    this.unbindTableEvents();
    this.instance.listen();
  };

  ContextMenu.prototype.closeAll = function () {
    while (this.menus.length > 0) {
      var menu = this.menus.pop();
      if (menu) {
        this.close(menu);
      }

    }
    this.triggerRows = [];
  };

  ContextMenu.prototype.closeLastOpenedSubMenu = function () {
    var menu = this.menus.pop();
    if (menu) {
      this.hide(menu);
    }

  };

  ContextMenu.prototype.hide = function (menu) {
    menu.style.display = 'none';
    var instance =this.htMenus[menu.id];

    instance.destroy();
    delete this.htMenus[menu.id];
  };

  ContextMenu.prototype.renderer = function (instance, TD, row, col, prop, value) {
    var contextMenu = this;
    var item = instance.getData()[row];
    var wrapper = document.createElement('DIV');

    if (typeof value === 'function') {
      value = value.call(this.instance);
    }

    Handsontable.Dom.empty(TD);
    TD.appendChild(wrapper);

    if (itemIsSeparator(item)) {
      Handsontable.Dom.addClass(TD, 'htSeparator');
    } else {
      Handsontable.Dom.fastInnerHTML(wrapper, value);
    }

    if (itemIsDisabled(item)) {
      Handsontable.Dom.addClass(TD, 'htDisabled');

      this.eventManager.addEventListener(wrapper, 'mouseenter', function () {
        instance.deselectCell();
      });

    } else {
      if (isSubMenu(item)) {
        Handsontable.Dom.addClass(TD, 'htSubmenu');


        this.eventManager.addEventListener(wrapper, 'mouseenter', function () {
          instance.selectCell(row, col);
        });

      } else {
        Handsontable.Dom.removeClass(TD, 'htSubmenu');
        Handsontable.Dom.removeClass(TD, 'htDisabled');

        this.eventManager.addEventListener(wrapper, 'mouseenter', function () {
          instance.selectCell(row, col);
        });
      }
    }


    function isSubMenu(item) {
      return item.hasOwnProperty('submenu');
    }

    function itemIsSeparator(item) {
      return new RegExp(ContextMenu.SEPARATOR.name, 'i').test(item.name);
    }

    function itemIsDisabled(item) {
      return item.disabled === true || (typeof item.disabled == 'function' && item.disabled.call(contextMenu.instance) === true);
    }


  };

  ContextMenu.prototype.onCellMouseOver = function (event, coords, TD, hot) {
    var menusLength = this.menus.length;

    if (menusLength > 0) {
      var lastMenu = this.menus[menusLength - 1];
      if (lastMenu.id != hot.guid) {
        this.closeLastOpenedSubMenu();
      }
    } else {
      this.closeLastOpenedSubMenu();
    }

    if (TD.className.indexOf('htSubmenu') != -1) {
      var selectedItem = hot.getData()[coords.row];
      var items = this.getItems(selectedItem.submenu);

      var subMenu = this.createMenu(selectedItem.name, coords.row);
      var tdCoords = TD.getBoundingClientRect();

      this.show(subMenu, items);
      this.setSubMenuPosition(tdCoords, subMenu);

    }
  };

  ContextMenu.prototype.onBeforeKeyDown = function (event, instance) {

    Handsontable.Dom.enableImmediatePropagation(event);
    var contextMenu = this;

    var selection = instance.getSelected();

    switch (event.keyCode) {

      case Handsontable.helper.keyCode.ESCAPE:
        contextMenu.closeAll();
        event.preventDefault();
        event.stopImmediatePropagation();
        break;

      case Handsontable.helper.keyCode.ENTER:
        if (selection) {
          contextMenu.performAction(event, instance);
        }
        break;

      case Handsontable.helper.keyCode.ARROW_DOWN:

        if (!selection) {

          selectFirstCell(instance, contextMenu);

        } else {

          selectNextCell(selection[0], selection[1], instance, contextMenu);

        }

        event.preventDefault();
        event.stopImmediatePropagation();

        break;

      case Handsontable.helper.keyCode.ARROW_UP:
        if (!selection) {

          selectLastCell(instance, contextMenu);

        } else {

          selectPrevCell(selection[0], selection[1], instance, contextMenu);

        }

        event.preventDefault();
        event.stopImmediatePropagation();

        break;
      case Handsontable.helper.keyCode.ARROW_RIGHT:
        if (selection) {
          var row = selection[0];
          var cell = instance.getCell(selection[0], 0);

          if (ContextMenu.utils.hasSubMenu(cell)) {
            openSubMenu(instance, contextMenu, cell, row);
          }
        }
        event.preventDefault();
        event.stopImmediatePropagation();

        break;

      case Handsontable.helper.keyCode.ARROW_LEFT:
        if (selection) {

          if (instance.rootElement.className.indexOf('htContextSubMenu_') != -1) {
            contextMenu.closeLastOpenedSubMenu();
            var index = contextMenu.menus.length;

            if (index > 0) {
              var menu = contextMenu.menus[index - 1];

              var triggerRow = contextMenu.triggerRows.pop();
              instance = this.htMenus[menu.id];
              instance.selectCell(triggerRow, 0);
            }
          }
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        break;
    }

    function selectFirstCell(instance) {

      var firstCell = instance.getCell(0, 0);

      if (ContextMenu.utils.isSeparator(firstCell) || ContextMenu.utils.isDisabled(firstCell)) {
        selectNextCell(0, 0, instance);
      } else {
        instance.selectCell(0, 0);
      }

    }


    function selectLastCell(instance) {

      var lastRow = instance.countRows() - 1;
      var lastCell = instance.getCell(lastRow, 0);

      if (ContextMenu.utils.isSeparator(lastCell) || ContextMenu.utils.isDisabled(lastCell)) {
        selectPrevCell(lastRow, 0, instance);
      } else {
        instance.selectCell(lastRow, 0);
      }

    }

    function selectNextCell(row, col, instance) {
      var nextRow = row + 1;
      var nextCell = nextRow < instance.countRows() ? instance.getCell(nextRow, col) : null;

      if (!nextCell) {
        return;
      }

      if (ContextMenu.utils.isSeparator(nextCell) || ContextMenu.utils.isDisabled(nextCell)) {
        selectNextCell(nextRow, col, instance);
      } else {
        instance.selectCell(nextRow, col);
      }
    }

    function selectPrevCell(row, col, instance) {

      var prevRow = row - 1;
      var prevCell = prevRow >= 0 ? instance.getCell(prevRow, col) : null;

      if (!prevCell) {
        return;
      }

      if (ContextMenu.utils.isSeparator(prevCell) || ContextMenu.utils.isDisabled(prevCell)) {
        selectPrevCell(prevRow, col, instance);
      } else {
        instance.selectCell(prevRow, col);
      }

    }

    function openSubMenu(instance, contextMenu, cell, row) {
      var selectedItem = instance.getData()[row];
      var items = contextMenu.getItems(selectedItem.submenu);
      var subMenu = contextMenu.createMenu(selectedItem.name, row);
      var coords = cell.getBoundingClientRect();
      var subMenuInstance = contextMenu.show(subMenu, items);

      contextMenu.setSubMenuPosition(coords, subMenu);
      subMenuInstance.selectCell(0, 0);
    }
  };

  function findByKey(items, key) {
    for (var i = 0, ilen = items.length; i < ilen; i++) {
      if (items[i].key === key) {
        return items[i];
      }
    }
  }

  function findIndexByKey(items, key) {
    for (var i = 0, ilen = items.length; i < ilen; i++) {
      if (items[i].key === key) {
        return i;
      }
    }
  }

  ContextMenu.prototype.getItems = function (items) {
    var menu, item;

    function ContextMenuItem(rawItem) {
      if (typeof rawItem == 'string') {
        this.name = rawItem;
      } else {
        Handsontable.helper.extend(this, rawItem);
      }
    }

    ContextMenuItem.prototype = items;

    if (items && items.items) {
      items = items.items;
    }

    if (items === true) {
      items = this.defaultOptions.items;
    }

    if (1 == 1) {
      menu = [];
      for (var key in items) {
        if (items.hasOwnProperty(key)) {
          if (typeof items[key] === 'string') {
            item = findByKey(this.defaultOptions.items, items[key]);
          }
          else {
            item = findByKey(this.defaultOptions.items, key);
          }
          if (!item) {
            item = items[key];
          }
          item = new ContextMenuItem(item);
          if (typeof items[key] === 'object') {
            Handsontable.helper.extend(item, items[key]);
          }
          if (!item.key) {
            item.key = key;
          }
          menu.push(item);
        }
      }
    }

    return menu;
  };

  ContextMenu.prototype.setSubMenuPosition = function (coords, menu) {
    var scrollTop = Handsontable.Dom.getWindowScrollTop();
    var scrollLeft = Handsontable.Dom.getWindowScrollLeft();

    var cursor = {
      top: scrollTop + coords.top,
      topRelative: coords.top,
      left: coords.left,
      leftRelative: coords.left - scrollLeft,
      scrollTop: scrollTop,
      scrollLeft: scrollLeft,
      cellHeight: coords.height,
      cellWidth: coords.width
    };

    if (this.menuFitsBelowCursor(cursor, menu, document.body.clientWidth)) {
      this.positionMenuBelowCursor(cursor, menu, true);
    } else {
      if (this.menuFitsAboveCursor(cursor, menu)) {
        this.positionMenuAboveCursor(cursor, menu, true);
      } else {
        this.positionMenuBelowCursor(cursor, menu, true);
      }
    }

    if (this.menuFitsOnRightOfCursor(cursor, menu, document.body.clientWidth)) {
      this.positionMenuOnRightOfCursor(cursor, menu, true);
    } else {
      this.positionMenuOnLeftOfCursor(cursor, menu, true);
    }
  };

  ContextMenu.prototype.setMenuPosition = function (event, menu) {
    // for ie8
    // http://msdn.microsoft.com/en-us/library/ie/ff974655(v=vs.85).aspx
    var scrollTop = Handsontable.Dom.getWindowScrollTop();
    var scrollLeft = Handsontable.Dom.getWindowScrollLeft();
    var cursorY = event.pageY || (event.clientY + scrollTop);
    var cursorX = event.pageX || (event.clientX + scrollLeft);

    var cursor = {
      top: cursorY,
      topRelative: cursorY - scrollTop,
      left: cursorX,
      leftRelative: cursorX - scrollLeft,
      scrollTop: scrollTop,
      scrollLeft: scrollLeft,
      cellHeight: event.target.clientHeight,
      cellWidth: event.target.clientWidth
    };

    if (this.menuFitsBelowCursor(cursor, menu, document.body.clientHeight)) {
      this.positionMenuBelowCursor(cursor, menu);
    } else {
      if (this.menuFitsAboveCursor(cursor, menu)) {
        this.positionMenuAboveCursor(cursor, menu);
      } else {
        this.positionMenuBelowCursor(cursor, menu);
      }
    }

    if (this.menuFitsOnRightOfCursor(cursor, menu, document.body.clientWidth)) {
      this.positionMenuOnRightOfCursor(cursor, menu);
    } else {
      this.positionMenuOnLeftOfCursor(cursor, menu);
    }

  };

  ContextMenu.prototype.menuFitsAboveCursor = function (cursor, menu) {
    return cursor.topRelative >= menu.offsetHeight;
  };

  ContextMenu.prototype.menuFitsBelowCursor = function (cursor, menu, viewportHeight) {
    return cursor.topRelative + menu.offsetHeight <= viewportHeight;
  };

  ContextMenu.prototype.menuFitsOnRightOfCursor = function (cursor, menu, viewportHeight) {
    return cursor.leftRelative + menu.offsetWidth <= viewportHeight;
  };

  ContextMenu.prototype.positionMenuBelowCursor = function (cursor, menu) {

    menu.style.top = cursor.top + 'px';
  };

  ContextMenu.prototype.positionMenuAboveCursor = function (cursor, menu, subMenu) {
    if (subMenu) {
      menu.style.top = (cursor.top + cursor.cellHeight - menu.offsetHeight) + 'px';
    } else {
      menu.style.top = (cursor.top - menu.offsetHeight) + 'px';
    }
  };

  ContextMenu.prototype.positionMenuOnRightOfCursor = function (cursor, menu, subMenu) {
    if (subMenu) {
      menu.style.left = 1 + cursor.left + cursor.cellWidth + 'px';
    } else {
      menu.style.left = 1 + cursor.left + 'px';
    }
  };

  ContextMenu.prototype.positionMenuOnLeftOfCursor = function (cursor, menu, subMenu) {
    if (subMenu) {
      menu.style.left = (cursor.left - menu.offsetWidth) + 'px';
    } else {
      menu.style.left = (cursor.left - menu.offsetWidth) + 'px';
    }
  };

  ContextMenu.utils = {};

  ContextMenu.utils.normalizeSelection = function (selRange) {
    return {
      start: selRange.getTopLeftCorner(),
      end: selRange.getBottomRightCorner()
    };
  };

  ContextMenu.utils.isSeparator = function (cell) {
    return Handsontable.Dom.hasClass(cell, 'htSeparator');
  };

  ContextMenu.utils.hasSubMenu = function (cell) {
    return Handsontable.Dom.hasClass(cell, 'htSubmenu');
  };

  ContextMenu.utils.isDisabled = function (cell) {
    return Handsontable.Dom.hasClass(cell, 'htDisabled');
  };

  ContextMenu.prototype.enable = function () {
    if (!this.enabled) {
      this.enabled = true;
      this.bindMouseEvents();
    }
  };

  ContextMenu.prototype.disable = function () {
    if (this.enabled) {
      this.enabled = false;
      this.closeAll();
      this.unbindMouseEvents();
      this.unbindTableEvents();
    }
  };

  ContextMenu.prototype.destroy = function () {
    this.closeAll();
    while (this.menus.length > 0) {
      var menu = this.menus.pop();
      this.triggerRows.pop();
      if (menu) {
        this.close(menu);
        if (!this.isMenuEnabledByOtherHotInstance()) {
          this.removeMenu(menu);
        }
      }
    }

    this.unbindMouseEvents();
    this.unbindTableEvents();

  };

  ContextMenu.prototype.isMenuEnabledByOtherHotInstance = function () {
    var hotContainers = document.querySelectorAll('.handsontable');
    var menuEnabled = false;

    for (var i = 0, len = hotContainers.length; i < len; i++) {
      var instance = this.htMenus[hotContainers[i].id];
      if (instance && instance.getSettings().contextMenu) {
        menuEnabled = true;
        break;
      }
    }

    return menuEnabled;
  };

  ContextMenu.prototype.removeMenu = function (menu) {
    if (menu.parentNode) {
      this.menu.parentNode.removeChild(menu);
    }
  };

  ContextMenu.SEPARATOR = {name: "---------"};

  function updateHeight() {
    /* jshint ignore:start */
    if (this.rootElement.className.indexOf('htContextMenu')) {
      return;
    }

    var realSeparatorHeight = 0,
      realEntrySize = 0,
      dataSize = this.getSettings().data.length;

    for (var i = 0; i < dataSize; i++) {
      if (this.getSettings().data[i].name == ContextMenu.SEPARATOR.name) {
        realSeparatorHeight += 2;
      } else {
        realEntrySize += 26;
      }
    }

    this.view.wt.wtScrollbars.vertical.fixedContainer.style.height = realEntrySize + realSeparatorHeight + "px";
    /* jshint ignore:end */
  }

  function init() {
    /* jshint ignore:start */
    var instance = this;
    /* jshint ignore:end */
    var contextMenuSetting = instance.getSettings().contextMenu;
    var customOptions = Handsontable.helper.isObject(contextMenuSetting) ? contextMenuSetting : {};

    if (contextMenuSetting) {
      if (!instance.contextMenu) {
        instance.contextMenu = new ContextMenu(instance, customOptions);
      }
      instance.contextMenu.enable();
    } else if (instance.contextMenu) {
      instance.contextMenu.destroy();
      delete instance.contextMenu;
    }
  }

  Handsontable.hooks.add('afterInit', init);
  Handsontable.hooks.add('afterUpdateSettings', init);
  Handsontable.hooks.add('afterInit', updateHeight);

  Handsontable.PluginHooks.register('afterContextMenuDefaultOptions');

  Handsontable.ContextMenu = ContextMenu;

})(Handsontable);
