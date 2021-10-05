describe('rowHeaders option', () => {
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

  it('should not add class `htRowHeader` when row headers are disabled', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();

    expect(spec().$wrapper.hasClass('htRowHeaders')).toBe(false);
  });

  it('should add class `htRowHeader` when row headers are enabled', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }]
    });

    wt.draw();

    expect(spec().$wrapper.hasClass('htRowHeaders')).toBe(true);
  });

  it('should create table row headers', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }]
    });

    wt.draw();

    expect(spec().$wrapper.find('.ht_clone_left colgroup col').length).toBe(1);
    expect(spec().$wrapper.find('.ht_clone_left thead tr').length).toBe(0);
    expect(spec().$wrapper.find('.ht_clone_left tbody tr').length).toBe(9);
    expect(spec().$wrapper.find('.ht_clone_top colgroup col').length).toBe(0);
    expect(spec().$wrapper.find('.ht_clone_top thead tr').length).toBe(0);
    expect(spec().$wrapper.find('.ht_clone_top tbody tr').length).toBe(0);
    expect(spec().$wrapper.find('.ht_master colgroup col').length).toBe(5);
    expect(spec().$wrapper.find('.ht_master thead tr').length).toBe(0);
    expect(spec().$wrapper.find('.ht_master tbody tr').length).toBe(9);
  });

  it('should generate headers from function', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }]
    });

    wt.draw();
    const potentialRowCount = 9;

    expect(spec().$table.find('tbody td').length).toBe(potentialRowCount * wt.wtTable.getRenderedColumnsCount()); // displayed cells
    expect(spec().$table.find('tbody th').length).toBe(potentialRowCount); // 9*1=9 displayed row headers
    expect(spec().$table.find('tbody tr:first th').length).toBe(1); // only one th per row
    expect(spec().$table.find('tbody tr:first th')[0].innerHTML).toBe('1'); // this should be the first row header
  });

  it('should add \'rowHeader\' class to row header column', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }]
    });

    wt.draw();

    expect(spec().$table.find('col:first').hasClass('rowHeader')).toBe(true);
  });
});
