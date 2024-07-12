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

  describe('beforeViewportScroll', () => {
    it('should be fired when the viewport is scrolled horizontally', () => {
      const beforeViewportScroll = jasmine.createSpy('beforeViewportScroll');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScroll,
      });

      scrollViewportTo({ col: 40 });

      expect(beforeViewportScroll).toHaveBeenCalledOnceWith();
    });

    it('should be fired when the viewport is scrolled vertically', () => {
      const beforeViewportScroll = jasmine.createSpy('beforeViewportScroll');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScroll,
      });

      scrollViewportTo({ row: 40 });

      expect(beforeViewportScroll).toHaveBeenCalledOnceWith();
    });

    it('should be fired when the viewport is scrolled horizontally and vertically', () => {
      const beforeViewportScroll = jasmine.createSpy('beforeViewportScroll');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScroll,
      });

      scrollViewportTo({ row: 40, col: 40 });

      expect(beforeViewportScroll).toHaveBeenCalledTimes(2);
    });

    it('should be fired when the viewport is scrolled horizontally and vertically', () => {
      const beforeViewportScroll = jasmine.createSpy('beforeViewportScroll');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScroll,
      });

      scrollViewportTo({ row: 40, col: 40 });

      expect(beforeViewportScroll).toHaveBeenCalledTimes(2);
    });

    it('should be fired when the viewport is scrolled horizontally and vertically (the coords are already within the viewport)', () => {
      const beforeViewportScroll = jasmine.createSpy('beforeViewportScroll');

      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        beforeViewportScroll,
      });

      scrollViewportTo({ row: 1, col: 1 });

      expect(beforeViewportScroll).toHaveBeenCalledTimes(2);
    });
  });
});
