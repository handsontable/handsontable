describe('DragToScroll', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  /**
   *
   */
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

  it('exact top, exact left should be in boundaries', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      dragToScroll: true
    });

    const dragToScroll = hot.getPlugin('dragToScroll');

    dragToScroll.setBoundaries(createBoundaries());

    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(0);
      expect(scrollY).toEqual(0);
    });

    dragToScroll.check(100, 100);
  });

  it('exact bottom, exact right should be in boundaries', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      dragToScroll: true
    });

    const dragToScroll = hot.getPlugin('dragToScroll');

    dragToScroll.setBoundaries(createBoundaries());

    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(0);
      expect(scrollY).toEqual(0);
    });

    dragToScroll.check(1000, 1000);
  });

  it('less than top, less than left should be out in "top" direction', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      dragToScroll: true
    });

    const dragToScroll = hot.getPlugin('dragToScroll');

    dragToScroll.setBoundaries(createBoundaries());

    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(-1);
      expect(scrollY).toEqual(-1);
    });

    dragToScroll.check(99, 99);
  });

  it('exact top, less than left should be out in "left" direction', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      dragToScroll: true
    });

    const dragToScroll = hot.getPlugin('dragToScroll');

    dragToScroll.setBoundaries(createBoundaries());

    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(-1);
      expect(scrollY).toEqual(0);
    });

    dragToScroll.check(99, 100);
  });

  it('less than top, more than right should be out in "top" direction', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      dragToScroll: true
    });

    const dragToScroll = hot.getPlugin('dragToScroll');

    dragToScroll.setBoundaries(createBoundaries());

    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(1);
      expect(scrollY).toEqual(-1);
    });

    dragToScroll.check(1001, 99);
  });

  it('more than bottom, more than right should be out in "bottom" direction', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      dragToScroll: true
    });

    const dragToScroll = hot.getPlugin('dragToScroll');

    dragToScroll.setBoundaries(createBoundaries());

    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(1);
      expect(scrollY).toEqual(1);
    });

    dragToScroll.check(1001, 1001);
  });

  it('exact bottom, more than right should be out in "right" direction', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      dragToScroll: true
    });

    const dragToScroll = hot.getPlugin('dragToScroll');

    dragToScroll.setBoundaries(createBoundaries());

    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(1);
      expect(scrollY).toEqual(0);
    });

    dragToScroll.check(1001, 1000);
  });

  it('more than bottom, less than left should be out in "bottom" direction', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      dragToScroll: true
    });

    const dragToScroll = hot.getPlugin('dragToScroll');

    dragToScroll.setBoundaries(createBoundaries());

    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(-1);
      expect(scrollY).toEqual(1);
    });

    dragToScroll.check(99, 1001);
  });

  describe('contextmenu', () => {
    it('should not scroll if the \'mouseup\' event has not been fired after the \'contextmenu\' event', () => {
      handsontable({
        dragToScroll: true
      });

      contextMenu();

      expect(getPlugin('dragToScroll').isListening()).toBe(false);
    });
  });
});
