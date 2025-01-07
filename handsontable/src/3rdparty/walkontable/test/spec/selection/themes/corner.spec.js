describe('WalkontableBorder corner (modern themes)', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable');
    this.$container = $('<div></div>');
    this.$wrapper.width(250).height(116).css('overflow', 'hidden');
    this.$table = $('<table></table>').addClass('htCore');
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');

    this.$wrapper[0].style.setProperty('--ht-line-height', '22px');
    this.$wrapper[0].style.setProperty('--ht-cell-vertical-padding', '0px');
    this.$wrapper[0].style.setProperty('--ht-cell-autofill-size', '10px');
    this.$wrapper[0].style.setProperty('--ht-cell-autofill-border-width', '4px');
    this.$wrapper[0].style.setProperty('--ht-cell-autofill-border-color', '#FF0000');

    createDataArray();
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  it('should render corner with proper styles', () => {
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

    wt.stylesHandler.useTheme('ht-theme-sth');

    wt.draw();

    let $td = spec().$table.find('tbody tr:eq(2) td:eq(1)');
    let focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    let $corner = $(focusBorder.corner);

    $td.simulate('mousedown');

    expect($corner.position().left).toEqual($td.position().left + $td.outerWidth() - 1 - ($corner.outerWidth() / 2));
    expect($corner.position().top).toEqual($td.position().top + $td.outerHeight() - 1 - ($corner.outerHeight() / 2));

    $td = spec().$table.find('tbody tr:eq(2) td:eq(4)');
    focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    $corner = $(focusBorder.corner);

    $td.simulate('mousedown');

    expect($corner.position().left).toEqual($td.position().left + $td.outerWidth() - $corner.outerWidth());

    $td = spec().$table.find('tbody tr:eq(4) td:eq(4)');
    focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    $corner = $(focusBorder.corner);
    const borderBottomWidth = parseInt($corner.css('border-bottom-width'), 10);

    $td.simulate('mousedown');

    expect($corner.position().left).toEqual($td.position().left + $td.outerWidth() - $corner.outerWidth());
    expect($corner.position().top).toEqual(
      $td.position().top + $td.outerHeight() - $corner.outerHeight() + borderBottomWidth - 1
    );
  });
});
