describe('Core_destroy', () => {
  const id = 'testContainer';

  beforeEach(() => {
    spec().$container = $(`<div id="${id}"></div>`).appendTo('#rootWrapper');
  });

  it('should remove table from the root element', async() => {
    handsontable();
    destroy();

    expect($('#rootWrapper').html()).toEqual(`<div id="${id}"></div>`);
  });

  it('should remove events from the root element, document element and window', () => {
    const x = handsontable();

    expect(x.eventListeners.length > 0).toBeTruthy();
    destroy();
    expect(x.eventListeners).toBeNull();
    $(document.documentElement).off('.copypaste'); // remove copypaste.js listeners, which are not removed by destroy (because copypaste is a singleton for whole page)
  });

  it('should NOT remove events from document element and window for other Handsontable instances on the page', () => {
    // test based on Core_selectionSpec.js (should deselect currently selected cell)
    handsontable();

    const $tmp = $('<div id="tmp"></div>').appendTo($('#rootWrapper'));

    $tmp.handsontable();
    $tmp.handsontable('destroy');
    $('#rootWrapper').find('#tmp').remove();

    selectCell(0, 0);

    $('html').simulate('mousedown');

    expect(getSelected()).toBeUndefined();
    destroy();
  });

  it('should throw an exception when metod on destroyed instance is called', () => {
    const hot = handsontable();

    destroy();
    $(`#${spec().$container[0].id}`).remove();

    expect(() => {
      hot.getDataAtCell(0, 0);
    }).toThrowError('The "getDataAtCell" method cannot be called because this ' +
      'Handsontable instance has been destroyed');
    expect(() => {
      hot.listen();
    }).toThrowError('The "listen" method cannot be called because this Handsontable instance has been destroyed');
  });

  it('should set isDestroyed flag to `true` when instance is destroyed', () => {
    const hot = handsontable();

    expect(hot.isDestroyed).toBe(false);

    destroy();

    expect(hot.isDestroyed).toBe(true);
  });

  it('should update index mappers cache only when necessary', () => {
    const hot = handsontable({
      data: [['a'], ['b'], ['c']],
      autoRowSize: true,
      autoColumnSize: true,
      bindRowsWithHeaders: 'strict',
      columnSorting: true,
      filters: true,
      manualColumnResize: true,
      manualRowResize: true,
      nestedRows: true,
      trimRows: true
    });
    const rowCacheUpdatedCallback = jasmine.createSpy('cacheUpdated');
    const columnCacheUpdatedCallback = jasmine.createSpy('cacheUpdated');

    hot.rowIndexMapper.addLocalHook('cacheUpdated', rowCacheUpdatedCallback);
    hot.columnIndexMapper.addLocalHook('cacheUpdated', columnCacheUpdatedCallback);

    destroy();

    // There is at least one plugin registering map which can update cache by change in its own map.
    expect(rowCacheUpdatedCallback.calls.count()).toEqual(1);

    // There is no plugin which can change cache by its own map.
    expect(columnCacheUpdatedCallback.calls.count()).toEqual(0);
  });
});
