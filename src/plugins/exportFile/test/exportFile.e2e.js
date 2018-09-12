describe('exportFile', () => {
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

  describe('export options', () => {
    it('should have prepared default general options', () => {
      handsontable();
      const csv = getPlugin('exportFile')._createTypeFormatter('csv');

      expect(csv.options.filename).toMatch(/Handsontable \d+-\d+-\d+/);
      expect(csv.options.bom).toBe(true);
      expect(csv.options.encoding).toBe('utf-8');
      expect(csv.options.columnHeaders).toBe(false);
      expect(csv.options.rowHeaders).toBe(false);
      expect(csv.options.exportHiddenColumns).toBe(false);
      expect(csv.options.exportHiddenRows).toBe(false);
      expect(csv.options.range).toEqual([]);
    });
  });

  describe('`exportAsString` method', () => {
    it('should create formatter class and call `export` method on it', () => {
      handsontable();
      const plugin = getPlugin('exportFile');
      const formatter = jasmine.createSpyObj('formatter', ['export']);

      formatter.export.and.returnValue('foo;bar');
      spyOn(plugin, '_createTypeFormatter').and.returnValue(formatter);

      const result = plugin.exportAsString('csv', { columnHeaders: true });

      expect(plugin._createTypeFormatter).toHaveBeenCalledWith('csv', { columnHeaders: true });
      expect(formatter.export).toHaveBeenCalled();
      expect(result).toBe('foo;bar');
    });
  });

  describe('`exportAsBlob` method', () => {
    it('should create formatter class and create blob object contains exported value', () => {
      handsontable();
      const plugin = getPlugin('exportFile');
      const formatter = jasmine.createSpy('formatter');

      spyOn(plugin, '_createTypeFormatter').and.returnValue(formatter);
      spyOn(plugin, '_createBlob').and.returnValue('blob');

      const result = plugin.exportAsBlob('csv', { columnHeaders: true });

      expect(plugin._createTypeFormatter).toHaveBeenCalledWith('csv', { columnHeaders: true });
      expect(plugin._createBlob).toHaveBeenCalledWith(formatter);
      expect(result).toBe('blob');
    });
  });

  describe('`_createTypeFormatter` method', () => {
    it('should create formatter type object', () => {
      const hot = handsontable();
      const plugin = hot.getPlugin('exportFile');

      const result = plugin._createTypeFormatter('csv');

      expect(result).toBeDefined();
      expect(result.options.fileExtension).toBeDefined('csv');
    });

    it('should throw exception when specified formatter type is not exist', () => {
      handsontable();
      const plugin = getPlugin('exportFile');

      expect(() => {
        plugin._createTypeFormatter('csv2');
      }).toThrow();
    });
  });

  describe('`_createBlob` method', () => {
    it('should create blob object contains exported value', () => {
      handsontable();
      const plugin = getPlugin('exportFile');
      const formatter = jasmine.createSpyObj('formatter', ['export']);

      formatter.export.and.returnValue('foo;bar');
      formatter.options = { mimeType: 'foo', encoding: 'iso-8859-1' };

      const result = plugin._createBlob(formatter);

      if (!Handsontable.helper.isIE9()) {
        expect(formatter.export).toHaveBeenCalled();
        expect(result.size).toBe(7);
        expect(result.type).toBe('foo;charset=iso-8859-1');
      }
    });
  });
});
