describe('Core.getColHeader', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return `null` when the table is initialized using default values', () => {
    handsontable();

    expect(getColHeader(1)).toBe(null);
    expect(getColHeader(2, -1)).toBe(null);
    expect(getColHeader(2, -2)).toBe(null);
    expect(getColHeader(2, 0)).toBe(null);
    expect(getColHeader(2, 1)).toBe(null);
    expect(getColHeader(2, 2)).toBe(null);
  });

  it('should return the Excel-style column titles when `colHeaders` is enabled', () => {
    handsontable({
      colHeaders: true
    });

    expect(getColHeader(0)).toBe('A');
    expect(getColHeader(0)).toBe('A');
    expect(getColHeader(1)).toBe('B');
    expect(getColHeader(2)).toBe('C');
    expect(getColHeader(3)).toBe('D');
    expect(getColHeader(30)).toBe('AE');
    expect(getColHeader(300)).toBe('KO');
  });

  it('should return Excel-style column for all header levels that point to the header beyond the range when `colHeaders` is enabled', () => {
    handsontable({
      colHeaders: true
    });

    expect(getColHeader(0, -1)).toBe('A'); // the column headers nearest the dataset in the -1 to -N nomenclature
    expect(getColHeader(0, -2)).toBe('A');
    expect(getColHeader(0, -20)).toBe('A');
    expect(getColHeader(0, 0)).toBe('A'); // the column headers nearest the dataset in the 0 to N nomenclature
    expect(getColHeader(0, 1)).toBe('A');
    expect(getColHeader(0, 20)).toBe('A');
  });

  it('should return value at specified index when `colHeaders` is defined as an array', () => {
    handsontable({
      colHeaders: ['One', 'Two', 'Three', 'Four', 'Five']
    });

    expect(getColHeader(0)).toBe('One');
    expect(getColHeader(1)).toBe('Two');
    expect(getColHeader(2)).toBe('Three');
    expect(getColHeader(3)).toBe('Four');
    expect(getColHeader(4)).toBe('Five');
  });

  it('should return the Excel-style column title when the index points beyond the array length', () => {
    handsontable({
      colHeaders: ['One', 'Two', 'Three']
    });

    expect(getColHeader(0)).toBe('One');
    expect(getColHeader(1)).toBe('Two');
    expect(getColHeader(2)).toBe('Three');
    expect(getColHeader(3)).toBe('D');
    expect(getColHeader(4)).toBe('E');
    expect(getColHeader(30)).toBe('AE');
    expect(getColHeader(300)).toBe('KO');
  });

  it('should return the Excel-style column title when the value at specific index returns `undefined`', () => {
    handsontable({
      data: createSpreadsheetData(2, 10),
      colHeaders: ['One', undefined, 'Three', '', null, 'Seven', undefined, 0]
    });

    expect(getColHeader(0)).toBe('One');
    expect(getColHeader(1)).toBe('B');
    expect(getColHeader(2)).toBe('Three');
    expect(getColHeader(3)).toBe('');
    expect(getColHeader(4)).toBe(null);
    expect(getColHeader(5)).toBe('Seven');
    expect(getColHeader(6)).toBe('G');
    expect(getColHeader(7)).toBe(0);
    expect(getColHeader(8)).toBe('I');
    expect(getColHeader(9)).toBe('J');
  });

  it('should return function output when the `colHeaders` is defined as function', () => {
    handsontable({
      colHeaders(index) {
        return `col${index}`;
      }
    });

    expect(getColHeader(1)).toBe('col1');
    expect(getColHeader(2)).toBe('col2');
    expect(getColHeader(3)).toBe('col3');
  });

  it('should return the value when the `colHeaders` is defined as static value', () => {
    handsontable({
      colHeaders: 'static'
    });

    expect(getColHeader(1)).toBe('static');
    expect(getColHeader(2)).toBe('static');
    expect(getColHeader(3)).toBe('static');
    expect(getColHeader(300)).toBe('static');
  });

  it('should return raw HTML values', () => {
    handsontable({
      colHeaders(index) {
        return `<b>col${index}</b>`;
      }
    });

    expect(getColHeader(1)).toBe('<b>col1</b>');
    expect(getColHeader(2)).toBe('<b>col2</b>');
    expect(getColHeader(3)).toBe('<b>col3</b>');
  });

  it('should return as much column headers as there are columns (`startCols`) when `colHeaders` is defined as `true`', () => {
    handsontable({
      colHeaders: true,
      startCols: 3
    });

    expect(getColHeader()).toEqual(['A', 'B', 'C']);
  });

  it('should return as much column headers as there are columns (`data`) when `colHeaders` is defined as `true`', () => {
    handsontable({
      colHeaders: true,
      data: createSpreadsheetData(2, 3)
    });

    expect(getColHeader()).toEqual(['A', 'B', 'C']);
  });

  it('should return as much column headers as there are columns (`columns`) when `colHeaders` is defined as `true`', () => {
    handsontable({
      colHeaders: true,
      columns: [
        { data: '0' },
        { data: '1' },
        { data: '2' },
      ]
    });

    expect(getColHeader()).toEqual(['A', 'B', 'C']);
  });

  it('should be possible to get the header values using header level index 0 to N nomenclature', () => {
    const headers = [
      ['a1', 'a2', 'a3', 'a4'],
      ['b1', 'b2', 'b3', 'b4'],
      ['c1', 'c2', 'c3', 'c4'],
      ['d1', 'd2', 'd3', 'd4'],
    ];

    handsontable({
      data: createSpreadsheetData(2, 4),
      copyPaste: true,
      modifyColumnHeaderValue(value, visualColumnIndex, headerLevel) {
        const zeroBasedHeaderLevel = headerLevel >= 0 ? headerLevel : headerLevel + 4; // 2 number of headers

        return headers[zeroBasedHeaderLevel]?.[visualColumnIndex] ?? 'default';
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

    expect(getColHeader(0)).toBe('d1');
    expect(getColHeader(0, 0)).toBe('a1');
    expect(getColHeader(1, 1)).toBe('b2');
    expect(getColHeader(2, 2)).toBe('c3');
    expect(getColHeader(3, 3)).toBe('d4');
    expect(getColHeader(3, 4)).toBe('default'); // header level is out of range
    expect(getColHeader(4, 3)).toBe('default'); // column index is out of range
  });

  it('should be possible to get the header values using header level index -1 to -N nomenclature', () => {
    const headers = [
      ['a1', 'a2', 'a3', 'a4'],
      ['b1', 'b2', 'b3', 'b4'],
      ['c1', 'c2', 'c3', 'c4'],
      ['d1', 'd2', 'd3', 'd4'],
    ];

    handsontable({
      data: createSpreadsheetData(2, 4),
      copyPaste: true,
      modifyColumnHeaderValue(value, visualColumnIndex, headerLevel) {
        const zeroBasedHeaderLevel = headerLevel >= 0 ? headerLevel : headerLevel + 4; // 2 number of headers

        return headers[zeroBasedHeaderLevel]?.[visualColumnIndex] ?? 'default';
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

    expect(getColHeader(0)).toBe('d1');
    expect(getColHeader(0, -1)).toBe('d1');
    expect(getColHeader(1, -2)).toBe('c2');
    expect(getColHeader(2, -3)).toBe('b3');
    expect(getColHeader(3, -4)).toBe('a4');
    expect(getColHeader(3, -5)).toBe('default'); // header level is out of range
    expect(getColHeader(4, -4)).toBe('default'); // column index is out of range
  });
});
