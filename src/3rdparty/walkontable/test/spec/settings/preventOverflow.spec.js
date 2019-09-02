describe('preventOverflow option', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').css({ overflow: 'hidden' });
    this.$wrapper.width(500).height(201);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>'); // create a table that is not attached to document
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

  it('should set overflow to `auto` for master table when `horizontal` value is passed', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      preventOverflow() {
        return 'horizontal';
      }
    });
    wt.draw();

    expect(spec().$table.parents('.wtHolder').css('overflow')).toBe('auto');
    expect(spec().$table.parents('.ht_master').css('overflow')).toBe('visible');
  });

  it('should set overflow-x to `auto` for top clone when `horizontal` value is passed', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(column, TH) {
        TH.innerHTML = column + 1;
      }],
      preventOverflow() {
        return 'horizontal';
      }
    });
    wt.draw();

    expect($(wt.wtTable.wtRootElement.parentNode).find('.ht_clone_top .wtHolder').css('overflow-x')).toBe('auto');
    expect($(wt.wtTable.wtRootElement.parentNode).find('.ht_clone_top .wtHolder').css('overflow-y')).toBe('hidden');
  });
});
