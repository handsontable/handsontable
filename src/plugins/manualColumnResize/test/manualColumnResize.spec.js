describe('manualColumnResize', function () {
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

  it("should change column widths at init", function () {
    handsontable({
      manualColumnResize: [100, 150, 180]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').outerWidth()).toEqual(100);
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').outerWidth()).toEqual(150);
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').outerWidth()).toEqual(180);
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
      colHeaders: true
    });

    updateSettings({manualColumnResize: true});

    this.$container.find('thead tr:eq(0) th:eq(0)').simulate('mouseover');

    expect($('.manualColumnResizer').size()).toBeGreaterThan(0);
  });

  it("should change the default column widths with updateSettings", function () {
    handsontable({
      manualColumnResize: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').outerWidth()).toEqual(50);
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').outerWidth()).toEqual(50);
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').outerWidth()).toEqual(50);

    updateSettings({
      manualColumnResize: [60, 50, 80]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').outerWidth()).toEqual(60);
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').outerWidth()).toEqual(50);
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').outerWidth()).toEqual(80);
  });

  it("should change column widths with updateSettings", function () {
    handsontable({
      manualColumnResize: [100, 150, 180]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').outerWidth()).toEqual(100);
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').outerWidth()).toEqual(150);
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').outerWidth()).toEqual(180);

    updateSettings({
      manualColumnResize: [60, 50, 80]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').outerWidth()).toEqual(60);
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').outerWidth()).toEqual(50);
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').outerWidth()).toEqual(80);
  });

  it("should reset column widths", function () {
    handsontable({
      manualColumnResize: [100, 150, 180]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').outerWidth()).toEqual(100);
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').outerWidth()).toEqual(150);
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').outerWidth()).toEqual(180);

    updateSettings({
      manualColumnResize: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').outerWidth()).toEqual(50);
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').outerWidth()).toEqual(50);
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').outerWidth()).toEqual(50);
  });

  it("should resize appropriate columns, even if the column order was changed with manualColumnMove plugin", function () {
    handsontable({
      colHeaders: ["First", "Second", "Third"],
      manualColumnMove: [2, 1, 0, 3],
      manualColumnResize: true
    });

    var $columnHeaders = this.$container.find('thead tr:eq(0) th');
    var initialColumnWidths = [];

    $columnHeaders.each(function(){
       initialColumnWidths.push($(this).width());
    });

    resizeColumn.call(this, 0, 100);

    var $resizedTh = $columnHeaders.eq(0);

    expect($resizedTh.text()).toEqual('Third');
    expect($resizedTh.outerWidth()).toEqual(100);

    //Sizes of remaining columns should stay the same
    for(var i = 1; i < $columnHeaders.length; i++){
      expect($columnHeaders.eq(i).width()).toEqual(initialColumnWidths[i]);
    }
  });

  it("should trigger an afterColumnResize event after column size changes", function () {

    var afterColumnResizeCallback = jasmine.createSpy('afterColumnResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      afterColumnResize: afterColumnResizeCallback
    });

    expect(colWidth(this.$container, 0)).toEqual(50);

    resizeColumn(0, 100);

    expect(afterColumnResizeCallback).toHaveBeenCalledWith(0, 100, void 0, void 0, void 0, void 0);
    expect(colWidth(this.$container, 0)).toEqual(100);
  });

  it("should not trigger an afterColumnResize event if column size does not change (mouseMove event width delta = 0)", function () {

    var afterColumnResizeCallback = jasmine.createSpy('afterColumnResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      afterColumnResize: afterColumnResizeCallback
    });

    expect(colWidth(this.$container, 0)).toEqual(50);

    resizeColumn(0, 50);

    expect(afterColumnResizeCallback).not.toHaveBeenCalled();
    expect(colWidth(this.$container, 0)).toEqual(50);

  });

  it("should not trigger an afterColumnResize event if column size does not change (no mouseMove event)", function () {

    var afterColumnResizeCallback = jasmine.createSpy('afterColumnResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      afterColumnResize: afterColumnResizeCallback
    });

    expect(colWidth(this.$container, 0)).toEqual(50);

    var $th = this.$container.find('thead tr:eq(0) th:eq(0)');
    $th.simulate('mouseover');

    var $resizer = this.$container.find('.manualColumnResizer');
    var resizerPosition = $resizer.position();


//    var mouseDownEvent = new $.Event('mousedown', {pageX: resizerPosition.left});
//    $resizer.trigger(mouseDownEvent);
    $resizer.simulate('mousedown',{clientX: resizerPosition.left});

//    $resizer.trigger('mouseup');
    $resizer.simulate('mouseup');

    expect(afterColumnResizeCallback).not.toHaveBeenCalled();
    expect(colWidth(this.$container, 0)).toEqual(50);

  });

  it("should trigger an afterColumnResize after column size changes, after double click", function () {

    var afterColumnResizeCallback = jasmine.createSpy('afterColumnResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      afterColumnResize: afterColumnResizeCallback
    });

    expect(colWidth(this.$container, 0)).toEqual(50);

    var $th = this.$container.find('thead tr:eq(0) th:eq(0)');

    $th.simulate('mouseover');

    var $resizer = this.$container.find('.manualColumnResizer');
    var resizerPosition = $resizer.position();

    $resizer.simulate('mousedown',{clientX: resizerPosition.left});
    $resizer.simulate('mouseup');

    $resizer.simulate('mousedown',{clientX: resizerPosition.left});
    $resizer.simulate('mouseup');


    waitsFor(function(){
      return afterColumnResizeCallback.calls.length > 0;
    }, 'Column resize', 1000);

    runs(function(){
      expect(afterColumnResizeCallback.calls.length).toEqual(1);
      expect(afterColumnResizeCallback.calls[0].args[0]).toEqual(0);

      //All modern browsers returns width = 25px, but IE8 seems to compute width differently and returns 24px
      expect(afterColumnResizeCallback.calls[0].args[1]).toBeInArray([24, 25]);
      expect(colWidth(this.$container, 0)).toBeInArray([24, 25]);
    });

  });

  it("should autosize column after double click (when initial width is not defined)", function () {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      columns: [{width: 100}, {width: 200}, {}]
    });

    expect(colWidth(this.$container, 0)).toEqual(100);
    expect(colWidth(this.$container, 1)).toEqual(200);
    expect(colWidth(this.$container, 2)).toEqual(50);

    resizeColumn(2, 300);

    var $resizer = this.$container.find('.manualColumnResizer');
    var resizerPosition = $resizer.position();

    $resizer.simulate('mousedown',{clientX: resizerPosition.left});
    $resizer.simulate('mouseup');

    $resizer.simulate('mousedown',{clientX: resizerPosition.left});
    $resizer.simulate('mouseup');

    waits(1000);

    runs(function() {
      expect(colWidth(this.$container, 2)).toBeAroundValue(26);
    }.bind(this));
  });

  it("should adjust resize handles position after table size changed", function(){
    var maxed = false;

    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      stretchH: 'all',
      width: function () {
        return maxed ? 614 : 200;
      }
    });

    this.$container.find('thead th:eq(0)').simulate('mouseover');

    var handle = this.$container.find('.manualColumnResizer');
    var handleBox = handle[0].getBoundingClientRect();
    var th0 = this.$container.find('thead th:eq(0)');
    var thBox = th0[0].getBoundingClientRect();

    expect(handleBox.left + handleBox.width).toEqual(thBox.left + thBox.width - 1);

    maxed = true;

    render();
    this.$container.find('thead th:eq(0)').simulate('mouseover');

    handleBox = handle[0].getBoundingClientRect();
    thBox = th0[0].getBoundingClientRect();
    expect(handleBox.left + handleBox.width).toEqual(thBox.left + thBox.width - 1);
  });

  it("should display the resize handle in the correct place after the table has been scrolled", function () {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 20),
      colHeaders: true,
      manualColumnResize: true,
      height: 100,
      width: 200
    });

    var mainHolder = hot.view.wt.wtTable.holder;

    var $colHeader = this.$container.find('.ht_clone_top thead tr:eq(0) th:eq(2)');
    $colHeader.simulate("mouseover");
    var $handle = this.$container.find('.manualColumnResizer');
    $handle[0].style.background = "red";

    expect($colHeader.offset().left + $colHeader.width() - 5).toEqual($handle.offset().left);
    expect($colHeader.offset().top).toEqual($handle.offset().top);

    $(mainHolder).scrollLeft(200);
    hot.render();

    $colHeader = this.$container.find('.ht_clone_top thead tr:eq(0) th:eq(3)');
    $colHeader.simulate("mouseover");
    expect($colHeader.offset().left + $colHeader.width() - 5).toEqual($handle.offset().left);
    expect($colHeader.offset().top).toEqual($handle.offset().top);
  });
});
