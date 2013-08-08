describe('WalkontableWheel', function () {
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

  it("scroll down one row", function () {
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
    expect(wt.wtTable.getCoords($table.find('tbody tr:eq(0) td:eq(0)')[0])).toEqual([0, 0]);

    $table.trigger('mousewheel', [null, null, -1]); //deltaY -1 means mouse wheel scrolled down

    waits(0); //mousewheel runs in async

    runs(function(){
      expect(wt.wtTable.getCoords($table.find('tbody tr:eq(0) td:eq(0)')[0])).toEqual([1, 0]);
    });
  });

  it("scroll down one row (wheel on parent, which sometimes is visible after scrolling to last row)", function () {
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
    expect(wt.wtTable.getCoords($table.find('tbody tr:eq(0) td:eq(0)')[0])).toEqual([0, 0]);

    $table.parent().trigger('mousewheel', [null, null, -1]); //deltaY -1 means mouse wheel scrolled down

    waits(0); //mousewheel runs in async

    runs(function(){
      expect(wt.wtTable.getCoords($table.find('tbody tr:eq(0) td:eq(0)')[0])).toEqual([1, 0]);
    });
  });
});