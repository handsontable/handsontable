describe('WalkontableScrollbar', function () {
  var $table
    , debug = false;

  beforeEach(function () {
    $table = $('<table></table>'); //create a table that is not attached to document
    $table.appendTo('body');
    createDataArray();
  });

  afterEach(function () {
    if (!debug) {
      $('.wtHolder').remove();
    }
  });

  it("should table in DIV.wtHolder that contains 2 scrollbars", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 100
    });
    wt.draw();

    expect($table.parents('.wtHolder').length).toEqual(1);
    expect($table.parents('.wtHolder:eq(0)').children('.dragdealer').length).toEqual(2);
  });

  it("handle should have the size of scrollbar if totalRows is smaller or equal height", function () {
    this.data.splice(5, this.data.length - 5);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 100
    });
    wt.draw();

    var slider = $table.parents('.wtHolder').find('.dragdealer.vertical');
    var handle = slider.find('.handle');
    expect(slider.height()).toBeGreaterThan(0);
    expect(slider.height()).toEqual(handle.height());
  });

  it("scrolling should have no effect when totalRows/Columns is smaller than height/width", function () {
    this.data.splice(5, this.data.length - 5);

    try {
      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 0,
        offsetColumn: 0,
        height: 200,
        width: 500
      });
      wt.draw();

      wt.wtScrollbars.horizontal.onScroll(1);
      expect(wt.getSetting('offsetColumn')).toEqual(0);
      wt.wtScrollbars.horizontal.onScroll(-1);
      expect(wt.getSetting('offsetColumn') + 1).toEqual(1); //+1 so it can be distinguished from previous one

      wt.wtScrollbars.vertical.onScroll(1);
      expect(wt.getSetting('offsetRow') + 2).toEqual(2); //+2 so it can be distinguished from previous one
      wt.wtScrollbars.vertical.onScroll(-1);
      expect(wt.getSetting('offsetRow') + 3).toEqual(3); //+3 so it can be distinguished from previous one
    }
    catch (e) {
      expect(e).toBeUndefined();
    }
  });

  it("vertical scrollbar position should change if table is scrolled using API", function () {
    this.data.splice(20, this.data.length - 20);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 100
    });
    wt.draw();

    var bar = $table.parents('.wtHolder').find('.dragdealer.vertical .handle');
    var originalPosition = bar.css('top');

    wt.scrollVertical(10).draw();
    expect(bar.css('top')).toBeGreaterThan(originalPosition);
  });

  it("horizontal scrollbar position should change if table is scrolled using API", function () {
    this.data.splice(20, this.data.length - 20);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 100
    });
    wt.draw();

    var bar = $table.parents('.wtHolder').find('.dragdealer.horizontal .handle');
    var originalPosition = bar.css('left');

    wt.scrollHorizontal(10).draw();
    expect(bar.css('left')).toBeGreaterThan(originalPosition);
  });

  /**
   * scrollH
   */

  it("should show horizontal scrollbar when scrollH is 'scroll' and table fits horizontally", function () {
    createDataArray(2, 2);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 400,
      scrollH: 'scroll'
    });
    wt.draw();

    var bar = $table.parents('.wtHolder').find('.dragdealer.horizontal');
    expect(bar.css('display')).toBe('block');
  });

  it("should show horizontal scrollbar when scrollH is 'scroll' and table DOES NOT fit horizontally", function () {
    createDataArray(2, 10);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 400,
      scrollH: 'scroll'
    });
    wt.draw();

    var bar = $table.parents('.wtHolder').find('.dragdealer.horizontal');
    expect(bar.css('display')).toBe('block');
  });

  it("should NOT show horizontal scrollbar when scrollH is 'auto' and table fits horizontally", function () {
    createDataArray(2, 2);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 400,
      scrollH: 'auto'
    });
    wt.draw();

    var bar = $table.parents('.wtHolder').find('.dragdealer.horizontal');
    expect(bar.css('display')).toBe('none');
  });

  it("should show horizontal scrollbar when scrollH is 'auto' and table DOES NOT fit horizontally", function () {
    createDataArray(2, 10);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 400,
      scrollH: 'auto'
    });
    wt.draw();

    var bar = $table.parents('.wtHolder').find('.dragdealer.horizontal');
    expect(bar.css('display')).toBe('block');
  });

  it("should hide/show horizontal scrollbar when scrollH is 'auto' column count changes", function () {
    createDataArray(2, 2);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 400,
      scrollH: 'auto'
    });
    wt.draw();

    var bar = $table.parents('.wtHolder').find('.dragdealer.horizontal');
    expect(bar.css('display')).toBe('none');

    createDataArray(2, 10);
    wt.draw();
    expect(bar.css('display')).toBe('block');
  });

  it("should show/hide horizontal scrollbar when scrollH is 'auto' column count changes", function () {
    createDataArray(2, 10);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 400,
      height: 100,
      scrollH: 'auto'
    });
    wt.draw();

    var bar = $table.parents('.wtHolder').find('.dragdealer.horizontal');
    var wtHider = $table.parents('.wtHider');
    expect(bar.css('display')).toBe('block');
    expect(wtHider.height()).toBe(100 - wt.getSetting('scrollbarHeight'));

    createDataArray(2, 2);
    wt.draw();
    expect(bar.css('display')).toBe('none');
    expect(wtHider.height()).toBe(100);
  });

  it("should NOT show horizontal scrollbar when scrollH is 'none' and table fits horizontally", function () {
    createDataArray(2, 2);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 400,
      scrollH: 'none'
    });
    wt.draw();

    var bar = $table.parents('.wtHolder').find('.dragdealer.horizontal');
    expect(bar.css('display')).toBe('none');
  });

  it("should NOT show horizontal scrollbar when scrollH is 'none' and table DOES NOT fit horizontally", function () {
    createDataArray(2, 10);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 400,
      scrollH: 'none'
    });
    wt.draw();

    var bar = $table.parents('.wtHolder').find('.dragdealer.horizontal');
    expect(bar.css('display')).toBe('none');
  });

  /**
   * scrollV
   */

  it("should show vertical scrollbar when scrollH is 'scroll' and table fits vertically", function () {
    createDataArray(2, 2);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      height: 400,
      scrollV: 'scroll'
    });
    wt.draw();

    var bar = $table.parents('.wtHolder').find('.dragdealer.vertical');
    expect(bar.css('display')).toBe('block');
  });

  it("should show vertical scrollbar when scrollV is 'scroll' and table DOES NOT fit vertically", function () {
    createDataArray(20, 2);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      height: 400,
      scrollV: 'scroll'
    });
    wt.draw();

    var bar = $table.parents('.wtHolder').find('.dragdealer.vertical');
    expect(bar.css('display')).toBe('block');
  });

  it("should NOT show vertical scrollbar when scrollV is 'auto' and table fits vertically", function () {
    createDataArray(2, 2);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      height: 400,
      scrollV: 'auto'
    });
    wt.draw();

    var bar = $table.parents('.wtHolder').find('.dragdealer.vertical');
    expect(bar.css('display')).toBe('none');
  });

  it("should show vertical scrollbar when scrollV is 'auto' and table DOES NOT fit vertically", function () {
    createDataArray(20, 2);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      height: 400,
      scrollV: 'auto'
    });
    wt.draw();

    var bar = $table.parents('.wtHolder').find('.dragdealer.vertical');
    expect(bar.css('display')).toBe('block');
  });

  it("should hide/show vertical scrollbar when scrollV is 'auto' column count changes", function () {
    createDataArray(2, 2);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      height: 400,
      scrollV: 'auto'
    });
    wt.draw();

    var bar = $table.parents('.wtHolder').find('.dragdealer.vertical');
    expect(bar.css('display')).toBe('none');

    createDataArray(20, 2);
    wt.draw();
    expect(bar.css('display')).toBe('block');
  });

  it("should show/hide vertical scrollbar when scrollV is 'auto' column count changes", function () {
    createDataArray(20, 2);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 100,
      height: 300,
      scrollV: 'auto'
    });
    wt.draw();

    var bar = $table.parents('.wtHolder').find('.dragdealer.vertical');
    var wtHider = $table.parents('.wtHider');
    expect(bar.css('display')).toBe('block');
    expect(wtHider.width()).toBe(100 - wt.getSetting('scrollbarWidth'));

    createDataArray(2, 2);
    wt.draw();
    expect(bar.css('display')).toBe('none');
    expect(wtHider.width()).toBe(100);
  });

  it("should NOT show vertical scrollbar when scrollV is 'none' and table fits vertically", function () {
    createDataArray(2, 2);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      height: 400,
      scrollV: 'none'
    });
    wt.draw();

    var bar = $table.parents('.wtHolder').find('.dragdealer.vertical');
    expect(bar.css('display')).toBe('none');
  });

  it("should NOT show vertical scrollbar when scrollV is 'none' and table DOES NOT fit vertically", function () {
    createDataArray(20, 2);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      height: 200,
      scrollV: 'none'
    });
    wt.draw();

    var bar = $table.parents('.wtHolder').find('.dragdealer.vertical');
    expect(bar.css('display')).toBe('none');
  });
});