describe('FillHandle', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      this.$container.remove();
    }
  });

  it('should appear when fillHandle equals true', function () {
    handsontable({
      fillHandle: true
    });
    selectCell(2, 2);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(isFillHandleVisible()).toBe(true);
    });
  });

  it('should not appear when fillHandle equals false', function () {
    handsontable({
      fillHandle: false
    });
    selectCell(2, 2);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(isFillHandleVisible()).toBe(false);
    });
  });

  it('should disappear when beginediting is triggered', function () {
    handsontable({
      fillHandle: true
    });
    selectCell(2, 2);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDown('enter');
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(isFillHandleVisible()).toBe(false);
    });
  });

  it('should appear when finishediting is triggered', function () {
    handsontable({
      fillHandle: true
    });
    selectCell(2, 2);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDown('enter');
      keyDown('enter');
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(isFillHandleVisible()).toBe(true);
    });
  });

  it('should not appear when fillHandle equals false and finishediting is triggered', function () {
    handsontable({
      fillHandle: false
    });
    selectCell(2, 2);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      keyDown('enter');
      keyDown('enter');
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(isFillHandleVisible()).toBe(false);
    });
  });
});