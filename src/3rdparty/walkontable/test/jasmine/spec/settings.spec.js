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

  it("should return correct countVisibleRows/countVisibleColumns for a grid without scrollbars", function () {
    createDataArray(6, 4);
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();
    expect(wt.wtTable.rowStrategy.countVisible()).toBe(getTotalRows());
    expect(wt.wtTable.columnStrategy.countVisible()).toBe(getTotalColumns());
  });
});