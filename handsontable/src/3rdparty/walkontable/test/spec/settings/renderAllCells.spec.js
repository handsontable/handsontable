describe('renderAllRows and renderAllColumns combination', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(500).height(201);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(100, 50);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  it('should render all cells once without cell rerendering after fast render', () => {
    const cellRenderer = jasmine.createSpy('cellRenderer');
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(column, TH) {
        TH.innerHTML = column + 1;
      }],
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }],
      renderAllRows: true,
      renderAllColumns: true,
      cellRenderer,
    });

    wt.draw();

    expect(spec().$table.find('tbody tr').length).toBe(100);
    expect(spec().$table.find('tbody tr:first td').length).toBe(50);
    expect(cellRenderer).toHaveBeenCalledTimes(5000); // 100 rows * 50 columns

    wt.draw(true);

    expect(cellRenderer).toHaveBeenCalledTimes(5000);

    wt.draw(false);

    expect(cellRenderer).toHaveBeenCalledTimes(10000);
  });
});
