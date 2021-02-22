describe('selection width under scale transform', () => {
  beforeEach(function() {
    this.$root = $('<div/>');
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(200).height(200);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo(this.$root);
    this.$root.appendTo('body');
    createDataArray(4, 4);
  });

  afterEach(function() {
    this.$root.css('transform-origin', '');
    this.$root.css('transform', '');

    this.$root.remove();
    this.wotInstance.destroy();
  });

  it('no scale', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController(),
      onCellMouseDown(event, coords) {
        wt.selections.getCell().clear();
        wt.selections.getCell().add(coords);
        wt.draw();
      }
    });

    wt.draw();

    const $td = spec().$table.find('tbody td:eq(0)');
    $td.simulate('mousedown');

    const { guid } = wt;
    const { top, bottom } = wt.selections.getCell().instanceBorders[guid];

    expect(top.getBoundingClientRect().width).toEqual(49);
    expect(bottom.getBoundingClientRect().width).toEqual(49);

    expect(top.offsetWidth).toEqual(49);
    expect(bottom.offsetWidth).toEqual(49);
  });

  it('scale(0.75)', async function() {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController(),
      onCellMouseDown(event, coords) {
        wt.selections.getCell().clear();
        wt.selections.getCell().add(coords);
        wt.draw();
      }
    });

    this.$root.css('transform-origin', 'top left');
    this.$root.css('transform', 'scale(0.75)');

    wt.draw();

    const $td = spec().$table.find('tbody td:eq(0)');
    $td.simulate('mousedown');

    const { guid } = wt;
    const { top, bottom } = wt.selections.getCell().instanceBorders[guid];

    expect(top.getBoundingClientRect().width).toEqual(49 * 0.75);
    expect(bottom.getBoundingClientRect().width).toEqual(49 * 0.75);

    expect(top.offsetWidth).toEqual(49);
    expect(bottom.offsetWidth).toEqual(49);
  });

  it('scale(1.5)', async function() {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController(),
      onCellMouseDown(event, coords) {
        wt.selections.getCell().clear();
        wt.selections.getCell().add(coords);
        wt.draw();
      }
    });

    this.$root.css('transform-origin', 'top left');
    this.$root.css('transform', 'scale(1.5)');

    wt.draw();

    const $td = spec().$table.find('tbody td:eq(0)');
    $td.simulate('mousedown');

    const { guid } = wt;
    const { top, bottom } = wt.selections.getCell().instanceBorders[guid];

    expect(top.getBoundingClientRect().width).toEqual(49 * 1.5);
    expect(bottom.getBoundingClientRect().width).toEqual(49 * 1.5);

    expect(top.offsetWidth).toEqual(49);
    expect(bottom.offsetWidth).toEqual(49);
  });
});
