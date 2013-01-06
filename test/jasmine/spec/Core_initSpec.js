describe('Core_init', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      this.$container.remove();
    }
  });

  it('should respect startRows and startCols when no data is provided', function () {
    handsontable();

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countRows()).toEqual(5); //as given in README.md
      expect(countCols()).toEqual(5); //as given in README.md
    });
  });
});
