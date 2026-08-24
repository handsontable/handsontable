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
    it('should return number of visible rows', async() => {
      const instance = handsontable({
        data: createSpreadsheetData(10, 10),
        height: 125,
        width: 600
      });

      expect(instance.countVisibleRows()).toEqual(expectedVisibleRows(125, 0));
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
    it('should return number of rendered rows', async() => {
      const instance = handsontable({
        data: createSpreadsheetData(10, 10),
        height: 125,
        viewportRowRenderingOffset: 0
      });

      // rendered rows = visible rows + 1 (partially visible row at the bottom)
      expect(instance.countRenderedRows()).toEqual(expectedVisibleRows(125, 0) + 1);
    });

    it('should return number of rendered rows, including rows rendered ' +
      'because of viewportRowRenderingOffset', async() => {
      const instance = handsontable({
        data: createSpreadsheetData(50, 10),
        height: 125,
        viewportRowRenderingOffset: 20
      });

      // rendered rows = visible rows + offset (capped at available rows)
      expect(instance.countRenderedRows()).toEqual(expectedVisibleRows(125, 0) + 1 + 20);
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
        // Wide enough that all columns fit in the viewport. With `width` set and no `height`, the root uses
        // horizontal clipping so `countVisibleCols` reflects the visible viewport (DEV-1025).
        width: 600
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
