describe('Core_destroy', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should remove table from the root element', function () {
    handsontable();
    destroy();
    expect(this.$container.html()).toEqual('');
  });

  it('should remove events from the root element, document element and window', function () {
    handsontable();

    //expect($._data(this.$container[0], 'events')).toBeTruthy(); //not true anymore after fragmentSelection feature, which changed bindings to documentElement
    expect($._data(document.documentElement, 'events')).toBeTruthy();
    expect($._data(window, 'events')).toBeTruthy();

    destroy();
    $(document.documentElement).off('.copypaste'); //remove copypaste.js listeners, which are not removed by destroy (because copypaste is a singleton for whole page)

    expect($._data(this.$container[0], 'events')).toBeFalsy();
    expect($._data(document.documentElement, 'events')).toBeFalsy();
    expect($._data(document.body, 'events')).toBeFalsy();
    expect($._data(window, 'events')).toBeFalsy();
  });

  it('should NOT remove events from document element and window for other Handsontable instances on the page', function () {
    //test based on Core_selectionSpec.js (should deselect currently selected cell)
    handsontable();

    var $tmp = $('<div id="tmp"></div>').appendTo(document.body);
    $tmp.handsontable();
    $tmp.handsontable('destroy');
    $tmp.remove();

    selectCell(0, 0);

    $("html").triggerHandler('mousedown');

    expect(getSelected()).toBeUndefined();
  });
});
