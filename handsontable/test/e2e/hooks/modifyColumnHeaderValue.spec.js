describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('modifyColumnHeaderValue', () => {
    it('should modify the value returned by the `getColHeader` method for multi-level headers', () => {
      handsontable({
        data: createSpreadsheetData(2, 4),
        colHeaders: true,
        modifyColumnHeaderValue(value, columnIndex, headerLevel) {
          return `${columnIndex} x ${headerLevel}`;
        },
        afterGetColumnHeaderRenderers(renderers) {
          renderers.length = 0;
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 0);
          });
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 1);
          });
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 2);
          });
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 3);
          });
        }
      });

      expect(getColHeader(0, 0)).toBe('0 x 0');
      expect(getColHeader(1, 1)).toBe('1 x 1');
      expect(getColHeader(2, 2)).toBe('2 x 2');
      expect(getColHeader(3, 2)).toBe('3 x 2');
      expect(getColHeader(3, 3)).toBe('3 x 3');
      expect(getColHeader(50, 50)).toBe('50 x 50');
      expect(getColHeader(3)).toBe('3 x -1');
      expect(getColHeader(3, -1)).toBe('3 x -1');
      expect(getColHeader(3, -2)).toBe('3 x -2');
      expect(getColHeader(50, -50)).toBe('50 x -50');
    });

    it('should be called with correct arguments for single-level headers after `getColHeader` method call', () => {
      const modifyColumnHeaderValue = jasmine.createSpy('modifyColumnHeaderValue')
        .and.returnValue('test');

      handsontable({
        data: createSpreadsheetData(2, 4),
        colHeaders: true,
        modifyColumnHeaderValue,
      });

      modifyColumnHeaderValue.calls.reset();

      expect(getColHeader(0)).toBe('test');
      expect(modifyColumnHeaderValue).toHaveBeenCalledTimes(1);
      expect(modifyColumnHeaderValue).toHaveBeenCalledWith('A', 0, -1);

      modifyColumnHeaderValue.calls.reset();

      expect(getColHeader(1, 2)).toBe('test');
      expect(modifyColumnHeaderValue).toHaveBeenCalledTimes(1);
      expect(modifyColumnHeaderValue).toHaveBeenCalledWith('B', 1, 2);

      modifyColumnHeaderValue.calls.reset();

      expect(getColHeader(2, -2)).toBe('test');
      expect(modifyColumnHeaderValue).toHaveBeenCalledTimes(1);
      expect(modifyColumnHeaderValue).toHaveBeenCalledWith('C', 2, -2);

      modifyColumnHeaderValue.calls.reset();

      expect(getColHeader(200, -3)).toBe('test');
      expect(modifyColumnHeaderValue).toHaveBeenCalledTimes(1);
      expect(modifyColumnHeaderValue).toHaveBeenCalledWith('GS', 200, -3);

      modifyColumnHeaderValue.calls.reset();

      expect(getColHeader(3, -100)).toBe('test');
      expect(modifyColumnHeaderValue).toHaveBeenCalledTimes(1);
      expect(modifyColumnHeaderValue).toHaveBeenCalledWith('D', 3, -100);

      modifyColumnHeaderValue.calls.reset();

      expect(getColHeader(3, 100)).toBe('test');
      expect(modifyColumnHeaderValue).toHaveBeenCalledTimes(1);
      expect(modifyColumnHeaderValue).toHaveBeenCalledWith('D', 3, 100);
    });

    it('should be called with correct arguments for multi-level headers after `getColHeader` method call', () => {
      const modifyColumnHeaderValue = jasmine.createSpy('modifyColumnHeaderValue')
        .and.returnValue('test');

      handsontable({
        data: createSpreadsheetData(2, 4),
        colHeaders: true,
        modifyColumnHeaderValue,
        afterGetColumnHeaderRenderers(renderers) {
          renderers.length = 0;
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 0);
          });
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 1);
          });
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 2);
          });
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 3);
          });
        }
      });

      modifyColumnHeaderValue.calls.reset();

      expect(getColHeader(0)).toBe('test');
      expect(modifyColumnHeaderValue).toHaveBeenCalledTimes(1);
      expect(modifyColumnHeaderValue).toHaveBeenCalledWith('A', 0, -1);

      modifyColumnHeaderValue.calls.reset();

      expect(getColHeader(1, 2)).toBe('test');
      expect(modifyColumnHeaderValue).toHaveBeenCalledTimes(1);
      expect(modifyColumnHeaderValue).toHaveBeenCalledWith('B', 1, 2);

      modifyColumnHeaderValue.calls.reset();

      expect(getColHeader(2, -2)).toBe('test');
      expect(modifyColumnHeaderValue).toHaveBeenCalledTimes(1);
      expect(modifyColumnHeaderValue).toHaveBeenCalledWith('C', 2, -2);

      modifyColumnHeaderValue.calls.reset();

      expect(getColHeader(200, -3)).toBe('test');
      expect(modifyColumnHeaderValue).toHaveBeenCalledTimes(1);
      expect(modifyColumnHeaderValue).toHaveBeenCalledWith('GS', 200, -3);

      modifyColumnHeaderValue.calls.reset();

      expect(getColHeader(3, -100)).toBe('test');
      expect(modifyColumnHeaderValue).toHaveBeenCalledTimes(1);
      expect(modifyColumnHeaderValue).toHaveBeenCalledWith('D', 3, -100);

      modifyColumnHeaderValue.calls.reset();

      expect(getColHeader(3, 100)).toBe('test');
      expect(modifyColumnHeaderValue).toHaveBeenCalledTimes(1);
      expect(modifyColumnHeaderValue).toHaveBeenCalledWith('D', 3, 100);
    });
  });
});
