import { instanceToHTML, _dataToHTML, htmlToGridSettings } from '../parseTable';
import Handsontable from '../../index';
import { registerCellType, TextCellType } from '../../cellTypes';

registerCellType(TextCellType);

describe('instanceToHTML', () => {
  it('should convert clear instance into HTML table', () => {
    const hot = new Handsontable(document.createElement('div'), {});

    expect(instanceToHTML(hot)).toBe([
      '<table><tbody>',
      '<tr><td ></td><td ></td><td ></td><td ></td><td ></td></tr>',
      '<tr><td ></td><td ></td><td ></td><td ></td><td ></td></tr>',
      '<tr><td ></td><td ></td><td ></td><td ></td><td ></td></tr>',
      '<tr><td ></td><td ></td><td ></td><td ></td><td ></td></tr>',
      '<tr><td ></td><td ></td><td ></td><td ></td><td ></td></tr>',
      '</tbody></table>',
    ].join(''));
  });

  it('should convert column headers into HTML table', () => {
    const hot = new Handsontable(document.createElement('div'), {
      colHeaders: true,
      data: [
        ['A1', 'B1'],
        ['A2', 'B2'],
      ],
    });

    expect(instanceToHTML(hot)).toBe([
      '<table><thead>',
      '<tr><th>A</th><th>B</th></tr>',
      '</thead><tbody>',
      '<tr><td >A1</td><td >B1</td></tr>',
      '<tr><td >A2</td><td >B2</td></tr>',
      '</tbody></table>',
    ].join(''));
  });

  it('should convert row headers into HTML table', () => {
    const hot = new Handsontable(document.createElement('div'), {
      rowHeaders: true,
      data: [
        ['A1', 'B1'],
        ['A2', 'B2'],
      ],
    });

    expect(instanceToHTML(hot)).toBe([
      '<table><tbody>',
      '<tr><th>1</th><td >A1</td><td >B1</td></tr>',
      '<tr><th>2</th><td >A2</td><td >B2</td></tr>',
      '</tbody></table>',
    ].join(''));
  });

  it('should convert column and rows headers into HTML table', () => {
    const hot = new Handsontable(document.createElement('div'), {
      colHeaders: true,
      rowHeaders: true,
      data: [
        ['A1', 'B1'],
        ['A2', 'B2'],
      ],
    });

    expect(instanceToHTML(hot)).toBe([
      '<table><thead>',
      '<tr><th></th><th>A</th><th>B</th></tr>',
      '</thead><tbody>',
      '<tr><th>1</th><td >A1</td><td >B1</td></tr>',
      '<tr><th>2</th><td >A2</td><td >B2</td></tr>',
      '</tbody></table>',
    ].join(''));
  });

  it('should convert merged cells into HTML table', () => {
    const hot = new Handsontable(document.createElement('div'), {
      colHeaders: true,
      rowHeaders: true,
      data: [
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
        ['A3', 'B3', 'C3'],
      ],
      mergeCells: [
        { row: 0, col: 0, colspan: 2, rowspan: 3 }
      ],
    });

    expect(instanceToHTML(hot)).toBe([
      '<table><thead>',
      '<tr><th></th><th>A</th><th>B</th><th>C</th></tr>',
      '</thead><tbody>',
      '<tr><th>1</th><td rowspan="3" colspan="2">A1</td><td >C1</td></tr>',
      '<tr><th>2</th><td >C2</td></tr>',
      '<tr><th>3</th><td >C3</td></tr>',
      '</tbody></table>',
    ].join(''));
  });
});

describe('_dataToHTML', () => {
  it('should parse two-dimensional array into HTML table', () => {
    const data = [
      ['A1', 'B1', 'C1'],
      ['A2', 'B2', 'C2'],
      ['A3', 'B3', 'C3'],
    ];

    expect(_dataToHTML(data)).toBe([
      '<table><tbody>',
      '<tr><td>A1</td><td>B1</td><td>C1</td></tr>',
      '<tr><td>A2</td><td>B2</td><td>C2</td></tr>',
      '<tr><td>A3</td><td>B3</td><td>C3</td></tr>',
      '</tbody></table>',
    ].join(''));
  });

  it('should escape HTML tags into entities', () => {
    const data = [
      ['<div class="test">A1</div>'],
    ];

    expect(_dataToHTML(data)).toBe([
      '<table><tbody>',
      '<tr><td>&lt;div&nbsp;class="test"&gt;A1&lt;/div&gt;</td></tr>',
      '</tbody></table>',
    ].join(''));
  });
});

describe('htmlToGridSettings', () => {
  describe('element validation', () => {
    it('should properly exit if passed element is undefined', () => {
      const config = htmlToGridSettings();

      expect(config).toBeUndefined();
    });

    it('should properly exit if passed element is an empty string', () => {
      const config = htmlToGridSettings('');

      expect(config).toBeUndefined();
    });

    it('should properly exit if passed element does not contain table element', () => {
      const elementToTest = [
        '<div>',
        '<p>',
        '<span>span element</span>',
        '</p>',
        '</div>',
      ].join('');
      const config = htmlToGridSettings(elementToTest);

      expect(config).toBeUndefined();
    });
  });

  it('should parse data from HTML table', () => {
    const htmlToParse = [
      '<table><tbody>',
      '<tr><td>A3</td><td>B3</td><td>C3</td></tr>',
      '<tr><td>A4</td><td>B4</td><td>C4</td></tr>',
      '<tr><td>A5</td><td>B5</td><td>C5</td></tr>',
      '<tr><td>A6</td><td>B6</td><td>C6</td></tr>',
      '</tbody></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    expect(config.data.toString()).toBe('A3,B3,C3,A4,B4,C4,A5,B5,C5,A6,B6,C6');
  });

  it('should parse an empty HTML table to an empty config object', () => {
    const htmlToParse = [
      '<table><tbody>',
      '</tbody></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    expect(config).toEqual({});
  });

  it('should parse data with special characters', () => {
    const htmlToParse = [
      '<table><tbody>',
      '<tr><td>£§!@#$%^&*()-_=+[{]};:\'\\"|,&lt;.&gt;/?©</td></tr>',
      '</tbody></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    expect(config.data.toString()).toBe('£§!@#$%^&*()-_=+[{]};:\'\\"|,<.>/?©');
  });

  it('should parse data without unescaped HTML tags', () => {
    const htmlToParse = [
      '<table><tbody>',
      '<tr><td>1<span class="abc">   </span>2</td></tr>',
      '</tbody></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    expect(config.data.toString()).toBe('1   2');
  });

  it('should parse data with HTML-like content', () => {
    const htmlToParse = [
      '<table><tbody>',
      '<tr>' +
        '<td>&lt;div class="test"&gt;A&lt;/div&gt;</td>' +
        '<td>&lt;script&gt;var b = 1 && 2 &lt;&lt; 1&lt;/script&gt;</td>' +
      '</tr>',
      '</tbody></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    expect(config.data.toString()).toBe('<div class="test">A</div>,<script>var b = 1 && 2 << 1</script>');
  });

  it('should parse data with Unicode characters (emoji)', () => {
    const htmlToParse = [
      '<table><tbody>',
      '<tr><td>☺️</td><td>✍️</td><td>☀️</td><td>❤️</td><td>✌️</td></tr>',
      '</tbody></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    expect(config.data.toString()).toBe('☺️,✍️,☀️,❤️,✌️');
  });

  it('should parse headers from HTML table', () => {
    const htmlToParse = [
      '<table><thead>',
      '<tr><th></th><th>A</th><th>B</th><th>C</th></tr>',
      '</thead><tbody>',
      '<tr><th>3</th><td>A3</td><td>B3</td><td>C3</td></tr>',
      '<tr><th>4</th><td>A4</td><td>B4</td><td>C4</td></tr>',
      '<tr><th>5</th><td>A5</td><td>B5</td><td>C5</td></tr>',
      '</tbody></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    expect(config.colHeaders.toString()).toBe('A,B,C');
    expect(config.rowHeaders.toString()).toBe('3,4,5');
  });

  it('should parse fixed rows from HTML table', () => {
    const htmlToParse = [
      '<table><thead>',
      '<tr><td>A1</td><td>B1</td><td>C1</td></tr>',
      '<tr><td>A2</td><td>B2</td><td>C2</td></tr>',
      '</thead><tbody>',
      '<tr><td>A3</td><td>B3</td><td>C3</td></tr>',
      '</tbody><tfoot>',
      '<tr><td>A4</td><td>B4</td><td>C4</td></tr>',
      '<tr><td>A5</td><td>B5</td><td>C5</td></tr>',
      '<tr><td>A6</td><td>B6</td><td>C6</td></tr>',
      '</tfoot></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    expect(config.fixedRowsTop).toBe(2);
    expect(config.fixedRowsBottom).toBe(3);
  });

  it('should parse merged cells from HTML table', () => {
    const htmlToParse = [
      '<table><tbody>',
      '<tr><td rowspan="2" colspan="2">A</td></tr>',
      '<tr></tr>',
      '<tr><td>B</td><td>C</td></tr>',
      '<tr><td rowspan="4" colspan="1">D</td><td>E</td></tr>',
      '<tr><td>F</td></tr>',
      '<tr><td>F</td></tr>',
      '<tr><td>H</td></tr>',
      '</tbody></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    expect(config.mergeCells.length).toBe(2);

    expect(config.mergeCells[0].col).toBe(0);
    expect(config.mergeCells[0].row).toBe(0);
    expect(config.mergeCells[0].colspan).toBe(2);
    expect(config.mergeCells[0].rowspan).toBe(2);

    expect(config.mergeCells[1].col).toBe(0);
    expect(config.mergeCells[1].row).toBe(3);
    expect(config.mergeCells[1].colspan).toBe(1);
    expect(config.mergeCells[1].rowspan).toBe(4);
  });

  describe('nestedHeaders', () => {
    it('should parse nested headers from HTML table', () => {
      const htmlToParse = [
        '<table><thead>',
        '<tr><th colspan="6" >A</th></tr>',
        '<tr><th colspan="3">B</th><th colspan="3">C</th></tr>',
        '<tr><th>D</th><th>E</th><th>F</th><th>G</th><th>H</th><th>I</th></tr>',
        '</thead><tbody>',
        '<tr><td>A1</td><td>B1</td><td>C1</td><td>D1</td><td>E1</td><td>F1</td></tr>',
        '</tbody></table>',
      ].join('');
      const config = htmlToGridSettings(htmlToParse);

      expect(config.nestedHeaders.length).toBe(3);
      expect(config.nestedHeaders[0][0].label).toBe('A');
      expect(config.nestedHeaders[0][0].colspan).toBe(6);
      expect(config.nestedHeaders[1][0].label).toBe('B');
      expect(config.nestedHeaders[1][0].colspan).toBe(3);
      expect(config.nestedHeaders[1][1].label).toBe('C');
      expect(config.nestedHeaders[1][1].colspan).toBe(3);
      expect(config.nestedHeaders[2].toString()).toBe('D,E,F,G,H,I');
    });

    it('should parse nested headers from HTML table if row headers are present', () => {
      const htmlToParse = [
        '<table><thead>',
        '<tr><th></th><th colspan="2" >A</th></tr>',
        '<tr><th></th><th>B</th><th>C</th></tr>',
        '</thead><tbody>',
        '<tr><th>1</th><td>B1</td><td>C1</td></tr>',
        '<tr><th>2</th><td>B2</td><td>C2</td></tr>',
        '<tr><th>3</th><td>B3</td><td>C3</td></tr>',
        '</tbody></table>',
      ].join('');
      const config = htmlToGridSettings(htmlToParse);

      expect(config.nestedHeaders.length).toBe(2);
      expect(config.nestedHeaders[0][0].label).toBe('A');
      expect(config.nestedHeaders[0][0].colspan).toBe(2);
      expect(config.nestedHeaders[1].toString()).toBe('B,C');
    });
  });

  describe('Excel support', () => {
    it('should ignore colspan attribute if mso-ignore point that', () => {
      // Raw clipboard data from Excel
      const htmlToParse = `
<table border=0 cellpadding=0 cellspacing=0 width=128 style="border-collapse:
 collapse;width:96pt">
<!--StartFragment-->
 <col width=64 span=2 style="width:48pt">
 <tr height=20 style="height:15.0pt">
  <td height=20 colspan=2 width=128 style="height:15.0pt;mso-ignore:colspan;
  width:96pt">Very long text</td>
 </tr>
 <tr height=20 style="height:15.0pt">
  <td height=20 style="height:15.0pt"></td>
  <td align=right>1</td>
 </tr>
<!--EndFragment-->
</table>`;
      const config = htmlToGridSettings(htmlToParse);

      expect(config.mergeCells).toBeUndefined();
      expect(config.data).toEqual([
        ['Very long text', null],
        ['', '1'],
      ]);
    });

    it('should standarize cell value if generator is defined', () => {
      const htmlToParse = [
        '<meta name=Generator content="Excel">',
        '<table><tbody><tr><td>',
        '1 2 3 4\r\n',
        '  5<br>\r\n',
        '    br<br>\r\n',
        '    6 7 8 9 0',
        '</td></tr></tbody></table>',
      ].join('');
      const config = htmlToGridSettings(htmlToParse);

      expect(config.data).toEqual([
        ['1 2 3 4 5\r\nbr\r\n6 7 8 9 0']
      ]);
    });
  });
});
