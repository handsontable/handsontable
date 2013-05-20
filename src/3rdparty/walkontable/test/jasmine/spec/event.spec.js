describe('WalkontableEvent', function () {
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

  it("should call `onCellMouseDown` callback", function () {
    var myCoords = null
      , myTD = null
      , wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 10,
        offsetColumn: 2,
        height: 200,
        width: 100,
        onCellMouseDown: function (event, coords, TD) {
          myCoords = coords;
          myTD = TD;
        }
      });
    wt.draw();

    var $td = $table.find('tbody tr:first td:first');
    $td.trigger('mousedown');

    expect(myCoords).toEqual([10, 2]);
    expect(myTD).toEqual($td[0]);
  });

  it("should call `onCellMouseOver` callback", function () {
    var myCoords = null
      , myTD = null
      , wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 10,
        offsetColumn: 2,
        height: 200,
        width: 100,
        onCellMouseOver: function (event, coords, TD) {
          myCoords = coords;
          myTD = TD;
        }
      });
    wt.draw();

    var $td = $table.find('tbody tr:first td:first');
    $td.trigger('mouseover');

    expect(myCoords).toEqual([10, 2]);
    expect(myTD).toEqual($td[0]);
  });

  it("should call `onCellDblClick` callback", function () {
    var myCoords = null
      , myTD = null
      , wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 10,
        offsetColumn: 2,
        height: 200,
        width: 100,
        onCellDblClick: function (event, coords, TD) {
          myCoords = coords;
          myTD = TD;
        }
      });
    wt.draw();

    var $td = $table.find('tbody tr:first td:first');
    $td.trigger('mousedown');
    $td.trigger('mouseup');
    $td.trigger('mousedown');
    $td.trigger('mouseup');
    expect(myCoords).toEqual([10, 2]);
    expect(myTD).toEqual($td[0]);
  });

  it("should call `onCellDblClick` callback, even when it is set only after first click", function () {
    var myCoords = null
      , myTD = null
      , wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 10,
        offsetColumn: 2,
        height: 200,
        width: 100
      });
    wt.draw();

    var $td = $table.find('tbody tr:first td:first');
    $td.trigger('mousedown');
    $td.trigger('mouseup');
    $td.trigger('mousedown');
    wt.update('onCellDblClick', function (event, coords, TD) {
      myCoords = coords;
      myTD = TD;
    });
    $td.trigger('mouseup');
    expect(myCoords).toEqual([10, 2]);
    expect(myTD).toEqual($td[0]);
  });

  it("should not call `onCellMouseDown` callback when clicked on TH", function () {
    var called = false
      , wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 10,
        offsetColumn: 2,
        height: 200,
        width: 100,
        columnHeaders: [function (col, TH) {
          TH.innerHTML = col + 1;
        }],
        onCellMouseDown: function (event, coords, TD) {
          called = true
        }
      });
    wt.draw();

    var $th = $table.find('th:first');
    $th.trigger('mousedown');
    expect(called).toEqual(false);
  });

  it("should not call `onCellMouseOver` callback when clicked on TH", function () {
    var called = false
      , wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 10,
        offsetColumn: 2,
        height: 200,
        width: 100,
        columnHeaders: [function (col, TH) {
          TH.innerHTML = col + 1;
        }],
        onCellMouseOver: function (event, coords, TD) {
          called = true
        }
      });
    wt.draw();

    var $th = $table.find('th:first');
    $th.trigger('mouseover');
    expect(called).toEqual(false);
  });

  it("should not call `onCellDblClick` callback when clicked on TH", function () {
    var called = false
      , wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 10,
        offsetColumn: 2,
        height: 200,
        width: 100,
        columnHeaders: [function (col, TH) {
          TH.innerHTML = col + 1;
        }],
        onCellDblClick: function (event, coords, TD) {
          called = true
        }
      });
    wt.draw();

    var $th = $table.find('th:first');
    $th.trigger('mousedown');
    $th.trigger('mouseup');
    $th.trigger('mousedown');
    $th.trigger('mouseup');
    expect(called).toEqual(false);
  });

  it("should not call `onCellDblClick` callback when right-clicked", function () {
    var called = false
      , wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 10,
        offsetColumn: 2,
        height: 200,
        width: 100,
        onCellDblClick: function (event, coords, TD) {
          called = true
        }
      });
    wt.draw();

    var $td = $table.find('tbody tr:first td:first');
    var mouseup = $.Event('mouseup');
    var mousedown = $.Event('mousedown');
    mouseup.button = mouseup.button = 2; //right mouse button
    $td.trigger(mousedown);
    $td.trigger(mouseup);
    $td.trigger(mousedown);
    $td.trigger(mouseup);
    expect(called).toEqual(false);
  });

  it("should not call `onCellDblClick` when first mouse up came from mouse drag", function () {
    var called = false
      , wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 10,
        offsetColumn: 2,
        height: 200,
        width: 100,
        onCellDblClick: function (event, coords, TD) {
          called = true
        }
      });
    wt.draw();

    var $td = $table.find('tbody tr:first td:first');
    var $td2 = $table.find('tbody tr:first td:eq(1)');
    $td2.trigger('mousedown');
    $td.trigger('mouseup');
    $td.trigger('mousedown');
    $td.trigger('mouseup');
    expect(called).toEqual(false);
  });

  it("border click should call `onCellMouseDown` callback", function () {
    var myCoords = null
      , myTD = null
      , wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 10,
        offsetColumn: 2,
        height: 200,
        width: 100,
        selections: {
          current: {
            className: 'current',
            border: {
              width: 1,
              color: 'red',
              style: 'solid'
            }
          }
        },
        onCellMouseDown: function (event, coords, TD) {
          myCoords = coords;
          myTD = TD;
        }
      });
    wt.selections.current.add([10, 2]);
    wt.draw();

    var $td = $table.find('tbody tr:first td:first');
    var $border = $table.parents('.wtHolder').find('.wtBorder:first');
    $border.trigger('mousedown');

    expect(myCoords).toEqual([10, 2]);
    expect(myTD).toEqual($td[0]);
  });

  it("border click should call `onCellDblClick` callback", function () {
    var myCoords = null
      , myTD = null
      , wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 10,
        offsetColumn: 2,
        height: 200,
        width: 100,
        selections: {
          current: {
            className: 'current',
            border: {
              width: 1,
              color: 'red',
              style: 'solid'
            }
          }
        },
        onCellDblClick: function (event, coords, TD) {
          myCoords = coords;
          myTD = TD;
        }
      });
    wt.selections.current.add([10, 2]);
    wt.draw();

    var $td = $table.find('tbody tr:first td:first');
    var $border = $table.parents('.wtHolder').find('.wtBorder:first');
    $border.trigger('mousedown');
    $border.trigger('mouseup');
    $border.trigger('mousedown');
    $border.trigger('mouseup');
    expect(myCoords).toEqual([10, 2]);
    expect(myTD).toEqual($td[0]);
  });

  //corner

  it("should call `onCellCornerMouseDown` callback", function () {
    var clicked = false
      , wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 10,
        offsetColumn: 2,
        height: 200,
        width: 100,
        selections: {
          current: {
            className: 'current',
            border: {
              width: 1,
              color: 'red',
              style: 'solid'
            }
          }
        },
        onCellCornerMouseDown: function (event) {
          clicked = true;
        }
      });
    wt.selections.current.add([10, 2]);
    wt.draw();

    var $td = $table.parents('.wtHolder').find('.current.corner');
    $td.trigger('mousedown');
    expect(clicked).toEqual(true);
  });

  it("should call `onCellCornerDblClick` callback, even when it is set only after first click", function () {
    var clicked = false
      , wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 10,
        offsetColumn: 2,
        height: 200,
        width: 100,
        selections: {
          current: {
            className: 'current',
            border: {
              width: 1,
              color: 'red',
              style: 'solid'
            }
          }
        }
      });
    wt.selections.current.add([10, 2]);
    wt.draw();

    var $td = $table.parents('.wtHolder').find('.current.corner');
    $td.trigger('mousedown');
    $td.trigger('mouseup');
    $td.trigger('mousedown');
    wt.update('onCellCornerDblClick', function (event) {
      clicked = true;
    });
    $td.trigger('mouseup');
    expect(clicked).toEqual(true);
  });

  it("should call `onDraw` callback after render", function () {
    var count = 0
      , wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 10,
        offsetColumn: 2,
        height: 200,
        width: 100,
        onDraw: function () {
          count++;
        }
      });
    wt.draw();
    expect(count).toEqual(1);
  });
});