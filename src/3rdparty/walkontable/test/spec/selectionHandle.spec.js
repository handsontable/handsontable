describe('WalkontableSelectionHandle', () => {
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

  it('should add/remove corner to selection when cell is clicked', () => {
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 5,
      selections: createSelectionController({
        current: new Walkontable.Selection({
          border: {
            width: 2,
            color: 'green',
            cornerVisible() {
              return true;
            }
          }
        }),
        area: new Walkontable.Selection({}),
      }),
      onCellMouseDown(event, coords) {
        wt.selections.getCell().clear();
        wt.selections.getCell().add(coords);
        wt.draw();
      }
    });
    wt.draw();

    const $td1 = spec().$table.find('tbody tr:eq(1) td:eq(0)');
    const $td2 = spec().$table.find('tbody tr:eq(2) td:eq(1)');
    const $corner = $(wt.selections.getCell().getSelectionHandle(wt).corner);

    $td1.simulate('mousedown');

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect($corner.position().top).toBe(42);
    expect($corner.position().left).toBe(46);

    $td2.simulate('mousedown');

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect($corner.position().top).toBe(65);
    expect($corner.position().left).toBe(96);
  });

  it('should draw only one corner if selection is added between overlays', () => {
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 5,
      fixedColumnsLeft: 2,
      fixedRowsTop: 2,
      selections: createSelectionController({
        current: new Walkontable.Selection({
          className: 'current',
        }),
        area: new Walkontable.Selection({
          className: 'area',
          border: {
            cornerVisible() {
              return true;
            }
          }
        }),
      }),
    });

    wt.selections.createOrGetArea().add(new Walkontable.CellCoords(0, 0));
    wt.selections.createOrGetArea().add(new Walkontable.CellCoords(2, 2));

    wt.draw();

    const corners = spec().$wrapper.find('.wtBorder.corner:visible');

    expect(corners.length).toBe(1);
  });

  it('should move the fill handle / corner border to the left, if in the position it would overlap the container (e.g.: far-right)', () => {
    spec().$wrapper.css({
      overflow: 'hidden',
      width: '201px',
    });
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 4,
      selections: createSelectionController({
        current: new Walkontable.Selection({
          border: {
            width: 2,
            color: 'green',
            cornerVisible() {
              return true;
            }
          }
        }),
        area: new Walkontable.Selection({}),
      }),
      onCellMouseDown(event, coords) {
        wt.selections.getCell().clear();
        wt.selections.getCell().add(coords);
        wt.draw();
      }
    });
    wt.draw();

    const $td1 = spec().$table.find('tbody tr:eq(1) td:eq(0)');
    const $td2 = spec().$table.find('tbody tr:eq(3) td:eq(3)');
    const $td3 = spec().$table.find('tbody tr:eq(2) td:eq(1)');
    const $corner = $(wt.selections.getCell().getSelectionHandle(wt).corner);

    $td1.simulate('mousedown');

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect($corner.position().top).toBe(42);
    expect($corner.position().left).toBe(46);
    expect(spec().$wrapper[0].clientWidth === spec().$wrapper[0].scrollWidth).toBe(true);

    $td2.simulate('mousedown');

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect($corner.position().top).toBe(88);
    expect($corner.position().left).toBe(194);
    expect(spec().$wrapper[0].clientWidth === spec().$wrapper[0].scrollWidth).toBe(true);

    $td3.simulate('mousedown');

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect($corner.position().top).toBe(65);
    expect($corner.position().left).toBe(96);
    expect(spec().$wrapper[0].clientWidth === spec().$wrapper[0].scrollWidth).toBe(true);
  });

  it('should move the fill handle / corner border to the top, if in the position it would overlap the container (e.g.: far-bottom)', () => {
    spec().$wrapper.css({
      height: '',
      marginTop: '2000px',
    });

    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 1,
      selections: createSelectionController({
        current: new Walkontable.Selection({
          border: {
            width: 2,
            color: 'green',
            cornerVisible() {
              return true;
            }
          }
        }),
        area: new Walkontable.Selection({}),
      }),
      onCellMouseDown(event, coords) {
        wt.selections.getCell().clear();
        wt.selections.getCell().add(coords);
        wt.draw();
      }
    });

    wt.draw();

    const $td = spec().$table.find('tbody tr:last-of-type td:last-of-type');
    const $corner = $(wt.selections.getCell().getSelectionHandle(wt).corner);

    $td.simulate('mousedown');

    wt.draw();

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect(spec().$table.css('height')).toBe('116px');
    expect($corner.position().top).toBe(109); // table.height - corner.height - corner.borderTop
    expect($corner.position().left).toBe(46);
    expect(spec().$wrapper[0].clientHeight === spec().$wrapper[0].scrollHeight).toBe(true);
  });

  it('should move the corner border to the top-left, if is not enough area on the bottom-right corner of container', () => {
    spec().$wrapper.css({
      height: '',
      width: '51px',
      marginTop: '2000px',
      marginLeft: '2000px',
    });

    const wt = walkontable({
      data: getData,
      totalRows: 1,
      totalColumns: 1,
      selections: createSelectionController({
        current: new Walkontable.Selection({
          border: {
            width: 2,
            color: 'green',
            cornerVisible() {
              return true;
            }
          }
        }),
        area: new Walkontable.Selection({}),
      }),
      onCellMouseDown(event, coords) {
        wt.selections.getCell().clear();
        wt.selections.getCell().add(coords);
        wt.draw();
      }
    });

    wt.draw();

    const $td = spec().$table.find('tbody tr:last-of-type td:last-of-type');
    const $corner = $(wt.selections.getCell().getSelectionHandle(wt).corner);

    $td.simulate('mousedown');

    wt.draw();

    expect($corner.css('width')).toBe('6px');
    expect($corner.css('height')).toBe('6px');
    expect(spec().$table.css('height')).toBe('24px');
    expect($corner.position().top).toBe(17); // table.height - corner.height - corner.borderTop
    expect($corner.position().left).toBe(44);
    expect(spec().$wrapper[0].clientHeight === spec().$wrapper[0].scrollHeight).toBe(true);
    expect(spec().$wrapper[0].clientWidth === spec().$wrapper[0].scrollWidth).toBe(true);
  });
});
