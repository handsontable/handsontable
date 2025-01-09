describe('Core_count', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    destroy();
    this.$container.remove();
  });

  describe('countVisibleRows', () => {
    it('should return number of visible rows', () => {
      // TODO [themes]: Could be potentially improved by per-theme configuration
      const instance = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        height: 100,
        width: 600
      });

      expect(instance.countVisibleRows()).forThemes(({ classic, main, horizon }) => {
        classic.toEqual(4);
        main.toEqual(3);
      });
    });

    it('should return -1 if table is not rendered', () => {
      spec().$container.remove();
      const instance = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        width: 100
      });

      expect(instance.countVisibleRows()).toEqual(-1);
    });
  });

  describe('countRenderedRows', () => {
    it('should return number of rendered rows', () => {
      // TODO [themes]: Could be potentially improved by per-theme configuration
      const instance = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        height: 100,
        viewportRowRenderingOffset: 0
      });

      expect(instance.countRenderedRows()).forThemes(({ classic, main, horizon }) => {
        classic.toEqual(5);
        main.toEqual(4);
      });
    });

    it('should return number of rendered rows, including rows rendered becausee of viewportRowRenderingOffset', () => {
      // TODO [themes]: Could be potentially improved by per-theme configuration
      const instance = handsontable({
        data: Handsontable.helper.createSpreadsheetData(50, 10),
        height: 100,
        viewportRowRenderingOffset: 20
      });

      expect(instance.countRenderedRows()).forThemes(({ classic, main, horizon }) => {
        classic.toEqual(25);
        main.toEqual(24);
      });
    });

    it('should return -1 if table is not rendered', () => {
      spec().$container.remove();
      const instance = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        width: 100
      });

      expect(instance.countRenderedRows()).toEqual(-1);
    });
  });

  describe('countVisibleCols', () => {
    it('should return number of visible columns', () => {
      const instance = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        width: 100
      });

      expect(instance.countVisibleCols()).toEqual(10);
    });

    it('should return -1 if table is not rendered', () => {
      spec().$container.remove();
      const instance = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        width: 100
      });

      expect(instance.countVisibleCols()).toEqual(-1);
    });
  });
});
