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
    runs(function () {
      handsontable();
      destroy();
      expect(this.$container.html()).toEqual('');
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(this.$container.html()).toEqual(''); //expect the same with async rendering
    });
  });

  it('should remove events from the root element, document element and window', function () {
    runs(function () {
      handsontable();
      expect($._data(this.$container[0], 'events')).toBeTruthy();
      expect($._data(document.documentElement, 'events')).toBeTruthy();
      expect($._data(window, 'events')).toBeTruthy();
      destroy();
      expect($._data(this.$container[0], 'events')).toBeFalsy();
      expect($._data(document.documentElement, 'events')).toBeFalsy();
      expect($._data(window, 'events')).toBeFalsy();
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect($._data(this.$container[0], 'events')).toBeFalsy(); //expect the same with async rendering
      expect($._data(document.documentElement, 'events')).toBeFalsy(); //expect the same with async rendering
      expect($._data(window, 'events')).toBeFalsy(); //expect the same with async rendering
    });
  });

  it('should NOT remove events from document element and window for other Handsontable instances on the page', function () {
    //test based on Core_selectionSpec.js (should deselect currently selected cell)
    runs(function () {
      handsontable();

      var $tmp = $('<div id="tmp"></div>').appendTo(document.body);
      $tmp.handsontable();
      $tmp.handsontable('destroy');

      selectCell(0, 0);
    });

    waits(10);

    runs(function () {
      $("html").triggerHandler('mousedown');
    });

    waits(10);

    runs(function () {
      expect(getSelected()).toBeUndefined();
    });
  });
});