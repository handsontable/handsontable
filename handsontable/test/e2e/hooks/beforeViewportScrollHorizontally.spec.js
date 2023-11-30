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

      expect(beforeViewportScrollHorizontally).toHaveBeenCalledOnceWith(40);
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

      expect(beforeViewportScrollHorizontally).toHaveBeenCalledOnceWith(3);
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

    it('should be possible to change column to which the viewport is scrolled', () => {
      const beforeViewportScrollHorizontally = jasmine.createSpy('beforeViewportScrollHorizontally')
        .and
        .returnValue(40);

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScrollHorizontally,
      });

      scrollViewportTo({ col: 10 });

      expect(inlineStartOverlay().getScrollPosition()).toBe(1815);
      expect(topOverlay().getScrollPosition()).toBe(0);
    });

    it('should be possible to change column to which the viewport is scrolled (case with hidden columns)', () => {
      const beforeViewportScrollHorizontally = jasmine.createSpy('beforeViewportScrollHorizontally');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
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

      expect(beforeViewportScrollHorizontally).toHaveBeenCalledOnceWith(20);
      expect(inlineStartOverlay().getScrollPosition()).toBe(665);
      expect(topOverlay().getScrollPosition()).toBe(0);
    });
  });
});
