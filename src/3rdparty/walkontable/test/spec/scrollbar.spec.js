describe('WalkontableScrollbar', () => {
  let $table;
  let $container;
  let $wrapper;
  const debug = false;

  beforeEach(() => {
    $wrapper = $('<div></div>').css({ overflow: 'hidden' });
    $container = $('<div></div>');
    $table = $('<table></table>'); // create a table that is not attached to document
    $wrapper.append($container);
    $container.append($table);
    $wrapper.appendTo('body');
    createDataArray();
  });

  afterEach(() => {
    if (!debug) {
      $('.wtHolder').remove();
    }
    $wrapper.remove();
  });

  it('should table in DIV.wtHolder that contains 2 scrollbars', () => {
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();

    expect($table.parents('.wtHolder').length).toEqual(1);
  });

  it('scrolling should have no effect when totalRows is smaller than height', function() {
    this.data.splice(5, this.data.length - 5);

    try {
      const wt = new Walkontable.Core({
        table: $table[0],
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
