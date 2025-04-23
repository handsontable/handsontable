describe('exportFile CSV type', () => {
  const id = 'testContainer';

  /**
   * @param x
   * @param y
   */
  function data(x, y) {
    return createSpreadsheetData(x, y);
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

  it('should export table when data source is defined as array of arrays', async() => {
    handsontable({
      data: [[1, 'Foo"s', 'He\nis\nvery\nkind'], [2, 'Bar"s', 'He\nis\nvery\nconfident']],
    });

    const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

    expect(csv).toBe('\ufeff1,"Foo""s","He\nis\nvery\nkind"\r\n2,"Bar""s","He\nis\nvery\nconfident"');
  });

  it('should export table when data source is defined as array of objects', async() => {
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

  it('should return CSV type formatter object', async() => {
    handsontable();
    const type = getPlugin('exportFile')._createTypeFormatter('csv');

    expect(type).toBeDefined();
  });

  describe('export options', () => {
    it('should have prepared default options', async() => {
      handsontable();
      const csv = getPlugin('exportFile')._createTypeFormatter('csv');

      expect(csv.options.mimeType).toBe('text/csv');
      expect(csv.options.fileExtension).toBe('csv');
      expect(csv.options.bom).toBe(true);
      expect(csv.options.columnDelimiter).toBe(',');
      expect(csv.options.rowDelimiter).toBe('\r\n');
      expect(csv.options.sanitizeValues).toBe(false);
    });
  });

  describe('`export` method', () => {
    it('should return string with corrected lines count', async() => {
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
    it('should export with default BOM', async() => {
      handsontable({
        data: data(2, 2),
        height: 396,
        colHeaders: true,
        rowHeaders: true
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

      expect('\ufeffA1,B1\r\nA2,B2').toBe(csv);
    });

    it('should export without any BOM', async() => {
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
    it('should export with comma as the default columnDelimiter', async() => {
      handsontable({
        data: data(2, 2),
        height: 396,
        colHeaders: true,
        rowHeaders: true
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

      expect('\ufeffA1,B1\r\nA2,B2').toBe(csv);
    });

    it('should export regarding to columnDelimiter option', async() => {
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
    it('should export with CRLF as the default rowDelimiter', async() => {
      handsontable({
        data: data(2, 2),
        height: 396,
        colHeaders: true,
        rowHeaders: true
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

      expect('\ufeffA1,B1\r\nA2,B2').toBe(csv);
    });

    it('should export regarding to rowDelimiter option', async() => {
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
    it('should export with `false` as the default columnHeaders', async() => {
      handsontable({
        data: data(2, 2),
        height: 396,
        colHeaders: true,
        rowHeaders: true
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

      expect('\ufeffA1,B1\r\nA2,B2').toBe(csv);
    });

    it('should export regarding to columnHeaders option', async() => {
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
    it('should export with `false` as the default rowHeaders', async() => {
      handsontable({
        data: data(2, 2),
        height: 396,
        colHeaders: true,
        rowHeaders: true
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

      expect('\ufeffA1,B1\r\nA2,B2').toBe(csv);
    });

    it('should export regarding to rowHeaders option', async() => {
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
    it('should export with `false` as the default exportHiddenRows', async() => {
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

    it('should export regarding to exportHiddenRows option', async() => {
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
    it('should export with `false` as the default exportHiddenColumns', async() => {
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

    it('should export regarding to exportHiddenColumns option', async() => {
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
    it('should export all data by default', async() => {
      handsontable({
        data: data(5, 5),
        height: 396,
        colHeaders: true,
        rowHeaders: true,
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

      expect('\ufeffA1,B1,C1,D1,E1\r\nA2,B2,C2,D2,E2\r\nA3,B3,C3,D3,E3\r\nA4,B4,C4,D4,E4\r\nA5,B5,C5,D5,E5').toBe(csv);
    });

    it('should export specified range from the middle of table', async() => {
      handsontable({
        data: data(5, 5),
        height: 396,
        colHeaders: true,
        rowHeaders: true,
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv', { range: [1, 1, 3, 2] }).export();

      expect('\ufeffB2,C2\r\nB3,C3\r\nB4,C4').toBe(csv);
    });

    it('should export only specified row', async() => {
      handsontable({
        data: data(5, 5),
        height: 396,
        colHeaders: true,
        rowHeaders: true,
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv', { range: [1, 0, 1, 2] }).export();

      expect('\ufeffA2,B2,C2').toBe(csv);
    });

    it('should export only specified column', async() => {
      handsontable({
        data: data(5, 5),
        height: 396,
        colHeaders: true,
        rowHeaders: true,
      });

      const csv = getPlugin('exportFile')._createTypeFormatter('csv', { range: [0, 1, 4, 1] }).export();

      expect('\ufeffB1\r\nB2\r\nB3\r\nB4\r\nB5').toBe(csv);
    });

    it('should export only existing data if "range" has coordinates defined out of scope', async() => {
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
    it('should not escape value if it is not necessary', async() => {
      handsontable();
      const csv = getPlugin('exportFile')._createTypeFormatter('csv');

      expect(csv['#escapeCell']('')).toBe('');
      expect(csv['#escapeCell']('12345')).toBe('12345');
      expect(csv['#escapeCell'](null)).toBe('');
      expect(csv['#escapeCell'](undefined)).toBe('');
      expect(csv['#escapeCell']({})).toBe('[object Object]');
    });

    it('should escape value if it includes Carriage Return (CR)', async() => {
      handsontable();
      const csv = getPlugin('exportFile')._createTypeFormatter('csv');

      expect(csv['#escapeCell']('1234\r22')).toBe('"1234\r22"');
    });

    it('should escape value if it includes Double Quote (")', async() => {
      handsontable();
      const csv = getPlugin('exportFile')._createTypeFormatter('csv');

      expect(csv['#escapeCell']('123"42')).toBe('"123""42"');
    });

    it('should escape value if it includes Line Feed (LF)', async() => {
      handsontable();
      const csv = getPlugin('exportFile')._createTypeFormatter('csv');

      expect(csv['#escapeCell']('123\n4')).toBe('"123\n4"');
    });

    it('should escape value if it includes char defined in `columnDelimiter` option', async() => {
      handsontable();
      let csv = getPlugin('exportFile')._createTypeFormatter('csv', { columnDelimiter: ',' });

      expect(csv['#escapeCell']('12,4')).toBe('"12,4"');

      csv = getPlugin('exportFile')._createTypeFormatter('csv', { columnDelimiter: ';' });

      expect(csv['#escapeCell']('12;4')).toBe('"12;4"');
    });

    describe('when `sanitizeValues` option is', () => {
      it('set to `true`, should sanitize strings starting with =', async() => {
        handsontable({
          data: [[42, '=A1+B1', '=A2+B2']],
        });

        const csv = getPlugin('exportFile')._createTypeFormatter('csv', { sanitizeValues: true }).export();

        expect(csv).toBe('\ufeff"42","\'=A1+B1","\'=A2+B2"');
      });

      it('set to `true`, should sanitize strings starting with +', async() => {
        handsontable({
          data: [['+abc', '+42']],
        });

        const csv = getPlugin('exportFile')._createTypeFormatter('csv', { sanitizeValues: true }).export();

        expect(csv).toBe('\ufeff"\'+abc","\'+42"');
      });

      it('set to `true`, should sanitize strings starting with -', async() => {
        handsontable({
          data: [['-abc', '-42']],
        });

        const csv = getPlugin('exportFile')._createTypeFormatter('csv', { sanitizeValues: true }).export();

        expect(csv).toBe('\ufeff"\'-abc","\'-42"');
      });

      it('set to `true`, should sanitize strings starting with @', async() => {
        handsontable({
          data: [['@abc', '@42']],
        });

        const csv = getPlugin('exportFile')._createTypeFormatter('csv', { sanitizeValues: true }).export();

        expect(csv).toBe('\ufeff"\'@abc","\'@42"');
      });

      it('set to `true`, should sanitize strings starting with TAB (0x09)', async() => {
        handsontable({
          data: [['\tabc', '\t42']],
        });

        const csv = getPlugin('exportFile')._createTypeFormatter('csv', { sanitizeValues: true }).export();

        expect(csv).toBe('\ufeff"\'\tabc","\'\t42"');
      });

      it('set to `true`, should sanitize strings starting with carriage return (0x0D)', async() => {
        handsontable({
          data: [['\rabc', '\r42']],
        });

        const csv = getPlugin('exportFile')._createTypeFormatter('csv', { sanitizeValues: true }).export();

        expect(csv).toBe('\ufeff"\'\rabc","\'\r42"');
      });

      it('set to `true`, should sanitize column headers', async() => {
        handsontable({
          data: [['1', '2']],
          colHeaders: ['====', '++++'],
        });

        const csv = getPlugin('exportFile')
          ._createTypeFormatter('csv', { sanitizeValues: true, columnHeaders: true })
          .export();

        expect(csv).toBe('\ufeff"\'====","\'++++"\r\n"1","2"');
      });

      it('set to `true`, should sanitize row headers', async() => {
        handsontable({
          data: [['1']],
          rowHeaders: ['==='],
        });

        const csv = getPlugin('exportFile')
          ._createTypeFormatter('csv', { sanitizeValues: true, rowHeaders: true })
          .export();

        expect(csv).toBe('\ufeff"\'===","1"');
      });

      it('set to a regex, should sanitize all values that match the regex', async() => {
        handsontable({
          data: [[42, '=A1+B1', '=WEBSERVICE("https://handsontable.com")']],
        });

        const sanitizeRegex = /WEBSERVICE/;

        const csv = getPlugin('exportFile')._createTypeFormatter('csv', { sanitizeValues: sanitizeRegex }).export();

        expect(csv).toBe('\ufeff"42","=A1+B1","\'=WEBSERVICE(""https://handsontable.com"")"');
      });

      it('set to a function, should sanitize values using the function', async() => {
        handsontable({
          data: [[42, '=A1+B1', 'abba', 'abfooba']],
        });

        const sanitizeFoo = jasmine.createSpy('sanitizeFoo').and.callFake((value) => {
          if (value.includes('foo')) {
            return 'BAR';
          }

          return value;
        });

        const csv = getPlugin('exportFile')._createTypeFormatter('csv', { sanitizeValues: sanitizeFoo }).export();

        expect(sanitizeFoo).toHaveBeenCalledTimes(4);
        expect(csv).toBe('\ufeff"42","=A1+B1","abba","BAR"');
      });

      it('not provided, should not sanitize values', async() => {
        handsontable({
          data: [['=A1+B1', '=A2+B2']],
        });

        const csv = getPlugin('exportFile')._createTypeFormatter('csv').export();

        expect(csv).toBe('\ufeff=A1+B1,=A2+B2');
      });
    });
  });
});
