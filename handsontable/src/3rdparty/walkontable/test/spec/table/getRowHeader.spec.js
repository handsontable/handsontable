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

  describe('getRowHeader()', () => {
    it('should return valid row header', () => {
      spec().$wrapper.width(250);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => {
            TH.innerHTML = `L1: ${row + 1}`;
          },
          (row, TH) => {
            TH.innerHTML = `L2: ${row + 1}`;
          },
          (row, TH) => {
            TH.innerHTML = `L3: ${row + 1}`;
          },
        ],
      });

      wt.draw();

      expect(wt.wtTable.getRowHeader(0)).toBe(spec().$table.find('tbody tr:nth(0) th:nth(0)').get(0));
      expect(wt.wtTable.getRowHeader(0, 1)).toBe(spec().$table.find('tbody tr:nth(0) th:nth(1)').get(0));
      expect(wt.wtTable.getRowHeader(0, 2)).toBe(spec().$table.find('tbody tr:nth(0) th:nth(2)').get(0));
      expect(wt.wtTable.getRowHeader(0, 3)).toBeUndefined();
    });

    it('should return valid row header when the viewport is scrolled', () => {
      spec().$wrapper.width(250);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => {
            TH.innerHTML = `L1: ${row + 1}`;
          },
          (row, TH) => {
            TH.innerHTML = `L2: ${row + 1}`;
          },
          (row, TH) => {
            TH.innerHTML = `L3: ${row + 1}`;
          },
        ],
      });

      wt.draw();
      wt.scrollViewportVertically(50);
      wt.draw();

      expect(wt.wtTable.getRowHeader(41)).toBeUndefined();
      expect(wt.wtTable.getRowHeader(42)).toBe(spec().$table.find('tbody tr:nth(0) th:nth(0)').get(0));
      expect(wt.wtTable.getRowHeader(42, 1)).toBe(spec().$table.find('tbody tr:nth(0) th:nth(1)').get(0));
      expect(wt.wtTable.getRowHeader(42, 2)).toBe(spec().$table.find('tbody tr:nth(0) th:nth(2)').get(0));
      expect(wt.wtTable.getRowHeader(42, 3)).toBeUndefined();
    });
  });
});
