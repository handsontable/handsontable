describe('WalkontableTable', () => {
  const debug = false;

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

  describe('getColumnHeaders()', () => {
    it('should return valid column headers', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [
          (col, TH) => {
            TH.innerHTML = `L1: ${col + 1}`;
          },
          (col, TH) => {
            TH.innerHTML = `L2: ${col + 1}`;
          },
          (col, TH) => {
            TH.innerHTML = `L3: ${col + 1}`;
          },
        ],
      });

      wt.draw();

      expect(wt.wtTable.getColumnHeaders(0)).toEqual([
        spec().$table.find('thead tr:nth(0) th:nth(0)').get(0),
        spec().$table.find('thead tr:nth(1) th:nth(0)').get(0),
        spec().$table.find('thead tr:nth(2) th:nth(0)').get(0),
      ]);
      expect(wt.wtTable.getColumnHeaders(1)).toEqual([
        spec().$table.find('thead tr:nth(0) th:nth(1)').get(0),
        spec().$table.find('thead tr:nth(1) th:nth(1)').get(0),
        spec().$table.find('thead tr:nth(2) th:nth(1)').get(0),
      ]);
      expect(wt.wtTable.getColumnHeaders(2)).toEqual([]);
    });

    it('should return valid column headers when the viewport is scrolled', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [
          (col, TH) => {
            TH.innerHTML = `L1: ${col + 1}`;
          },
          (col, TH) => {
            TH.innerHTML = `L2: ${col + 1}`;
          },
          (col, TH) => {
            TH.innerHTML = `L3: ${col + 1}`;
          },
        ],
      });

      wt.draw();
      wt.scrollViewportHorizontally(3);
      wt.draw();

      expect(wt.wtTable.getColumnHeaders(1)).toEqual([]);
      expect(wt.wtTable.getColumnHeaders(2)).toEqual([
        spec().$table.find('thead tr:nth(0) th:nth(0)').get(0),
        spec().$table.find('thead tr:nth(1) th:nth(0)').get(0),
        spec().$table.find('thead tr:nth(2) th:nth(0)').get(0),
      ]);
      expect(wt.wtTable.getColumnHeaders(3)).toEqual([
        spec().$table.find('thead tr:nth(0) th:nth(1)').get(0),
        spec().$table.find('thead tr:nth(1) th:nth(1)').get(0),
        spec().$table.find('thead tr:nth(2) th:nth(1)').get(0),
      ]);
    });
  });
});
