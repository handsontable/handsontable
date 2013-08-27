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

  it('should show enabled Insert row (above and below) in context menu', function () {
    handsontable({
      startRows: 5,
      contextMenu: ['row_above', 'row_below']
    });
    selectCell(4, 4);
    contextMenu();
    expect($('ul.context-menu-list li').length).toEqual(2);
    expect($('ul.context-menu-list li.disabled').length).toEqual(0);
  });

  it('should disable Insert row in context menu when maxRows is reached', function () {
    handsontable({
      startRows: 5,
      maxRows: 5,
      contextMenu: ['row_above', 'row_below']
    });
    selectCell(4, 4);
    contextMenu();
    expect($('ul.context-menu-list li').length).toEqual(2);
    expect($('ul.context-menu-list li.disabled').length).toEqual(2);
  });

  it('should work properly (remove row) after destroy and new init', function () {
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

  it('should destroy contextMenu when Handsotnable is destroyed', function () {
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
    expect($('ul.context-menu-list').length).toEqual(1);
    destroy();
    expect($('ul.context-menu-list').length).toEqual(0);
  });

  it('should destroy contextMenu when Handsotnable is destroyed', function () {
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
    expect($('ul.context-menu-list').length).toEqual(1);
    destroy();
    expect($('ul.context-menu-list').length).toEqual(0);
  });

  it("should be possible to enable contextMenu using updateSettings", function () {
    handsontable({
      contextMenu: false
    });

    expect($('ul.context-menu-list').length).toBe(0);

    updateSettings({
      contextMenu: true
    });

    expect($('ul.context-menu-list').length).toBe(1);

  });

  it("should be possible to disable contextMenu using updateSettings", function () {
    handsontable({
      contextMenu: true
    });

    expect($('ul.context-menu-list').length).toBe(1);

    updateSettings({
      contextMenu: false
    });

    expect($('ul.context-menu-list').length).toBe(0);

  });

  it("should be possible to enable/disable contextMenu multiple times, using updateSettings", function () {
    handsontable({
      contextMenu: true
    });

    expect($('ul.context-menu-list').length).toBe(1);

    expect($('ul.context-menu-list').is(':visible')).toBe(false);
    contextMenu();
    expect($('ul.context-menu-list').is(':visible')).toBe(true);


    updateSettings({
      contextMenu: false
    });

    expect($('ul.context-menu-list').length).toBe(0);

    expect($('ul.context-menu-list').is(':visible')).toBe(false);
    contextMenu();
    expect($('ul.context-menu-list').is(':visible')).toBe(false);

    updateSettings({
      contextMenu: true
    });

    expect($('ul.context-menu-list').length).toBe(1);

    expect($('ul.context-menu-list').is(':visible')).toBe(false);
    contextMenu();
    expect($('ul.context-menu-list').is(':visible')).toBe(true);

  });

  it("should apply enabling/disabling contextMenu using updateSetting only to particular instance of HOT ", function () {
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

    $('ul.context-menu-list li').not('.context-menu-separator').eq(0).trigger('mouseup.contextMenu'); //Insert row above

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

    $('ul.context-menu-list li').not('.context-menu-separator').eq(0).trigger('mouseup.contextMenu'); //Insert row above

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

    $('ul.context-menu-list li').not('.context-menu-separator').eq(1).trigger('mouseup.contextMenu'); //Insert row below

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

    $('ul.context-menu-list li').not('.context-menu-separator').eq(1).trigger('mouseup.contextMenu'); //Insert row below

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

    $('ul.context-menu-list li').not('.context-menu-separator').eq(2).trigger('mouseup.contextMenu'); //Insert col on he left

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

    $('ul.context-menu-list li').not('.context-menu-separator').eq(2).trigger('mouseup.contextMenu'); //Insert col on he left

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

    $('ul.context-menu-list li').not('.context-menu-separator').eq(3).trigger('mouseup.contextMenu'); //Insert col on he right

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

    $('ul.context-menu-list li').not('.context-menu-separator').eq(3).trigger('mouseup.contextMenu'); //Insert col on he right

    expect(afterCreateColCallback).toHaveBeenCalledWith(4, 1, undefined, undefined, undefined);
    expect(countCols()).toEqual(5);
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

    $('ul.context-menu-list li').not('.context-menu-separator').eq(4).trigger('mouseup.contextMenu'); //Remove row

    expect(countRows()).toEqual(1);
    expect(afterRemoveRowCallback).toHaveBeenCalledWith(1, 3, undefined, undefined, undefined);
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

    $('ul.context-menu-list li').not('.context-menu-separator').eq(4).trigger('mouseup.contextMenu'); //Remove row

    expect(countRows()).toEqual(1);
    expect(afterRemoveRowCallback).toHaveBeenCalledWith(1, 3, undefined, undefined, undefined);
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

    $('ul.context-menu-list li').not('.context-menu-separator').eq(5).trigger('mouseup.contextMenu'); //Remove col

    expect(countCols()).toEqual(1);
    expect(afterRemoveColCallback).toHaveBeenCalledWith(1, 3, undefined, undefined, undefined);
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

    $('ul.context-menu-list li').not('.context-menu-separator').eq(5).trigger('mouseup.contextMenu'); //Remove col

    expect(countCols()).toEqual(1);
    expect(afterRemoveColCallback).toHaveBeenCalledWith(1, 3, undefined, undefined, undefined);
  });
});