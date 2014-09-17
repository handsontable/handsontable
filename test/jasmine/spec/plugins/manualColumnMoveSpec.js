describe('manualColumnMove', function () {
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

  function moveSecondDisplayedColumnBeforeFirstColumn(container, secondDisplayedColIndex){
    var $mainContainer = container.parents(".handsontable").not("[class*=clone]").first();
    var $colHeaders = container.find('thead tr:eq(0) th');
    var $firstColHeader = $colHeaders.eq(secondDisplayedColIndex - 1);
    var $secondColHeader = $colHeaders.eq(secondDisplayedColIndex);

    //Enter the second column header
    $secondColHeader.trigger('mouseenter');
    var $manualColumnMover = $mainContainer.find('.manualColumnMover');

    //Grab the second column
    var mouseDownEvent = $.Event('mousedown');
    mouseDownEvent.pageX = $manualColumnMover[0].getBoundingClientRect().left;
    $manualColumnMover.trigger(mouseDownEvent);

    //Drag the second column over the first column
    var mouseMoveEvent = $.Event('mousemove');
    mouseMoveEvent.pageX = $manualColumnMover[0].getBoundingClientRect().left - 20;
    $manualColumnMover.trigger(mouseMoveEvent);

    $firstColHeader.trigger('mouseenter');

    //Drop the second column
    $secondColHeader.trigger('mouseup');
  }

  it("should change column order at init", function () {
    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"},
        {id: 6, name: "Chuck", lastName: "Jackson"},
        {id: 7, name: "Meg", lastName: "Jansen"},
        {id: 8, name: "Rob", lastName: "Norris"},
        {id: 9, name: "Sean", lastName: "O'Hara"},
        {id: 10, name: "Eve", lastName: "Branson"}
      ],
      manualColumnMove: [1, 2, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Right');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('1');
  });

  it("should change the default column order with updateSettings", function () {
    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"},
        {id: 6, name: "Chuck", lastName: "Jackson"},
        {id: 7, name: "Meg", lastName: "Jansen"},
        {id: 8, name: "Rob", lastName: "Norris"},
        {id: 9, name: "Sean", lastName: "O'Hara"},
        {id: 10, name: "Eve", lastName: "Branson"}
      ],
      manualColumnMove: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');

    updateSettings({
      manualColumnMove: [2, 1, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Right');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('1');
  });

  it("should change column order with updateSettings", function () {
    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"},
        {id: 6, name: "Chuck", lastName: "Jackson"},
        {id: 7, name: "Meg", lastName: "Jansen"},
        {id: 8, name: "Rob", lastName: "Norris"},
        {id: 9, name: "Sean", lastName: "O'Hara"},
        {id: 10, name: "Eve", lastName: "Branson"}
      ],
      manualColumnMove: [1, 2, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Right');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('1');

    updateSettings({
      manualColumnMove: [2, 1, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Right');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('1');
  });

  it("should reset column order", function () {
    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"},
        {id: 6, name: "Chuck", lastName: "Jackson"},
        {id: 7, name: "Meg", lastName: "Jansen"},
        {id: 8, name: "Rob", lastName: "Norris"},
        {id: 9, name: "Sean", lastName: "O'Hara"},
        {id: 10, name: "Eve", lastName: "Branson"}
      ],
      manualColumnMove: [1, 2, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Right');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('1');

    updateSettings({
      manualColumnMove: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');
  });

  it("should move columns when viewport has been scrolled", function () {

    this.$container.width(120);

    var hot = handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"},
        {id: 6, name: "Chuck", lastName: "Jackson"},
        {id: 7, name: "Meg", lastName: "Jansen"},
        {id: 8, name: "Rob", lastName: "Norris"},
        {id: 9, name: "Sean", lastName: "O'Hara"},
        {id: 10, name: "Eve", lastName: "Branson"}
      ],
      colHeaders: true,
      manualColumnMove: true
    });

    var htCore = getHtCore();

    selectCell(0, 2);

    var lastVisibleColumnIndex = hot.view.wt.wtTable.getLastVisibleColumn();

    expect(htCore.find('tbody tr:eq(0) td:eq(' + (lastVisibleColumnIndex - 1) +')').text()).toEqual('Ted');
    expect(htCore.find('tbody tr:eq(0) td:eq(' + lastVisibleColumnIndex +')').text()).toEqual('Right');

    //wait for clones to reposition after table scroll
    waits(100);

    runs(function () {
      moveSecondDisplayedColumnBeforeFirstColumn(htCore, lastVisibleColumnIndex);

      expect(htCore.find('tbody tr:eq(0) td:eq(' + (lastVisibleColumnIndex - 1) +')').text()).toEqual('Right');
      expect(htCore.find('tbody tr:eq(0) td:eq(' + lastVisibleColumnIndex +')').text()).toEqual('Ted');

    });

  });

  it("should move columns only in specific HOT instance", function () {

    this.$container2 = $('<div id="' + id + '-2" style="width: 300px; height: 200px;"></div>').appendTo('body');

    this.$container2.width(120);
    this.$container.width(120);

    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Left"},
        {id: 2, name: "Frank", lastName: "Sincere"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"},
        {id: 6, name: "Chuck", lastName: "Jackson"},
        {id: 7, name: "Meg", lastName: "Jansen"},
        {id: 8, name: "Rob", lastName: "Norris"},
        {id: 9, name: "Sean", lastName: "O'Hara"},
        {id: 10, name: "Eve", lastName: "Branson"}
      ],
      colHeaders: true,
      manualColumnMove: true
    });

    var htCore1 = getHtCore();

    this.$container2.handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"},
        {id: 6, name: "Chuck", lastName: "Jackson"},
        {id: 7, name: "Meg", lastName: "Jansen"},
        {id: 8, name: "Rob", lastName: "Norris"},
        {id: 9, name: "Sean", lastName: "O'Hara"},
        {id: 10, name: "Eve", lastName: "Branson"}
      ],
      colHeaders: true,
      manualColumnMove: true
    });

    var hot2 = this.$container2.handsontable('getInstance');
    var htCore2 = this.$container2.find('.htCore');

    hot2.selectCell(0, 0);
    expect(htCore1.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(htCore1.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(htCore1.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Left');

    expect(htCore2.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(htCore2.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(htCore2.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');

    moveSecondDisplayedColumnBeforeFirstColumn(htCore2, 1);

    expect(htCore1.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(htCore1.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(htCore1.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Left');

    expect(htCore2.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Ted');
    expect(htCore2.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('1');
    expect(htCore2.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');

    hot2.destroy();
    this.$container2.remove();
  });

  it("should mark apropriate column as invalid, when column order is changed", function () {

    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"},
        {id: 6, name: "Chuck", lastName: "Jackson"},
        {id: 7, name: "Meg", lastName: "Jansen"},
        {id: 8, name: "Rob", lastName: "Norris"},
        {id: 9, name: "Sean", lastName: "O'Hara"},
        {id: 10, name: "Eve", lastName: "Branson"}
      ],
      colHeaders: true,
      manualColumnMove: [2, 0, 1],
      columns: [
        {
          type: 'numeric',
          data: 'id'
        },
        {
          data: 'name'
        },
        {
          data: 'lastName'
        }
      ],
      allowInvalid: true,
      afterValidate: onAfterValidate
    });

    selectCell(0, 1);
    keyDownUp('enter');
    var editor = $('.handsontableInput');
    editor.val('foo');

    onAfterValidate.reset();
    keyDownUp('enter');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation 2', 1000);

    runs(function () {
      expect(this.$container.find('.htInvalid').length).toEqual(1);
      expect(this.$container.find('.htInvalid').text()).toMatch('foo');
    });

  });

  it("should display the move handle in the correct place after the table has been scrolled", function () {
    handsontable({
      data: createSpreadsheetData(10, 20),
      colHeaders: true,
      manualColumnMove: true,
      height: 100,
      width: 200
    });

    var $colHeader = this.$container.find('.ht_clone_top thead tr:eq(0) th:eq(2)');
    $colHeader.trigger("mouseenter");
    var $handle = this.$container.find('.manualColumnMover');
    $handle[0].style.background = "red";

    expect($colHeader.offset().left).toEqual($handle.offset().left);
    expect($colHeader.offset().top).toEqual($handle.offset().top);

    this.$container.scrollLeft(200);
    this.$container.scroll();

    $colHeader = this.$container.find('.ht_clone_top thead tr:eq(0) th:eq(5)');
    $colHeader.trigger("mouseenter");
    expect($colHeader.offset().left).toEqual($handle.offset().left);
    expect($colHeader.offset().top).toEqual($handle.offset().top);
  });

  it("should not move the column if you click the handle without dragging", function () {
    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
      ],
      colHeaders: true,
      manualColumnMove: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');

    selectCell(0, 0);

    var $colHeader = this.$container.find('.ht_clone_top thead tr:eq(0) th:eq(2)');
    $colHeader.trigger("mouseenter");
    var $manualColumnMover = this.$container.find('.manualColumnMover');

    //Grab the column
    var mouseDownEvent = $.Event('mousedown');
    mouseDownEvent.pageX = $manualColumnMover[0].getBoundingClientRect().left;
    $manualColumnMover.trigger(mouseDownEvent);

    //Drop it without dragging
    $colHeader.trigger('mouseup');

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');
  });

  it("should return an appropriate column width, when column order has changed", function () {
    var hot = handsontable({
      columns: [
        {
          width: 50
        },
        {
          width: 60
        },
        {
          width: 70
        }
      ]
    });

    expect(hot.getColWidth(0)).toEqual(50);
    expect(hot.getColWidth(1)).toEqual(60);
    expect(hot.getColWidth(2)).toEqual(70);

    hot.updateSettings({
      manualColumnMove: [2, 0, 1]
    });

    expect(hot.getColWidth(0)).toEqual(70);
    expect(hot.getColWidth(1)).toEqual(50);
    expect(hot.getColWidth(2)).toEqual(60);


  });

  it("should not change the default spreadsheet-like column headers when column order has changed ", function(){
    var hot = handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"}
      ],
      colHeaders: true,
      columns: [
        {
          type: 'numeric',
          data: 'id'
        },
        {
          data: 'name'
        },
        {
          data: 'lastName'
        }
      ]
    });

    if(hot.getSettings().colHeaders === true) {
      expect(hot.getColHeader(0)).toEqual('A');
      expect(hot.getColHeader(1)).toEqual('B');
      expect(hot.getColHeader(2)).toEqual('C');

      hot.updateSettings({
        manualColumnMove: [2, 0, 1]
      });

      expect(hot.getColHeader(0)).toEqual('A');
      expect(hot.getColHeader(1)).toEqual('B');
      expect(hot.getColHeader(2)).toEqual('C');
    }

  });

  it("should change the custom column headers order when column order has changed", function(){
    var hot = handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"}
      ],
      colHeaders: ["Id","Name","Last Name"],
      columns: [
        {
          type: 'numeric',
          data: 'id'
        },
        {
          data: 'name'
        },
        {
          data: 'lastName'
        }
      ]
    });

    if(!hot.getSettings().colHeaders === true) {
      expect(hot.getColHeader(0)).toEqual('Id');
      expect(hot.getColHeader(1)).toEqual('Name');
      expect(hot.getColHeader(2)).toEqual('Last Name');

      hot.updateSettings({
        manualColumnMove: [2, 0, 1]
      });

      expect(hot.getColHeader(0)).toEqual('Last Name');
      expect(hot.getColHeader(1)).toEqual('Id');
      expect(hot.getColHeader(2)).toEqual('Name');
    }
  });

  it("should not select the column when the user clicks the move handler", function() {
    var hot = handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"}
      ],
      colHeaders: true,
      manualColumnMove: true
    });

    var $colHeader = this.$container.find('.ht_clone_top thead tr:eq(0) th:eq(1)');
    $colHeader.trigger("mouseenter");
    var $manualColumnMover = this.$container.find('.manualColumnMover');

    $manualColumnMover.eq(1).trigger('mousedown');

    expect(hot.getSelected()).toEqual(undefined);

  });

  it("should display the resize handle in the correct place after the table has been scrolled", function () {
    handsontable({
      data: createSpreadsheetData(10, 20),
      colHeaders: true,
      manualColumnMove: true,
      height: 100,
      width: 200
    });

    var $colHeader = this.$container.find('.ht_clone_top thead tr:eq(0) th:eq(2)');
    $colHeader.trigger("mouseenter");
    var $handle = this.$container.find('.manualColumnMover');
    $handle[0].style.background = "red";

    expect($colHeader.offset().left).toEqual($handle.offset().left);
    expect($colHeader.offset().top).toEqual($handle.offset().top);

    this.$container.scrollLeft(200);
    this.$container.scroll();

    $colHeader = this.$container.find('.ht_clone_top thead tr:eq(0) th:eq(5)');
    $colHeader.trigger("mouseenter");
    expect($colHeader.offset().left).toEqual($handle.offset().left);
    expect($colHeader.offset().top).toEqual($handle.offset().top);
  });

});
