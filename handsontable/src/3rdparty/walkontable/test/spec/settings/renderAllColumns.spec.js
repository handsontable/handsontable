describe('renderAllColumns option', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(500).height(201);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(50, 100);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  it('should render all columns once without rerendering after fast render', () => {
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
      renderAllColumns: true,
      cellRenderer,
    });

    wt.draw();

    expect(spec().$table.find('tbody tr:first td').length).toBe(100);
    expect(cellRenderer).toHaveBeenCalledTimes(900); // 100 columns * 9 virtualized rows

    wt.draw(true);

    expect(cellRenderer).toHaveBeenCalledTimes(900);

    wt.draw(false);

    expect(cellRenderer).toHaveBeenCalledTimes(1700);
  });
});
