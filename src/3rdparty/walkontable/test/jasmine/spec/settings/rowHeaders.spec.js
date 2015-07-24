describe('rowHeaders option', function () {
  var $table
    , $container
    , $wrapper
    , debug = false;

  beforeEach(function () {
    $wrapper = $('<div></div>').css({'overflow': 'hidden', 'position': 'relative'});
    $wrapper.width(500).height(201);
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

  it("shouldn\'t add class `htRowHeader` when row headers are disabled", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();

    expect($wrapper.hasClass('htRowHeaders')).toBe(false);
  });

  it("should add class `htRowHeader` when row headers are enabled", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();

    expect($wrapper.hasClass('htRowHeaders')).toBe(true);
  });

  it("should create table row headers", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();

    expect($wrapper.find('.ht_clone_left colgroup col').length).toBe(1);
    expect($wrapper.find('.ht_clone_left thead tr').length).toBe(0);
    expect($wrapper.find('.ht_clone_left tbody tr').length).toBe(9);
    expect($wrapper.find('.ht_clone_top colgroup col').length).toBe(0);
    expect($wrapper.find('.ht_clone_top thead tr').length).toBe(0);
    expect($wrapper.find('.ht_clone_top tbody tr').length).toBe(0);
    expect($wrapper.find('.ht_master colgroup col').length).toBe(5);
    expect($wrapper.find('.ht_master thead tr').length).toBe(0);
    expect($wrapper.find('.ht_master tbody tr').length).toBe(9);
  });

  it("should generate headers from function", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }]
    });

    wt.draw();
    var potentialRowCount = 9;
    expect($table.find('tbody td').length).toBe(potentialRowCount * wt.wtTable.getRenderedColumnsCount()); //displayed cells
    expect($table.find('tbody th').length).toBe(potentialRowCount); //9*1=9 displayed row headers
    expect($table.find('tbody tr:first th').length).toBe(1); //only one th per row
    expect($table.find('tbody tr:first th')[0].innerHTML).toBe('1'); //this should be the first row header
  });

  it("should add 'rowHeader' class to row header column", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function (col, TH) {
        TH.innerHTML = col + 1;
      }]
    });
    wt.draw();
    
    expect($table.find('col:first').hasClass('rowHeader')).toBe(true);
  });
});
