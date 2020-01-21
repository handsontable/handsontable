describe('exportFile CSV type', () => {
  const id = 'testContainer';

  /**
   * @param x
   * @param y
   */
  function data(x, y) {
    return Handsontable.helper.createSpreadsheetData(x, y);
  }

  /**
   * @param str
   */
  function countLines(str) {
    const lines = str.split('\r\n');

    return lines.length;
  }

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should export table when data source is defined as array of arrays', () => {
    handsontable({
      data: [[1, 'Foo"s', 'He\nis\nvery\nkind'], [2, 'Bar"s', 'He\nis\nvery\nconfident']],
    });

    const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

    expect(csv).toBe('\ufeff1,"Foo""s","He\nis\nvery\nkind"\r\n2,"Bar""s","He\nis\nvery\nconfident"');
  });

  it('should export table when data source is defined as array of objects', () => {
    handsontable({
      data: [
        {
          id: 1,
          name: 'Foo"s',
          desc: 'He\nis\nvery\nkind'
        },
        {
          id: 2,
          name: 'Bar"s',
          desc: 'He\nis\nvery\nconfident'
        }
      ],
      columns: [
        { data: 'id' },
        { data: 'name' },
        { data: 'desc' },
      ]
    });

    const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

    expect(csv).toBe('\ufeff1,"Foo""s","He\nis\nvery\nkind"\r\n2,"Bar""s","He\nis\nvery\nconfident"');
  });

  it('should returns CSV type formatter object', () => {
    handsontable();
    const type = getPlugin('exportFile')._createTypeFormatter('csv');

    expect(type).toBeDefined();
  });

  describe('export options', () => {
    it('should have prepared default options', () => {
      handsontable();
      const csv = getPlugin('exportFile')._createTypeFormatter('csv');

      expect(csv.options.mimeType).toBe('text/csv');
      expect(csv.options.fileExtension).toBe('csv');
      expect(csv.options.bom).toBe(true);
      expect(csv.options.columnDelimiter).toBe(',');
      expect(csv.options.rowDelimiter).toBe('\r\n');
    });
  });

  describe('`export` method', () => {
    it('should returns string with corrected lines count', () => {
      handsontable({
        data: data(10, 10),
        height: 396,
        colHeaders: false,
        rowHeaders: true
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

      expect(10).toBe(countLines(csv));
    });

    // BOM
    it('should export with default BOM', () => {
      handsontable({
        data: data(2, 2),
        height: 396,
        colHeaders: true,
        rowHeaders: true
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

      expect('\ufeffA1,B1\r\nA2,B2').toBe(csv);
    });

    it('should export without any BOM', () => {
      handsontable({
        data: data(2, 2),
        height: 396,
        colHeaders: true,
        rowHeaders: true
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv', { bom: false }).export();

      expect('A1,B1\r\nA2,B2').toBe(csv);
    });

    // columnDelimiter
    it('should export with comma as the default columnDelimiter', () => {
      handsontable({
        data: data(2, 2),
        height: 396,
        colHeaders: true,
        rowHeaders: true
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

      expect('\ufeffA1,B1\r\nA2,B2').toBe(csv);
    });

    it('should export regarding to columnDelimiter option', () => {
      handsontable({
        data: data(2, 2),
        height: 396,
        colHeaders: true,
        rowHeaders: true
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv', { columnDelimiter: ';' }).export();

      expect('\ufeffA1;B1\r\nA2;B2').toBe(csv);
    });

    // rowDelimiter
    it('should export with CRLF as the default rowDelimiter', () => {
      handsontable({
        data: data(2, 2),
        height: 396,
        colHeaders: true,
        rowHeaders: true
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

      expect('\ufeffA1,B1\r\nA2,B2').toBe(csv);
    });

    it('should export regarding to rowDelimiter option', () => {
      handsontable({
        data: data(2, 2),
        height: 396,
        colHeaders: true,
        rowHeaders: true
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv', { rowDelimiter: '\n' }).export();

      expect('\ufeffA1,B1\nA2,B2').toBe(csv);
    });

    // columnHeaders
    it('should export with `false` as the default columnHeaders', () => {
      handsontable({
        data: data(2, 2),
        height: 396,
        colHeaders: true,
        rowHeaders: true
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

      expect('\ufeffA1,B1\r\nA2,B2').toBe(csv);
    });

    it('should export regarding to columnHeaders option', () => {
      handsontable({
        data: data(2, 2),
        height: 396,
        colHeaders: true,
        rowHeaders: true
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv', { columnHeaders: true }).export();

      expect('\ufeff"A","B"\r\nA1,B1\r\nA2,B2').toBe(csv);
    });

    // rowHeaders
    it('should export with `false` as the default rowHeaders', () => {
      handsontable({
        data: data(2, 2),
        height: 396,
        colHeaders: true,
        rowHeaders: true
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

      expect('\ufeffA1,B1\r\nA2,B2').toBe(csv);
    });

    it('should export regarding to rowHeaders option', () => {
      handsontable({
        data: data(2, 2),
        height: 396,
        colHeaders: true,
        rowHeaders: true
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv', { rowHeaders: true }).export();

      expect('\ufeff1,A1,B1\r\n2,A2,B2').toBe(csv);
    });

    // exportHiddenRows
    it('should export with `false` as the default exportHiddenRows', () => {
      handsontable({
        data: data(5, 2),
        height: 396,
        colHeaders: true,
        rowHeaders: true,
        hiddenRows: {
          indicators: true,
          rows: [1, 2, 4],
        },
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

      expect('\ufeffA1,B1\r\nA4,B4').toBe(csv);
    });

    it('should export regarding to exportHiddenRows option', () => {
      handsontable({
        data: data(5, 2),
        height: 396,
        colHeaders: true,
        rowHeaders: true,
        hiddenRows: {
          indicators: true,
          rows: [1, 2, 4],
        },
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv', { exportHiddenRows: true }).export();

      expect('\ufeffA1,B1\r\nA2,B2\r\nA3,B3\r\nA4,B4\r\nA5,B5').toBe(csv);
    });

    // exportHiddenColumns
    it('should export with `false` as the default exportHiddenColumns', () => {
      handsontable({
        data: data(2, 5),
        height: 396,
        colHeaders: true,
        rowHeaders: true,
        hiddenColumns: {
          indicators: true,
          columns: [1, 2, 4],
        },
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

      expect('\ufeffA1,D1\r\nA2,D2').toBe(csv);
    });

    it('should export regarding to exportHiddenColumns option', () => {
      handsontable({
        data: data(2, 5),
        height: 396,
        colHeaders: true,
        rowHeaders: true,
        hiddenColumns: {
          indicators: true,
          columns: [1, 2, 4],
        },
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv', { exportHiddenColumns: true }).export();

      expect('\ufeffA1,B1,C1,D1,E1\r\nA2,B2,C2,D2,E2').toBe(csv);
    });

    // range
    it('should export all data by default', () => {
      handsontable({
        data: data(5, 5),
        height: 396,
        colHeaders: true,
        rowHeaders: true,
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

      expect('\ufeffA1,B1,C1,D1,E1\r\nA2,B2,C2,D2,E2\r\nA3,B3,C3,D3,E3\r\nA4,B4,C4,D4,E4\r\nA5,B5,C5,D5,E5').toBe(csv);
    });

    it('should export specified range from the middle of table', () => {
      handsontable({
        data: data(5, 5),
        height: 396,
        colHeaders: true,
        rowHeaders: true,
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv', { range: [1, 1, 3, 2] }).export();

      expect('\ufeffB2,C2\r\nB3,C3\r\nB4,C4').toBe(csv);
    });

    it('should export only specified row', () => {
      handsontable({
        data: data(5, 5),
        height: 396,
        colHeaders: true,
        rowHeaders: true,
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv', { range: [1, 0, 1, 2] }).export();

      expect('\ufeffA2,B2,C2').toBe(csv);
    });

    it('should export only specified column', () => {
      handsontable({
        data: data(5, 5),
        height: 396,
        colHeaders: true,
        rowHeaders: true,
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv', { range: [0, 1, 4, 1] }).export();

      expect('\ufeffB1\r\nB2\r\nB3\r\nB4\r\nB5').toBe(csv);
    });

    it('should export only existing data if "range" has coordinates defined out of scope', () => {
      handsontable({
        data: data(5, 5),
        height: 396,
        colHeaders: true,
        rowHeaders: true,
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv', { range: [4, 3, 40, 15] }).export();

      expect('\ufeffD5,E5').toBe(csv);
    });
  });

  describe('`_escapeCell` method', () => {
    it('should not escape value if it is not necessary', () => {
      handsontable();
      const csv = getPlugin('exportFile')._createTypeFormatter('csv');

      expect(csv._escapeCell('')).toBe('');
      expect(csv._escapeCell('12345')).toBe('12345');
      expect(csv._escapeCell(null)).toBe('');
      expect(csv._escapeCell(void 0)).toBe('');
      expect(csv._escapeCell({})).toBe('[object Object]');
    });

    it('should escape value if it includes Carriage Return (CR)', () => {
      handsontable();
      const csv = getPlugin('exportFile')._createTypeFormatter('csv');

      expect(csv._escapeCell('1234\r22')).toBe('"1234\r22"');
    });

    it('should escape value if it includes Double Quote (")', () => {
      handsontable();
      const csv = getPlugin('exportFile')._createTypeFormatter('csv');

      expect(csv._escapeCell('123"42')).toBe('"123""42"');
    });

    it('should escape value if it includes Line Feed (LF)', () => {
      handsontable();
      const csv = getPlugin('exportFile')._createTypeFormatter('csv');

      expect(csv._escapeCell('123\n4')).toBe('"123\n4"');
    });

    it('should escape value if it includes char defined in `columnDelimiter` option', () => {
      handsontable();
      let csv = getPlugin('exportFile')._createTypeFormatter('csv', { columnDelimiter: ',' });

      expect(csv._escapeCell('12,4')).toBe('"12,4"');

      csv = getPlugin('exportFile')._createTypeFormatter('csv', { columnDelimiter: ';' });

      expect(csv._escapeCell('12;4')).toBe('"12;4"');
    });
  });
});
