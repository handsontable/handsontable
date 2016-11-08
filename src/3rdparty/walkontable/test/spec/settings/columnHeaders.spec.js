describe('columnHeaders option', function () {
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

  it("shouldn\'t add class `htColumnHeaders` when column headers are disabled", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();

    expect($wrapper.hasClass('htColumnHeaders')).toBe(false);
  });

  it("should add class `htColumnHeaders` when column headers are enabled", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function (col, TH) {
        TH.innerHTML = col + 1;
      }]
    });
    wt.draw();

    expect($wrapper.hasClass('htColumnHeaders')).toBe(true);
  });

  it("should create table with column headers", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function (col, TH) {
        TH.innerHTML = col + 1;
      }]
    });
    wt.draw();

    expect($wrapper.find('.ht_clone_left colgroup col').length).toBe(0);
    expect($wrapper.find('.ht_clone_left thead tr').length).toBe(1);
    expect($wrapper.find('.ht_clone_left tbody tr').length).toBe(0);
    expect($wrapper.find('.ht_clone_top colgroup col').length).toBe(4);
    expect($wrapper.find('.ht_clone_top thead tr').length).toBe(1);
    expect($wrapper.find('.ht_clone_top tbody tr').length).toBe(0);
    expect($wrapper.find('.ht_master colgroup col').length).toBe(4);
    expect($wrapper.find('.ht_master thead tr').length).toBe(1);
    expect($wrapper.find('.ht_master tbody tr').length).toBe(9);
  });

  it("should create column headers with correct height when th has css `white-space: normal`", function () {
    var style = $('<style>.handsontable thead th {white-space: normal;}</style>').appendTo('head');
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function (col, TH) {
        TH.innerHTML = 'Client State State';
      }],
      columnWidth: 80
    });
    wt.draw();

    expect($wrapper.find('.ht_clone_top thead tr').height()).toBe(43);
    style.remove();
  });

  it("should create column headers with correct height when th has css `white-space: pre-line` (default)", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function (col, TH) {
        TH.innerHTML = 'Client State State';
      }],
      columnWidth: 80
    });
    wt.draw();

    expect($wrapper.find('.ht_clone_top thead tr').height()).toBe(23);
  });

  it("should generate column headers from function", function () {
    var headers = ["Description", 2012, 2013, 2014];
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function (column, TH) {
        TH.innerHTML = headers[column];
      }]
    });
    wt.draw();

    var visibleHeaders = headers.slice(0, wt.wtTable.getLastRenderedColumn() + 1); // headers for rendered columns only

    expect($table.find('thead tr:first th').length).toBe(visibleHeaders.length);
    expect($table.find('thead tr:first th').text()).toEqual(visibleHeaders.join(''));
  });
});
