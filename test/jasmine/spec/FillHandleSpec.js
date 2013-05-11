describe('FillHandle', function () {
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

  it('should appear when fillHandle equals true', function () {
    handsontable({
      fillHandle: true
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      selectCell(2, 2);
    });

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

  it('should add custom value after autofill', function () {

    handsontable({
      data: [[1,2,3,4,5,6], [1,2,3,4,5,6], [1,2,3,4,5,6], [1,2,3,4,5,6]],
      beforeAutofill: function (start, end, data) {
        data[0][0] = "test";
      }
    });
    selectCell(0, 0);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      var fillHandle = this.$container.find('.wtBorder.corner')[0]
        , event = jQuery.Event("mousedown");

      event.target = fillHandle;
      this.$container.find('tr:eq(0) td:eq(0)').trigger(event);
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      this.$container.find('tr:eq(1) td:eq(0)').trigger('mouseenter');
      this.$container.find('tr:eq(2) td:eq(0)').trigger('mouseenter');
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      var fillHandle = this.$container.find('.wtBorder.corner')[0]
        , event = jQuery.Event("mouseup");

      event.target = fillHandle;
      this.$container.find('tr:eq(2) td:eq(0)').trigger(event);
    });

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(getDataAtCell(1,0)).toEqual("test");
    });
  });
});