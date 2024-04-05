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

  describe('getStretchedColumnWidth()', () => {
    it('should return valid column width when stretchH is set as \'all\'', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [function(row, TH) {
          TH.innerHTML = row + 1;
        }],
        stretchH: 'all'
      });

      spec().$wrapper.width(500);
      wt.draw();

      expect(wt.wtTable.getStretchedColumnWidth(0, 50)).toBe(109);
      expect(wt.wtTable.getStretchedColumnWidth(1, 50)).toBe(109);
      expect(wt.wtTable.getStretchedColumnWidth(2, 50)).toBe(109);
      expect(wt.wtTable.getStretchedColumnWidth(3, 50)).toBe(108);
    });

    it('should return valid column width when stretchH is set as \'last\'', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [function(row, TH) {
          TH.innerHTML = row + 1;
        }],
        stretchH: 'last'
      });

      spec().$wrapper.width(500);
      wt.draw();

      expect(wt.wtTable.getStretchedColumnWidth(0, 50)).toBe(50);
      expect(wt.wtTable.getStretchedColumnWidth(1, 50)).toBe(50);
      expect(wt.wtTable.getStretchedColumnWidth(2, 50)).toBe(50);
      expect(wt.wtTable.getStretchedColumnWidth(3, 50)).toBe(285);
    });
  });
});
