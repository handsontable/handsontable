describe('manualRowMove', function () {
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

  it('should change row order at init', function () {
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
      manualRowMove: [1, 2, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
  });

  it("should be enabled after specifying it in updateSettings config", function () {
    var hot = handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"}
      ],
      rowHeaders: true
    });

    updateSettings({manualRowMove: true});

    this.$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseover');

    expect($('.manualRowMover').size()).toBeGreaterThan(0);
  });

  it('should change the default row order with updateSettings', function () {
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
      manualRowMove: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

    updateSettings({
      manualRowMove: [2, 1, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
  });

  it('should change row order with updateSettings', function () {
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
      manualRowMove: [1, 2, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');

    updateSettings({
      manualRowMove: [2, 1, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
  });

  it('should reset row order', function () {
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
      manualRowMove: [1, 2, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');

    updateSettings({
      manualRowMove: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
  });

  it('should move rows for manualRowMove: true', function () {

    this.$container.height(150);

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
        {id: 10, name: "Eve10", lastName: "Branson"}
      ],
      rowHeaders: true,
      manualRowMove: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');


    var htCore = getHtCore();

    selectCell(7, 0);

    var lastRenderedRowIndex = hot.view.wt.wtTable.getLastRenderedRow();

    expect(htCore.find('tbody tr:eq(' + (lastRenderedRowIndex - 1) + ') td:eq(0)').text()).toEqual('9');
    expect(htCore.find('tbody tr:eq(' + (lastRenderedRowIndex) + ') td:eq(0)').text()).toEqual('10');

    waits(500);

    runs(function () {
      moveSecondDisplayedRowBeforeFirstRow(htCore, lastRenderedRowIndex);

      expect(htCore.find('tbody tr:eq(' + (lastRenderedRowIndex - 1) + ') td:eq(0)').text()).toEqual('10');
      expect(htCore.find('tbody tr:eq(' + (lastRenderedRowIndex) + ') td:eq(0)').text()).toEqual('9');
    });
  });

  it('should not move rows for manualRowMove: false', function () {

    this.$container.height(150);

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
        {id: 10, name: "Eve10", lastName: "Branson"}
      ],
      rowHeaders: true,
      manualRowMove: false
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

    var htCore = getHtCore();

    selectCell(7, 0);

    var lastRenderedRowIndex = hot.view.wt.wtTable.getLastRenderedRow();
    expect(htCore.find('tbody tr:eq(' + (lastRenderedRowIndex - 1) + ') td:eq(0)').text()).toEqual('9');
    expect(htCore.find('tbody tr:eq(' + (lastRenderedRowIndex) + ') td:eq(0)').text()).toEqual('10');

    waits(500);

    runs(function () {
      moveSecondDisplayedRowBeforeFirstRow(htCore, lastRenderedRowIndex - 1);

      expect(htCore.find('tbody tr:eq(' + (lastRenderedRowIndex - 1) + ') td:eq(0)').text()).toEqual('9');
      expect(htCore.find('tbody tr:eq(' + (lastRenderedRowIndex) + ') td:eq(0)').text()).toEqual('10');
    });
  });

  it('should trigger an afterRowMove event after row move', function () {
    var afterMoveRowCallback = jasmine.createSpy('afterMoveRowCallback');

    this.$container.height(150);

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
        {id: 9, name: "Sean", lastName: "O'Hara"}
      ],
      rowHeaders: true,
      manualRowMove: true,
      afterRowMove: afterMoveRowCallback
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
    expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

    var htCore = getHtCore();
    var lastVisibleRowIndex = hot.view.wt.wtTable.getLastVisibleRow();

    selectCell(7, 0);

    waits(500);

    runs(function () {

      moveSecondDisplayedRowBeforeFirstRow(htCore, lastVisibleRowIndex);

      expect(htCore.find('tbody tr:eq(' + (lastVisibleRowIndex - 1) + ') td:eq(0)').text()).toEqual('9');
      expect(htCore.find('tbody tr:eq(' + (lastVisibleRowIndex - 2) + ') td:eq(0)').text()).toEqual('7');
      expect(htCore.find('tbody tr:eq(' + (lastVisibleRowIndex) + ') td:eq(0)').text()).toEqual('8');

      expect(afterMoveRowCallback).toHaveBeenCalledWith(lastVisibleRowIndex, lastVisibleRowIndex - 1, void 0, void 0, void 0, void 0);
    });
  });

  it("should not select the column when the user clicks the move handler", function() {
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
        {id: 9, name: "Sean", lastName: "O'Hara"}
      ],
      rowHeaders: true,
      manualRowMove: true
    });

    var $rowHeader = this.$container.find('tbody tr:eq(2) th:eq(1)');
    $rowHeader.simulate("mouseover");

    var $manualRowMover = this.$container.find('.manualRowMover');
    $manualRowMover.eq(1).simulate('mousedown');

    expect(hot.getSelected()).toEqual(undefined);
  });

  it("should display the move handle in the correct place after the table has been scrolled", function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(20, 20),
      rowHeaders: true,
      manualRowMove: true,
      height: 100,
      width: 200
    });

    var mainHolder = hot.view.wt.wtTable.holder;

    var $rowHeader = this.$container.find('.ht_clone_left tbody tr:eq(2) th:eq(0)');
    $rowHeader.simulate("mouseover");

    var $handle = this.$container.find('.manualRowMover');
    $handle[0].style.background = "red";

    expect($rowHeader.offset().left).toEqual($handle.offset().left);
    expect($rowHeader.offset().top).toEqual($handle.offset().top);

    $(mainHolder).scrollTop(200);
    hot.render();

    $rowHeader = this.$container.find('.ht_clone_left tbody tr:eq(2) th:eq(0)');
    $rowHeader.simulate("mouseover");
    expect($rowHeader.offset().left).toEqual($handle.offset().left);
    expect($rowHeader.offset().top).toEqual($handle.offset().top);
  });

  it("should move the first row to the second row", function () {
    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"}
      ],
      rowHeaders: true,
      manualRowMove: true
    });

    var htCore = getHtCore();

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
    expect(htCore.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

    moveFirstDisplayedRowAfterSecondRow(htCore, 0);

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
    expect(htCore.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
  });

  it("should move the second row to the third row", function () {
    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"}
      ],
      rowHeaders: true,
      manualRowMove: true
    });

    var htCore = getHtCore();

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
    expect(htCore.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

    moveFirstDisplayedRowAfterSecondRow(htCore, 1);

    expect(htCore.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(htCore.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
    expect(htCore.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
  });

  it("moving row should keep cell meta created using cells function", function () {
    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"}
      ],
      rowHeaders: true,
      manualRowMove: true,
      cells: function (row, col) {
        if (row == 1 && col == 0) {
          this.readOnly = true;
        }
      }
    });

    var htCore = getHtCore();

    expect(htCore.find('tbody tr:eq(1) td:eq(0)')[0].className.indexOf("htDimmed")).toBeGreaterThan(-1);

    moveFirstDisplayedRowAfterSecondRow(htCore, 1);

    expect(htCore.find('tbody tr:eq(2) td:eq(0)')[0].className.indexOf("htDimmed")).toBeGreaterThan(-1);
  });

  it("moving row should keep cell meta created using cell array", function () {
    handsontable({
      data: [
        {id: 1, name: "Ted", lastName: "Right"},
        {id: 2, name: "Frank", lastName: "Honest"},
        {id: 3, name: "Joan", lastName: "Well"},
        {id: 4, name: "Sid", lastName: "Strong"},
        {id: 5, name: "Jane", lastName: "Neat"}
      ],
      rowHeaders: true,
      manualRowMove: true,
      cell: [
        {row: 1, col: 0, readOnly: true}
      ]
    });

    var htCore = getHtCore();

    expect(htCore.find('tbody tr:eq(1) td:eq(0)')[0].className.indexOf("htDimmed")).toBeGreaterThan(-1);

    moveFirstDisplayedRowAfterSecondRow(htCore, 1);

    expect(htCore.find('tbody tr:eq(2) td:eq(0)')[0].className.indexOf("htDimmed")).toBeGreaterThan(-1);
  });

});
