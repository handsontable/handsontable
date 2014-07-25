describe('WalkontableCore', function () {
  var $table,
    $container
    , debug = false;

  beforeEach(function () {
    $container = $('<div></div>').css({'overflow': 'auto'});
    $table = $('<table></table>'); //create a table that is not attached to document
    $container.append($table).appendTo('body');
    createDataArray(100, 4);
  });

  afterEach(function () {
    if (!debug) {
      $('.wtHolder').remove();
    }

    $container.remove();
  });

  it("first row should have the same text as in data source", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 200,
      width: 100
    });
    wt.draw();
    var TDs = $table.find('tbody tr:first td');
    expect(TDs[0].innerHTML).toBe('0');
    expect(TDs[1].innerHTML).toBe('a');
  });

  it("should bootstrap table if empty TABLE is given", function () {
    var rowHeight = 23; //measured in real life with walkontable.css
    var colCount = 4;
    var height = 200;

    $container.width(200).height(height);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: height,
      width: 200
    });
    wt.draw();

    var potentialCellCount = colCount * (Math.ceil(height / rowHeight) + wt.wtTable.getRowStrategy().maxOuts);

    expect($table.find('td').length).toBe(potentialCellCount);
  });

  it("should bootstrap column headers if THEAD is given", function () {
    $table.remove();
    $table = $('<table><thead><tr><th>A</th><th>B</th><th>C</th><th>D</th></tr></thead></table>');
    $table.appendTo('body');

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 200,
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();
    expect($table.find('thead th').length).toBe(5); //include corner TH
    expect($table.find('tbody tr:first th').length).toBe(1);
    expect($table.find('tbody tr:first td').length).toBe(4);
  });

  it("should figure out the amount of rows to display if height param given", function () {
    var rowHeight = 23; //measured in real life with walkontable.css

    $container.height(400);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 400
    });
    wt.draw();

    var expectedRowCount = Math.ceil(400 / rowHeight) + wt.wtTable.getRowStrategy().maxOuts;

    expect($table.find('tbody tr').length).toBe(expectedRowCount);
  });

  it("should figure out how many columns to display if width param given", function () {

    $container.width(100);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      width: 100
    });
    wt.draw();
    expect($table.find('tbody tr:first td').length).toBe(4);
  });

  it("should not render table that is removed from DOM", function () {
    $container.remove();
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      width: 100
    });
    wt.draw();
    expect(wt.drawn).toBe(false);
    expect(wt.drawInterrupted).toBe(true);
  });

  it("should not render table that is `display: none`", function () {
    var $div = $('<div style="display: none"></div>').appendTo('body');
    $div.append($table);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      width: 100
    });
    wt.draw();
    expect(wt.drawn).toBe(false);
    expect(wt.drawInterrupted).toBe(true);

    $div.remove();
  });

  it("should render empty table (limited height)", function () {
    createDataArray(0, 5);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      height: 100
    });
    wt.draw();
    wt.draw(); //second render was giving "Cannot read property 'firstChild' of null" sometimes
  });

  it("should render empty table (unlimited height)", function () {
    createDataArray(0, 5);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();
    wt.draw(); //second render was giving "Cannot read property 'firstChild' of null" sometimes
  });

  it("should render empty then filled table (limited height)", function () {
    createDataArray(0, 5);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      height: 100
    });
    wt.draw();
    createDataArray(1, 5);
    wt.draw(); //second render was giving "Cannot read property 'firstChild' of null" sometimes
  });

  it("should render empty then filled table (unlimited height)", function () {
    createDataArray(0, 5);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();
    createDataArray(1, 5);
    wt.draw(); //second render was giving "Cannot read property 'firstChild' of null" sometimes
  });

  it("should render table with rows but no columns", function () {
    createDataArray(5, 0);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();
  });
});