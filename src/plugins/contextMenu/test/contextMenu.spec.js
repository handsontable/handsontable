describe('ContextMenu', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it("should update context menu items by calling `updateSettings` method", function () {
    var hot = handsontable({
      contextMenu: ['row_above', 'row_below', '---------', 'remove_row'],
      height: 100
    });

    contextMenu();

    var items = $('.htContextMenu tbody td');
    var actions = items.not('.htSeparator');
    var separators = items.filter('.htSeparator');

    expect(actions.length).toEqual(3);
    expect(separators.length).toEqual(1);

    expect(actions.text()).toEqual([
      'Insert row above',
      'Insert row below',
      'Remove row',
    ].join(''));

    hot.updateSettings({
      contextMenu: ['remove_row']
    });

    contextMenu();

    var items = $('.htContextMenu tbody td');
    var actions = items.not('.htSeparator');
    var separators = items.filter('.htSeparator');

    expect(actions.length).toEqual(1);
    expect(separators.length).toEqual(0);

    expect(actions.text()).toEqual([
      'Remove row',
    ].join(''));

    hot.updateSettings({
      contextMenu: {
        items: {
          remove_col: true,
          hsep1: '---------',
          custom: {name: 'My custom item'},
        }
      }
    });

    contextMenu();

    var items = $('.htContextMenu tbody td');
    var actions = items.not('.htSeparator');
    var separators = items.filter('.htSeparator');

    expect(actions.length).toEqual(2);
    expect(separators.length).toEqual(1);

    expect(actions.text()).toEqual([
      'Remove column',
      'My custom item',
    ].join(''));
  });

  describe("menu opening", function () {
    it("should open menu after right click on table cell", function () {
      var hot = handsontable({
        contextMenu: true,
        height: 100
      });

      expect(hot.getPlugin('contextMenu')).toBeDefined();
      expect($('.htContextMenu').is(':visible')).toBe(false);

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it("should open menu after right click on header cell when only header cells are visible", function () {
      var hot = handsontable({
        data: [],
        colHeaders: ['Year', 'Kia'],
        columns: [{"data":0}, {"data":1}],
        contextMenu: true,
        height: 100
      });

      expect(hot.getPlugin('contextMenu')).toBeDefined();
      expect($('.htContextMenu').is(':visible')).toBe(false);

      contextMenu(hot.rootElement.querySelector('.ht_clone_top thead th'));

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it("should open menu after right click on header corner", function () {
      var hot = handsontable({
        data: [],
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        height: 100
      });

      expect(hot.getPlugin('contextMenu')).toBeDefined();
      expect($('.htContextMenu').is(':visible')).toBe(false);

      contextMenu(hot.rootElement.querySelector('.ht_clone_top_left_corner thead th'));

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it("should open menu after right click active cell border", function () {
      var hot = handsontable({
        contextMenu: true,
        height: 100
      });

      expect(hot.getPlugin('contextMenu')).toBeDefined();
      expect($('.htContextMenu').is(':visible')).toBe(false);

      selectCell(0, 0);

			this.$container.find('.wtBorder.current:eq(0)').simulate('contextmenu');

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });
  });

  describe('menu closing', function () {
    it("should close menu after click", function () {
      var hot = handsontable({
        contextMenu: true,
        height: 100
      });

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      mouseDown(this.$container);

      expect($('.htContextMenu').is(':visible')).toBe(false);
    });
  });

  describe("menu disabled", function () {

    it("should not open menu after right click", function () {
      var hot = handsontable({
        contextMenu: true,
        height: 100
      });

			hot.getPlugin('contextMenu').disablePlugin();

      expect($('.htContextMenu').is(':visible')).toBe(false);

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it("should not create context menu if it's disabled in constructor options", function () {
      var hot = handsontable({
        contextMenu: false,
        height: 100
      });

      expect(hot.getPlugin('contextMenu').isEnabled()).toBe(false);
    });

    it("should reenable menu", function () {
      var hot = handsontable({
        contextMenu: true,
        height: 100
      });

      hot.getPlugin('contextMenu').disablePlugin();

      expect($('.htContextMenu').is(':visible')).toBe(false);

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(false);

      hot.getPlugin('contextMenu').enablePlugin();

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it("should reenable menu with updateSettings when it was disabled in constructor", function () {
      var hot = handsontable({
        contextMenu: false,
        height: 100
      });

      expect(hot.getPlugin('contextMenu').isEnabled()).toBe(false);

      updateSettings({
        contextMenu: true
      });

      expect(hot.getPlugin('contextMenu').isEnabled()).toBe(true);

      expect($('.htContextMenu').is(':visible')).toBe(false);

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it("should disable menu with updateSettings when it was enabled in constructor", function () {
      var hot = handsontable({
        contextMenu: true,
        height: 100
      });


      expect(hot.getPlugin('contextMenu').isEnabled()).toBe(true);
      //expect($('.htContextMenu').length).toEqual(1);

      updateSettings({
        contextMenu: false
      });

      expect(hot.getPlugin('contextMenu').isEnabled()).toBe(false);
      //expect($('.htContextMenu').length).toEqual(0);
    });

    it('should work properly (remove row) after destroy and new init', function () {
      var test = function () {
        handsontable({
          startRows: 5,
          contextMenu: ['remove_row'],
          height: 100
        });
        selectCell(0, 0);
        contextMenu();

      $('.htContextMenu .ht_master .htCore tbody').find('td').not('.htSeparator').eq(0).simulate('mousedown');
        expect(getData().length).toEqual(4);
      };
      test();

      destroy();

      test();
    });

  });

  describe("menu hidden items", function() {
    it("should remove separators from top, bottom and duplicated", function() {
      var hot = handsontable({
        contextMenu: [
          '---------',
          '---------',
          'row_above',
          '---------',
          '---------',
          'row_below',
          '---------',
          'remove_row'
        ],
        height: 100
      });

      contextMenu();

      var items = $('.htContextMenu tbody td');
      var actions = items.not('.htSeparator');
      var separators = items.filter('.htSeparator');

      expect(actions.length).toEqual(3);
      expect(separators.length).toEqual(2);
    });

    it("should hide option if hidden function return true", function() {

      var hot = handsontable({
        startCols: 5,
        colHeaders: true,
        contextMenu: [
          {
            key: '',
            name: "Custom option",
            hidden: function () {
              return !this.selection.selectedHeader.cols;
            }
          }
        ]
      });

      contextMenu();
      var items = $('.htContextMenu tbody td');
      var actions = items.not('.htSeparator');

      expect(actions.length).toEqual(0);

      var header = $('.ht_clone_top thead th').eq(1);

      header.simulate('mousedown');
      contextMenu();

      items = $('.htContextMenu tbody td');
      actions = items.not('.htSeparator');
      expect(actions.length).toEqual(1);
    });
  });

  describe("menu destroy", function () {
    it("should close context menu when HOT is being destroyed", function () {
      var hot = handsontable({
        contextMenu: true,
        height: 100
      });

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      destroy();

      expect($('.htContextMenu').is(':visible')).toBe(false);
    });
  });

  describe("subMenu", function () {
    it ('should not open subMenu immediately', function (){
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);

      item.simulate('mouseover');

      var contextSubMenu = $('.htContextMenuSub_' + item.text()).find('tbody td');

      expect(contextSubMenu.length).toEqual(0);

      waits(250);
      runs(function() {
        var contextSubMenu = $('.htContextMenuSub_' + item.text()).find('tbody td');

        expect(contextSubMenu.length).toEqual(0);
      })
    });

    it ('should open subMenu with delay', function (){
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);

      item.simulate('mouseover');

      waits(350); // menu opens after 300ms
      runs(function() {
        var contextSubMenu = $('.htContextMenuSub_' + item.text());

        expect(contextSubMenu.length).toEqual(1);
      });
    });

    it ('should NOT open subMenu if there is no subMenu for item', function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(8);

      item.simulate('mouseover');

      expect(item.hasClass('htSubmenu')).toBe(false);

      var contextSubMenu = $('.htContextMenuSub_' + item.text());

      expect(contextSubMenu.length).toEqual(0);
    });

    it('should open subMenu on the left of main menu if on the right there\'s no space left', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4,  Math.floor(window.innerWidth / 50)),
        contextMenu: true,
        width: window.innerWidth
      });

      selectCell(0, countCols() - 1);
      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      var contextMenuRoot = $('.htContextMenu');

      item.simulate('mouseover');

      expect(item.text()).toBe('Alignment');
      expect(item.hasClass('htSubmenu')).toBe(true);

      var contextSubMenu = $('.htContextMenuSub_' + item.text());

      expect(contextSubMenu.offset().left).toBeLessThan(contextMenuRoot.offset().left - contextSubMenu.width() + 30); // 30 - scroll
    });

    it('should open subMenu on the right of main menu if there\'s free space', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4,  Math.floor(window.innerWidth / 50)),
        contextMenu: true,
        width: window.innerWidth
      });

      selectCell(0, countCols() - 9);
      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      var contextMenuRoot = $('.htContextMenu');

      item.simulate('mouseover');

      waits(350) // waits for submenu open delay
      runs(function() {
        expect(item.text()).toBe('Alignment');
        expect(item.hasClass('htSubmenu')).toBe(true);

        var contextSubMenu = $('.htContextMenuSub_' + item.text());

        expect(contextSubMenu.offset().left).toBeGreaterThan(contextMenuRoot.offset().left + contextMenuRoot.width() - 30); // 30 - scroll
      })
    });

    it('should open subMenu on the left-bottom of main menu if there\'s free space', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(Math.floor(window.innerHeight / 23),  Math.floor(window.innerWidth / 50)),
        contextMenu: true,
        height: window.innerHeight,
      });

      window.scrollTo(0, document.body.clientHeight);
      selectCell(0, countCols() - 1);
      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      var contextMenuRoot = $('.htContextMenu');

      item.simulate('mouseover');

      waits(350) // waits for submenu open delay
      runs(function() {
        expect(item.text()).toBe('Alignment');
        expect(item.hasClass('htSubmenu')).toBe(true);

        var contextSubMenu = $('.htContextMenuSub_' + item.text());

        expect(contextSubMenu.offset().top).toBeAroundValue(item.offset().top);
        expect(contextSubMenu.offset().left).toBeLessThan(contextMenuRoot.offset().left - contextSubMenu.width() + 30); // 30 - scroll
      });
    });

    it('should open subMenu on the right-bottom of main menu if there\'s free space', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(Math.floor(window.innerHeight / 23),  Math.floor(window.innerWidth / 50)),
        contextMenu: true,
        height: window.innerHeight
      });

      window.scrollTo(0, document.body.clientHeight);
      selectCell(0, countCols() - 9);

      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      var contextMenuRoot = $('.htContextMenu');

      item.simulate('mouseover');

      waits(350) // waits for submenu open delay
      runs(function() {
        expect(item.text()).toBe('Alignment');
        expect(item.hasClass('htSubmenu')).toBe(true);

        var contextSubMenu = $('.htContextMenuSub_' + item.text());

        expect(contextSubMenu.offset().top).toBeAroundValue(item.offset().top);
        expect(contextSubMenu.offset().left).toBeGreaterThan(contextMenuRoot.offset().left + contextMenuRoot.width() - 30); // 30 - scroll
      });
    });

    it('should open subMenu on the left-top of main menu if there\'s no free space on bottom', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(Math.floor(window.innerHeight / 23),  Math.floor(window.innerWidth / 50)),
        contextMenu: true,
        height: window.innerHeight
      });

      selectCell(countRows() - 1, countCols() - 1);
      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      var contextMenuRoot = $('.htContextMenu');

      item.simulate('mouseover');

      waits(350) // waits for submenu open delay
      runs(function() {
        expect(item.text()).toBe('Alignment');
        expect(item.hasClass('htSubmenu')).toBe(true);

        var contextSubMenu = $('.htContextMenuSub_' + item.text());

        expect(contextSubMenu.offset().top + contextSubMenu.height() - 28).toBeAroundValue(item.offset().top);
        expect(contextSubMenu.offset().left).toBeLessThan(contextMenuRoot.offset().left - contextSubMenu.width() + 30); // 30 - scroll
      });
    });

    it('should open subMenu on the right-top of main menu if there\'s no free space on bottom', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(Math.floor(window.innerHeight / 23),  Math.floor(window.innerWidth / 50)),
        contextMenu: true,
        height: window.innerHeight
      });

      selectCell(countRows() - 1, countCols() - 9);
      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      var contextMenuRoot = $('.htContextMenu');

      item.simulate('mouseover');

      waits(350) // waits for submenu open delay
      runs(function() {
        expect(item.text()).toBe('Alignment');
        expect(item.hasClass('htSubmenu')).toBe(true);

        var contextSubMenu = $('.htContextMenuSub_' + item.text());

        expect(contextSubMenu.offset().top + contextSubMenu.height() - 28).toBeAroundValue(item.offset().top);
        expect(contextSubMenu.offset().left).toBeGreaterThan(contextMenuRoot.offset().left + contextMenuRoot.width() - 30); // 30 - scroll
      });
    });
  });

  describe("default context menu actions", function () {
    it("should display the default set of actions", function () {
      var hot = handsontable({
        contextMenu: true,
				comments: true,
        height: 100
      });

      contextMenu();

      var items = $('.htContextMenu tbody td');
      var actions = items.not('.htSeparator');
      var separators = items.filter('.htSeparator');

      expect(actions.length).toEqual(12);
      expect(separators.length).toEqual(6);

      expect(actions.text()).toEqual([
        'Insert row above',
        'Insert row below',
        'Insert column on the left',
        'Insert column on the right',
        'Remove row',
        'Remove column',
        'Undo',
        'Redo',
        'Read only',
        'Alignment',
        'Add Comment',
        'Delete Comment'
      ].join(''));
    });

    it("should disable column manipulation when row header selected", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        colHeaders: true,
        rowHeaders: true,
        height: 100
      });

      $('.ht_clone_left .htCore').eq(0).find('tbody').find('th').eq(0).simulate('mousedown', {which: 3});
      contextMenu();

      expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
        'Insert column on the left',
        'Insert column on the right',
        'Remove column',
        'Undo',
        'Redo',
      ].join(''));
    });

    it("should disable row manipulation when column header selected", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        colHeaders: true,
        rowHeaders: true,
        height: 100
      });

      $('.ht_clone_top .htCore').find('thead').find('th').eq(2).simulate('mousedown', {which: 3});
      contextMenu();

      expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
        'Insert row above',
        'Insert row below',
        'Remove row',
        'Undo',
        'Redo',
      ].join(''));
    });

    it("should disable cells manipulation when corner header selected", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        colHeaders: true,
        rowHeaders: true,
        height: 100
      });

      $('.ht_clone_top_left_corner .htCore').find('thead').find('th').eq(0).simulate('mousedown', {which: 3});
      contextMenu();

      expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
        'Remove row',
        'Remove column',
        'Undo',
        'Redo',
        'Read only',
        'Alignment',
      ].join(''));
    });

    it("should insert row above selection", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 400
      });

      var afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');
      hot.addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(4);

      selectCell(1, 0, 3, 0);
      contextMenu();
			$('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(0).simulate('mousedown'); //Insert row above

      expect(afterCreateRowCallback).toHaveBeenCalledWith(1, 1, undefined, undefined, undefined, undefined);
      expect(countRows()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it("should insert row above selection when initial data is empty", function () {
      var hot = handsontable({
        rowHeaders: true,
        colHeaders: true,
        data: [],
        dataSchema: [],
        contextMenu: true,
        height: 400
      });

      var afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');
      hot.addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(0);

      var cell = $('.ht_clone_top_left_corner .htCore').find('thead').find('th').eq(0);

      cell.simulate('mousedown', {which: 3});
      contextMenu(cell[0]);
      $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(0).simulate('mousedown'); // Insert row above

      expect(afterCreateRowCallback).toHaveBeenCalledWith(0, 1, undefined, undefined, undefined, undefined);
      expect(countRows()).toEqual(1);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should NOT display insert row selection', function () {
      var hot = handsontable({
        contextMenu: true,
        allowInsertRow: false
      });

      contextMenu();

      var items = $('.htContextMenu tbody td');
      var actions = items.not('.htSeparator');
      var separators = items.filter('.htSeparator');

      expect(actions.length).toEqual(8);
      expect(separators.length).toEqual(4);

      expect(actions.text()).toEqual([
        'Insert column on the left',
        'Insert column on the right',
        'Remove row',
        'Remove column',
        'Undo',
        'Redo',
        'Read only',
        'Alignment'
      ].join(''));
    });

    it('should NOT display insert column selection', function () {
      var hot = handsontable({
      	contextMenu: true,
        	allowInsertColumn: false
      });

      contextMenu();

      var items = $('.htContextMenu tbody td');
      var actions = items.not('.htSeparator');

      expect(actions.length).toEqual(8);

      expect(actions.text()).toEqual([
          'Insert row above',
          'Insert row below',
          'Remove row',
          'Remove column',
          'Undo',
          'Redo',
          'Read only',
          'Alignment'
        ].join(''));
  	});

    it("should insert row above selection (reverse selection)", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      var afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');
      hot.addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(4);

      selectCell(3, 0, 1, 0);
      contextMenu();
			$('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(0).simulate('mousedown'); //Insert row above

      expect(afterCreateRowCallback).toHaveBeenCalledWith(1, 1, undefined, undefined, undefined, undefined);
      expect(countRows()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it("should insert row below selection", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      var afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');
      hot.addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(4);

      selectCell(1, 0, 3, 0);
      contextMenu();
			$('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(1).simulate('mousedown'); //Insert row above

      expect(afterCreateRowCallback).toHaveBeenCalledWith(4, 1, undefined, undefined, undefined, undefined);
      expect(countRows()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it("should insert row below selection when initial data is empty", function () {
      var hot = handsontable({
        rowHeaders: true,
        colHeaders: true,
        data: [],
        dataSchema: [],
        contextMenu: true,
        height: 400
      });

      var afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');
      hot.addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(0);

      var cell = $('.ht_clone_top_left_corner .htCore').find('thead').find('th').eq(0);

      cell.simulate('mousedown', {which: 3});
      contextMenu(cell[0]);
      $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(1).simulate('mousedown'); // Insert row below

      expect(afterCreateRowCallback).toHaveBeenCalledWith(0, 1, undefined, undefined, undefined, undefined);
      expect(countRows()).toEqual(1);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it("should insert row below selection (reverse selection)", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      var afterCreateRowCallback = jasmine.createSpy('afterCreateRowCallback');
      hot.addHook('afterCreateRow', afterCreateRowCallback);

      expect(countRows()).toEqual(4);

      selectCell(3, 0, 1, 0);
      contextMenu();
			$('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(1).simulate('mousedown'); //Insert row below

      expect(afterCreateRowCallback).toHaveBeenCalledWith(4, 1, undefined, undefined, undefined, undefined);
      expect(countRows()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it("should insert column on the left of selection", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        width: 400,
        height: 400
      });

      var afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');
      hot.addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      selectCell(0, 1, 0, 3);
      contextMenu();
			$('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(2).simulate('mousedown'); //Insert col left

      expect(afterCreateColCallback).toHaveBeenCalledWith(1, 1, undefined, undefined, undefined, undefined);
      expect(countCols()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it("should insert column on the left of selection when initial data is empty", function () {
      var hot = handsontable({
        rowHeaders: true,
        colHeaders: true,
        data: [],
        dataSchema: [],
        contextMenu: true,
        height: 400
      });

      var afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');
      hot.addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(0);

      var cell = $('.ht_clone_top_left_corner .htCore').find('thead').find('th').eq(0);

      cell.simulate('mousedown', {which: 3});
      contextMenu(cell[0]);
      $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(3).simulate('mousedown'); // Insert column on the left

      expect(afterCreateColCallback).toHaveBeenCalledWith(0, 1, undefined, undefined, undefined, undefined);
      expect(countCols()).toEqual(1);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it("should insert column on the left of selection (reverse selection)", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      var afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');
      hot.addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      selectCell(0, 3, 0, 1);
      contextMenu();
			$('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(2).simulate('mousedown'); //Insert col left

      expect(afterCreateColCallback).toHaveBeenCalledWith(1, 1, undefined, undefined, undefined, undefined);
      expect(countCols()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it("should insert column on the right of selection", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      var afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');
      hot.addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      selectCell(0, 1, 0, 3);
      contextMenu();
      $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(2).simulate('mousedown'); //Insert col right

      expect(afterCreateColCallback).toHaveBeenCalledWith(1, 1, undefined, undefined, undefined, undefined);
      expect(countCols()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it("should insert column on the right of selection when initial data is empty", function () {
      var hot = handsontable({
        rowHeaders: true,
        colHeaders: true,
        data: [],
        dataSchema: [],
        contextMenu: true,
        height: 400
      });

      var afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');
      hot.addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(0);

      var cell = $('.ht_clone_top_left_corner .htCore').find('thead').find('th').eq(0);

      cell.simulate('mousedown', {which: 3});
      contextMenu(cell[0]);
      $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(3).simulate('mousedown'); // Insert column on the right

      expect(afterCreateColCallback).toHaveBeenCalledWith(0, 1, undefined, undefined, undefined, undefined);
      expect(countCols()).toEqual(1);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it("should insert column on the right of selection (reverse selection)", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      var afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');
      hot.addHook('afterCreateCol', afterCreateColCallback);

      expect(countCols()).toEqual(4);

      selectCell(0, 3, 0, 1);
      contextMenu();
      $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(3).simulate('mousedown'); //Insert col right

      expect(afterCreateColCallback).toHaveBeenCalledWith(4, 1, undefined, undefined, undefined, undefined);
      expect(countCols()).toEqual(5);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it("should remove selected rows", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      var afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');
      hot.addHook('afterRemoveRow', afterRemoveRowCallback);

      expect(countRows()).toEqual(4);

      selectCell(1, 0, 3, 0);
      contextMenu();
      $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(4).simulate('mousedown'); //Remove row

      expect(afterRemoveRowCallback).toHaveBeenCalledWith(1, 3, [1, 2, 3], undefined, undefined, undefined);
      expect(countRows()).toEqual(1);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it("should allow to remove the latest row", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 4),
        contextMenu: true,
        height: 100
      });

      var afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');
      hot.addHook('afterRemoveRow', afterRemoveRowCallback);

      expect(countRows()).toBe(1);

      selectCell(0, 0, 0, 0);
      contextMenu();

      $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(4).simulate('mousedown'); // Remove row

      expect(afterRemoveRowCallback).toHaveBeenCalledWith(0, 1, [0], undefined, undefined, undefined);
      expect(countRows()).toBe(0);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it("should remove selected rows (reverse selection)", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      var afterRemoveRowCallback = jasmine.createSpy('afterRemoveRowCallback');
      hot.addHook('afterRemoveRow', afterRemoveRowCallback);

      expect(countRows()).toBe(4);

      selectCell(3, 0, 1, 0);
      contextMenu();
      $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(4).simulate('mousedown'); //Remove row

      expect(afterRemoveRowCallback).toHaveBeenCalledWith(1, 3, [1, 2, 3], undefined, undefined, undefined);
      expect(countRows()).toBe(1);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it("should remove selected columns", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      var afterRemoveColCallback = jasmine.createSpy('afterRemoveColCallback');
      hot.addHook('afterRemoveCol', afterRemoveColCallback);

      expect(countCols()).toBe(4);

      selectCell(0, 1, 0, 3);
      contextMenu();
      $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(5).simulate('mousedown'); //Remove col

      expect(afterRemoveColCallback).toHaveBeenCalledWith(1, 3, undefined, undefined, undefined, undefined);
      expect(countCols()).toBe(1);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it("should allow to remove the latest column", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 1),
        contextMenu: true,
        height: 100
      });

      var afterRemoveColCallback = jasmine.createSpy('afterRemoveColCallback');
      hot.addHook('afterRemoveCol', afterRemoveColCallback);

      expect(countCols()).toBe(1);

      selectCell(0, 0, 0, 0);
      contextMenu();

      $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(5).simulate('mousedown'); // Remove column

      expect(afterRemoveColCallback).toHaveBeenCalledWith(0, 1, undefined, undefined, undefined, undefined);
      expect(countCols()).toBe(0);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it("should remove selected columns (reverse selection)", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      var afterRemoveColCallback = jasmine.createSpy('afterRemoveColCallback');
      hot.addHook('afterRemoveCol', afterRemoveColCallback);

      expect(countCols()).toEqual(4);

      selectCell(0, 3, 0, 1);

      contextMenu();

      $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(5).simulate('mousedown'); //Remove col

      expect(afterRemoveColCallback).toHaveBeenCalledWith(1, 3, undefined, undefined, undefined, undefined);
      expect(countCols()).toEqual(1);
    });

    it("should undo changes", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(0, 0);

      expect(getDataAtCell(0, 0)).toEqual('A1');

      setDataAtCell(0, 0, 'XX');

      expect(getDataAtCell(0, 0)).toEqual('XX');

      contextMenu();

      $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(6).simulate('mousedown'); //Undo

      expect(getDataAtCell(0, 0)).toEqual('A1');
    });

    it("should redo changes", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(0, 0);

      expect(getDataAtCell(0, 0)).toEqual('A1');

      setDataAtCell(0, 0, 'XX');

      expect(getDataAtCell(0, 0)).toEqual('XX');

      hot.undo();

      expect(getDataAtCell(0, 0)).toEqual('A1');

      contextMenu();

      $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(7).simulate('mousedown'); //Redo

      expect(getDataAtCell(0, 0)).toEqual('XX');
    });

    it("should display only the specified actions", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: ['remove_row', 'undo'],
        height: 100
      });

      contextMenu();

      expect($('.htContextMenu .ht_master .htCore').find('tbody td').length).toEqual(2);
    });

    it("should make a single selected cell read-only", function(){
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(0, 0);

      expect(getDataAtCell(0, 0)).toEqual('A1');
      expect(hot.getCellMeta(0,0).readOnly).toBe(false);

      selectCell(0,0);
      contextMenu();
			var menu = $('.htContextMenu .ht_master .htCore tbody');
      menu.find('td').not('.htSeparator').eq(8).simulate('mousedown'); //Make read-only

      expect(hot.getCellMeta(0,0).readOnly).toBe(true);

    });

    it("should make a single selected cell writable, when it's set to read-only", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(0, 0);

      expect(getDataAtCell(0, 0)).toEqual('A1');

      hot.getCellMeta(0,0).readOnly = true;

      selectCell(0,0);
      contextMenu();
			var menu = $('.htContextMenu .ht_master .htCore tbody');
			menu.find('td').not('.htSeparator').eq(8).simulate('mousedown');
//      $(hot.contextMenu.menu).find('tbody td').not('.htSeparator').eq(8).trigger('mousedown'); //Make writable

      expect(hot.getCellMeta(0,0).readOnly).toBe(false);
    });

    it("should make a group of selected cells read-only, if all of them are writable", function(){
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      for(var i = 0; i < 2; i++) {
        for(var j = 0; j < 2; j++) {
          expect(hot.getCellMeta(i,j).readOnly).toEqual(false);
        }
      }

      selectCell(0, 0, 2, 2);

      contextMenu();
			var menu = $('.htContextMenu .ht_master .htCore tbody');
			menu.find('td').not('.htSeparator').eq(8).simulate('mousedown');
//      $(hot.contextMenu.menu).find('tbody td').not('.htSeparator').eq(8).trigger('mousedown'); //Make read-only

      for(var i = 0; i < 2; i++) {
        for(var j = 0; j < 2; j++) {
          expect(hot.getCellMeta(i,j).readOnly).toEqual(true);
        }
      }
    });

    it("should align text left", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      waits(350);
      runs(function() {
        var contextSubMenu = $('.htContextMenuSub_' + item.text());
        var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(0);
        button.simulate('mousedown'); //Text left

        expect(getCellMeta(0,0).className).toEqual('htLeft');
        expect(getCell(0,0).className).toContain('htLeft');
      });
    });

    it("should align text center", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      waits(350);
      runs(function() {
        var contextSubMenu = $('.htContextMenuSub_' + item.text());
        var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(1);

        button.simulate('mousedown'); //Text center
        expect(getCellMeta(0,0).className).toEqual('htCenter');
        expect(getCell(0,0).className).toContain('htCenter');
      });
    });

    it("should align text right", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      waits(350);
      runs(function() {
        var contextSubMenu = $('.htContextMenuSub_' + item.text());
        var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(2);

        button.simulate('mousedown'); //Text right
        expect(getCellMeta(0,0).className).toEqual('htRight');
        expect(getCell(0,0).className).toContain('htRight');
      });
    });

    it("should justify text", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      waits(350);
      runs(function() {
        var contextSubMenu = $('.htContextMenuSub_' + item.text());
        var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(3);

        button.simulate('mousedown'); //Text justify
        deselectCell();
        expect(getCellMeta(0,0).className).toEqual('htJustify');
        expect(getCell(0,0).className).toContain('htJustify');
      });
    });

    it("should vertical align text top", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      waits(350);
      runs(function() {
        var contextSubMenu = $('.htContextMenuSub_' + item.text());
        var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(4);

        button.simulate('mousedown'); //Text top
        deselectCell();
        expect(getCellMeta(0,0).className).toEqual('htTop');
        expect(getCell(0,0).className).toContain('htTop');
      });
    });

    it("should vertical align text middle", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      waits(350);
      runs(function() {
        var contextSubMenu = $('.htContextMenuSub_' + item.text());
        var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(5);

        button.simulate('mousedown'); //Text middle
        deselectCell();
        expect(getCellMeta(0,0).className).toEqual('htMiddle');
        expect(getCell(0,0).className).toContain('htMiddle');
      });
    });

    it("should vertical align text bottom", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();
      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      waits(350);
      runs(function() {
        var contextSubMenu = $('.htContextMenuSub_' + item.text());
        var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(6);
        button.simulate('mousedown'); //Text bottom
        deselectCell();
        expect(getCellMeta(0,0).className).toEqual('htBottom');
        expect(getCell(0,0).className).toContain('htBottom');
      });
    });

    it("should not close menu after clicking on submenu root item", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: ['row_above', 'remove_row', '---------', 'alignment'],
        height: 400
      });

      selectCell(1, 0, 3, 0);
      contextMenu();

      $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(2).simulate('mousedown'); // Alignment
      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it("should add comment", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
				comments: true,
        height: 100
      });

      var testComment = 'Test comment';

      selectCell(1, 1, 1, 1);
      contextMenu();

      var menu = $('.htContextMenu .ht_master .htCore tbody');
      expect(menu.find('td:eq(17)').hasClass('htDisabled')).toBe(true);

      waits(350);
      runs(function() {
        menu.find('td').not('.htSeparator').eq(10).simulate('mousedown');

        var comments = $('body > .htCommentsContainer > .htComments');
        expect(comments[0]).not.toBeUndefined();
        expect(comments.css('display')).toEqual('block');

        var textArea = comments.find('textarea');
        textArea.focus();
        textArea.val(testComment);
        textArea.blur();

        mouseDown(document.body);

        waits(100);

        runs(function() {
          expect(getCellMeta(1, 1).comment).toEqual(testComment);
          expect(getCell(1, 1).className).toContain('htCommentCell');
        });
      })
    });

    it("should delete comment", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100,

				comments: true,
        afterCellMetaReset: function() {
          this.setCellMeta(0, 0, "comment", "Test comment");
        }
      });

      expect(getCell(0,0).className).toContain('htCommentCell');
      contextMenu();
      var $menu = $('.htContextMenu .ht_master .htCore tbody');
      expect($menu.find('td:eq(17)').hasClass('htDisabled')).toBe(false);
      $menu.find('td').not('.htSeparator').eq(11).simulate('mousedown');
      expect(getCellMeta(0,0).comment).toBeUndefined();
    });

    it("should make a group of selected cells read-only, if all of them are writable (reverse selection)", function(){
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      for(var i = 0; i < 2; i++) {
        for(var j = 0; j < 2; j++) {
          expect(hot.getCellMeta(i,j).readOnly).toEqual(false);
        }
      }

      selectCell(2, 2, 0, 0);

      contextMenu();

      var menu = $('.htContextMenu .ht_master .htCore tbody');
      menu.find('td').not('.htSeparator').eq(8).simulate('mousedown'); //Make read-only

      for(var i = 0; i < 2; i++) {
        for(var j = 0; j < 2; j++) {
          expect(hot.getCellMeta(i,j).readOnly).toEqual(true);
        }
      }
    });

    it("should make a group of selected cells writable if at least one of them is read-only", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      for(var i = 0; i < 2; i++) {
        for(var j = 0; j < 2; j++) {
          expect(hot.getCellMeta(i,j).readOnly).toEqual(false);
        }
      }

      hot.getCellMeta(1,1).readOnly = true;

      selectCell(0, 0, 2, 2);

      contextMenu();
      $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(8).simulate('mousedown'); //Make writable

      for(var i = 0; i < 2; i++) {
        for(var j = 0; j < 2; j++) {
          expect(hot.getCellMeta(i,j).readOnly).toEqual(false);
        }
      }
    });

    it("should make a group of selected cells writable if at least one of them is read-only (reverse selection)", function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      for(var i = 0; i < 2; i++) {
        for(var j = 0; j < 2; j++) {
          expect(hot.getCellMeta(i,j).readOnly).toEqual(false);
        }
      }

      hot.getCellMeta(1,1).readOnly = true;

      selectCell(2, 2, 0, 0);

      contextMenu();
      $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(8).simulate('mousedown'); //Make writable

      for(var i = 0; i < 2; i++) {
        for(var j = 0; j < 2; j++) {
          expect(hot.getCellMeta(i,j).readOnly).toEqual(false);
        }
      }
    });


  });

  describe("disabling actions", function () {
    it("should not close menu after clicking on disabled item", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: ['undo', 'redo'],
        height: 400
      });

      selectCell(1, 0, 3, 0);
      contextMenu();

      $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(0).simulate('mousedown'); // Undo
      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it("should disable undo and redo action if undoRedo plugin is not enabled ", function () {
      var hot = handsontable({
        contextMenu: true,
        undoRedo: false,
        height: 100
      });

      contextMenu();
      var $menu = $('.htContextMenu .ht_master .htCore')

      expect($menu.find('tbody td:eq(9)').text()).toEqual('Undo');
      expect($menu.find('tbody td:eq(9)').hasClass('htDisabled')).toBe(true);
      expect($menu.find('tbody td:eq(10)').text()).toEqual('Redo');
      expect($menu.find('tbody td:eq(10)').hasClass('htDisabled')).toBe(true);

    });

    it("should disable undo when there is nothing to undo ", function () {
      var hot = handsontable({
        contextMenu: true,
        height: 100
      });

      contextMenu();
      var $menu = $('.htContextMenu .ht_master .htCore');

      expect(hot.undoRedo.isUndoAvailable()).toBe(false);
      expect($menu.find('tbody td:eq(9)').text()).toEqual('Undo');
      expect($menu.find('tbody td:eq(9)').hasClass('htDisabled')).toBe(true);

      closeContextMenu();

      setDataAtCell(0, 0, 'foo');

      contextMenu();
      $menu = $('.htContextMenu .ht_master .htCore');
      expect(hot.undoRedo.isUndoAvailable()).toBe(true);
      expect($menu.find('tbody td:eq(9)').hasClass('htDisabled')).toBe(false);

    });

    it("should disable redo when there is nothing to redo ", function () {
      var hot = handsontable({
        contextMenu: true,
        height: 100
      });

      contextMenu();
      var $menu = $('.htContextMenu .ht_master .htCore');

      expect(hot.undoRedo.isRedoAvailable()).toBe(false);
      expect($menu.find('tbody td:eq(10)').text()).toEqual('Redo');
      expect($menu.find('tbody td:eq(10)').hasClass('htDisabled')).toBe(true);

      closeContextMenu();

      setDataAtCell(0, 0, 'foo');
      hot.undo();

      contextMenu();
      $menu = $('.htContextMenu .ht_master .htCore');
      expect(hot.undoRedo.isRedoAvailable()).toBe(true);
      expect($menu.find('tbody td:eq(10)').hasClass('htDisabled')).toBe(false);

    });

    it('should disable Insert row in context menu when maxRows is reached', function () {
      var hot = handsontable({
        contextMenu: true,
        maxRows: 6,
        height: 100
      });

      contextMenu();
      var $menu = $('.htContextMenu .ht_master .htCore');

      expect($menu.find('tbody td:eq(0)').text()).toEqual('Insert row above');
      expect($menu.find('tbody td:eq(0)').hasClass('htDisabled')).toBe(false);
      expect($menu.find('tbody td:eq(1)').text()).toEqual('Insert row below');
      expect($menu.find('tbody td:eq(1)').hasClass('htDisabled')).toBe(false);

      closeContextMenu();

      alter('insert_row');

      contextMenu();
      $menu = $('.htContextMenu .ht_master .htCore');

      expect($menu.find('tbody td:eq(0)').hasClass('htDisabled')).toBe(true);
      expect($menu.find('tbody td:eq(1)').hasClass('htDisabled')).toBe(true);

    });

    it('should disable Insert col in context menu when maxCols is reached', function () {
      var hot = handsontable({
        contextMenu: true,
        maxCols: 6,
        height: 100
      });

      contextMenu();
      var $menu = $('.htContextMenu .ht_master .htCore');

      expect($menu.find('tbody td:eq(3)').text()).toEqual('Insert column on the left');
      expect($menu.find('tbody td:eq(3)').hasClass('htDisabled')).toBe(false);
      expect($menu.find('tbody td:eq(4)').text()).toEqual('Insert column on the right');
      expect($menu.find('tbody td:eq(4)').hasClass('htDisabled')).toBe(false);

      closeContextMenu();

      alter('insert_col');

      contextMenu();
      $menu = $('.htContextMenu .ht_master .htCore');
      expect($menu.find('tbody td:eq(3)').hasClass('htDisabled')).toBe(true);
      expect($menu.find('tbody td:eq(4)').hasClass('htDisabled')).toBe(true);

    });

    it('should NOT disable Insert col in context menu when only one column exists', function () {
      var hot = handsontable({
        data: [['single col']],
        contextMenu: true,
        maxCols: 10,
        height: 100
      });

      selectCell(0, 0);
      contextMenu();
      var $menu = $('.htContextMenu .ht_master .htCore');

      expect($menu.find('tbody td:eq(3)').text()).toEqual('Insert column on the left');
      expect($menu.find('tbody td:eq(3)').hasClass('htDisabled')).toBe(false);
      expect($menu.find('tbody td:eq(4)').text()).toEqual('Insert column on the right');
      expect($menu.find('tbody td:eq(4)').hasClass('htDisabled')).toBe(false);
    });

    it('should disable Remove col in context menu when rows are selected by headers', function() {
      var hot = handsontable({
        contextMenu: ["remove_col", "remove_row"],
        height: 100,
        colHeaders: true,
        rowHeaders: true
      });
      var $rowsHeaders = this.$container.find('.ht_clone_left tr th');

      $rowsHeaders.eq(1).simulate('mousedown');
      $rowsHeaders.eq(2).simulate('mouseover');
      $rowsHeaders.eq(3).simulate('mouseover');
      $rowsHeaders.eq(3).simulate('mousemove');
      $rowsHeaders.eq(3).simulate('mouseup');

      contextMenu();
      var $menu = $('.htContextMenu .ht_master .htCore');

      expect($menu.find('tbody td:eq(0)').text()).toEqual('Remove column');
      expect($menu.find('tbody td:eq(0)').hasClass('htDisabled')).toBe(true);
    });

    it('should disable Remove row in context menu when columns are selected by headers', function() {
      var hot = handsontable({
        contextMenu: ["remove_col", "remove_row"],
        height: 100,
        colHeaders: true,
        rowHeaders: true
      });

      this.$container.find('thead tr:eq(0) th:eq(1)').simulate('mousedown');
      this.$container.find('thead tr:eq(0) th:eq(2)').simulate('mouseover');
      this.$container.find('thead tr:eq(0) th:eq(3)').simulate('mouseover');
      this.$container.find('thead tr:eq(0) th:eq(3)').simulate('mousemove');
      this.$container.find('thead tr:eq(0) th:eq(3)').simulate('mouseup');

      contextMenu();
      var $menu = $('.htContextMenu .ht_master .htCore');

      expect($menu.find('tbody td:eq(1)').text()).toEqual('Remove row');
      expect($menu.find('tbody td:eq(1)').hasClass('htDisabled')).toBe(true);
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
        },
        height: 100
      });

      contextMenu();

      expect($('.htContextMenu .ht_master .htCore').find('tbody td').length).toEqual(2);
      expect($('.htContextMenu .ht_master .htCore').find('tbody td').text()).toEqual(['CustomItem1', 'CustomItem2'].join(''));

      $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)').simulate('mousedown');

      expect(callback1.calls.length).toEqual(1);
      expect(callback2.calls.length).toEqual(0);

      contextMenu();
      $('.htContextMenu .ht_master .htCore').find('tbody td:eq(1)').simulate('mousedown');

      expect(callback1.calls.length).toEqual(1);
      expect(callback2.calls.length).toEqual(1);

    });

    it("should have custom items list (defined as a function)", function () {
      var enabled = false;
      var hot = handsontable({
        contextMenu: {
          items: {
            cust1: {
              name: function() {
                if(!enabled) {
                  return 'Enable my custom option'
                }
                else {
                  return 'Disable my custom option';
                }
              },
              callback: function() {

              }
            }
          }
        },
        height: 100
      });

      contextMenu();

      expect($('.htContextMenu .ht_master .htCore').find('tbody td').text()).toEqual('Enable my custom option');

      $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)').simulate('mousedown');

      enabled = true;
      contextMenu();

      expect($('.htContextMenu .ht_master .htCore').find('tbody td').text()).toEqual('Disable my custom option');

      $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)').simulate('mousedown');

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
        },
        height: 100
      });

      contextMenu();

      $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)').simulate('mousedown');

      expect(callback.calls.length).toEqual(1);

      contextMenu();
      $('.htContextMenu .ht_master .htCore').find('tbody td:eq(1)').simulate('mousedown');

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
        },
        height: 100
      });

      contextMenu();

      expect($('.htContextMenu .ht_master .htCore').find('tbody td').length).toEqual(2);
      expect($('.htContextMenu .ht_master .htCore').find('tbody td').text()).toEqual(['Remove row', 'Delete column'].join(''));

      $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)').simulate('mousedown');

      expect(callback.calls.length).toEqual(1);

      expect(countCols()).toEqual(5);

      contextMenu();
      $('.htContextMenu .ht_master .htCore').find('tbody td:eq(1)').simulate('mousedown');

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
        },
        height: 100
      });

      contextMenu();

      $('.htContextMenu .ht_master .htCore').find('tbody td:eq(0)').simulate('mousedown');

      expect(customItem.callback.calls.length).toEqual(1);
      expect(customItem.callback.calls[0].args[0]).toEqual('customItemKey');

    });

  });

  describe("keyboard navigation", function () {
    describe("no item selected", function () {
      it("should select the first item in menu, when user hits ARROW_DOWN", function () {

        var hot = handsontable({
          contextMenu: true,
          height: 100
        });

        contextMenu();
        var menuHot =  hot.getPlugin('contextMenu').menu.hotMenu;

        expect(menuHot.getSelected()).toBeUndefined();

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toEqual([0, 0, 0, 0]);
      });

      it("should select the first NOT DISABLED item in menu, when user hits ARROW_DOWN", function () {
        var hot = handsontable({
          contextMenu: {
            items: {
              item1: {
                name: 'Item1',
                disabled: true
              },
              item2: {
                name: 'Item2',
                disabled: true
              },
              item3: {
                name: 'Item3'
              }
            }
          },
          height: 100
        });

        contextMenu();

        var menuHot =  hot.getPlugin('contextMenu').menu.hotMenu;

        expect(menuHot.getSelected()).toBeUndefined();

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toEqual([2, 0, 2, 0]);
      });

      it("should NOT select any items in menu, when user hits ARROW_DOWN and there is no items enabled", function () {
        var hot = handsontable({
          contextMenu: {
            items: {
              item1: {
                name: 'Item1',
                disabled: true
              },
              item2: {
                name: 'Item2',
                disabled: true
              },
              item3: {
                name: 'Item3',
                disabled: true
              }
            }
          },
          height: 100
        });

        contextMenu();
        var menuHot =  hot.getPlugin('contextMenu').menu.hotMenu;

        expect(menuHot.getSelected()).toBeUndefined();

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toBeUndefined();
      });

      it("should select the last item in menu, when user hits ARROW_UP", function () {
        var hot = handsontable({
          contextMenu: {
            items: {
              item1: 'Item1',
              item2: 'Item2',
              item3: 'Item3'
            }
          },
          height: 100
        });

        contextMenu();
        var menuHot =  hot.getPlugin('contextMenu').menu.hotMenu;

        expect(menuHot.getSelected()).toBeUndefined();

        keyDownUp('arrow_up');

        expect(menuHot.getSelected()).toEqual([2, 0, 2, 0]);
      });

      it("should select the last NOT DISABLED item in menu, when user hits ARROW_UP", function () {
        var hot = handsontable({
          contextMenu: {
            items: {
              item1: {
                name: 'Item1'
              },
              item2: {
                name: 'Item2',
                disabled: true
              },
              item3: {
                name: 'Item3',
                disabled: true
              }
            }
          },
          height: 100
        });

        contextMenu();
        var menuHot =  hot.getPlugin('contextMenu').menu.hotMenu;

        expect(menuHot.getSelected()).toBeUndefined();

        keyDownUp('arrow_up');

        expect(menuHot.getSelected()).toEqual([0, 0, 0, 0]);
      });

      it("should NOT select any items in menu, when user hits ARROW_UP and there is no items enabled", function () {
        var hot = handsontable({
          contextMenu: {
            items: {
              item1: {
                name: 'Item1',
                disabled: true
              },
              item2: {
                name: 'Item2',
                disabled: true
              },
              item3: {
                name: 'Item3',
                disabled: true
              }
            }
          },
          height: 100
        });

        contextMenu();
        var id = $('.htContextMenu')[0].id;
        var menuHot =  hot.getPlugin('contextMenu').menu.hotMenu;

        expect(menuHot.getSelected()).toBeUndefined();

        keyDownUp('arrow_up');

        expect(menuHot.getSelected()).toBeUndefined();
      });
    });

    describe("item selected", function () {
      it("should select next item when user hits ARROW_DOWN", function () {
        var hot = handsontable({
          contextMenu: {
            items: {
              item1: {
                name: 'Item1'
              },
              item2: {
                name: 'Item2'
              },
              item3: {
                name: 'Item3'
              }
            }
          },
          height: 100
        });

        contextMenu();
        var menuHot =  hot.getPlugin('contextMenu').menu.hotMenu;

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toEqual([0, 0, 0, 0]);

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toEqual([1, 0, 1, 0]);

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toEqual([2, 0, 2, 0]);
      });

      it("should select next item (skipping disabled items) when user hits ARROW_DOWN", function () {
        var hot = handsontable({
          contextMenu: {
            items: {
              item1: {
                name: 'Item1'
              },
              item2: {
                name: 'Item2',
                disabled: true
              },
              item3: {
                name: 'Item3'
              }
            }
          },
          height: 100
        });

        contextMenu();
        var menuHot =  hot.getPlugin('contextMenu').menu.hotMenu;

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toEqual([0, 0, 0, 0]);

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toEqual([2, 0, 2, 0]);
      });

      it("should select next item (skipping separators) when user hits ARROW_DOWN", function () {
        var hot = handsontable({
          contextMenu: {
            items: {
              item1: {
                name: 'Item1'
              },
              sep1: Handsontable.plugins.ContextMenu.SEPARATOR,
              item2: {
                name: 'Item2'
              },
              item3: {
                name: 'Item3'
              }
            }
          },
          height: 100
        });

        contextMenu();
        var menuHot =  hot.getPlugin('contextMenu').menu.hotMenu;

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toEqual([0, 0, 0, 0]);

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toEqual([2, 0, 2, 0]);

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toEqual([3, 0, 3, 0]);
      });

      it("should not change selection when last item is selected and user hits ARROW_DOWN", function () {
        var hot = handsontable({
          contextMenu: {
            items: {
              item1: {
                name: 'Item1'
              },
              item2: {
                name: 'Item2'
              },
              item3: {
                name: 'Item3'
              }
            }
          },
          height: 100
        });

        contextMenu();
        var menuHot =  hot.getPlugin('contextMenu').menu.hotMenu;

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toEqual([0, 0, 0, 0]);

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toEqual([1, 0, 1, 0]);

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toEqual([2, 0, 2, 0]);

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toEqual([2, 0, 2, 0]);
      });

      it("should not change selection when last enabled item is selected and user hits ARROW_DOWN", function () {
        var hot = handsontable({
          contextMenu: {
            items: {
              item1: {
                name: 'Item1'
              },
              item2: {
                name: 'Item2'
              },
              item3: {
                name: 'Item3',
                disabled: true
              }
            }
          },
          height: 100
        });

        contextMenu();
        var menuHot =  hot.getPlugin('contextMenu').menu.hotMenu;

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toEqual([0, 0, 0, 0]);

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toEqual([1, 0, 1, 0]);

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toEqual([1, 0, 1, 0]);
      });

      it("should select next item when user hits ARROW_UP", function () {
        var hot = handsontable({
          contextMenu: {
            items: {
              item1: {
                name: 'Item1'
              },
              item2: {
                name: 'Item2'
              },
              item3: {
                name: 'Item3'
              }
            }
          },
          height: 100
        });

        contextMenu();
        var menuHot =  hot.getPlugin('contextMenu').menu.hotMenu;

        keyDownUp('arrow_up');

        expect(menuHot.getSelected()).toEqual([2, 0, 2, 0]);

        keyDownUp('arrow_up');

        expect(menuHot.getSelected()).toEqual([1, 0, 1, 0]);

        keyDownUp('arrow_up');

        expect(menuHot.getSelected()).toEqual([0, 0, 0, 0]);
      });

      it("should select next item (skipping disabled items) when user hits ARROW_UP", function () {
        var hot = handsontable({
          contextMenu: {
            items: {
              item1: {
                name: 'Item1'
              },
              item2: {
                name: 'Item2',
                disabled: true
              },
              item3: {
                name: 'Item3'
              }
            }
          },
          height: 100
        });

        contextMenu();
        var menuHot =  hot.getPlugin('contextMenu').menu.hotMenu;

        keyDownUp('arrow_up');

        expect(menuHot.getSelected()).toEqual([2, 0, 2, 0]);

        keyDownUp('arrow_up');

        expect(menuHot.getSelected()).toEqual([0, 0, 0, 0]);
      });

      it("should select next item (skipping separators) when user hits ARROW_UP", function () {
        var hot = handsontable({
          contextMenu: {
            items: {
              item1: {
                name: 'Item1'
              },
              sep1: Handsontable.plugins.ContextMenu.SEPARATOR,
              item2: {
                name: 'Item2'
              },
              item3: {
                name: 'Item3'
              }
            }
          },
          height: 100
        });

        contextMenu();
        var menuHot =  hot.getPlugin('contextMenu').menu.hotMenu;

        keyDownUp('arrow_up');

        expect(menuHot.getSelected()).toEqual([3, 0, 3, 0]);

        keyDownUp('arrow_up');

        expect(menuHot.getSelected()).toEqual([2, 0, 2, 0]);

        keyDownUp('arrow_up');

        expect(menuHot.getSelected()).toEqual([0, 0, 0, 0]);
      });

      it("should not change selection when first item is selected and user hits ARROW_UP", function () {
        var hot = handsontable({
          contextMenu: {
            items: {
              item1: {
                name: 'Item1'
              },
              item2: {
                name: 'Item2'
              },
              item3: {
                name: 'Item3'
              }
            }
          },
          height: 100
        });

        contextMenu();
        var menuHot =  hot.getPlugin('contextMenu').menu.hotMenu;

        keyDownUp('arrow_up');

        expect(menuHot.getSelected()).toEqual([2, 0, 2, 0]);

        keyDownUp('arrow_up');

        expect(menuHot.getSelected()).toEqual([1, 0, 1, 0]);

        keyDownUp('arrow_up');

        expect(menuHot.getSelected()).toEqual([0, 0, 0, 0]);

        keyDownUp('arrow_up');

        expect(menuHot.getSelected()).toEqual([0, 0, 0, 0]);
      });

      it("should not change selection when first enabled item is selected and user hits ARROW_UP", function () {
        var hot = handsontable({
          contextMenu: {
            items: {
              item1: {
                name: 'Item1',
                disabled: true
              },
              item2: {
                name: 'Item2'
              },
              item3: {
                name: 'Item3'
              }
            }
          },
          height: 100
        });

        contextMenu();
        var menuHot =  hot.getPlugin('contextMenu').menu.hotMenu;

        keyDownUp('arrow_up');

        expect(menuHot.getSelected()).toEqual([2, 0, 2, 0]);

        keyDownUp('arrow_up');

        expect(menuHot.getSelected()).toEqual([1, 0, 1, 0]);

        keyDownUp('arrow_up');

        expect(menuHot.getSelected()).toEqual([1, 0, 1, 0]);
      });

      it("should perform a selected item action, when user hits ENTER", function () {
        var itemAction = jasmine.createSpy('itemAction');
        var hot = handsontable({
          contextMenu: {
            items: {
              item1: {
                name: 'Item1',
                callback: itemAction
              },
              item2: 'Item2'
            }
          },
          height: 100
        });

        contextMenu();
        var menuHot =  hot.getPlugin('contextMenu').menu.hotMenu;

        keyDownUp('arrow_down');

        expect(menuHot.getSelected()).toEqual([0, 0, 0, 0]);

        expect(itemAction).not.toHaveBeenCalled();

        keyDownUp('enter');

        expect(itemAction).toHaveBeenCalled();
        expect($(hot.getPlugin('contextMenu').menu).is(':visible')).toBe(false);
      });
    });

    it("should close menu when user hits ESC", function () {
      handsontable({
        contextMenu: true,
        height: 100
      });

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      keyDownUp('esc');

      expect($('.htContextMenu').is(':visible')).toBe(false);
    });
  });

  describe('mouse navigation', function () {
    it('should not scroll window position after fireing mouseenter on menu item', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1000, 5),
        contextMenu: true,
      });

      hot.selectCell(100, 0);
      contextMenu();
      window.scrollTo(0, 0);
      $('.htContextMenu .ht_master .htCore').find('tr td:eq("0")').simulate('mouseenter');

      expect(window.scrollY).toBe(0);
    });
  });

  describe("working with multiple tables", function () {
    beforeEach(function () {
      this.$container2 = $('<div id="' + id + '-2"></div>').appendTo('body');
    });

    afterEach(function () {
      if(this.$container2){
        this.$container2.handsontable('destroy');
        this.$container2.remove();
      }
    });

    it("should apply enabling/disabling contextMenu using updateSetting only to particular instance of HOT ", function () {
      var hot1 = handsontable({
        contextMenu: false,
        height: 100
      });
      var hot2 =this.$container2.handsontable({
        contextMenu: true,
        height: 100
      });

      var hot2 = hot2.handsontable('getInstance');
      var contextMenuContainer = $('.htContextMenu');

      contextMenu();
      expect(hot1.getPlugin('contextMenu').isEnabled()).toBe(false);
      expect(contextMenuContainer.is(':visible')).toBe(false);

      contextMenu2();
      expect(hot2.getPlugin('contextMenu').isEnabled()).toBe(true);
      expect($('.htContextMenu').is(':visible')).toBe(true);

      mouseDown(hot2.rootElement); //close menu

      hot1.updateSettings({
        contextMenu: true
      });
      hot2.updateSettings({
        contextMenu: false
      });

      contextMenu2();
      expect(hot2.getPlugin('contextMenu').isEnabled()).toBe(false);

      contextMenu();
      expect($('.htContextMenu').is(':visible')).toBe(true);

      function contextMenu2() {
        var hot = spec().$container2.data('handsontable');
        var selected = hot.getSelected();

        if(!selected){
          hot.selectCell(0, 0);
          selected = hot.getSelected();
        }

        var cell = hot.getCell(selected[0], selected[1]);
        var cellOffset = $(cell).offset();

        $(cell).simulate('contextmenu',{
          pageX: cellOffset.left,
          pageY: cellOffset.top
        });
      }
    });

//    it("should create only one DOM node for contextMenu per page ", function () {
//
//
//      var hot1 = handsontable({
//        contextMenu: false
//      });
//
//      this.$container2.handsontable({
//        contextMenu: false
//      });
//

//      var hot2 = this.$container2.handsontable('getInstance');
//      var contextMenuContainer = $('.htContextMenu');
//
//

//      expect(contextMenuContainer.length).toEqual(0);
//
//      hot1.updateSettings({
//        contextMenu: true
//      });
//
//      contextMenuContainer = $('.htContextMenu');
//
//      expect(contextMenuContainer.length).toEqual(1);
//
//      hot2.updateSettings({
//        contextMenu: true
//      });
//
//      contextMenuContainer = $('.htContextMenu');
//
//      expect(contextMenuContainer.length).toEqual(1);
//
//
//
//
//    });

//    it("should remove contextMenu DOM nodes when there is no HOT instance on the page, which has contextMenu enabled ", function () {
//      var hot1 = handsontable({
//        contextMenu: true
//      });
//
//      this.$container2.handsontable({
//        contextMenu: true
//      });
//

//
//      var hot2 = this.$container2.handsontable('getInstance');
//      var contextMenuContainer = $('.htContextMenu');
//
//      expect(contextMenuContainer.length).toEqual(1);
//
//      hot1.updateSettings({
//        contextMenu: true
//      });
//
//      hot2.updateSettings({
//        contextMenu: false
//      });
//
//      contextMenuContainer = $('.htContextMenu');
//
//      expect(contextMenuContainer.length).toEqual(1);
//
//      hot1.updateSettings({
//        contextMenu: false
//      });
//
//      hot2.updateSettings({
//        contextMenu: false
//      });
//
//      contextMenuContainer = $('.htContextMenu');
//
//      expect(contextMenuContainer.length).toEqual(0);
//
//
//    });

    it("should perform a contextMenu action only for particular instance of HOT ", function () {
      var hot1 = handsontable({
        contextMenu: true,
        height: 100
      });

      var hot2 = this.$container2.handsontable({
        contextMenu: true,
        height: 100
      });

      var hot2 = hot2.handsontable('getInstance');

      hot1.selectCell(0, 0);
      contextMenu();


      expect(hot1.countRows()).toEqual(5);
      expect(hot2.countRows()).toEqual(5);

      $('.htContextMenu .ht_master .htCore').find('tr td:eq("0")').simulate('mousedown'); //insert row above

      expect(hot1.countRows()).toEqual(6);
      expect(hot2.countRows()).toEqual(5);

      hot2.selectCell(0, 0);
      contextMenu2();

      expect(hot1.countRows()).toEqual(6);
      expect(hot2.countRows()).toEqual(5);

      $('.htContextMenu .ht_master .htCore').find('tr td:eq("0")').simulate('mousedown'); //insert row above

      expect(hot1.countRows()).toEqual(6);
      expect(hot2.countRows()).toEqual(6);

      function contextMenu2() {
        var hot = spec().$container2.data('handsontable');
        var selected = hot.getSelected();

        if(!selected){
          hot.selectCell(0, 0);
          selected = hot.getSelected();
        }

        var cell = hot.getCell(selected[0], selected[1]);
        var cellOffset = $(cell).offset();

        $(cell).simulate('contextmenu',{
          pageX: cellOffset.left,
          pageY: cellOffset.top
        });
      }
    });
  });

  describe("context menu with native scroll", function () {
    beforeEach(function () {
      var wrapper = $('<div></div>').css({
        width: 400,
        height: 200,
        overflow: 'scroll'
      });

      this.$wrapper = this.$container.wrap(wrapper).parent();
    });

    afterEach(function () {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
      this.$wrapper.remove();
    });

    it("should display menu table is not scrolled", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(40, 30),
        colWidths: 50, //can also be a number or a function
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        height: 100
      });

      contextMenu();
      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it("should display menu table is scrolled", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(40, 30),
        colWidths: 50, //can also be a number or a function
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        height: 100
      });

      var mainHolder = hot.view.wt.wtTable.holder;

      $(mainHolder).scrollTop(300);
      $(mainHolder).scroll();

      selectCell(15, 3);
      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);
    });

    it("should not close the menu, when table is scrolled", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(40, 30),
        colWidths: 50, //can also be a number or a function
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        height: 100
      });

      var $mainHolder = $(hot.view.wt.wtTable.holder);

      selectCell(15, 3);
      var scrollTop = $mainHolder.scrollTop();
      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      $mainHolder.scrollTop(scrollTop + 60).scroll();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      $mainHolder.scrollTop(scrollTop + 100).scroll();

      expect($('.htContextMenu').is(':visible')).toBe(true)
    });

    xit("should not attempt to close menu, when table is scrolled and the menu is already closed", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(40, 30),
        colWidths: 50, //can also be a number or a function
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        height: 100
      });

      var mainHolder = $(hot.view.wt.wtTable.holder);

      selectCell(15, 3);
      var scrollTop = mainHolder.scrollTop();
      contextMenu();
      var $menu = $(hot.getPlugin('contextMenu').menu);

      expect($menu.is(':visible')).toBe(true);

      mainHolder.scrollTop(scrollTop + 60).scroll();

      expect($menu.is(':visible')).toBe(false);

      spyOn(hot.getPlugin('contextMenu'), 'close');

      mainHolder.scrollTop(scrollTop + 100).scroll();

      expect(hot.getPlugin('contextMenu').close).not.toHaveBeenCalled();
    });

    it("should not scroll the window when hovering over context menu items (#1897 reopen)", function () {
      this.$wrapper.css("overflow","visible");

      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(403, 303),
        colWidths: 50, //can also be a number or a function
        contextMenu: true
      });

      var beginningScrollX = window.scrollX;

      selectCell(2, 4);
      contextMenu();

      var cmInstance = hot.getPlugin('contextMenu').menu.hotMenu;

      cmInstance.selectCell(3,0);
      expect(window.scrollX).toEqual(beginningScrollX);

      cmInstance.selectCell(4,0);
      expect(window.scrollX).toEqual(beginningScrollX);

      cmInstance.selectCell(6,0);
      expect(window.scrollX).toEqual(beginningScrollX);
    });
  });

  describe("afterContextMenuDefaultOptions hook", function() {
    it("should call afterContextMenuDefaultOptions hook with context menu options as the first param", function () {
      var options;

      var afterContextMenuDefaultOptions = function(options_) {
        options = options_;
        options.items.cust1 = {
          name: 'My custom item',
          callback: function () {
          }
        };
      };

      Handsontable.hooks.add('afterContextMenuDefaultOptions', afterContextMenuDefaultOptions);

      var hot = handsontable({
        contextMenu: true,
        height: 100
      });

      contextMenu();

      var $menu = $('.htContextMenu .ht_master .htCore');

      expect(options).toBeDefined();
      expect(options.items).toBeDefined();
      expect($menu.find('tbody td').text()).toContain('My custom item');

      $menu.find('tbody td:eq(0)').simulate('mousedown');

      Handsontable.hooks.remove('afterContextMenuDefaultOptions', afterContextMenuDefaultOptions);
    });
  });

});
