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
    var $mainContainer = container.parents(".handsontable").not("[class*=clone]").not("[class*=master]").first();
    var $colHeaders = container.find('thead tr:eq(0) th');
    var $firstColHeader = $colHeaders.eq(secondDisplayedColIndex - 1);
    var $secondColHeader = $colHeaders.eq(secondDisplayedColIndex);

    //Enter the second column header
    $secondColHeader.simulate('mouseover');
    var $manualColumnMover = $mainContainer.find('.manualColumnMover');

    //Grab the second column
    $manualColumnMover.simulate('mousedown',{
      pageX : $manualColumnMover[0].getBoundingClientRect().left
    });

    //Drag the second column over the first column
    $manualColumnMover.simulate('mousemove',{
      pageX : $manualColumnMover[0].getBoundingClientRect().left - 20
    });

    $firstColHeader.simulate('mouseover');

    //Drop the second column
    $secondColHeader.simulate('mouseup');
  }

  function moveFirstDisplayedColumnAfterSecondColumn(container, firstDisplayedColIndex){
    var $mainContainer = container.parents(".handsontable").not("[class*=clone]").not("[class*=master]").first();
    var $colHeaders = container.find('thead tr:eq(0) th');
    var $firstColHeader = $colHeaders.eq(firstDisplayedColIndex);
    var $secondColHeader = $colHeaders.eq(firstDisplayedColIndex + 1);

    //Enter the first column header
    $firstColHeader.simulate('mouseover');
    var $manualColumnMover = $mainContainer.find('.manualColumnMover');

    //Grab the first column
    $manualColumnMover.simulate('mousedown',{
      pageX:$manualColumnMover[0].getBoundingClientRect().left
    });

    //Drag the first column over the second column
    $manualColumnMover.simulate('mousemove',{
      pageX:$manualColumnMover[0].getBoundingClientRect().left + 20
    });

    $secondColHeader.simulate('mouseover');

    //Drop the first column
    $firstColHeader.simulate('mouseup');
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
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 20),
      colHeaders: true,
      manualColumnMove: true,
      height: 100,
      width: 200
    });

    var mainHolder = hot.view.wt.wtTable.holder;

    var $colHeader = this.$container.find('.ht_clone_top thead tr:eq(0) th:eq(2)');
//    $colHeader.trigger("mouseenter");
    $colHeader.simulate("mouseover");
    var $handle = this.$container.find('.manualColumnMover');
    $handle[0].style.background = "red";

    expect($colHeader.offset().left).toEqual($handle.offset().left);
    expect($colHeader.offset().top).toEqual($handle.offset().top);

    $(mainHolder).scrollLeft(200);
    hot.render();

    $colHeader = this.$container.find('.ht_clone_top thead tr:eq(0) th:eq(3)');
//    $colHeader.trigger("mouseenter");
    $colHeader.simulate("mouseover");
    expect($colHeader.offset().left).toEqual($handle.offset().left);
    expect($colHeader.offset().top).toEqual($handle.offset().top);
  });

  it("should not move the column if you click the handle without dragging", function () {
    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"}
      ],
      colHeaders: true,
      manualColumnMove: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');

    selectCell(0, 0);

    var $colHeader = this.$container.find('.ht_clone_top thead tr:eq(0) th:eq(2)');
//    $colHeader.trigger("mouseenter");
    $colHeader.simulate("mouseover");
    var $manualColumnMover = this.$container.find('.manualColumnMover');

    //Grab the column
    $manualColumnMover.simulate('mousedown',{
      pageX:$manualColumnMover[0].getBoundingClientRect().left
    });

    //Drop it without dragging
//    $colHeader.trigger('mouseup');
    $colHeader.simulate('mouseup');

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
    $colHeader.simulate("mouseover");
    var $manualColumnMover = this.$container.find('.manualColumnMover');

    $manualColumnMover.eq(1).simulate('mousedown');

    expect(hot.getSelected()).toEqual(undefined);

  });

  it("should display the resize handle in the correct place after the table has been scrolled", function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 20),
      colHeaders: true,
      manualColumnMove: true,
      height: 100,
      width: 200
    });

    var mainHolder = hot.view.wt.wtTable.holder;

    var $colHeader = this.$container.find('.ht_clone_top thead tr:eq(0) th:eq(2)');
    $colHeader.simulate("mouseover");
    var $handle = this.$container.find('.manualColumnMover');
    $handle[0].style.background = "red";

    expect($colHeader.offset().left).toEqual($handle.offset().left);
    expect($colHeader.offset().top).toEqual($handle.offset().top);

    $(mainHolder).scrollLeft(200);
    hot.render();

    $colHeader = this.$container.find('.ht_clone_top thead tr:eq(0) th:eq(3)');
    $colHeader.simulate("mouseover");
    expect($colHeader.offset().left).toEqual($handle.offset().left);
    expect($colHeader.offset().top).toEqual($handle.offset().top);
  });

  it("should move the first column to the second column", function () {
    handsontable({
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

    var htCore = getHtCore();

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');

    moveFirstDisplayedColumnAfterSecondColumn(htCore, 0);

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Ted');
    expect(htCore.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');
  });

  it("should move the second column to the third column", function () {
    handsontable({
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

    var htCore = getHtCore();

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');

    moveFirstDisplayedColumnAfterSecondColumn(htCore, 1);

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Right');
    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Ted');
  });

  it("should not move the column when dropped in the row header column", function () {
    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right", color: "Blue"},
        {id: 2, name: "Frank", lastName: "Honest", color: "Red"},
        {id: 3, name: "Joan", lastName: "Well", color: "Yellow"},
        {id: 4, name: "Sid", lastName: "Strong", color: "Black"},
        {id: 5, name: "Jane", lastName: "Neat", color: "White"}
      ],
      colHeaders: true,
      rowHeaders: true,
      manualColumnMove: true
    });

    var htCore = getHtCore();

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');
    expect(htCore.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('Blue');

    moveSecondDisplayedColumnBeforeFirstColumn(htCore, 1);

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');
    expect(htCore.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('Blue');
  });

  it("should not display the move handler in the row header column", function () {
    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right", color: "Blue"},
        {id: 2, name: "Frank", lastName: "Honest", color: "Red"},
        {id: 3, name: "Joan", lastName: "Well", color: "Yellow"},
        {id: 4, name: "Sid", lastName: "Strong", color: "Black"},
        {id: 5, name: "Jane", lastName: "Neat", color: "White"}
      ],
      colHeaders: true,
      rowHeaders: true,
      manualColumnMove: true
    });

    var htCore = getHtCore();

    var $mainContainer = htCore.parents(".handsontable").not("[class*=clone]").not("[class*=master]").first();
    var $colHeaders = htCore.find('thead tr:eq(0) th');
    var $rowHeader = $colHeaders.eq(0);
    var $firstColHeader = $colHeaders.eq(1);

    //Enter the first column header
    $firstColHeader.simulate('mouseover');
    var $manualColumnMover = $mainContainer.find('.manualColumnMover');

    //Grab the first column
    $manualColumnMover.simulate('mousedown',{
      pageX:$manualColumnMover[0].getBoundingClientRect().left
    });

    //Drag the first column over the row header column
    $manualColumnMover.simulate('mousemove',{
      pageX:$manualColumnMover[0].getBoundingClientRect().left - 20
    });

    $rowHeader.simulate('mouseover');

    expect($manualColumnMover[0].getBoundingClientRect().left).not.toEqual($rowHeader[0].getBoundingClientRect().left);
    expect($manualColumnMover[0].getBoundingClientRect().left).toEqual($firstColHeader[0].getBoundingClientRect().left);


    //Drop the second column
    $firstColHeader.trigger('mouseup');
  });

  it("moving column should keep cell meta created using cells function", function () {
    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"}
      ],
      colHeaders: true,
      manualColumnMove: true,
      cells: function (row, col) {
        if (row == 0 && col == 1) {
          this.readOnly = true;
        }
      }
    });

    var htCore = getHtCore();

    expect(htCore.find('tbody tr:eq(0) td:eq(1)')[0].className.indexOf("htDimmed")).toBeGreaterThan(-1);

    moveFirstDisplayedColumnAfterSecondColumn(htCore, 1);

    expect(htCore.find('tbody tr:eq(0) td:eq(2)')[0].className.indexOf("htDimmed")).toBeGreaterThan(-1);
  });

  it("moving column should keep cell meta created using cell array", function () {
    var hot = handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"}
      ],
      colHeaders: true,
      manualColumnMove: true,
      cell: [
        {row: 0, col: 1, readOnly: true}
      ]
    });

    var htCore = getHtCore();

    expect(htCore.find('tbody tr:eq(0) td:eq(1)')[0].className.indexOf("htDimmed")).toBeGreaterThan(-1);

    moveFirstDisplayedColumnAfterSecondColumn(htCore, 1);

    expect(htCore.find('tbody tr:eq(0) td:eq(2)')[0].className.indexOf("htDimmed")).toBeGreaterThan(-1);

  });

  it("should reconstruct manualcolpositions after adding columns", function () {
    var hot = handsontable({
      data: [
        ["", "Kia", "Nissan", "Toyota", "Honda"],
        ["2008", 10, 11, 12, 13],
        ["2009", 20, 11, 14, 13],
        ["2010", 30, 15, 12, 13]
      ],
      colHeaders: true,
      rowHeaders: true,
      manualColumnMove: true,
      contextMenu: true
    });

    var htCore = getHtCore();

    selectCell(0, 2);

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('');
    expect(htCore.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Kia');
    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Nissan');

    moveSecondDisplayedColumnBeforeFirstColumn(htCore, 3);

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('');
    expect(htCore.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Nissan');
    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Kia');
    expect(hot.manualColumnPositions).toEqual([0, 2, 1, 3, 4]);

    alter('insert_col', 2);

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('');
    expect(htCore.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Nissan');
    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('');
    expect(hot.manualColumnPositions).toEqual([0, 3, 2, 1, 4, 5]);
  });

  it("should reconstruct manualcolpositions after removing columns", function () {
    var hot = handsontable({
      data: [
        ["", "Kia", "Nissan", "Toyota", "Honda"],
        ["2008", 10, 11, 12, 13],
        ["2009", 20, 11, 14, 13],
        ["2010", 30, 15, 12, 13]
      ],
      colHeaders: true,
      rowHeaders: true,
      manualColumnMove: true,
      contextMenu: true
    });

    var htCore = getHtCore();

    selectCell(0, 2);

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('');
    expect(htCore.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Kia');
    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Nissan');

    moveSecondDisplayedColumnBeforeFirstColumn(htCore, 3);

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('');
    expect(htCore.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Nissan');
    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Kia');
    expect(hot.manualColumnPositions).toEqual([0, 2, 1, 3, 4]);

    alter('remove_col', 2);

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('');
    expect(htCore.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Kia');
    expect(htCore.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Toyota');
    expect(hot.manualColumnPositions).toEqual([0, 1, 2, 3]);
  });
});
