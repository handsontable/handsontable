describe('preventOverflow option', () => {
  let $table;
  let $container;
  let $wrapper;
  const debug = false;

  beforeEach(() => {
    $wrapper = $('<div></div>').css({ position: 'relative' });
    $wrapper.width(500).height(201);
    $container = $('<div></div>');
    $table = $('<table></table>'); // create a table that is not attached to document
    $wrapper.append($container);
    $container.append($table);
    $wrapper.appendTo('body');
    createDataArray(100, 100);
  });

  afterEach(() => {
    if (!debug) {
      $('.wtHolder').remove();
    }
    $wrapper.remove();
  });

  it('should set overflow to `auto` for master table when `horizontal` value is passed', () => {
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      preventOverflow() {
        return 'horizontal';
      }
    });
    wt.draw();

    expect($table.parents('.wtHolder').css('overflow')).toBe('auto');
    expect($table.parents('.ht_master').css('overflow')).toBe('visible');
  });

  it('should set overflow-x to `auto` for top clone when `horizontal` value is passed', () => {
    const wt = new Walkontable.Core({
      table: $table[0],
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
