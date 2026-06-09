import ExcelJS from 'exceljs';

describe('exportFile XLSX type — API', () => {
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

  describe('default options', () => {
    it('should have the correct default options', async() => {
      handsontable({ exportFile: { engines: { xlsx: ExcelJS } } });

      const formatter = getPlugin('exportFile')._createTypeFormatter('xlsx');

      expect(formatter.options.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(formatter.options.fileExtension).toBe('xlsx');
      expect(formatter.options.bom).toBe(false);
      expect(formatter.options.colHeaders).toBe(false);
      expect(formatter.options.rowHeaders).toBe(false);
      expect(formatter.options.exportHiddenColumns).toBe(false);
      expect(formatter.options.exportHiddenRows).toBe(false);
      expect(formatter.options.range).toEqual([]);
      expect(formatter.options.exportFormulas).toBe(false);
    });

    it('should mark the format as binary', async() => {
      handsontable({ exportFile: { engines: { xlsx: ExcelJS } } });

      const formatter = getPlugin('exportFile')._createTypeFormatter('xlsx');

      expect(formatter.constructor.BINARY).toBe(true);
    });
  });

  describe('`export()` method', () => {
    it('should return a Promise', async() => {
      handsontable({
        data: [['A1']],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const result = getPlugin('exportFile')._createTypeFormatter('xlsx').export();

      expect(result instanceof Promise).toBe(true);

      await result;
    });

    it('should resolve with a binary buffer', async() => {
      handsontable({
        data: [['A1']],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const buffer = await getPlugin('exportFile')._createTypeFormatter('xlsx').export();

      // ExcelJS returns a Buffer (Uint8Array subclass) in browser environments.
      expect(buffer instanceof Uint8Array).toBe(true);
    });
  });

  describe('engine injection', () => {
    it('should use the engine configured in the plugin-level settings', async() => {
      handsontable({
        data: [['a']],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      // No per-call engine option — reads from plugin settings.
      const buffer = await getPlugin('exportFile')._createTypeFormatter('xlsx').export();

      expect(buffer instanceof Uint8Array).toBe(true);
    });

    it('should allow a per-call engine option to override the plugin-level setting', async() => {
      handsontable({
        data: [['a']],
        // Plugin-level engine deliberately absent.
      });

      const buffer = await getPlugin('exportFile')
        ._createTypeFormatter('xlsx', { engine: ExcelJS })
        .export();

      expect(buffer instanceof Uint8Array).toBe(true);
    });

    it('should reject when no engine is configured at any level', async() => {
      handsontable({
        data: [['a']],
      });

      const formatter = getPlugin('exportFile')._createTypeFormatter('xlsx');

      await expectAsync(formatter.export()).toBeRejectedWithError(/Missing or invalid ExcelJS engine/);
    });
  });
});
