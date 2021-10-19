describe('WalkontableScrollbar', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
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

  it('should table in DIV.wtHolder that contains 2 scrollbars', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();

    expect(spec().$table.parents('.wtHolder').length).toEqual(1);
  });

  it('scrolling should have no effect when totalRows is smaller than height', function() {
    this.data.splice(5, this.data.length - 5);

    try {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      wt.wtOverlays.topOverlay.onScroll(1);
      expect(wt.getViewport()[0]).toEqual(0);
      wt.wtOverlays.topOverlay.onScroll(-1);
      expect(wt.getViewport()[0]).toEqual(0);
    } catch (e) {
      expect(e).toBeUndefined();
    }
  });
});
