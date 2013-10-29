describe('ContextMenu', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();

      if ($('ul.context-menu-list').length > 0) {
        $.contextMenu('destroy');
      }
    }
  });



  it("should open menu after right click on table cell", function () {
    var hot = handsontable({
      contextMenu: true
    });

    expect(hot.contextMenu).toBeDefined();
    expect($(hot.contextMenu.menu).is(':visible')).toBe(false);

    contextMenu();

    expect($(hot.contextMenu.menu).is(':visible')).toBe(true);


  });

  it("should open menu after right click active cell border", function () {
    var hot = handsontable({
      contextMenu: true
    });

    expect(hot.contextMenu).toBeDefined();
    expect($(hot.contextMenu.menu).is(':visible')).toBe(false);

    selectCell(0, 0);
    var cellOffset = $(getCell(0, 0)).offset();

    var event = $.Event('contextmenu', {
       pageX: cellOffset.left,
       pageY: cellOffset.top
    });

    this.$container.find('.wtBorder.current:eq(0)').trigger(event);

    expect($(hot.contextMenu.menu).is(':visible')).toBe(true);


  });

  it("should close menu after click", function () {
    var hot = handsontable({
      contextMenu: true
    });

    contextMenu();

    expect($(hot.contextMenu.menu).is(':visible')).toBe(true);

    mouseDown(this.$container);

    expect($(hot.contextMenu.menu).is(':visible')).toBe(false);

  });

  describe("menu disabled", function () {

    it("should not open menu after right click", function () {
      var hot = handsontable({
        contextMenu: true
      });

      hot.contextMenu.disable();

      expect($(hot.contextMenu.menu).is(':visible')).toBe(false);

      contextMenu();

      expect($(hot.contextMenu.menu).is(':visible')).toBe(false);

    });

    it("should not create context menu if it's disabled in constructor options", function () {
      var hot = handsontable({
        contextMenu: false
      });

      expect(hot.contextMenu).toBeUndefined();

    });

    it("should reenable menu", function () {
      var hot = handsontable({
        contextMenu: true
      });

      hot.contextMenu.disable();

      expect($(hot.contextMenu.menu).is(':visible')).toBe(false);

      contextMenu();

      expect($(hot.contextMenu.menu).is(':visible')).toBe(false);

      hot.contextMenu.enable();

      contextMenu();

      expect($(hot.contextMenu.menu).is(':visible')).toBe(true);
    });

    it("should reenable menu with updateSettings when it was disabled in constructor", function () {
      var hot = handsontable({
        contextMenu: false
      });

      expect(hot.contextMenu).toBeUndefined();

      updateSettings({
        contextMenu: true
      });

      expect(hot.contextMenu).toBeDefined();

      expect($(hot.contextMenu.menu).is(':visible')).toBe(false);

      contextMenu();

      expect($(hot.contextMenu.menu).is(':visible')).toBe(true);
    });

    it("should disable menu with updateSettings when it was enabled in constructor", function () {
      var hot = handsontable({
        contextMenu: true
      });

      expect(hot.contextMenu).toBeDefined();
      expect($('.htContextMenu').length).toEqual(1);

      updateSettings({
        contextMenu: false
      });

      expect(hot.contextMenu).toBeUndefined();
      expect($('.htContextMenu').length).toEqual(0);
    });

  });

  describe("menu destroy", function () {

    it("should destroy menu together with handsontable", function () {
      var hot = handsontable({
        contextMenu: true
      });

      expect($('.htContextMenu').length).toEqual(1);

      destroy();

      expect($('.htContextMenu').length).toEqual(0);

    });

    it("should close context menu when HOT is being destroyed", function () {
      var hot = handsontable({
        contextMenu: true
      });

      contextMenu();

      expect($(hot.contextMenu.menu).is(':visible')).toBe(true);

      destroy();

      expect($(hot.contextMenu.menu).is(':visible')).toBe(false);

    });

  });

  describe("default context menu actions", function () {

    it("should display the default set of actions", function () {
      var hot = handsontable({
        contextMenu: true
      });

      contextMenu();

      var items = $('.htContextMenu tbody td');
      var actions = items.not('.htSeparator');
      var separators = items.filter('.htSeparator');

      expect(actions.length).toEqual(8);
      expect(separators.length).toEqual(3);

      expect(actions.text()).toEqual([
        'Insert row above',
        'Insert row below',
        'Insert column on the left',
        'Insert column on the right',
        'Remove row',
        'Remove column',
        'Undo',
        'Redo'
      ].join(''));

    });

    it("should insert row above selection", function () {
      var hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true
      });

      var afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');
      hot.addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(4);

      selectCell(1, 0, 3, 0);

      contextMenu();

      $(hot.contextMenu.menu).find('tbody td').not('.htSeparator').eq(0).trigger('mousedown'); //Insert row above

      expect(afterCreateRowCallback).toHaveBeenCalledWith(1, 1, undefined, undefined, undefined);
      expect(countRows()).toEqual(5);
    });

    it("should insert row above selection (reverse selection)", function () {
      var hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true
      });

      var afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');
      hot.addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(4);

      selectCell(3, 0, 1, 0);

      contextMenu();

      $(hot.contextMenu.menu).find('tbody td').not('.htSeparator').eq(0).trigger('mousedown'); //Insert row above

      expect(afterCreateRowCallback).toHaveBeenCalledWith(1, 1, undefined, undefined, undefined);
      expect(countRows()).toEqual(5);
    });

    it("should insert row below selection", function () {
      var hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true
      });

      var afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');
      hot.addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(4);

      selectCell(1, 0, 3, 0);

      contextMenu();

      $(hot.contextMenu.menu).find('tbody td').not('.htSeparator').eq(1).trigger('mousedown'); //Insert row above

      expect(afterCreateRowCallback).toHaveBeenCalledWith(4, 1, undefined, undefined, undefined);
      expect(countRows()).toEqual(5);
    });

    it("should insert row below selection (reverse selection)", function () {
      var hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true
      });

      var afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');
      hot.addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(4);

      selectCell(3, 0, 1, 0);

      contextMenu();

      $(hot.contextMenu.menu).find('tbody td').not('.htSeparator').eq(1).trigger('mousedown'); //Insert row below

      expect(afterCreateRowCallback).toHaveBeenCalledWith(4, 1, undefined, undefined, undefined);
      expect(countRows()).toEqual(5);
    });

    it("should insert column on the left of selection", function () {
      var hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true
      });

      var afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');
      hot.addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      selectCell(0, 1, 0, 3);

      contextMenu();

      $(hot.contextMenu.menu).find('tbody td').not('.htSeparator').eq(2).trigger('mousedown'); //Insert col left

      expect(afterCreateColCallback).toHaveBeenCalledWith(1, 1, undefined, undefined, undefined);
      expect(countCols()).toEqual(5);
    });

    it("should insert column on the left of selection (reverse selection)", function () {
      var hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true
      });

      var afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');
      hot.addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      selectCell(0, 3, 0, 1);

      contextMenu();

      $(hot.contextMenu.menu).find('tbody td').not('.htSeparator').eq(2).trigger('mousedown'); //Insert col left

      expect(afterCreateColCallback).toHaveBeenCalledWith(1, 1, undefined, undefined, undefined);
      expect(countCols()).toEqual(5);
    });

    it("should insert column on the right of selection", function () {
      var hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true
      });

      var afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');
      hot.addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      selectCell(0, 1, 0, 3);

      contextMenu();

      $(hot.contextMenu.menu).find('tbody td').not('.htSeparator').eq(3).trigger('mousedown'); //Insert col right

      expect(afterCreateColCallback).toHaveBeenCalledWith(4, 1, undefined, undefined, undefined);
      expect(countCols()).toEqual(5);
    });

    it("should insert column on the right of selection (reverse selection)", function () {
      var hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true
      });

      var afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');
      hot.addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      selectCell(0, 3, 0, 1);

      contextMenu();

      $(hot.contextMenu.menu).find('tbody td').not('.htSeparator').eq(3).trigger('mousedown'); //Insert col right

      expect(afterCreateColCallback).t
    });

    it("should remove selected rows", function () {
      var hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true
      });

      var afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');
      hot.addHook('afterRemoveRow', afterRemoveRowCallback);

      expect(countRows()).toEqual(4);

      selectCell(1, 0, 3, 0);

      contextMenu();

      $(hot.contextMenu.menu).find('tbody td').not('.htSeparator').eq(4).trigger('mousedown'); //Remove row

      expect(afterRemoveRowCallback).toHaveBeenCalledWith(1, 3, undefined, undefined, undefined);
      expect(countRows()).toEqual(1);
    });

    it("should remove selected rows (reverse selection)", function () {
      var hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true
      });

      var afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');
      hot.addHook('afterRemoveRow', afterRemoveRowCallback);

      expect(countRows()).toEqual(4);

      selectCell(3, 0, 1, 0);

      contextMenu();

      $(hot.contextMenu.menu).find('tbody td').not('.htSeparator').eq(4).trigger('mousedown'); //Remove row

      expect(afterRemoveRowCallback).toHaveBeenCalledWith(1, 3, undefined, undefined, undefined);
      expect(countRows()).toEqual(1);
    });

    it("should remove selected columns", function () {
      var hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true
      });

      var afterRemoveColCallback = jasmine.createSpy('afterRemoveColCallback');
      hot.addHook('afterRemoveCol', afterRemoveColCallback);

      expect(countCols()).toEqual(4);

      selectCell(0, 1, 0, 3);

      contextMenu();

      $(hot.contextMenu.menu).find('tbody td').not('.htSeparator').eq(5).trigger('mousedown'); //Remove col

      expect(afterRemoveColCallback).toHaveBeenCalledWith(1, 3, undefined, undefined, undefined);
      expect(countCols()).toEqual(1);
    });

    it("should remove selected columns (reverse selection)", function () {
      var hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true
      });

      var afterRemoveColCallback = jasmine.createSpy('afterRemoveColCallback');
      hot.addHook('afterRemoveCol', afterRemoveColCallback);

      expect(countCols()).toEqual(4);

      selectCell(0, 3, 0, 1);

      contextMenu();

      $(hot.contextMenu.menu).find('tbody td').not('.htSeparator').eq(5).trigger('mousedown'); //Remove col

      expect(afterRemoveColCallback).toHaveBeenCalledWith(1, 3, undefined, undefined, undefined);
      expect(countCols()).toEqual(1);
    });

    it("should undo changes", function () {
      var hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true
      });

      selectCell(0, 0);

      expect(getDataAtCell(0, 0)).toEqual('A0');

      setDataAtCell(0, 0, 'XX');

      expect(getDataAtCell(0, 0)).toEqual('XX');

      contextMenu();

      $(hot.contextMenu.menu).find('tbody td').not('.htSeparator').eq(6).trigger('mousedown'); //Undo

      expect(getDataAtCell(0, 0)).toEqual('A0');
    });

    it("should redo changes", function () {
      var hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true
      });

      selectCell(0, 0);

      expect(getDataAtCell(0, 0)).toEqual('A0');

      setDataAtCell(0, 0, 'XX');

      expect(getDataAtCell(0, 0)).toEqual('XX');

      hot.undo();

      expect(getDataAtCell(0, 0)).toEqual('A0');

      contextMenu();

      $(hot.contextMenu.menu).find('tbody td').not('.htSeparator').eq(7).trigger('mousedown'); //Redo

      expect(getDataAtCell(0, 0)).toEqual('XX');
    });

    it("should display only the specified actions", function () {
      var hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['remove_row', 'undo']
      });

      contextMenu();

      expect($(hot.contextMenu.menu).find('tbody td').length).toEqual(2);
    });



  });

  describe("disabling actions", function () {

    it("should disable undo and redo action if undoRedo plugin is not enabled ", function () {
      var hot = handsontable({
        contextMenu: true,
        undoRedo: false
      });

      contextMenu();
      var $menu = $(hot.contextMenu.menu);

      expect($menu.find('tbody td:eq(9)').text()).toEqual('Undo');
      expect($menu.find('tbody td:eq(9)').hasClass('htDisabled')).toBe(true);
      expect($menu.find('tbody td:eq(10)').text()).toEqual('Redo');
      expect($menu.find('tbody td:eq(10)').hasClass('htDisabled')).toBe(true);

    });

    it("should disable undo when there is nothing to undo ", function () {
      var hot = handsontable({
        contextMenu: true
      });

      contextMenu();
      var $menu = $(hot.contextMenu.menu);

      expect(hot.undoRedo.isUndoAvailable()).toBe(false);
      expect($menu.find('tbody td:eq(9)').text()).toEqual('Undo');
      expect($menu.find('tbody td:eq(9)').hasClass('htDisabled')).toBe(true);

      closeContextMenu();

      setDataAtCell(0, 0, 'foo');

      contextMenu();

      expect(hot.undoRedo.isUndoAvailable()).toBe(true);
      expect($menu.find('tbody td:eq(9)').hasClass('htDisabled')).toBe(false);

    });

    it("should disable redo when there is nothing to redo ", function () {
      var hot = handsontable({
        contextMenu: true
      });

      contextMenu();
      var $menu = $(hot.contextMenu.menu);

      expect(hot.undoRedo.isRedoAvailable()).toBe(false);
      expect($menu.find('tbody td:eq(10)').text()).toEqual('Redo');
      expect($menu.find('tbody td:eq(10)').hasClass('htDisabled')).toBe(true);

      closeContextMenu();

      setDataAtCell(0, 0, 'foo');
      hot.undo();

      contextMenu();

      expect(hot.undoRedo.isRedoAvailable()).toBe(true);
      expect($menu.find('tbody td:eq(10)').hasClass('htDisabled')).toBe(false);

    });

    it('should disable Insert row in context menu when maxRows is reached', function () {
      var hot = handsontable({
        contextMenu: true,
        maxRows: 6
      });

      contextMenu();
      var $menu = $(hot.contextMenu.menu);

      expect($menu.find('tbody td:eq(0)').text()).toEqual('Insert row above');
      expect($menu.find('tbody td:eq(0)').hasClass('htDisabled')).toBe(false);
      expect($menu.find('tbody td:eq(1)').text()).toEqual('Insert row below');
      expect($menu.find('tbody td:eq(1)').hasClass('htDisabled')).toBe(false);

      closeContextMenu();

      alter('insert_row');

      contextMenu();

      expect($menu.find('tbody td:eq(0)').hasClass('htDisabled')).toBe(true);
      expect($menu.find('tbody td:eq(1)').hasClass('htDisabled')).toBe(true);

    });

    it('should disable Insert col in context menu when maxCols is reached', function () {
      var hot = handsontable({
        contextMenu: true,
        maxCols: 6
      });

      contextMenu();
      var $menu = $(hot.contextMenu.menu);

      expect($menu.find('tbody td:eq(3)').text()).toEqual('Insert column on the left');
      expect($menu.find('tbody td:eq(3)').hasClass('htDisabled')).toBe(false);
      expect($menu.find('tbody td:eq(4)').text()).toEqual('Insert column on the right');
      expect($menu.find('tbody td:eq(4)').hasClass('htDisabled')).toBe(false);

      closeContextMenu();

      alter('insert_col');

      contextMenu();

      expect($menu.find('tbody td:eq(3)').hasClass('htDisabled')).toBe(true);
      expect($menu.find('tbody td:eq(4)').hasClass('htDisabled')).toBe(true);

    });
  });

  describe("custom options", function () {
    it("should have custom items list", function () {

      var callback1 = jasmine.createSpy('callback1');
      var callback2 = jasmine.createSpy('callback2');

      var hot = handsontable({
        contextMenu: {
          items: {
            cust1: {
              name: 'CustomItem1',
              callback: callback1
            },
            cust2: {
              name: 'CustomItem2',
              callback: callback2
            }
          }
        }
      });

      contextMenu();
      var $menu = $(hot.contextMenu.menu);

      expect($menu.find('tbody td').length).toEqual(2);
      expect($menu.find('tbody td').text()).toEqual(['CustomItem1', 'CustomItem2'].join(''));

      $menu.find('tbody td:eq(0)').trigger('mousedown');

      expect(callback1.calls.length).toEqual(1);
      expect(callback2.calls.length).toEqual(0);

      contextMenu();
      $menu.find('tbody td:eq(1)').trigger('mousedown');

      expect(callback1.calls.length).toEqual(1);
      expect(callback2.calls.length).toEqual(1);

    });

    it("should enable to define item options globally", function () {

      var callback = jasmine.createSpy('callback');

      var hot = handsontable({
        contextMenu: {
          callback: callback,
          items: {
            cust1: {
              name: 'CustomItem1'
            },
            cust2: {
              name: 'CustomItem2'
            }
          }
        }
      });

      contextMenu();
      var $menu = $(hot.contextMenu.menu);

      $menu.find('tbody td:eq(0)').trigger('mousedown');

      expect(callback.calls.length).toEqual(1);

      contextMenu();
      $menu.find('tbody td:eq(1)').trigger('mousedown');

      expect(callback.calls.length).toEqual(2);

    });

    it("should override default items options", function () {
      var callback = jasmine.createSpy('callback');

      var hot = handsontable({
        contextMenu: {
          items: {
            'remove_row': {
              callback: callback
            },
            'remove_col': {
              name: 'Delete column'
            }
          }
        }
      });

      contextMenu();
      var $menu = $(hot.contextMenu.menu);

      expect($menu.find('tbody td').length).toEqual(2);
      expect($menu.find('tbody td').text()).toEqual(['Remove row', 'Delete column'].join(''));

      $menu.find('tbody td:eq(0)').trigger('mousedown');

      expect(callback.calls.length).toEqual(1);

      expect(countCols()).toEqual(5);

      contextMenu();
      $menu.find('tbody td:eq(1)').trigger('mousedown');

      expect(countCols()).toEqual(4);

    });

    it("should fire item callback after item has been clicked", function () {

      var customItem = {
        name: 'Custom item',
        callback: function(){}
      };

      spyOn(customItem, 'callback');

      var hot = handsontable({
        contextMenu: {
          items: {
            'customItemKey' : customItem
          }
        }
      });

      contextMenu();
      var $menu = $(hot.contextMenu.menu);

      $menu.find('tbody td:eq(0)').trigger('mousedown');

      expect(customItem.callback.calls.length).toEqual(1);
      expect(customItem.callback.calls[0].args[0]).toEqual('customItemKey');

    });

  });






  //TODO rewrite these tests for new context menu that uses Handsontable
  xit('should work properly (remove row) after destroy and new init', function () {
    var test = function () {
      handsontable({
        startRows: 5,
        contextMenu: ['remove_row']
      });
      selectCell(0, 0);
      contextMenu();
      $('ul.context-menu-list li').first().trigger('mouseup.contextMenu');
      expect(getData().length).toEqual(4);
    };
    test();
    destroy();

    waits(50); //jquery.contextMenu.js waits that long to hide background so we must wait too

    runs(function () {
      test();
    });
  });

  xit("should apply enabling/disabling contextMenu using updateSetting only to particular instance of HOT ", function () {
    this.$container2 = $('<div id="' + id + '-2"></div>').appendTo('body');

    var hot1 = handsontable({
      contextMenu: false
    });

    this.$container2.handsontable({
      contextMenu: true
    });

    var hot2 = this.$container2.handsontable('getInstance');

    contextMenu();
    expect($('ul.context-menu-list').is(':visible')).toBe(false);

    contextMenu2();
    expect($('ul.context-menu-list').is(':visible')).toBe(true);

    hideContextMenu.call(hot2);

    waitsFor(function () {
      return $('ul.context-menu-list:visible').length == 0
    }, 'Hiding context menu', 1000);

    runs(function () {

      hot1.updateSettings({
        contextMenu: true
      });

      hot2.updateSettings({
        contextMenu: false
      });

      contextMenu2();
      expect($('ul.context-menu-list').is(':visible')).toBe(false);

      contextMenu();
      expect($('ul.context-menu-list').is(':visible')).toBe(true);

      hot2.destroy();
      this.$container2.remove();
    });

    function contextMenu2() {
      var ev = $.Event('contextmenu');
      ev.button = 2;
      var selector = "#" + hot2.rootElement.attr('id') + ' table, #' + hot2.rootElement.attr('id') + ' div';
      $(selector).trigger(ev);
    }

    function hideContextMenu() {
      var selector = "#" + this.rootElement.attr('id') + ' table, #' + this.rootElement.attr('id') + ' div';
      $(selector).contextMenu('hide')
    }

  });


});