describe('DragToScroll', () => {
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
  var dragToScroll = new Handsontable.plugins.DragToScroll();

  dragToScroll.setBoundaries(createBoundaries());

  it('exact top, exact left should be in boundaries', () => {
    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(0);
      expect(scrollY).toEqual(0);
    });

    dragToScroll.check(100, 100);
  });

  it('exact bottom, exact right should be in boundaries', () => {
    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(0);
      expect(scrollY).toEqual(0);
    });

    dragToScroll.check(1000, 1000);
  });

  it('less than top, less than left should be out in "top" direction', () => {
    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(-1);
      expect(scrollY).toEqual(-1);
    });

    dragToScroll.check(99, 99);
  });

  it('exact top, less than left should be out in "left" direction', () => {
    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(-1);
      expect(scrollY).toEqual(0);
    });

    dragToScroll.check(99, 100);
  });

  it('less than top, more than right should be out in "top" direction', () => {
    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(1);
      expect(scrollY).toEqual(-1);
    });

    dragToScroll.check(1001, 99);
  });

  it('more than bottom, more than right should be out in "bottom" direction', () => {
    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(1);
      expect(scrollY).toEqual(1);
    });

    dragToScroll.check(1001, 1001);
  });

  it('exact bottom, more than right should be out in "right" direction', () => {
    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(1);
      expect(scrollY).toEqual(0);
    });

    dragToScroll.check(1001, 1000);
  });

  it('more than bottom, less than left should be out in "bottom" direction', () => {
    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(-1);
      expect(scrollY).toEqual(1);
    });

    dragToScroll.check(99, 1001);
  });
});
