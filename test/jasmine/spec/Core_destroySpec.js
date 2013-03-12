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

  it('should remove events from the root element', function () {
    runs(function () {
      handsontable();
      expect($._data(this.$container[0], 'events')).toBeTruthy();
      destroy();
      expect($._data(this.$container[0], 'events')).toBeFalsy();
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect($._data(this.$container[0], 'events')).toBeFalsy(); //expect the same with async rendering
    });
  });
});