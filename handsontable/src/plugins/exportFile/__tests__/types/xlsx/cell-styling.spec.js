import ExcelJS from 'exceljs';

describe('exportFile XLSX type — cell styling', () => {
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

  describe('cell alignment', () => {
    it('should export htLeft className as horizontal left alignment', async() => {
      handsontable({
        data: [['text']],
        cell: [{ row: 0, col: 0, className: 'htLeft' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).alignment).toEqual(
        jasmine.objectContaining({ horizontal: 'left' })
      );
    });

    it('should export htCenter className as horizontal center alignment', async() => {
      handsontable({
        data: [['text']],
        cell: [{ row: 0, col: 0, className: 'htCenter' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).alignment).toEqual(
        jasmine.objectContaining({ horizontal: 'center' })
      );
    });

    it('should export htRight className as horizontal right alignment', async() => {
      handsontable({
        data: [['text']],
        cell: [{ row: 0, col: 0, className: 'htRight' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).alignment).toEqual(
        jasmine.objectContaining({ horizontal: 'right' })
      );
    });

    it('should export htJustify className as horizontal justify alignment', async() => {
      handsontable({
        data: [['text']],
        cell: [{ row: 0, col: 0, className: 'htJustify' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).alignment).toEqual(
        jasmine.objectContaining({ horizontal: 'justify' })
      );
    });

    it('should export htTop className as vertical top alignment', async() => {
      handsontable({
        data: [['text']],
        cell: [{ row: 0, col: 0, className: 'htTop' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).alignment).toEqual(
        jasmine.objectContaining({ vertical: 'top' })
      );
    });

    it('should export htMiddle className as vertical middle alignment', async() => {
      handsontable({
        data: [['text']],
        cell: [{ row: 0, col: 0, className: 'htMiddle' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).alignment).toEqual(
        jasmine.objectContaining({ vertical: 'middle' })
      );
    });

    it('should export htBottom className as vertical bottom alignment', async() => {
      handsontable({
        data: [['text']],
        cell: [{ row: 0, col: 0, className: 'htBottom' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).alignment).toEqual(
        jasmine.objectContaining({ vertical: 'bottom' })
      );
    });

    it('should export combined horizontal and vertical alignment', async() => {
      handsontable({
        data: [['text']],
        cell: [{ row: 0, col: 0, className: 'htRight htTop' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).alignment).toEqual({
        horizontal: 'right',
        vertical: 'top',
      });
    });

    it('should not set alignment when no alignment className is present', async() => {
      handsontable({
        data: [['text']],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).alignment).toBeUndefined();
    });
  });

  describe('cell borders', () => {
    it('should export a top border with the correct ARGB color', async() => {
      handsontable({
        data: [['text']],
        customBorders: [{
          row: 0,
          col: 0,
          top: { width: 1, color: '#FF0000' },
        }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();
      const { border } = ws.getRow(1).getCell(1);

      expect(border.top).toEqual({ style: 'thin', color: { argb: 'FFFF0000' } });
      expect(border.bottom).toBeUndefined();
      expect(border.left).toBeUndefined();
      expect(border.right).toBeUndefined();
    });

    it('should export all four borders with their respective colors', async() => {
      handsontable({
        data: [['text']],
        customBorders: [{
          row: 0,
          col: 0,
          top: { width: 1, color: '#FF0000' },
          bottom: { width: 1, color: '#00FF00' },
          left: { width: 1, color: '#0000FF' },
          right: { width: 1, color: '#AABBCC' },
        }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();
      const { border } = ws.getRow(1).getCell(1);

      expect(border.top).toEqual({ style: 'thin', color: { argb: 'FFFF0000' } });
      expect(border.bottom).toEqual({ style: 'thin', color: { argb: 'FF00FF00' } });
      expect(border.left).toEqual({ style: 'thin', color: { argb: 'FF0000FF' } });
      expect(border.right).toEqual({ style: 'thin', color: { argb: 'FFAABBCC' } });
    });

    it('should not set a border when no custom border is defined', async() => {
      handsontable({
        data: [['text']],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).border).toBeUndefined();
    });

    it('should convert a 3-character hex color to ARGB', async() => {
      handsontable({
        data: [['text']],
        customBorders: [{
          row: 0,
          col: 0,
          top: { width: 1, color: '#F0A' },
        }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      // #F0A expands to #FF00AA → FFFF00AA
      expect(ws.getRow(1).getCell(1).border.top.color.argb).toBe('FFFF00AA');
    });

    it('should map border width 1 to the "thin" Excel style', async() => {
      handsontable({
        data: [['text']],
        customBorders: [{
          row: 0,
          col: 0,
          top: { width: 1, color: '#000000' },
        }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).border.top.style).toBe('thin');
    });

    it('should map border width 2 to the "medium" Excel style', async() => {
      handsontable({
        data: [['text']],
        customBorders: [{
          row: 0,
          col: 0,
          top: { width: 2, color: '#000000' },
        }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).border.top.style).toBe('medium');
    });

    it('should map border width 3 to the "thick" Excel style', async() => {
      handsontable({
        data: [['text']],
        customBorders: [{
          row: 0,
          col: 0,
          top: { width: 3, color: '#000000' },
        }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).border.top.style).toBe('thick');
    });

    it('should map border width 4 (or greater) to the "thick" Excel style', async() => {
      handsontable({
        data: [['text']],
        customBorders: [{
          row: 0,
          col: 0,
          top: { width: 4, color: '#000000' },
        }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).border.top.style).toBe('thick');
    });

    it('should apply different border widths on different sides', async() => {
      handsontable({
        data: [['text']],
        customBorders: [{
          row: 0,
          col: 0,
          top: { width: 1, color: '#FF0000' },
          right: { width: 2, color: '#00FF00' },
          bottom: { width: 3, color: '#0000FF' },
        }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();
      const { border } = ws.getRow(1).getCell(1);

      expect(border.top.style).toBe('thin');
      expect(border.right.style).toBe('medium');
      expect(border.bottom.style).toBe('thick');
    });
  });

  describe('cell font styling', () => {
    it('should export bold font from a CSS class', async() => {
      const style = document.createElement('style');

      style.textContent = '.test-bold { font-weight: bold; }';
      document.head.appendChild(style);

      handsontable({
        data: [['Bold text']],
        cell: [{ row: 0, col: 0, className: 'test-bold' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      document.head.removeChild(style);

      expect(ws.getRow(1).getCell(1).font).toEqual(jasmine.objectContaining({ bold: true }));
    });

    it('should export italic font from a CSS class', async() => {
      const style = document.createElement('style');

      style.textContent = '.test-italic { font-style: italic; }';
      document.head.appendChild(style);

      handsontable({
        data: [['Italic text']],
        cell: [{ row: 0, col: 0, className: 'test-italic' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      document.head.removeChild(style);

      expect(ws.getRow(1).getCell(1).font).toEqual(jasmine.objectContaining({ italic: true }));
    });

    it('should export underline from a CSS class', async() => {
      const style = document.createElement('style');

      style.textContent = '.test-underline { text-decoration: underline; }';
      document.head.appendChild(style);

      handsontable({
        data: [['Underline text']],
        cell: [{ row: 0, col: 0, className: 'test-underline' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      document.head.removeChild(style);

      // ExcelJS stores underline as a string ('single') or boolean after round-trip.
      expect(ws.getRow(1).getCell(1).font?.underline).toBeTruthy();
    });

    it('should export font color from a CSS class', async() => {
      const style = document.createElement('style');

      style.textContent = '.test-red { color: #FF0000 !important; }';
      document.head.appendChild(style);

      handsontable({
        data: [['Red text']],
        cell: [{ row: 0, col: 0, className: 'test-red' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      document.head.removeChild(style);

      expect(ws.getRow(1).getCell(1).font?.color?.argb).toBe('FFFF0000');
    });

    it('should export combined bold, italic, and color from a CSS class', async() => {
      const style = document.createElement('style');

      style.textContent = '.test-styled { font-weight: bold; font-style: italic; color: #0000FF !important; }';
      document.head.appendChild(style);

      handsontable({
        data: [['styled']],
        cell: [{ row: 0, col: 0, className: 'test-styled' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      document.head.removeChild(style);

      const { font } = ws.getRow(1).getCell(1);

      expect(font.bold).toBe(true);
      expect(font.italic).toBe(true);
      expect(font.color.argb).toBe('FF0000FF');
    });

    it('should not set font when no className is set', async() => {
      handsontable({
        data: [['plain']],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).font).toBeUndefined();
    });
  });

  describe('cell background color', () => {
    it('should export a solid fill from a CSS class', async() => {
      const style = document.createElement('style');

      style.textContent = '.test-bg-yellow { background-color: #FFCC00 !important; }';
      document.head.appendChild(style);

      handsontable({
        data: [['highlighted']],
        cell: [{ row: 0, col: 0, className: 'test-bg-yellow' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      document.head.removeChild(style);

      const { fill } = ws.getRow(1).getCell(1);

      expect(fill.type).toBe('pattern');
      expect(fill.pattern).toBe('solid');
      expect(fill.fgColor.argb).toBe('FFFFCC00');
    });

    it('should not set fill when no className is set', async() => {
      handsontable({
        data: [['plain']],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).fill).toBeUndefined();
    });

    it('should read background color from a CSS class and export it as a fill', async() => {
      const style = document.createElement('style');

      style.textContent = '.test-bg-red { background-color: #FF0000 !important; }';
      document.head.appendChild(style);

      handsontable({
        data: [['colored']],
        cell: [{ row: 0, col: 0, className: 'test-bg-red' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();
      const { fill } = ws.getRow(1).getCell(1);

      document.head.removeChild(style);

      expect(fill?.type).toBe('pattern');
      expect(fill?.pattern).toBe('solid');
      expect(fill?.fgColor?.argb).toBe('FFFF0000');
    });

    it('should not set fill when a CSS class sets only font properties (no background)', async() => {
      const style = document.createElement('style');

      style.textContent = '.test-font-only { font-weight: bold; }';
      document.head.appendChild(style);

      handsontable({
        data: [['bold text']],
        cell: [{ row: 0, col: 0, className: 'test-font-only' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      document.head.removeChild(style);

      // ExcelJS may return { type: 'pattern', pattern: 'none' } (its "no fill" sentinel) when
      // other cell styles (e.g. font) are applied. Neither that nor undefined represents an
      // explicit background color, so we assert that no fill color was written.
      expect(ws.getRow(1).getCell(1).fill?.fgColor).toBeUndefined();
    });

    it('should not set fill when a CSS class sets only font color (no background)', async() => {
      const style = document.createElement('style');

      style.textContent = '.test-font-color { color: #B71C1C !important; }';
      document.head.appendChild(style);

      handsontable({
        data: [['red text']],
        cell: [{ row: 0, col: 0, className: 'test-font-color' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      document.head.removeChild(style);

      // Same reasoning as above — no explicit fill color should be present.
      expect(ws.getRow(1).getCell(1).fill?.fgColor).toBeUndefined();
    });

    it('should pick up a CSS background-color change between two exports of the same className', async() => {
      const style = document.createElement('style');

      style.textContent = '.test-cache-invalidation { background-color: #FF0000 !important; }';
      document.head.appendChild(style);

      handsontable({
        data: [['cell']],
        cell: [{ row: 0, col: 0, className: 'test-cache-invalidation' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws1 = await parseXlsx();

      expect(ws1.getRow(1).getCell(1).fill?.fgColor?.argb).toBe('FFFF0000');

      // Change the CSS rule — same className, different color.
      style.textContent = '.test-cache-invalidation { background-color: #0000FF !important; }';

      const ws2 = await parseXlsx();

      document.head.removeChild(style);

      expect(ws2.getRow(1).getCell(1).fill?.fgColor?.argb).toBe('FF0000FF');
    });
  });

  describe('read-only cells', () => {
    it('should apply the default light gray background to a read-only cell', async() => {
      handsontable({
        data: [['locked']],
        cell: [{ row: 0, col: 0, readOnly: true }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();
      const { fill } = ws.getRow(1).getCell(1);

      expect(fill.type).toBe('pattern');
      expect(fill.pattern).toBe('solid');
      // Default read-only background is #F0F0F0
      expect(fill.fgColor.argb).toBe('FFF0F0F0');
    });

    it('should apply the default dimmed text color to a read-only cell', async() => {
      handsontable({
        data: [['locked']],
        cell: [{ row: 0, col: 0, readOnly: true }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      // Default read-only text color is #808080
      expect(ws.getRow(1).getCell(1).font?.color?.argb).toBe('FF808080');
    });

    it('should prefer an explicit CSS background color over the read-only default', async() => {
      const style = document.createElement('style');

      style.textContent = '.test-bg-gold { background-color: #FFD700 !important; }';
      document.head.appendChild(style);

      handsontable({
        data: [['locked']],
        cell: [{ row: 0, col: 0, readOnly: true, className: 'test-bg-gold' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      document.head.removeChild(style);

      expect(ws.getRow(1).getCell(1).fill?.fgColor?.argb).toBe('FFFFD700');
    });

    it('should prefer an explicit CSS font color over the read-only default', async() => {
      const style = document.createElement('style');

      // Use the same selector specificity as `.handsontable td.htDimmed` so that
      // source order (our stylesheet loaded last) decides the winner.
      style.textContent = '.handsontable td.test-blue { color: #0000FF !important; }';
      document.head.appendChild(style);

      handsontable({
        data: [['locked']],
        cell: [{ row: 0, col: 0, readOnly: true, className: 'test-blue' }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      document.head.removeChild(style);

      expect(ws.getRow(1).getCell(1).font?.color?.argb).toBe('FF0000FF');
    });

    it('should not apply read-only styling to a non-read-only cell', async() => {
      handsontable({
        data: [['editable']],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).fill).toBeUndefined();
      expect(ws.getRow(1).getCell(1).font).toBeUndefined();
    });

    it('should protect the worksheet and unlock non-read-only cells when a read-only cell exists', async() => {
      handsontable({
        data: [['locked', 'editable']],
        cell: [{ row: 0, col: 0, readOnly: true }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      // Excel's default is locked=true, so ExcelJS omits the protection record for locked cells.
      // Only cells explicitly set to locked=false carry a record after the round-trip.
      expect(ws.getRow(1).getCell(1).protection).toBeUndefined(); // read-only → locked (default)
      expect(ws.getRow(1).getCell(2).protection?.locked).toBe(false); // editable → unlocked
      expect(ws.sheetProtection?.sheet).toBe(true);
    });

    it('should not protect the worksheet when no cells are read-only', async() => {
      handsontable({
        data: [['editable']],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).protection).toBeUndefined();
      expect(ws.sheetProtection).toBeUndefined();
    });

    it('should keep non-read-only cells unlocked when the worksheet is protected', async() => {
      handsontable({
        data: [['a', 'b', 'c']],
        cell: [{ row: 0, col: 1, readOnly: true }],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).protection?.locked).toBe(false); // editable
      expect(ws.getRow(1).getCell(2).protection).toBeUndefined(); // read-only → locked (default)
      expect(ws.getRow(1).getCell(3).protection?.locked).toBe(false); // editable
      expect(ws.sheetProtection?.sheet).toBe(true);
    });

    it('should not protect the worksheet when ColumnSummary is active and exportFormulas is false', async() => {
      // readOnly is set on both the destination cell and its label cell (the common
      // demo pattern). Neither should translate into Excel sheet protection when the
      // summary is exported as a static value — the readOnly flag exists only to
      // prevent in-grid editing in Handsontable.
      handsontable({
        data: [['Alice', 100], ['Bob', 200], ['TOTAL', null]],
        columns: [{ type: 'text' }, { type: 'numeric' }],
        columnSummary: [{
          sourceColumn: 1,
          destinationRow: 2,
          destinationColumn: 1,
          type: 'sum',
          forceNumeric: true,
        }],
        cell: [
          { row: 2, col: 0, readOnly: true }, // label cell
          { row: 2, col: 1, readOnly: true }, // destination cell
        ],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx();

      expect(ws.sheetProtection).toBeUndefined();
    });

    it('should not protect the worksheet when ColumnSummary destinations are exported as live formulas', async() => {
      handsontable({
        data: [['Alice', 100], ['Bob', 200], ['TOTAL', null]],
        columns: [{ type: 'text' }, { type: 'numeric' }],
        columnSummary: [{
          sourceColumn: 1,
          destinationRow: 2,
          destinationColumn: 1,
          type: 'sum',
          forceNumeric: true,
        }],
        cell: [
          { row: 2, col: 0, readOnly: true }, // label cell
          { row: 2, col: 1, readOnly: true }, // destination cell
        ],
        exportFile: { engines: { xlsx: ExcelJS } },
      });

      const ws = await parseXlsx({ exportFormulas: true });

      // ColumnSummary is active → protection is never applied, regardless of exportFormulas.
      expect(ws.sheetProtection).toBeUndefined();
    });
  });
});
