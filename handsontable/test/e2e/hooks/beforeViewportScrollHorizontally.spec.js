describe('Hook', () => {
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

  describe('beforeViewportScrollHorizontally', () => {
    it('should be fired when the viewport is scrolled horizontally', () => {
      const beforeViewportScrollHorizontally = jasmine.createSpy('beforeViewportScrollHorizontally');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollHorizontally,
      });

      scrollViewportTo({ col: 40 });

      expect(beforeViewportScrollHorizontally).toHaveBeenCalledOnceWith(40, jasmine.objectContaining({
        value: 'auto',
      }));
    });

    it('should be fired when the viewport is scrolled horizontally with snapping option', () => {
      const beforeViewportScrollHorizontally = jasmine.createSpy('beforeViewportScrollHorizontally');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollHorizontally,
      });

      scrollViewportTo({ col: 40, horizontalSnap: 'end' });

      expect(beforeViewportScrollHorizontally).toHaveBeenCalledOnceWith(40, jasmine.objectContaining({
        value: 'end',
      }));
    });

    it('should be fired when the viewport is tried to scroll horizontally (the column is already within the viewport)', () => {
      const beforeViewportScrollHorizontally = jasmine.createSpy('beforeViewportScrollHorizontally');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollHorizontally,
      });

      scrollViewportTo({ col: 3 });

      expect(beforeViewportScrollHorizontally).toHaveBeenCalledOnceWith(3, jasmine.objectContaining({
        value: 'auto',
      }));
    });

    it('should not be fired when the viewport is scrolled vertically', () => {
      const beforeViewportScrollHorizontally = jasmine.createSpy('beforeViewportScrollHorizontally');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollHorizontally,
      });

      scrollViewportTo({ row: 3 });

      expect(beforeViewportScrollHorizontally).not.toHaveBeenCalledWith();
    });

    it('should not be fired when the viewport is tried to scroll vertically (the row is already within the viewport)', () => {
      const beforeViewportScrollHorizontally = jasmine.createSpy('beforeViewportScrollHorizontally');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollHorizontally,
      });

      scrollViewportTo({ row: 3 });

      expect(beforeViewportScrollHorizontally).not.toHaveBeenCalledWith();
    });

    it('should be possible to change the snapping option', () => {
      const beforeViewportScrollHorizontally = jasmine.createSpy('beforeViewportScrollHorizontally')
        .and
        .callFake((column, snapping) => {
          snapping.value = 'start';
        });

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        colWidths: 50,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollHorizontally,
      });

      scrollViewportTo({ col: 10 });

      expect(beforeViewportScrollHorizontally).toHaveBeenCalledOnceWith(10, jasmine.objectContaining({
        value: 'start',
      }));
    });

    it('should be possible to change column to which the viewport is scrolled', () => {
      const beforeViewportScrollHorizontally = jasmine.createSpy('beforeViewportScrollHorizontally')
        .and
        .returnValue(40);

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        colWidths: 50,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollHorizontally,
      });

      scrollViewportTo({ col: 10 });

      // 2050 column width - 250 viewport width + 15 scrollbar compensation + 1 header border compensation
      expect(inlineStartOverlay().getScrollPosition()).toBe(1816);
      expect(topOverlay().getScrollPosition()).toBe(0);
    });

    it('should be possible to change column to which the viewport is scrolled (case with hidden columns)', () => {
      const beforeViewportScrollHorizontally = jasmine.createSpy('beforeViewportScrollHorizontally');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        colWidths: 50,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollHorizontally,
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(0, true);
      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(2, true);

      render();

      scrollViewportTo({ col: 20 });

      expect(beforeViewportScrollHorizontally).toHaveBeenCalledOnceWith(20, jasmine.objectContaining({
        value: 'auto',
      }));

      // 900 column width - 250 viewport width + 15 scrollbar compensation + 1 header border compensation
      expect(inlineStartOverlay().getScrollPosition()).toBe(666);
      expect(topOverlay().getScrollPosition()).toBe(0);
    });

    it('should be possible to block viewport scrolling after returning `false`', () => {
      const beforeViewportScrollHorizontally = jasmine.createSpy('beforeViewportScrollHorizontally')
        .and.returnValue(false);

      handsontable({
        data: createSpreadsheetData(50, 100),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollHorizontally,
      });

      scrollViewportTo({ col: 90 });

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(topOverlay().getScrollPosition()).toBe(0);
    });

    it('should not scroll the viewport when the returned value is not an integer', () => {
      const beforeViewportScrollHorizontally = jasmine.createSpy('beforeViewportScrollHorizontally');

      handsontable({
        data: createSpreadsheetData(50, 100),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollHorizontally,
      });

      beforeViewportScrollHorizontally.and.returnValue('foo');

      expect(scrollViewportTo({ col: 90 })).toBe(false);
      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(topOverlay().getScrollPosition()).toBe(0);

      beforeViewportScrollHorizontally.and.returnValue(1.5);

      expect(scrollViewportTo({ col: 90 })).toBe(false);
      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(topOverlay().getScrollPosition()).toBe(0);

      beforeViewportScrollHorizontally.and.returnValue(null);

      expect(scrollViewportTo({ col: 90 })).toBe(false);
      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(topOverlay().getScrollPosition()).toBe(0);

      beforeViewportScrollHorizontally.and.returnValue(-1);

      expect(scrollViewportTo({ col: 90 })).toBe(false);
      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(topOverlay().getScrollPosition()).toBe(0);

      beforeViewportScrollHorizontally.and.returnValue(100); // out of range

      expect(scrollViewportTo({ col: 90 })).toBe(false);
      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(topOverlay().getScrollPosition()).toBe(0);
    });
  });
});
