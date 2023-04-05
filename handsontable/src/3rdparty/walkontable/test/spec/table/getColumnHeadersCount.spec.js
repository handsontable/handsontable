describe('WalkontableTable', () => {
  const debug = false;

  function hotParentName(TH) {
    const hotParent = TH.parentElement.parentElement.parentElement.parentElement.parentElement
      .parentElement.parentElement;
    const classes = hotParent.className.split(' ');

    return classes[0];
  }

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(100).height(201);
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

  describe('getColumnHeadersCount()', () => {
    it('should return count that is relevant to given header layers', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [
          (col, TH) => { TH.innerHTML = `${hotParentName(TH)}-header-of-col-0-${col}`; },
          (col, TH) => { TH.innerHTML = `${hotParentName(TH)}-header-of-col-1-${col}`; },
          (col, TH) => { TH.innerHTML = `${hotParentName(TH)}-header-of-col-2-${col}`; },
        ],
        rowHeaders: [
          (row, TH) => { TH.innerHTML = `${hotParentName(TH)}-header-of-row-0-${row}`; },
        ],
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsStart: 2
      });

      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getColumnHeadersCount(), 'master').toBe(3);
      expectWtTable(wt, wtTable => wtTable.getColumnHeadersCount(), 'bottomInlineStartCorner').toBe(0);
      expectWtTable(wt, wtTable => wtTable.getColumnHeadersCount(), 'bottom').toBe(0);
      expectWtTable(wt, wtTable => wtTable.getColumnHeadersCount(), 'inlineStart').toBe(3);
      expectWtTable(wt, wtTable => wtTable.getColumnHeadersCount(), 'topInlineStartCorner').toBe(3);
      expectWtTable(wt, wtTable => wtTable.getColumnHeadersCount(), 'top').toBe(3);
    });

    it('should return 0 for disabled column headers', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getColumnHeadersCount(), 'master').toBe(0);
      expectWtTable(wt, wtTable => wtTable.getColumnHeadersCount(), 'bottomInlineStartCorner').toBe(0);
      expectWtTable(wt, wtTable => wtTable.getColumnHeadersCount(), 'bottom').toBe(0);
      expectWtTable(wt, wtTable => wtTable.getColumnHeadersCount(), 'inlineStart').toBe(0);
      expectWtTable(wt, wtTable => wtTable.getColumnHeadersCount(), 'topInlineStartCorner').toBe(0);
      expectWtTable(wt, wtTable => wtTable.getColumnHeadersCount(), 'top').toBe(0);
    });
  });
});
