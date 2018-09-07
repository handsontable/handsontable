describe('WalkontableCore', () => {
  let $table;
  let $container;
  let $wrapper;
  const debug = false;

  beforeEach(() => {
    $wrapper = $('<div></div>').css({ overflow: 'hidden' });
    $container = $('<div></div>');
    $table = $('<table></table>'); // create a table that is not attached to document
    $wrapper.append($container);
    $container.append($table);
    $wrapper.appendTo('body');
    createDataArray(100, 4);
  });

  afterEach(() => {
    if (!debug) {
      $('.wtHolder').remove();
    }

    $wrapper.remove();
  });

  it('first row should have the same text as in data source', () => {
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();
    const TDs = $table.find('tbody tr:first td');
    expect(TDs[0].innerHTML).toBe('0');
    expect(TDs[1].innerHTML).toBe('a');
  });

  it('should bootstrap table if empty TABLE is given', () => {
    $wrapper.width(200).height(200);

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      renderAllRows: true
    });
    wt.draw();

    expect($table.find('td').length).toBe(400);
  });

  it('should bootstrap column headers if THEAD is given', () => {
    $table.remove();
    $table = $('<table><thead><tr><th>A</th><th>B</th><th>C</th><th>D</th></tr></thead></table>');
    $table.appendTo('body');

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();
    expect($table.find('thead th').length).toBe(5); // include corner TH
    expect($table.find('tbody tr:first th').length).toBe(1);
    expect($table.find('tbody tr:first td').length).toBe(4);
  });

  it('should figure out how many columns to display if width param given', () => {
    $wrapper.width(100);

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();
    expect($table.find('tbody tr:first td').length).toBe(2);
  });

  it('should not render table that is removed from DOM', () => {
    $wrapper.remove();
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();
    expect(wt.drawn).toBe(false);
    expect(wt.drawInterrupted).toBe(true);
  });

  it('should not render table that is `display: none`', () => {
    const $div = $('<div style="display: none"></div>').appendTo('body');
    $div.append($table);

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();
    expect(wt.drawn).toBe(false);
    expect(wt.drawInterrupted).toBe(true);

    $div.remove();
  });

  it('should render empty table (limited height)', () => {
    createDataArray(0, 5);

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();

    expect(() => {
      wt.draw(); // second render was giving "Cannot read property 'firstChild' of null" sometimes
    }).not.toThrow();
  });

  it('should render empty table (unlimited height)', () => {
    createDataArray(0, 5);

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();

    expect(() => {
      wt.draw(); // second render was giving "Cannot read property 'firstChild' of null" sometimes
    }).not.toThrow();
  });

  it('should render empty then filled table (limited height)', () => {
    createDataArray(0, 5);

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();
    createDataArray(1, 5);

    expect(() => {
      wt.draw(); // second render was giving "Cannot read property 'firstChild' of null" sometimes
    }).not.toThrow();
  });

  it('should render empty then filled table (unlimited height)', () => {
    createDataArray(0, 5);

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();
    createDataArray(1, 5);

    expect(() => {
      wt.draw(); // second render was giving "Cannot read property 'firstChild' of null" sometimes
    }).not.toThrow();
  });

  it('should render table with rows but no columns', () => {
    createDataArray(5, 0);

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();

    expect($table.find('tbody tr').length).toBe(5);
    expect($table.find('tbody td').length).toBe(0);
    expect($table.find('tbody col').length).toBe(0);
  });
});
