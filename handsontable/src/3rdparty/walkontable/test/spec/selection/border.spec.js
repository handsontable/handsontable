describe('WalkontableBorder', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable');
    this.$container = $('<div></div>');
    this.$wrapper.width(100).height(200);
    this.$table = $('<table></table>').addClass('htCore');
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray();
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  it('should add/remove border to selection when cell is clicked', async() => {
    const selections = createSelectionController({
      border: {
        width: 1,
        color: 'red'
      }
    });
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 5,
      selections,
      onCellMouseDown(event, coords) {
        selections.getFocus()
          .clear()
          .add(coords);
        wt.draw();
      }
    });

    wt.draw();

    const focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    const $td1 = spec().$table.find('tbody tr:eq(1) td:eq(0)');
    const $td2 = spec().$table.find('tbody tr:eq(2) td:eq(1)');
    const $top = $(focusBorder.top);
    const $end = $(focusBorder.end);
    const $bottom = $(focusBorder.bottom);
    const $start = $(focusBorder.start);

    $td1.simulate('mousedown');

    expect($top.css('height')).toBe('1px');
    expect($top.position().top).toBe(23);
    expect($top.position().left).toBe(0);
    expect($end.css('width')).toBe('1px');
    expect($end.position().top).toBe(23);
    expect($end.position().left).toBe(49);
    expect($bottom.css('height')).toBe('1px');
    expect($bottom.position().top).toBe(46);
    expect($bottom.position().left).toBe(0);
    expect($start.css('width')).toBe('1px');
    expect($start.position().top).toBe(23);
    expect($start.position().left).toBe(0);

    $td2.simulate('mousedown');

    expect($top.css('height')).toBe('1px');
    expect($top.position().top).toBe(46);
    expect($top.position().left).toBe(49);
    expect($end.css('width')).toBe('1px');
    expect($end.position().top).toBe(46);
    expect($end.position().left).toBe(99);
    expect($bottom.css('height')).toBe('1px');
    expect($bottom.position().top).toBe(69);
    expect($bottom.position().left).toBe(49);
    expect($start.css('width')).toBe('1px');
    expect($start.position().top).toBe(46);
    expect($start.position().left).toBe(49);
  });

  it('should add/remove border to selection when cell is clicked and the table has only one column', async() => {
    const selections = createSelectionController({
      border: {
        width: 1,
        color: 'red'
      }
    });
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 1,
      selections,
      onCellMouseDown(event, coords) {
        selections.getFocus()
          .clear()
          .add(coords);
        wt.draw();
      }
    });

    wt.draw();

    const focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    const $td1 = spec().$table.find('tbody tr:eq(1) td:eq(0)');
    const $top = $(focusBorder.top);
    const $end = $(focusBorder.end);
    const $bottom = $(focusBorder.bottom);
    const $start = $(focusBorder.start);

    $td1.simulate('mousedown');

    expect($top.css('height')).toBe('1px');
    expect($top.position().top).toBe(23);
    expect($top.position().left).toBe(0);
    expect($end.css('width')).toBe('1px');
    expect($end.position().top).toBe(23);
    expect($end.position().left).toBe(49);
    expect($bottom.css('height')).toBe('1px');
    expect($bottom.position().top).toBe(46);
    expect($bottom.position().left).toBe(0);
    expect($start.css('width')).toBe('1px');
    expect($start.position().top).toBe(23);
    expect($start.position().left).toBe(0);
  });

  it('should properly add a selection border on an entirely selected column', async() => {
    const selections = createSelectionController({
      border: {
        width: 1,
        color: 'red'
      }
    });
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 2,
      selections,
      onCellMouseDown(event, coords) {
        selections.getFocus()
          .clear()
          .add(coords);
        wt.draw();
      }
    });

    wt.draw();
    selections.getFocus()
      .add(new Walkontable.CellCoords(0, 0))
      .add(new Walkontable.CellCoords(4, 0));
    wt.draw(true);

    const focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    const $top = $(focusBorder.top);
    const $end = $(focusBorder.end);
    const $bottom = $(focusBorder.bottom);
    const $start = $(focusBorder.start);

    expect($top.css('height')).toBe('1px');
    expect($top.position().top).toBe(0);
    expect($top.position().left).toBe(0);
    expect($end.css('width')).toBe('1px');
    expect($end.position().top).toBe(0);
    expect($end.position().left).toBe(49);
    expect($bottom.css('height')).toBe('1px');
    expect($bottom.position().top).toBe(115);
    expect($bottom.position().left).toBe(0);
    expect($start.css('width')).toBe('1px');
    expect($start.position().top).toBe(0);
    expect($start.position().left).toBe(0);
  });

  it('should add/remove corner to selection when cell is clicked', async() => {
    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'green',
        cornerVisible() {
          return true;
        }
      }
    });
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 5,
      selections,
      onCellMouseDown(event, coords) {
        selections.getFocus()
          .clear()
          .add(coords);
        wt.draw();
      }
    });

    wt.draw();

    const $td1 = spec().$table.find('tbody tr:eq(1) td:eq(0)');
    const $td2 = spec().$table.find('tbody tr:eq(2) td:eq(1)');
    const focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    const $corner = $(focusBorder.corner);

    $td1.simulate('mousedown');

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect($corner.position().top).toBe(42);
    expect($corner.position().left).toBe(45);

    $td2.simulate('mousedown');

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect($corner.position().top).toBe(65);
    expect($corner.position().left).toBe(95);
  });

  it('should render selection corner in the correct position', async() => {
    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'green',
        cornerVisible() {
          return true;
        }
      }
    });
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 5,
      selections,
      onCellMouseDown(event, coords) {
        selections.getFocus()
          .clear()
          .add(coords);
        wt.draw();
      }
    });

    wt.draw();

    const $td1 = spec().$table.find('tbody tr:eq(2) td:eq(1)');
    const focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    const $corner = $(focusBorder.corner);

    $td1.simulate('mousedown');

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('width')).toBe('6px');
    expect($corner.css('top')).toBe('65px');
    expect($corner.css('left')).toBe('95px');
  });

  it('should properly render a selection corner on the edge of the left fixed column', async() => {
    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'green',
        cornerVisible() {
          return true;
        }
      }
    });
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 5,
      fixedColumnsStart: 2,
      selections,
      onCellMouseDown(event, coords) {
        selections.getFocus()
          .clear()
          .add(coords);
        wt.draw();
      }
    });

    wt.draw();

    const $td1 = spec().$table.find('tbody tr:eq(2) td:eq(1)');
    const focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    const $corner = $(focusBorder.corner);
    const inlineStartOverlay = $(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder);

    $td1.simulate('mousedown');

    expect(inlineStartOverlay.position().left + inlineStartOverlay.outerWidth())
      .toBe($corner.position().left + $corner.outerWidth());
  });

  it('should properly render a selection corner on the edge of the top fixed row', async() => {
    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'green',
        cornerVisible() {
          return true;
        }
      }
    });
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 5,
      fixedRowsTop: 2,
      selections,
      onCellMouseDown(event, coords) {
        selections.getFocus()
          .clear()
          .add(coords);
        wt.draw();
      }
    });

    wt.draw();

    const $td1 = spec().$table.find('tbody tr:eq(1) td:eq(1)');
    const focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    const $corner = $(focusBorder.corner);
    const topOverlay = $(wt.wtOverlays.topOverlay.clone.wtTable.holder);

    $td1.simulate('mousedown');

    expect(topOverlay.position().top + topOverlay.outerHeight())
      .toBe($corner.position().top + $corner.outerHeight());
  });

  it('should draw only one corner if selection is added between overlays', async() => {
    const selections = createSelectionController();
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 5,
      fixedColumnsStart: 2,
      fixedRowsTop: 2,
      selections,
    });

    selections.getArea({
      border: {
        cornerVisible() {
          return true;
        }
      }
    })
      .add(new Walkontable.CellCoords(0, 0))
      .add(new Walkontable.CellCoords(2, 2));

    wt.draw();

    const corners = spec().$wrapper.find('.wtBorder.corner:visible');

    expect(corners.length).toBe(1);
  });

  it('should move the fill handle / corner border to the left, if in the position it would overlap the container (e.g.: far-right)', async() => {
    spec().$wrapper.css({
      overflow: 'hidden',
      width: '200px',
    });

    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'green',
        cornerVisible() {
          return true;
        }
      }
    });
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 4,
      selections,
      onCellMouseDown(event, coords) {
        selections.getFocus()
          .clear()
          .add(coords);
        wt.draw();
      }
    });

    wt.draw();

    const $td1 = spec().$table.find('tbody tr:eq(1) td:eq(0)');
    const $td2 = spec().$table.find('tbody tr:eq(3) td:eq(3)');
    const $td3 = spec().$table.find('tbody tr:eq(2) td:eq(1)');
    const focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    const $corner = $(focusBorder.corner);

    $td1.simulate('mousedown');

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect($corner.position().top).toBe(42);
    expect($corner.position().left).toBe(45);
    expect(spec().$wrapper[0].clientWidth === spec().$wrapper[0].scrollWidth).toBe(true);

    $td2.simulate('mousedown');

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect($corner.position().top).toBe(88);
    expect($corner.position().left).toBe(193);
    expect(spec().$wrapper[0].clientWidth === spec().$wrapper[0].scrollWidth).toBe(true);

    $td3.simulate('mousedown');

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect($corner.position().top).toBe(65);
    expect($corner.position().left).toBe(95);
    expect(spec().$wrapper[0].clientWidth === spec().$wrapper[0].scrollWidth).toBe(true);
  });

  it('should move the fill handle / corner border to the top, if in the position it would overlap the container (e.g.: far-bottom)', async() => {
    spec().$wrapper.css({
      height: '',
      marginTop: '2000px',
    });

    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'green',
        cornerVisible() {
          return true;
        }
      }
    });
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 1,
      selections,
      onCellMouseDown(event, coords) {
        selections.getFocus()
          .clear()
          .add(coords);
        wt.draw();
      }
    });

    wt.draw();

    const $td = spec().$table.find('tbody tr:last-of-type td:last-of-type');
    const focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    const $corner = $(focusBorder.corner);

    $td.simulate('mousedown');

    wt.draw();

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect(spec().$table.css('height')).toBe('116px');
    expect($corner.position().top).toBe(109); // table.height - corner.height - corner.borderTop
    expect($corner.position().left).toBe(45);
    expect(spec().$wrapper[0].clientHeight === spec().$wrapper[0].scrollHeight).toBe(true);
  });

  it('should move the corner border to the top-left, if is not enough area on the bottom-right corner of container', async() => {
    spec().$wrapper.css({
      height: '',
      width: '50px',
      marginTop: '2000px',
      marginLeft: '2000px',
    });

    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'green',
        cornerVisible() {
          return true;
        }
      }
    });
    const wt = walkontable({
      data: getData,
      totalRows: 1,
      totalColumns: 1,
      selections,
      onCellMouseDown(event, coords) {
        selections.getFocus()
          .clear()
          .add(coords);
        wt.draw();
      }
    });

    wt.draw();

    const $td = spec().$table.find('tbody tr:last-of-type td:last-of-type');
    const focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    const $corner = $(focusBorder.corner);

    $td.simulate('mousedown');
    wt.draw();

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect(spec().$table.css('height')).toBe('24px');
    expect($corner.position().top).toBe(17); // table.height - corner.height - corner.borderTop
    expect($corner.position().left).toBe(43);
    expect(spec().$wrapper[0].clientHeight === spec().$wrapper[0].scrollHeight).toBe(true);
    expect(spec().$wrapper[0].clientWidth === spec().$wrapper[0].scrollWidth).toBe(true);
  });
});
