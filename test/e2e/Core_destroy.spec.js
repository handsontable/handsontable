describe('Core_destroy', () => {
  const id = 'testContainer';

  beforeEach(() => {
    spec().$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(() => {
    if (spec().$container) {
      destroy();
      spec().$container.remove();
    }
  });

  it('should remove table from the root element', () => {
    handsontable();
    destroy();

    expect(spec().$container.html()).toEqual('');
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

    const $tmp = $('<div id="tmp"></div>').appendTo(document.body);
    $tmp.handsontable();
    $tmp.handsontable('destroy');
    $tmp.remove();

    selectCell(0, 0);

    $('html').simulate('mousedown');

    expect(getSelected()).toBeUndefined();
  });

  it('should throw an exception when metod on destroyed instance is called', () => {
    const hot = handsontable();

    destroy();
    spec().$container.remove();

    expect(() => {
      hot.getDataAtCell(0, 0);
    }).toThrowError('The "getDataAtCell" method cannot be called because this Handsontable instance has been destroyed');
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
});
