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

      expect(beforeViewportScrollVertically).toHaveBeenCalledOnceWith(40);
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

      expect(beforeViewportScrollVertically).toHaveBeenCalledOnceWith(3);
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
      expect(topOverlay().getScrollPosition()).toBe(685);
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

      expect(beforeViewportScrollVertically).toHaveBeenCalledOnceWith(20);
      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(topOverlay().getScrollPosition()).toBe(156);
    });
  });
});
