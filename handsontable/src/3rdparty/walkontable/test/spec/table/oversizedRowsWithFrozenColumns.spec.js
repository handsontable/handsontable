describe('WalkontableTable', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(300).height(200);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore');
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(20, 50);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  describe('oversized rows whose tall cell is in a frozen column', () => {
    // Row 2 gets content taller than a row in column 1, which is frozen. The master's rendered
    // column band starts at the column under the horizontal scroll offset, so the master never
    // renders column 1 - only the inline-start clone does. The tall content is a fixed-height block
    // rather than wrapping text, so the row height does not depend on the runner's font metrics.
    const TALL_ROW = 2;
    const TALL_COLUMN = 1;
    const TALL_CONTENT_HEIGHT = 60;

    /**
     * Builds a grid whose only tall cell sits in a frozen column.
     *
     * @param {Function} [isTall] Returns whether the tall cell currently holds the tall content.
     *   Lets a test switch the content off and re-draw.
     * @returns {Walkontable} The Walkontable instance (not drawn yet).
     */
    function createGridWithTallFrozenCell(isTall = () => true) {
      const isTallCell = (row, column) => isTall() && row === TALL_ROW && column === TALL_COLUMN;

      return walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsStart: 3,
        columnWidth: 100,
        cellRenderer(row, column, TD) {
          if (isTallCell(row, column)) {
            TD.innerHTML = `<div style="height: ${TALL_CONTENT_HEIGHT}px"></div>`;
          } else {
            TD.innerHTML = getData(row, column);
          }
        },
      });
    }

    /**
     * Returns the vertical offset of one source row inside one table, relative to that table's own
     * body top, so the master and a clone are comparable even though they sit at different page
     * positions.
     *
     * @param {Table} wtTable The master or clone table.
     * @param {number} sourceRow The source row index.
     * @returns {number}
     */
    function rowOffsetWithinTable(wtTable, sourceRow) {
      const TR = wtTable.getTrForRow(sourceRow);

      return TR.getBoundingClientRect().top - wtTable.TBODY.getBoundingClientRect().top;
    }

    /**
     * Asserts that every row from the tall one down to the last one rendered in both tables sits at
     * the same vertical offset in the master and in the inline-start overlay.
     *
     * @param {Walkontable} wt The drawn Walkontable instance.
     */
    function expectRowsAlignedWithFrozenColumns(wt) {
      const inlineStartTable = wt.wtOverlays.inlineStartOverlay.clone.wtTable;
      const lastComparableRow = Math.min(
        wt.wtTable.getLastRenderedRow(),
        inlineStartTable.getLastRenderedRow()
      );

      // Without this the test could pass while comparing nothing below the tall row.
      expect(lastComparableRow).toBeGreaterThan(TALL_ROW);

      for (let sourceRow = TALL_ROW; sourceRow <= lastComparableRow; sourceRow++) {
        expect(rowOffsetWithinTable(wt.wtTable, sourceRow))
          .toBe(rowOffsetWithinTable(inlineStartTable, sourceRow));
      }
    }

    /**
     * The height of a normal, single-line row. Row 0 is deliberately not used: the rendered band's
     * first row carries an extra 1px top border.
     *
     * @param {Walkontable} wt The drawn Walkontable instance.
     * @returns {number}
     */
    function defaultRowHeight(wt) {
      return wt.wtTable.getTrForRow(1).getBoundingClientRect().height;
    }

    it('should give the row the same height in the master table and in the inline-start overlay', async() => {
      const wt = createGridWithTallFrozenCell();

      wt.draw();

      const inlineStartTable = wt.wtOverlays.inlineStartOverlay.clone.wtTable;
      const masterHeight = wt.wtTable.getTrForRow(TALL_ROW).getBoundingClientRect().height;
      const frozenHeight = inlineStartTable.getTrForRow(TALL_ROW).getBoundingClientRect().height;

      // The frozen cell wraps, so the row must be taller than a single-line row in BOTH tables.
      expect(frozenHeight).toBeGreaterThan(defaultRowHeight(wt));
      expect(masterHeight).toBe(frozenHeight);
    });

    it('should keep the rows below the tall one aligned with the inline-start overlay', async() => {
      const wt = createGridWithTallFrozenCell();

      wt.draw();

      // Without this the test would pass without exercising the fix: the master would be rendering
      // the frozen columns itself and would measure the tall cell on its own.
      expect(wt.wtTable.getFirstRenderedColumn()).toBeGreaterThan(0);

      expectRowsAlignedWithFrozenColumns(wt);
    });

    it('should keep the rows aligned after scrolling horizontally away from the frozen columns', async() => {
      const wt = createGridWithTallFrozenCell();

      wt.draw();
      wt.wtTable.holder.scrollLeft = 1500;
      wt.draw();

      expect(wt.wtTable.getFirstRenderedColumn()).toBeGreaterThan(0);

      expectRowsAlignedWithFrozenColumns(wt);
    });

    it('should shrink the row back once the frozen cell no longer wraps', async() => {
      let isTall = true;
      const wt = createGridWithTallFrozenCell(() => isTall);

      wt.draw();

      const singleLineHeight = defaultRowHeight(wt);

      expect(wt.wtTable.getTrForRow(TALL_ROW).getBoundingClientRect().height)
        .toBeGreaterThan(singleLineHeight);

      isTall = false;
      wt.draw();

      // The recorded height must not ratchet: with the long text gone the row is a normal row again.
      expect(wt.wtTable.getTrForRow(TALL_ROW).getBoundingClientRect().height).toBe(singleLineHeight);
      expect(wt.wtOverlays.inlineStartOverlay.clone.wtTable.getTrForRow(TALL_ROW)
        .getBoundingClientRect().height).toBe(singleLineHeight);
    });
  });
});
