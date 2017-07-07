describe('manualColumnResize', () => {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should change column widths at init', function() {
    handsontable({
      manualColumnResize: [100, 150, 180]
    });

    expect(colWidth(this.$container, 0)).toBe(100);
    expect(colWidth(this.$container, 1)).toBe(150);
    expect(colWidth(this.$container, 2)).toBe(180);
  });

  it('should be enabled after specifying it in updateSettings config', function() {
    var hot = handsontable({
      data: [
        {id: 1, name: 'Ted', lastName: 'Right'},
        {id: 2, name: 'Frank', lastName: 'Honest'},
        {id: 3, name: 'Joan', lastName: 'Well'},
        {id: 4, name: 'Sid', lastName: 'Strong'},
        {id: 5, name: 'Jane', lastName: 'Neat'}
      ],
      colHeaders: true
    });

    updateSettings({manualColumnResize: true});

    this.$container.find('thead tr:eq(0) th:eq(0)').simulate('mouseover');

    expect($('.manualColumnResizer').size()).toBeGreaterThan(0);
  });

  it('should change the default column widths with updateSettings', function() {
    handsontable({
      manualColumnResize: true
    });

    expect(colWidth(this.$container, 0)).toBe(50);
    expect(colWidth(this.$container, 1)).toBe(50);
    expect(colWidth(this.$container, 2)).toBe(50);

    updateSettings({
      manualColumnResize: [60, 50, 80]
    });

    expect(colWidth(this.$container, 0)).toBe(60);
    expect(colWidth(this.$container, 1)).toBe(50);
    expect(colWidth(this.$container, 2)).toBe(80);
  });

  it('should change column widths with updateSettings', function() {
    handsontable({
      manualColumnResize: [100, 150, 180]
    });

    expect(colWidth(this.$container, 0)).toBe(100);
    expect(colWidth(this.$container, 1)).toBe(150);
    expect(colWidth(this.$container, 2)).toBe(180);

    updateSettings({
      manualColumnResize: [60, 50, 80]
    });

    expect(colWidth(this.$container, 0)).toBe(60);
    expect(colWidth(this.$container, 1)).toBe(50);
    expect(colWidth(this.$container, 2)).toBe(80);
  });

  it('should reset column widths when undefined is passed', function() {
    handsontable({
      manualColumnResize: [100, 150, 180]
    });

    expect(colWidth(this.$container, 0)).toBe(100);
    expect(colWidth(this.$container, 1)).toBe(150);
    expect(colWidth(this.$container, 2)).toBe(180);

    updateSettings({
      manualColumnResize: void 0
    });

    expect(colWidth(this.$container, 0)).toBe(50);
    expect(colWidth(this.$container, 1)).toBe(50);
    expect(colWidth(this.$container, 2)).toBe(50);
  });

  it('should not reset column widths when `true` is passed', function() {
    handsontable({
      manualColumnResize: [100, 150, 180]
    });

    expect(colWidth(this.$container, 0)).toBe(100);
    expect(colWidth(this.$container, 1)).toBe(150);
    expect(colWidth(this.$container, 2)).toBe(180);

    updateSettings({
      manualColumnResize: true
    });

    expect(colWidth(this.$container, 0)).toBe(100);
    expect(colWidth(this.$container, 1)).toBe(150);
    expect(colWidth(this.$container, 2)).toBe(180);
  });

  it('should resize (narrowing) appropriate columns, even when stretchH `all` is enabled', function() {
    this.$container.css('width', '910px');
    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      stretchH: 'all'
    });

    resizeColumn(1, 65);

    var $columnHeaders = this.$container.find('thead tr:eq(1) th');

    expect($columnHeaders.eq(0).width()).toBe(209);
    expect($columnHeaders.eq(1).width()).toBe(64);
    expect($columnHeaders.eq(2).width()).toBe(210);
    expect($columnHeaders.eq(3).width()).toBe(210);
    expect($columnHeaders.eq(4).width()).toBe(211);
  });

  it('should resize (extending) appropriate columns, even when stretchH `all` is enabled', function() {
    this.$container.css('width', '910px');
    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      stretchH: 'all'
    });

    resizeColumn(1, 400);

    var $columnHeaders = this.$container.find('thead tr:eq(1) th');

    expect($columnHeaders.eq(0).width()).toBe(125);
    expect($columnHeaders.eq(1).width()).toBe(399);
    expect($columnHeaders.eq(2).width()).toBe(126);
    expect($columnHeaders.eq(3).width()).toBe(126);
    expect($columnHeaders.eq(4).width()).toBe(128);
  });

  it('should resize (narrowing) selected columns', function(done) {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 20),
      colHeaders: true,
      manualColumnResize: true
    });

    var $columnHeaders = this.$container.find('thead tr:eq(0) th');
    var $colHeader = this.$container.find('thead tr:eq(0) th:eq(1)');
    $colHeader.simulate('mouseover');

    var $resizer = this.$container.find('.manualColumnResizer');
    var resizerPosition = $resizer.position();

    this.$container.find('tr:eq(0) th:eq(1)').simulate('mousedown');
    this.$container.find('tr:eq(0) th:eq(2)').simulate('mouseover');
    this.$container.find('tr:eq(0) th:eq(3)').simulate('mouseover');
    this.$container.find('tr:eq(0) th:eq(3)').simulate('mousemove');
    this.$container.find('tr:eq(0) th:eq(3)').simulate('mouseup');

    $resizer.simulate('mousedown', {clientX: resizerPosition.left});
    $resizer.simulate('mousemove', {clientX: this.$container.find('tr:eq(0) th:eq(1)').position().left + 29});
    $resizer.simulate('mouseup');

    setTimeout(() => {
      expect($columnHeaders.eq(1).width()).toBe(33);
      expect($columnHeaders.eq(2).width()).toBe(34);
      expect($columnHeaders.eq(3).width()).toBe(34);
      done();
    }, 1000);
  });

  it('should resize (expanding) selected columns', function(done) {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 20),
      colHeaders: true,
      manualColumnResize: true
    });

    var $columnHeaders = this.$container.find('thead tr:eq(0) th');
    var $colHeader = this.$container.find('thead tr:eq(0) th:eq(1)');
    $colHeader.simulate('mouseover');

    var $resizer = this.$container.find('.manualColumnResizer');
    var resizerPosition = $resizer.position();

    this.$container.find('tr:eq(0) th:eq(1)').simulate('mousedown');
    this.$container.find('tr:eq(0) th:eq(2)').simulate('mouseover');
    this.$container.find('tr:eq(0) th:eq(3)').simulate('mouseover');
    this.$container.find('tr:eq(0) th:eq(3)').simulate('mousemove');
    this.$container.find('tr:eq(0) th:eq(3)').simulate('mouseup');

    $resizer.simulate('mousedown', {clientX: resizerPosition.left});
    $resizer.simulate('mousemove', {clientX: this.$container.find('tr:eq(0) th:eq(1)').position().left + 150});
    $resizer.simulate('mouseup');

    setTimeout(() => {
      expect($columnHeaders.eq(1).width()).toBe(154);
      expect($columnHeaders.eq(2).width()).toBe(155);
      expect($columnHeaders.eq(3).width()).toBe(155);
      done();
    }, 1000);
  });

  it('should resize appropriate columns to calculated stretch width after double click on column handler when stretchH is set as `all`', function(done) {
    this.$container.css('width', '910px');
    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      stretchH: 'all',
    });

    resizeColumn(1, 65);

    var $columnHeaders = this.$container.find('thead tr:eq(1) th');

    expect($columnHeaders.eq(0).width()).toBe(209);
    expect($columnHeaders.eq(1).width()).toBe(64);
    expect($columnHeaders.eq(2).width()).toBe(210);
    expect($columnHeaders.eq(3).width()).toBe(210);
    expect($columnHeaders.eq(4).width()).toBe(211);

    var $th = $columnHeaders.eq(1);

    $th.simulate('mouseover');

    var $resizer = this.$container.find('.manualColumnResizer');
    var resizerPosition = $resizer.position();

    $resizer.simulate('mousedown', {clientX: resizerPosition.left});
    $resizer.simulate('mouseup');

    $resizer.simulate('mousedown', {clientX: resizerPosition.left});
    $resizer.simulate('mouseup');

    setTimeout(() => {
      expect($columnHeaders.eq(0).width()).toBe(180);
      expect($columnHeaders.eq(1).width()).toBe(181);
      expect($columnHeaders.eq(2).width()).toBe(181);
      expect($columnHeaders.eq(3).width()).toBe(181);
      expect($columnHeaders.eq(4).width()).toBe(181);
      done();
    }, 1000);
  });

  it('should resize appropriate columns to calculated autoColumnSize width after double click on column handler when stretchH is set as `last`', function(done) {
    this.$container.css('width', '910px');
    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      stretchH: 'last',
    });

    resizeColumn(0, 65);

    var $columnHeaders = this.$container.find('thead tr:eq(0) th');

    expect($columnHeaders.eq(0).width()).toBe(63);
    expect($columnHeaders.eq(1).width()).toBe(48);
    expect($columnHeaders.eq(2).width()).toBe(49);
    expect($columnHeaders.eq(3).width()).toBe(49);
    expect($columnHeaders.eq(4).width()).toBe(694);

    var $th = $columnHeaders.eq(0);

    $th.simulate('mouseover');

    var $resizer = this.$container.find('.manualColumnResizer');
    var resizerPosition = $resizer.position();

    $resizer.simulate('mousedown', {clientX: resizerPosition.left});
    $resizer.simulate('mouseup');

    $resizer.simulate('mousedown', {clientX: resizerPosition.left});
    $resizer.simulate('mouseup');

    setTimeout(() => {
      expect($columnHeaders.eq(0).width()).toBeAroundValue(19);
      expect($columnHeaders.eq(1).width()).toBe(48);
      expect($columnHeaders.eq(2).width()).toBe(49);
      expect($columnHeaders.eq(3).width()).toBe(49);
      expect($columnHeaders.eq(4).width()).toBeAroundValue(738);
      done();
    }, 1000);
  });

  it('should resize appropriate columns, even if the column order was changed with manualColumnMove plugin', function() {
    handsontable({
      colHeaders: ['First', 'Second', 'Third'],
      manualColumnMove: [2, 1, 0, 3],
      manualColumnResize: true
    });

    var $columnHeaders = this.$container.find('thead tr:eq(0) th');
    var initialColumnWidths = [];

    $columnHeaders.each(function() {
      initialColumnWidths.push($(this).width());
    });

    resizeColumn.call(this, 0, 100);

    var $resizedTh = $columnHeaders.eq(0);

    expect($resizedTh.text()).toEqual('Third');
    expect($resizedTh.outerWidth()).toEqual(100);

    // Sizes of remaining columns should stay the same
    for (var i = 1; i < $columnHeaders.length; i++) {
      expect($columnHeaders.eq(i).width()).toEqual(initialColumnWidths[i]);
    }
  });

  it('should trigger an afterColumnResize event after column size changes', function() {
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

  it('should not trigger an afterColumnResize event if column size does not change (mouseMove event width delta = 0)', function() {
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

  it('should not trigger an afterColumnResize event if column size does not change (no mouseMove event)', function() {
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

    $resizer.simulate('mousedown', {clientX: resizerPosition.left});
    $resizer.simulate('mouseup');

    expect(afterColumnResizeCallback).not.toHaveBeenCalled();
    expect(colWidth(this.$container, 0)).toEqual(50);
  });

  it('should trigger an afterColumnResize after column size changes, after double click', function(done) {
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

    $resizer.simulate('mousedown', {clientX: resizerPosition.left});
    $resizer.simulate('mouseup');

    $resizer.simulate('mousedown', {clientX: resizerPosition.left});
    $resizer.simulate('mouseup');

    setTimeout(() => {
      expect(afterColumnResizeCallback.calls.count()).toEqual(1);
      expect(afterColumnResizeCallback.calls.argsFor(0)[0]).toEqual(0);
      // All modern browsers returns width = 25px, but IE8 seems to compute width differently and returns 24px
      expect(afterColumnResizeCallback.calls.argsFor(0)[1]).toBeInArray([30, 31, 32, 24, 25]);
      expect(colWidth(spec().$container, 0)).toBeInArray([30, 31, 32, 24, 25]);
      done();
    }, 1000);
  });

  it('should autosize column after double click (when initial width is not defined)', function(done) {
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

    $resizer.simulate('mousedown', {clientX: resizerPosition.left});
    $resizer.simulate('mouseup');

    $resizer.simulate('mousedown', {clientX: resizerPosition.left});
    $resizer.simulate('mouseup');

    setTimeout(() => {
      expect(colWidth(spec().$container, 2)).toBeAroundValue(29, 3);
      done();
    }, 1000);
  });

  it('should autosize selected columns after double click on handler', function(done) {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(9, 9),
      colHeaders: true,
      manualColumnResize: true,
    });

    resizeColumn(2, 300);

    this.$container.find('thead tr:eq(0) th:eq(1)').simulate('mousedown');
    this.$container.find('thead tr:eq(0) th:eq(2)').simulate('mouseover');
    this.$container.find('thead tr:eq(0) th:eq(3)').simulate('mouseover');
    this.$container.find('thead tr:eq(0) th:eq(3)').simulate('mousemove');
    this.$container.find('thead tr:eq(0) th:eq(3)').simulate('mouseup');

    var $resizer = spec().$container.find('.manualColumnResizer');
    var resizerPosition = $resizer.position();

    setTimeout(() => {
      $resizer.simulate('mousedown', {clientX: resizerPosition.left});
      $resizer.simulate('mouseup');
      $resizer.simulate('mousedown', {clientX: resizerPosition.left});
      $resizer.simulate('mouseup');
    }, 600);

    setTimeout(() => {
      expect(colWidth(spec().$container, 1)).toBeAroundValue(32, 2);
      expect(colWidth(spec().$container, 2)).toBeAroundValue(32, 2);
      expect(colWidth(spec().$container, 3)).toBeAroundValue(32, 2);
      done();
    }, 1200);
  });

  it('should adjust resize handles position after table size changed', function() {
    var maxed = false;

    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      stretchH: 'all',
      width() {
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

  it('should display the resize handle in the correct place after the table has been scrolled', function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 20),
      colHeaders: true,
      manualColumnResize: true,
      height: 100,
      width: 200
    });

    var mainHolder = hot.view.wt.wtTable.holder;

    var $colHeader = this.$container.find('.ht_clone_top thead tr:eq(0) th:eq(2)');
    $colHeader.simulate('mouseover');
    var $handle = this.$container.find('.manualColumnResizer');
    $handle[0].style.background = 'red';

    expect($colHeader.offset().left + $colHeader.width() - 5).toBeCloseTo($handle.offset().left, 0);
    expect($colHeader.offset().top).toBeCloseTo($handle.offset().top, 0);

    $(mainHolder).scrollLeft(200);
    hot.render();

    $colHeader = this.$container.find('.ht_clone_top thead tr:eq(0) th:eq(3)');
    $colHeader.simulate('mouseover');
    expect($colHeader.offset().left + $colHeader.width() - 5).toBeCloseTo($handle.offset().left, 0);
    expect($colHeader.offset().top).toBeCloseTo($handle.offset().top, 0);
  });

  describe('handle and guide', () => {
    it('should display the resize handle in the proper position and with a proper size', function() {
      var hot = handsontable({
        data: [
          {id: 1, name: 'Ted', lastName: 'Right'},
          {id: 2, name: 'Frank', lastName: 'Honest'},
          {id: 3, name: 'Joan', lastName: 'Well'},
          {id: 4, name: 'Sid', lastName: 'Strong'},
          {id: 5, name: 'Jane', lastName: 'Neat'}
        ],
        colHeaders: true,
        manualColumnResize: true
      });

      var $headerTH = this.$container.find('thead tr:eq(0) th:eq(1)');
      $headerTH.simulate('mouseover');

      var $handle = $('.manualColumnResizer');

      expect($handle.offset().left).toEqual($headerTH.offset().left + $headerTH.outerWidth() - $handle.outerWidth() - 1);
      expect($handle.height()).toEqual($headerTH.outerHeight());
    });
  });
});
