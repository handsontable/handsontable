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
    it.forTheme('classic')('should return number of visible rows', async() => {
      const instance = handsontable({
        data: createSpreadsheetData(10, 10),
        height: 100,
        width: 600
      });

      expect(instance.countVisibleRows()).toEqual(4);
    });

    it.forTheme('main')('should return number of visible rows', async() => {
      const instance = handsontable({
        data: createSpreadsheetData(10, 10),
        height: 125,
        width: 600
      });

      expect(instance.countVisibleRows()).toEqual(4);
    });

    it.forTheme('horizon')('should return number of visible rows', async() => {
      const instance = handsontable({
        data: createSpreadsheetData(10, 10),
        height: 161,
        width: 600
      });

      expect(instance.countVisibleRows()).toEqual(4);
    });

    it('should return -1 if table is not rendered', async() => {
      spec().$container.remove();
      const instance = handsontable({
        data: createSpreadsheetData(10, 10),
        width: 100
      });

      expect(instance.countVisibleRows()).toEqual(-1);
    });
  });

  describe('countRenderedRows', () => {
    it.forTheme('classic')('should return number of rendered rows', async() => {
      const instance = handsontable({
        data: createSpreadsheetData(10, 10),
        height: 100,
        viewportRowRenderingOffset: 0
      });

      expect(instance.countRenderedRows()).toEqual(5);
    });

    it.forTheme('main')('should return number of rendered rows', async() => {
      const instance = handsontable({
        data: createSpreadsheetData(10, 10),
        height: 125,
        viewportRowRenderingOffset: 0
      });

      expect(instance.countRenderedRows()).toEqual(5);
    });

    it.forTheme('horizon')('should return number of rendered rows', async() => {
      const instance = handsontable({
        data: createSpreadsheetData(10, 10),
        height: 161,
        viewportRowRenderingOffset: 0
      });

      expect(instance.countRenderedRows()).toEqual(5);
    });

    it.forTheme('classic')('should return number of rendered rows, including rows rendered ' +
      'because of viewportRowRenderingOffset', async() => {
      const instance = handsontable({
        data: createSpreadsheetData(50, 10),
        height: 100,
        viewportRowRenderingOffset: 20
      });

      expect(instance.countRenderedRows()).toEqual(25);
    });

    it.forTheme('main')('should return number of rendered rows, including rows rendered ' +
      'because of viewportRowRenderingOffset', async() => {
      const instance = handsontable({
        data: createSpreadsheetData(50, 10),
        height: 125,
        viewportRowRenderingOffset: 20
      });

      expect(instance.countRenderedRows()).toEqual(25);
    });

    it.forTheme('horizon')('should return number of rendered rows, including rows rendered ' +
      'because of viewportRowRenderingOffset', async() => {
      const instance = handsontable({
        data: createSpreadsheetData(50, 10),
        height: 161,
        viewportRowRenderingOffset: 20
      });

      expect(instance.countRenderedRows()).toEqual(25);
    });

    it('should return -1 if table is not rendered', async() => {
      spec().$container.remove();
      const instance = handsontable({
        data: createSpreadsheetData(10, 10),
        width: 100
      });

      expect(instance.countRenderedRows()).toEqual(-1);
    });
  });

  describe('countVisibleCols', () => {
    it('should return number of visible columns', async() => {
      const instance = handsontable({
        data: createSpreadsheetData(10, 10),
        width: 100
      });

      expect(instance.countVisibleCols()).toEqual(10);
    });

    it('should return -1 if table is not rendered', async() => {
      spec().$container.remove();
      const instance = handsontable({
        data: createSpreadsheetData(10, 10),
        width: 100
      });

      expect(instance.countVisibleCols()).toEqual(-1);
    });
  });
});
