describe('WalkontableSettings', function () {
  var $table
    , debug = false;

  beforeEach(function () {
    $table = $('<table></table>'); //create a table that is not attached to document
    $table.appendTo('body');
  });

  afterEach(function () {
    if (!debug) {
      $('.wtHolder').remove();
    }
  });

  it("should return correct viewportRows/viewportCols for a grid without scrollbars", function () {
    createDataArray(6, 4);
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();
    expect(wt.getSetting('viewportRows')).toBe(getTotalRows());
    expect(wt.getSetting('viewportColumns')).toBe(getTotalColumns());
  });
});