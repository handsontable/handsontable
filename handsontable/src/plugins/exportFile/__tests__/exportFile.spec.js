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
    it('should have prepared default general options', async() => {
      handsontable();
      const csv = getPlugin('exportFile')._createTypeFormatter('csv');

      expect(csv.options.filename).toMatch(/Handsontable \d+-\d+-\d+/);
      expect(csv.options.bom).toBe(true);
      expect(csv.options.encoding).toBe('utf-8');
      expect(csv.options.colHeaders).toBe(false);
      expect(csv.options.rowHeaders).toBe(false);
      expect(csv.options.exportHiddenColumns).toBe(false);
      expect(csv.options.exportHiddenRows).toBe(false);
      expect(csv.options.range).toEqual([]);
      expect(csv.options.sanitizeValues).toEqual(false);
    });
  });

  describe('`_createTypeFormatter` method', () => {
    it('should create formatter type object', async() => {
      handsontable();
      const plugin = getPlugin('exportFile');

      const result = plugin._createTypeFormatter('csv');

      expect(result).toBeDefined();
      expect(result.options.fileExtension).toBeDefined('csv');
    });

    it('should throw exception when specified formatter type is not exist', async() => {
      handsontable();
      const plugin = getPlugin('exportFile');

      expect(() => {
        plugin._createTypeFormatter('csv2');
      }).toThrow();
    });
  });

  describe('`_createBlob` method', () => {
    it('should create blob object contains exported value', async() => {
      handsontable();
      const plugin = getPlugin('exportFile');
      const formatter = jasmine.createSpyObj('formatter', ['export']);

      formatter.export.and.returnValue('foo;bar');
      formatter.options = { mimeType: 'foo', encoding: 'iso-8859-1' };

      const result = plugin._createBlob(formatter);

      expect(formatter.export).toHaveBeenCalled();
      expect(result.size).toBe(7);
      expect(result.type).toBe('foo;charset=iso-8859-1');
    });
  });
});
