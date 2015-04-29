//if (typeof DragToScroll === 'undefined' && typeof require !== 'undefined') {
//  // having this allows you to run this test using:
//  // jasmine-node src/plugins/dragToScroll/test/dragToScroll.spec.js
//  eval(require('fs').readFileSync(__dirname + '/../dragToScroll.js', 'utf8'));
//}

describe("DragToScroll", function () {
  function createBoundaries() {
    return {
      top: 100,
      left: 100,
      width: 900,
      height: 900,
      bottom: 1000,
      right: 1000
    };
  }

  if (typeof DragToScroll !== 'undefined') {
    var dragToScroll = new DragToScroll();
  }
  else {
    var dragToScroll = new Handsontable.plugins.DragToScroll();
  }
  dragToScroll.setBoundaries(createBoundaries());

  it('exact top, exact left should be in boundaries', function () {
    dragToScroll.setCallback(function (scrollX, scrollY) {
      expect(scrollX).toEqual(0);
      expect(scrollY).toEqual(0);
    });

    dragToScroll.check(100, 100);
  });

  it('exact bottom, exact right should be in boundaries', function () {
    dragToScroll.setCallback(function (scrollX, scrollY) {
      expect(scrollX).toEqual(0);
      expect(scrollY).toEqual(0);
    });

    dragToScroll.check(1000, 1000);
  });

  it('less than top, less than left should be out in "top" direction', function () {
    dragToScroll.setCallback(function (scrollX, scrollY) {
      expect(scrollX).toEqual(-1);
      expect(scrollY).toEqual(-1);
    });

    dragToScroll.check(99, 99);
  });

  it('exact top, less than left should be out in "left" direction', function () {
    dragToScroll.setCallback(function (scrollX, scrollY) {
      expect(scrollX).toEqual(-1);
      expect(scrollY).toEqual(0);
    });

    dragToScroll.check(99, 100);
  });

  it('less than top, more than right should be out in "top" direction', function () {
    dragToScroll.setCallback(function (scrollX, scrollY) {
      expect(scrollX).toEqual(1);
      expect(scrollY).toEqual(-1);
    });

    dragToScroll.check(1001, 99)
  });

  it('more than bottom, more than right should be out in "bottom" direction', function () {
    dragToScroll.setCallback(function (scrollX, scrollY) {
      expect(scrollX).toEqual(1);
      expect(scrollY).toEqual(1);
    });

    dragToScroll.check(1001, 1001);
  });

  it('exact bottom, more than right should be out in "right" direction', function () {
    dragToScroll.setCallback(function (scrollX, scrollY) {
      expect(scrollX).toEqual(1);
      expect(scrollY).toEqual(0);
    });

    dragToScroll.check(1001, 1000);
  });

  it('more than bottom, less than left should be out in "bottom" direction', function () {
    dragToScroll.setCallback(function (scrollX, scrollY) {
      expect(scrollX).toEqual(-1);
      expect(scrollY).toEqual(1);
    });

    dragToScroll.check(99, 1001);
  });
});
