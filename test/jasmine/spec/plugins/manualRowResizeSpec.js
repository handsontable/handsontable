describe('manualRowResize', function () {
  var id = 'test';
  var defaultRowHeight = 22;

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  function resizeRow(displayedRowIndex, height) {

    var $container = spec().$container;
    var $th = $container.find('tbody tr:eq(' + displayedRowIndex + ') th:eq(0)');

    $th.simulate('mouseover');

    var $resizer = $container.find('.manualRowResizer');
    var resizerPosition = $resizer.position();

    $resizer.simulate('mousedown',{
      clientY: resizerPosition.top
    });

    var delta = height - $th.height() - 2;

    if (delta < 0) {
      delta = 0;
    }

    $resizer.simulate('mousemove',{
      clientY: resizerPosition.top + delta
    });

    $resizer.simulate('mouseup');
  }

  it("should change row heights at init", function () {
    handsontable({
      rowHeaders: true,
      manualRowResize: [50, 40, 100]
    });

    expect(rowHeight(this.$container, 0)).toEqual(50);
    expect(rowHeight(this.$container, 1)).toEqual(40);
    expect(rowHeight(this.$container, 2)).toEqual(100);
  });

  it("should change the default row height with updateSettings", function () {
    handsontable({
      manualRowResize: true
    });

    expect(rowHeight(this.$container, 0)).toEqual(defaultRowHeight);
    expect(rowHeight(this.$container, 1)).toEqual(defaultRowHeight);
    expect(rowHeight(this.$container, 2)).toEqual(defaultRowHeight);

    updateSettings({
      manualRowResize: [60, 50, 80]
    });

    expect(rowHeight(this.$container, 0)).toEqual(60);
    expect(rowHeight(this.$container, 1)).toEqual(50);
    expect(rowHeight(this.$container, 2)).toEqual(80);
  });

  it("should change the row height with updateSettings", function () {
    handsontable({
      manualRowResize: [60, 50, 80]
    });

    expect(rowHeight(this.$container, 0)).toEqual(60);
    expect(rowHeight(this.$container, 1)).toEqual(50);
    expect(rowHeight(this.$container, 2)).toEqual(80);

    updateSettings({
      manualRowResize: [30, 80, 100]
    });

    expect(rowHeight(this.$container, 0)).toEqual(30);
    expect(rowHeight(this.$container, 1)).toEqual(80);
    expect(rowHeight(this.$container, 2)).toEqual(100);
  });

  it("should reset row height", function () {
    handsontable({
      manualRowResize: true
    });

    expect(rowHeight(this.$container, 0)).toEqual(defaultRowHeight);
    expect(rowHeight(this.$container, 1)).toEqual(defaultRowHeight);
    expect(rowHeight(this.$container, 2)).toEqual(defaultRowHeight);

    updateSettings({
      manualRowResize: true
    });

    expect(rowHeight(this.$container, 0)).toEqual(defaultRowHeight);
    expect(rowHeight(this.$container, 1)).toEqual(defaultRowHeight);
    expect(rowHeight(this.$container, 2)).toEqual(defaultRowHeight);
  });

  it("should trigger afterRowResize event after row height changes", function () {
    var afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(this.$container, 0)).toEqual(defaultRowHeight);

    resizeRow(0, 100);
    expect(afterRowResizeCallback).toHaveBeenCalledWith(0, 100, void 0, void 0, void 0, void 0);
    expect(rowHeight(this.$container, 0)).toEqual(100);
  });

  it("should not trigger afterRowResize event if row height does not change (delta = 0)", function () {
    var afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(this.$container, 0)).toEqual(defaultRowHeight);

    resizeRow(0, defaultRowHeight);
    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(this.$container, 0)).toEqual(defaultRowHeight);
  });

  it("should not trigger afterRowResize event after if row height does not change (no mousemove event)", function () {
    var afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(this.$container, 0)).toEqual(defaultRowHeight);

    var $th = this.$container.find('tbody tr:eq(0) th:eq(0)');
    $th.simulate('mouseover');

    var $resizer = this.$container.find('.manualRowResizer');
    var resizerPosition = $resizer.position();

//    var mouseDownEvent = new $.Event('mousedown', {pageY: resizerPosition.top});
    $resizer.simulate('mousedown',{
      clientY: resizerPosition.top
    });

    $resizer.simulate('mouseup');

    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(this.$container, 0)).toEqual(defaultRowHeight);
  });

  it("should trigger an afterRowResize after row size changes, after double click", function () {
    var afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(this.$container, 0)).toEqual(defaultRowHeight);

    var $th = this.$container.find('tbody tr:eq(2) th:eq(0)');
    $th.simulate('mouseover');

    var $resizer = this.$container.find('.manualRowResizer');
    var resizerPosition = $resizer.position();

    $resizer.simulate('mousedown',{
      clientY: resizerPosition.top
    });
    $resizer.simulate('mouseup');

    $resizer.simulate('mousedown',{
      clientY:resizerPosition.top
    });
    $resizer.simulate('mouseup');

    waitsFor(function() {
      return afterRowResizeCallback.calls.length > 0;
    }, 'Row resize', 500);

    runs(function () {
      expect(afterRowResizeCallback.calls.length).toEqual(1);
      expect(afterRowResizeCallback.calls[0].args[0]).toEqual(2);

      expect(afterRowResizeCallback.calls[0].args[1]).toEqual(defaultRowHeight + 1);
      expect(rowHeight(this.$container, 2)).toEqual(defaultRowHeight);
    });
  });

  it("should not trigger afterRowResize event after if row height does not change (no dblclick event)", function () {
    var afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(this.$container, 0)).toEqual(defaultRowHeight);

    var $th = this.$container.find('tbody tr:eq(2) th:eq(0)');
    $th.simulate('mouseover');

    var $resizer = this.$container.find('.manualRowResizer');
    var resizerPosition = $resizer.position();

    $resizer.simulate('mousedown',{
      clientY:resizerPosition.top
    });
    $resizer.simulate('mouseup');

    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(this.$container, 0)).toEqual(defaultRowHeight);
  })

  it("should display the resize handle in the correct place after the table has been scrolled", function () {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(20, 20),
      rowHeaders: true,
      manualRowResize: true,
      height: 100,
      width: 200
    });

    var $rowHeader = this.$container.find('.ht_clone_left tbody tr:eq(2) th:eq(0)');
    $rowHeader.simulate("mouseover");
    var $handle = this.$container.find('.manualRowResizer');
    $handle[0].style.background = "red";

    expect($rowHeader.offset().left).toEqual($handle.offset().left);
    expect($rowHeader.offset().top + $rowHeader.height() - 5).toEqual($handle.offset().top);

    this.$container.scrollTop(200);
    this.$container.scroll();

    $rowHeader = this.$container.find('.ht_clone_left tbody tr:eq(2) th:eq(0)');
    $rowHeader.simulate("mouseover");
    expect($rowHeader.offset().left).toEqual($handle.offset().left);
    expect($rowHeader.offset().top + $rowHeader.height() - 5).toEqual($handle.offset().top);
  });
});
