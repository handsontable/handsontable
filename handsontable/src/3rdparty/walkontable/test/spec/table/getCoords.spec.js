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

  describe('getCoords()', () => {
    it('should return coords of TD', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      const $td2 = spec().$table.find('tbody tr:eq(1) td:eq(1)');

      expect(wt.wtTable.getCoords($td2[0])).toEqual(new Walkontable.CellCoords(1, 1));
    });

    it('should return coords of TD (with row header)', () => {
      spec().$wrapper.width(300);

      function plusOne(i) {
        return i + 1;
      }

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [function(row, TH) {
          TH.innerHTML = plusOne(row);
        }]
      });

      wt.draw();

      const $td2 = spec().$table.find('tbody tr:eq(1) td:eq(1)');

      expect(wt.wtTable.getCoords($td2[0])).toEqual(new Walkontable.CellCoords(1, 1));
    });

    it('should return coords of TH', () => {
      spec().$wrapper.width(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [function(col, TH) {
          TH.innerHTML = col + 1;
        }]
      });

      wt.draw();

      const $th2 = spec().$table.find('thead tr:first th:eq(1)');

      expect(wt.wtTable.getCoords($th2[0])).toEqual(new Walkontable.CellCoords(-1, 1));
    });

    it('should return coords of TD (with fixedColumnsStart)', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsStart: 2,
        columnHeaders: [function(col, TH) {
          TH.innerHTML = col + 1;
        }]
      });

      wt.draw();

      const $cloneLeft = $('.ht_clone_inline_start');
      const $td2 = $cloneLeft.find('tbody tr:eq(1) td:eq(1)');

      expect(wt.wtTable.getCoords($td2[0])).toEqual(new Walkontable.CellCoords(1, 1));
    });
  });
});
