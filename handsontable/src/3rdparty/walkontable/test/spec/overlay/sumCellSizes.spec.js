describe('WalkontableOverlay', () => {
  const OUTER_WIDTH = 200;
  const OUTER_HEIGHT = 200;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(OUTER_WIDTH).height(OUTER_HEIGHT);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore');
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');

    createDataArray(200, 200);
  });

  afterEach(function() {
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  describe('sumCellSizes', () => {
    /**
     * Reference implementation: the live per-row walk that `sumCellSizes` used before it
     * delegated to the row-height prefix-sum cache. The delegation must stay exactly equal to it.
     *
     * @param {Walkontable} wt The Walkontable instance.
     * @param {number} from Start row index (inclusive).
     * @param {number} to End row index (exclusive).
     * @returns {number} The height sum in pixels.
     */
    function liveRowWalk(wt, from, to) {
      const stylesHandler = wt.wtSettings.getSetting('stylesHandler');
      const defaultRowHeight = stylesHandler.getDefaultRowHeight();
      let sum = 0;

      for (let row = from; row < to; row++) {
        const height = wt.wtTable.getRowHeight(row);

        sum += height === undefined ? defaultRowHeight : height;
      }

      return sum;
    }

    it('should equal a live per-row walk with default row heights', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const topOverlay = wt.wtOverlays.topOverlay;

      expect(topOverlay.sumCellSizes(0, getTotalRows())).toBe(liveRowWalk(wt, 0, getTotalRows()));
      expect(topOverlay.sumCellSizes(0, 1)).toBe(liveRowWalk(wt, 0, 1));
      expect(topOverlay.sumCellSizes(5, 42)).toBe(liveRowWalk(wt, 5, 42));
    });

    it('should equal a live per-row walk with varied row heights', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeight: row => 20 + ((row % 7) * 4),
      });

      wt.draw();

      const topOverlay = wt.wtOverlays.topOverlay;
      const bottomOverlay = wt.wtOverlays.bottomOverlay;

      expect(topOverlay.sumCellSizes(0, getTotalRows())).toBe(liveRowWalk(wt, 0, getTotalRows()));
      expect(topOverlay.sumCellSizes(13, 177)).toBe(liveRowWalk(wt, 13, 177));
      expect(bottomOverlay.sumCellSizes(0, 100)).toBe(liveRowWalk(wt, 0, 100));
    });

    it('should equal a live per-row walk after the viewport was scrolled', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeight: row => 20 + ((row % 7) * 4),
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(150, 0));
      wt.draw();

      const topOverlay = wt.wtOverlays.topOverlay;

      expect(topOverlay.sumCellSizes(0, getTotalRows())).toBe(liveRowWalk(wt, 0, getTotalRows()));
      expect(topOverlay.sumCellSizes(140, 160)).toBe(liveRowWalk(wt, 140, 160));
    });

    it('should reflect changed row heights after the row-height cache is invalidated', async() => {
      let heightOverride = null;
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeight: row => (heightOverride === null ? 25 : heightOverride[row] ?? 25),
      });

      wt.draw();

      const topOverlay = wt.wtOverlays.topOverlay;

      expect(topOverlay.sumCellSizes(0, 10)).toBe(liveRowWalk(wt, 0, 10));

      heightOverride = { 3: 100, 7: 60 };
      wt.wtViewport.invalidateRowHeightCache();

      expect(topOverlay.sumCellSizes(0, 10)).toBe(liveRowWalk(wt, 0, 10));
      expect(topOverlay.sumCellSizes(0, 10)).toBe((8 * 25) + 100 + 60);
    });

    it('should equal a live per-column walk for the inline-start overlay', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: column => 40 + ((column % 5) * 10),
      });

      wt.draw();

      const inlineStartOverlay = wt.wtOverlays.inlineStartOverlay;
      const defaultColumnWidth = wt.wtSettings.getSetting('defaultColumnWidth');
      let sum = 0;

      for (let column = 0; column < getTotalColumns(); column++) {
        sum += wt.wtTable.getColumnWidth(column) || defaultColumnWidth;
      }

      expect(inlineStartOverlay.sumCellSizes(0, getTotalColumns())).toBe(sum);
    });
  });
});
