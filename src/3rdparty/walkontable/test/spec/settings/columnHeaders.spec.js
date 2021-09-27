describe('columnHeaders option', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(500).height(201);
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

  it('should not add class `htColumnHeaders` when column headers are disabled', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();

    expect(spec().$wrapper.hasClass('htColumnHeaders')).toBe(false);
  });

  it('should add class `htColumnHeaders` when column headers are enabled', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }]
    });

    wt.draw();

    expect(spec().$wrapper.hasClass('htColumnHeaders')).toBe(true);
  });

  it('should create table with column headers', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }]
    });

    wt.draw();

    expect(spec().$wrapper.find('.ht_clone_left colgroup col').length).toBe(0);
    expect(spec().$wrapper.find('.ht_clone_left thead tr').length).toBe(1);
    expect(spec().$wrapper.find('.ht_clone_left tbody tr').length).toBe(0);
    expect(spec().$wrapper.find('.ht_clone_top colgroup col').length).toBe(4);
    expect(spec().$wrapper.find('.ht_clone_top thead tr').length).toBe(1);
    expect(spec().$wrapper.find('.ht_clone_top tbody tr').length).toBe(0);
    expect(spec().$wrapper.find('.ht_master colgroup col').length).toBe(4);
    expect(spec().$wrapper.find('.ht_master thead tr').length).toBe(1);
    expect(spec().$wrapper.find('.ht_master tbody tr').length).toBe(9);
  });

  it('should create column headers with correct height when th has css `white-space: normal`', () => {
    const style = $('<style>.handsontable thead th {white-space: normal;}</style>').appendTo('head');
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = 'Client State State';
      }],
      columnWidth: 80
    });

    wt.draw();

    expect(spec().$wrapper.find('.ht_clone_top thead tr').height()).toBe(43);
    style.remove();
  });

  it('should create column headers with correct height when th has css `white-space: pre-line` (default)', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = 'Client State State';
      }],
      columnWidth: 80
    });

    wt.draw();

    expect(spec().$wrapper.find('.ht_clone_top thead tr').height()).toBe(23);
  });

  it('should generate column headers from function', () => {
    const headers = ['Description', 2012, 2013, 2014];
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(column, TH) {
        TH.innerHTML = headers[column];
      }]
    });

    wt.draw();

    const visibleHeaders = headers.slice(0, wt.wtTable.getLastRenderedColumn() + 1); // headers for rendered columns only

    expect(spec().$table.find('thead tr:first th').length).toBe(visibleHeaders.length);
    expect(spec().$table.find('thead tr:first th').text()).toEqual(visibleHeaders.join(''));
  });
});
