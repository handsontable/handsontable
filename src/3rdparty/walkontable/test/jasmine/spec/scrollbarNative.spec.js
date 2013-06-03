describe('WalkontableScrollbarNative', function () {
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

  it("initial render should be no different than the redraw (vertical)", function () {
    createDataArray(100, 1);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      scrollbarModelH: 'native',
      scrollbarModelV: 'native'
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
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      scrollbarModelH: 'native',
      scrollbarModelV: 'native'
    });
    wt.draw();

    var tds = $table.find('td').length;
    wt.draw();

    expect($table.find('td').length).toEqual(tds);
  });
});