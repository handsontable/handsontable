describe('WalkontableCore', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(100, 4);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  it('first row should have the same text as in data source', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();
    const TDs = spec().$table.find('tbody tr:first td');

    expect(TDs[0].innerHTML).toBe('0');
    expect(TDs[1].innerHTML).toBe('a');
  });

  it('should bootstrap table if empty TABLE is given', () => {
    spec().$wrapper.width(200).height(200);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      renderAllRows: true
    });

    wt.draw();

    expect(spec().$table.find('td').length).toBe(400);
  });

  it('should bootstrap column headers if THEAD is given', () => {
    spec().$table.remove();
    spec().$table = $('<table><thead><tr><th>A</th><th>B</th><th>C</th><th>D</th></tr></thead></table>')
      .addClass('htCore');
    spec().$table.appendTo(spec().$container);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }]
    });

    wt.draw();

    expect(spec().$table.find('thead th').length).toBe(5); // include corner TH
    expect(spec().$table.find('tbody tr:first th').length).toBe(1);
    expect(spec().$table.find('tbody tr:first td').length).toBe(4);
  });

  it('should figure out how many columns to display if width param given', () => {
    spec().$wrapper.width(100);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();
    expect(spec().$table.find('tbody tr:first td').length).toBe(2);
  });

  it('should not render table that is removed from DOM', () => {
    spec().$wrapper.remove();
    const wt = walkontable({
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

    $div.append(spec().$wrapper);

    const wt = walkontable({
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

    const wt = walkontable({
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

    const wt = walkontable({
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

    const wt = walkontable({
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

    const wt = walkontable({
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

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();

    expect(spec().$table.find('tbody tr').length).toBe(5);
    expect(spec().$table.find('tbody td').length).toBe(0);
    expect(spec().$table.find('tbody col').length).toBe(0);
  });
});
