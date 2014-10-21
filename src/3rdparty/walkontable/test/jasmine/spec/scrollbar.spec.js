describe('WalkontableScrollbar', function () {
  var $table
    , $container
    , debug = false;

  beforeEach(function () {
    $container = $('<div></div>').css({'overflow': 'auto'});
    $container.width(100).height(200);
    $table = $('<table></table>'); //create a table that is not attached to document
    $container.append($table).appendTo('body');
    createDataArray();
  });

  afterEach(function () {
    if (!debug) {
      $('.wtHolder').remove();
    }
    $container.remove();
  });

  it("should table in DIV.wtHolder that contains 2 scrollbars", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();

    expect($table.parents('.wtHolder').length).toEqual(1);
  });

  it("scrolling should have no effect when totalRows is smaller than height", function () {
    this.data.splice(5, this.data.length - 5);

    try {
      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();

      wt.wtScrollbars.vertical.onScroll(1);
      expect(wt.getViewport()[0]).toEqual(0);
      wt.wtScrollbars.vertical.onScroll(-1);
      expect(wt.getViewport()[0]).toEqual(0);
    }
    catch (e) {
      expect(e).toBeUndefined();
    }
  });


});