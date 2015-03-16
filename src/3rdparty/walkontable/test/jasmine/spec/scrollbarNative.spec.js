describe('WalkontableScrollbarNative', function () {
  var $table
    , $container
    , $wrapper
    , debug = false;

  beforeEach(function () {
    $wrapper = $('<div></div>').css({'overflow': 'hidden'});
    $wrapper.width(100).height(200);
    $container = $('<div></div>');
    $table = $('<table></table>'); //create a table that is not attached to document
    $wrapper.append($container);
    $container.append($table);
    $wrapper.appendTo('body');
    createDataArray();
  });

  afterEach(function () {
    if (!debug) {
      $('.wtHolder').remove();
    }
    $wrapper.remove();
  });

  it("initial render should be no different than the redraw (vertical)", function () {
    createDataArray(100, 1);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();

    var tds = $table.find('td').length;
    wt.draw();

    expect($table.find('td').length).toEqual(tds);
  });

  it("initial render should be no different than the redraw (horizontal)", function () {
    createDataArray(1, 50);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();

    var tds = $table.find('td').length;
    wt.draw();

    expect($table.find('td').length).toEqual(tds);
  });

  it("scrolling 50px down should render 2 more rows", function () {
    createDataArray(20, 4);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();

    var lastRenderedRow = wt.wtTable.getLastRenderedRow();

    $(wt.wtTable.holder).scrollTop(50);
    wt.draw();

    expect(wt.wtTable.getLastRenderedRow()).toEqual(lastRenderedRow + 2);
  });

  it("should recognize the scrollHandler properly, even if the 'overflow' property is assigned in an external stylesheet", function () {
    $wrapper.css({
      'overflow': ''
    });
    $wrapper.addClass('testOverflowHidden');

    createDataArray(20, 4);
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();

    wt.wtOverlays.topOverlay.scrollTo(3);
    expect($(wt.wtTable.holder).scrollTop()).toEqual(69);
  });
});
