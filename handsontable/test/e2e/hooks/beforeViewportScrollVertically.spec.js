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

  describe('beforeViewportScrollVertically', () => {
    it('should be fired when the viewport is scrolled vertically', () => {
      const beforeViewportScrollVertically = jasmine.createSpy('beforeViewportScrollVertically');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollVertically,
      });

      scrollViewportTo({ row: 40 });

      expect(beforeViewportScrollVertically).toHaveBeenCalledOnceWith(40, jasmine.objectContaining({
        value: 'auto',
      }));
    });

    it('should be fired when the viewport is scrolled vertically with snapping option', () => {
      const beforeViewportScrollVertically = jasmine.createSpy('beforeViewportScrollVertically');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollVertically,
      });

      scrollViewportTo({ row: 3, verticalSnap: 'end' });

      expect(beforeViewportScrollVertically).toHaveBeenCalledOnceWith(3, jasmine.objectContaining({
        value: 'end',
      }));
    });

    it('should be fired when the viewport is tried to scroll vertically (the row is already within the viewport)', () => {
      const beforeViewportScrollVertically = jasmine.createSpy('beforeViewportScrollVertically');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollVertically,
      });

      scrollViewportTo({ row: 3 });

      expect(beforeViewportScrollVertically).toHaveBeenCalledOnceWith(3, jasmine.objectContaining({
        value: 'auto',
      }));
    });

    it('should not be fired when the viewport is scrolled horizontally', () => {
      const beforeViewportScrollVertically = jasmine.createSpy('beforeViewportScrollVertically');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollVertically,
      });

      scrollViewportTo({ col: 3 });

      expect(beforeViewportScrollVertically).not.toHaveBeenCalledWith();
    });

    it('should not be fired when the viewport is tried to scroll horizontally (the column is already within the viewport)', () => {
      const beforeViewportScrollVertically = jasmine.createSpy('beforeViewportScrollVertically');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollVertically,
      });

      scrollViewportTo({ col: 3 });

      expect(beforeViewportScrollVertically).not.toHaveBeenCalledWith();
    });

    it('should be possible to change the snapping option', () => {
      const beforeViewportScrollVertically = jasmine.createSpy('beforeViewportScrollVertically')
        .and
        .callFake((row, snapping) => {
          snapping.value = 'start';
        });

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollVertically,
      });

      scrollViewportTo({ row: 10 });

      expect(beforeViewportScrollVertically).toHaveBeenCalledOnceWith(10, jasmine.objectContaining({
        value: 'start',
      }));
    });

    it('should be possible to change row to which the viewport is scrolled', () => {
      const beforeViewportScrollVertically = jasmine.createSpy('beforeViewportScrollVertically')
        .and
        .returnValue(40);

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollVertically,
      });

      scrollViewportTo({ row: 10 });

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
        classic.toBe(686);
        main.toBe(935);
      });
    });

    it('should be possible to change row to which the viewport is scrolled (case with hidden rows)', () => {
      const beforeViewportScrollVertically = jasmine.createSpy('beforeViewportScrollVertically');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollVertically,
      });

      const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(0, true);
      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(2, true);

      render();

      scrollViewportTo({ row: 20 });

      expect(beforeViewportScrollVertically).toHaveBeenCalledOnceWith(20, jasmine.objectContaining({
        value: 'auto',
      }));
      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
        classic.toBe(157);
        main.toBe(268);
      });
    });

    it('should be possible to block viewport scrolling after returning `false`', () => {
      const beforeViewportScrollVertically = jasmine.createSpy('beforeViewportScrollVertically')
        .and.returnValue(false);

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollVertically,
      });

      scrollViewportTo({ row: 90 });

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(topOverlay().getScrollPosition()).toBe(0);
    });

    it('should not scroll the viewport when the returned value is not an integer', () => {
      const beforeViewportScrollVertically = jasmine.createSpy('beforeViewportScrollVertically');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollVertically,
      });

      beforeViewportScrollVertically.and.returnValue('foo');

      expect(scrollViewportTo({ row: 90 })).toBe(false);
      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(topOverlay().getScrollPosition()).toBe(0);

      beforeViewportScrollVertically.and.returnValue(1.5);

      expect(scrollViewportTo({ row: 90 })).toBe(false);
      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(topOverlay().getScrollPosition()).toBe(0);

      beforeViewportScrollVertically.and.returnValue(null);

      expect(scrollViewportTo({ row: 90 })).toBe(false);
      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(topOverlay().getScrollPosition()).toBe(0);

      beforeViewportScrollVertically.and.returnValue(-1);

      expect(scrollViewportTo({ row: 90 })).toBe(false);
      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(topOverlay().getScrollPosition()).toBe(0);

      beforeViewportScrollVertically.and.returnValue(100); // out of range

      expect(scrollViewportTo({ row: 90 })).toBe(false);
      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(topOverlay().getScrollPosition()).toBe(0);
    });
  });
});
