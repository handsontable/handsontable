describe('exportFile', function() {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('export options', function() {

    it('should have prepared default general options', function() {
      var hot = handsontable();
      var csv = hot.getPlugin('exportFile')._createTypeFormatter('csv');

      expect(csv.options.filename).toMatch(/Handsontable \d+-\d+-\d+/);
      expect(csv.options.encoding).toBe('utf-8');
      expect(csv.options.columnHeaders).toBe(false);
      expect(csv.options.rowHeaders).toBe(false);
      expect(csv.options.exportHiddenColumns).toBe(false);
      expect(csv.options.exportHiddenRows).toBe(false);
      expect(csv.options.range).toEqual([]);
    });
  });

  describe('`exportAsString` method', function() {

    it('should create formatter class and call `export` method on it', function() {
      var hot = handsontable();
      var plugin = hot.getPlugin('exportFile');
      var formatter = jasmine.createSpyObj('formatter', ['export']);

      formatter.export.and.returnValue('foo;bar');
      spyOn(plugin, '_createTypeFormatter').and.returnValue(formatter);

      var result = plugin.exportAsString('csv', {columnHeaders: true});

      expect(plugin._createTypeFormatter).toHaveBeenCalledWith('csv', {columnHeaders: true});
      expect(formatter.export).toHaveBeenCalled();
      expect(result).toBe('foo;bar');
    });
  });

  describe('`exportAsBlob` method', function() {

    it('should create formatter class and create blob object contains exported value', function() {
      var hot = handsontable();
      var plugin = hot.getPlugin('exportFile');
      var formatter = jasmine.createSpy('formatter');

      spyOn(plugin, '_createTypeFormatter').and.returnValue(formatter);
      spyOn(plugin, '_createBlob').and.returnValue('blob');

      var result = plugin.exportAsBlob('csv', {columnHeaders: true});

      expect(plugin._createTypeFormatter).toHaveBeenCalledWith('csv', {columnHeaders: true});
      expect(plugin._createBlob).toHaveBeenCalledWith(formatter);
      expect(result).toBe('blob');
    });
  });

  describe('`_createTypeFormatter` method', function() {

    it('should create formatter type object', function() {
      var hot = handsontable();
      var plugin = hot.getPlugin('exportFile');

      var result = plugin._createTypeFormatter('csv');

      expect(result).toBeDefined();
      expect(result.options.fileExtension).toBeDefined('csv');
    });

    it('should throw exception when specified formatter type is not exist', function() {
      var hot = handsontable();
      var plugin = hot.getPlugin('exportFile');

      expect(function() {
        plugin._createTypeFormatter('csv2');
      }).toThrow();
    });
  });

  describe('`_createBlob` method', function() {

    it('should create blob object contains exported value', function() {
      var hot = handsontable();
      var plugin = hot.getPlugin('exportFile');
      var formatter = jasmine.createSpyObj('formatter', ['export']);

      formatter.export.and.returnValue('foo;bar');
      formatter.options = {mimeType: 'foo', encoding: 'iso-8859-1'};

      var result = plugin._createBlob(formatter);

      if (!Handsontable.helper.isIE9()) {
        expect(formatter.export).toHaveBeenCalled();
        expect(result.size).toBe(7);
        expect(result.type).toBe('foo;charset=iso-8859-1');
      }
    });
  });
});
