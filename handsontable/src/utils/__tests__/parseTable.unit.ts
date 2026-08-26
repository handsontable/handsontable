import {
  instanceToHTML, instanceToTableElement, _dataToHTML, htmlToGridSettings
} from '../parseTable';
import Handsontable from '../../index';
import { registerCellType, TextCellType } from '../../cellTypes';

registerCellType(TextCellType);

describe('instanceToHTML', () => {
  it('should convert clear instance into HTML table', () => {
    const hot = new Handsontable(document.createElement('div'));

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
      '<tr><td>&lt;div class="test"&gt;A1&lt;/div&gt;</td></tr>',
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

  it('should parse every column of a ragged HTML table whose first row is the narrowest', () => {
    const htmlToParse = [
      '<table><tbody>',
      '<tr><td>schedule</td></tr>',
      '<tr><td></td><td>Football</td><td>Score</td></tr>',
      '</tbody></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    // The grid is as wide as the widest row, and the short first row is padded out.
    expect(config.data).toEqual([
      ['schedule', undefined, undefined],
      ['', 'Football', 'Score'],
    ]);
  });

  it('should parse every column of a ragged HTML table whose widest row is neither first nor last', () => {
    const htmlToParse = [
      '<table><tbody>',
      '<tr><td>A1</td></tr>',
      '<tr><td>A2</td><td>B2</td><td>C2</td><td>D2</td></tr>',
      '<tr><td>A3</td><td>B3</td></tr>',
      '</tbody></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    expect(config.data).toEqual([
      ['A1', undefined, undefined, undefined],
      ['A2', 'B2', 'C2', 'D2'],
      ['A3', 'B3', undefined, undefined],
    ]);
  });

  it('should count a colspan in a later row when sizing a ragged HTML table', () => {
    const htmlToParse = [
      '<table><tbody>',
      '<tr><td>A1</td></tr>',
      '<tr><td colspan="2">A2</td><td>C2</td></tr>',
      '</tbody></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    expect(config.data[1]).toHaveLength(3);
    expect(config.data[1][2]).toBe('C2');
  });

  it('should keep the first row\'s width when it is already the widest', () => {
    const htmlToParse = [
      '<table><tbody>',
      '<tr><td>A1</td><td>B1</td><td>C1</td></tr>',
      '<tr><td>A2</td></tr>',
      '</tbody></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    expect(config.data).toEqual([
      ['A1', 'B1', 'C1'],
      ['A2', undefined, undefined],
    ]);
  });

  it('should not let a full-width colspan row widen the whole table', () => {
    const htmlToParse = [
      '<table><tbody>',
      '<tr><td>A1</td><td>B1</td><td>C1</td></tr>',
      // A footer row spanning the table is normal in email and Word exports. It needs one slot,
      // not twenty, or every pasted row gains seventeen blank columns.
      '<tr><td colspan="20">footer</td></tr>',
      '</tbody></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    expect(config.data[0]).toHaveLength(3);
  });

  it('should keep every cell when the first row spans both ways', () => {
    const htmlToParse = [
      '<table><tbody>',
      // The cell holds two columns of the row below it as well, so that row needs four slots.
      '<tr><td rowspan="2" colspan="2">A</td></tr>',
      '<tr><td>B</td><td>C</td></tr>',
      '</tbody></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    expect(config.data[1]).toEqual([null, null, 'B', 'C']);
  });

  it('should keep rows rectangular when a span reaches past the last column', () => {
    const htmlToParse = [
      '<table><tbody>',
      '<tr><td>a</td></tr>',
      '<tr><td>b</td><td colspan="3">wide</td></tr>',
      '</tbody></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    // The span is trimmed to what the grid holds, so it cannot stretch its own row.
    expect(config.data.map((row: unknown[]) => row.length)).toEqual([2, 2]);
  });

  it('should give a th outside the first column no data slot', () => {
    const htmlToParse = [
      '<table><tbody>',
      // The fill loop sends every non-`td` to the row headers, so a `th` here takes no column.
      '<tr><td>a</td><th>grp</th><td>b</td></tr>',
      '<tr><td>1</td><td>2</td></tr>',
      '</tbody></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    expect(config.data).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('should count the slots a rowspan reserves in the rows below it', () => {
    const htmlToParse = [
      '<table><tbody>',
      '<tr><td>A1</td><td>B1</td></tr>',
      '<tr><td rowspan="2">A2</td></tr>',
      // The rowspan above holds column 0, so this row needs four slots, not three.
      '<tr><td>B3</td><td>C3</td><td>D3</td></tr>',
      '</tbody></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    expect(config.data[2]).toEqual([null, 'B3', 'C3', 'D3']);
  });

  it('should not subtract a row header from rows that do not have one', () => {
    const htmlToParse = [
      '<table><tbody>',
      '<tr><th>H1</th><td>A1</td></tr>',
      // No `th` here, so all three cells are data and none of them may be trimmed away.
      '<tr><td>A2</td><td>B2</td><td>C2</td></tr>',
      '</tbody></table>',
    ].join('');
    const config = htmlToGridSettings(htmlToParse);

    expect(config.data[1]).toEqual(['A2', 'B2', 'C2']);
  });

  it('should parse data from HTML table with nested Excel shape cells', () => {
    const htmlToParse = [
      '<table><tbody>',
      '<tr><td>text</td>',
      '<td width=116><!--[if gte vml 1]><v:shape></v:shape><![endif]-->',
      '<span><table><tr><td></td></tr></table></span></td>',
      '<td>text2</td>',
      '<td width=124><!--[if gte vml 1]><v:shape></v:shape><![endif]-->',
      '<span><table><tr><td></td></tr></table></span></td>',
      '<td>test</td>',
      '</tr></table>'
    ].join('');

    const config = htmlToGridSettings(htmlToParse);

    expect(config.data.toString()).toBe('text,,text2,,test');
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

  it('should parse table with long text properly', () => {
    /* eslint-disable no-irregular-whitespace */
    const htmlToParse = `
      <table>
       <tr>
        <td>
        <p><span>Some very long text with no line breaks inside table
        cell. Some very long text with no line breaks</span></p>
        <p><span>&nbsp;</span></p>
        <p><span>&nbsp;</span></p>
        <p><span>ins table cell. Some very long text with no line breaks
        inside table cell. Some very long text with no line breaks inside table cell.
        Some very long text with no line breaks inside table cell. Some very long
        text with no line breaks inside table cell. Some very long text with no line
        breaks inside table cell. Some very long text with no line breaks inside
        table cell. Some very long text with no line breaks inside table cell. Some
        very long text with no line breaks inside table cell. Some very long text
        with no line breaks inside table cell. Some very long text with no line
        breaks inside table cell. Some very long text with no line breaks inside
        table cell. Some very long text with no line breaks inside table cell. Some
        very long text with no line breaks inside table cell. Some very long text
        with no line breaks inside table cell. Some very long text with no line
        breaks inside table cell. Some very long text with no line breaks inside
        table cell. Some very long text with no line breaks inside table cell. Some
        very long text with no line breaks inside table cell. Some very long text
        with no line breaks inside table cell. Some very long text with no line
        breaks inside table cell. Some very long text with no line breaks inside
        table cell. Some very long text with no line breaks inside table cell.</span></p>
        </td>
       </tr>
       <tr>
        <td>
        <p><span>Another very long text with no line breaks inside table
        cell. <span>       </span>Some very long text with
        no line breaks <span>     </span>o line breo line
        breo line breo line breo line bre</span></p>
        <p><span>&nbsp;</span></p>
        <p><span>NEW LINE</span></p>
        </td>
       </tr>
      </table>`;
    /* eslint-enable */

    const config = htmlToGridSettings(htmlToParse);

    expect(config.data).toEqual([[
      'Some very long text with no line breaks inside table cell. Some very long text with no line breaks' +
      '\n\n\n' +
      'ins table cell. Some very long text with no line breaks inside table cell. Some very long text with no line ' +
      'breaks inside table cell. Some very long text with no line breaks inside table cell. Some very long text with ' +
      'no line breaks inside table cell. Some very long text with no line breaks inside table cell. Some very long ' +
      'text with no line breaks inside table cell. Some very long text with no line breaks inside table cell. Some ' +
      'very long text with no line breaks inside table cell. Some very long text with no line breaks inside table ' +
      'cell. Some very long text with no line breaks inside table cell. Some very long text with no line breaks ' +
      'inside table cell. Some very long text with no line breaks inside table cell. Some very long text with no ' +
      'line breaks inside table cell. Some very long text with no line breaks inside table cell. Some very long ' +
      'text with no line breaks inside table cell. Some very long text with no line breaks inside table cell. Some ' +
      'very long text with no line breaks inside table cell. Some very long text with no line breaks inside table ' +
      'cell. Some very long text with no line breaks inside table cell. Some very long text with no line breaks ' +
      'inside table cell. Some very long text with no line breaks inside table cell. Some very long text with no ' +
      'line breaks inside table cell.'
    ], [
      'Another very long text with no line breaks inside table cell.        Some very long text with no line ' +
      'breaks      o line breo line breo line breo line breo line bre' +
      '\n\n' +
      'NEW LINE'
    ]]);
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

describe('instanceToTableElement', () => {
  /**
   * Parses the string form the DOM form replaced, so the two can be compared node for node.
   *
   * @param {string} html The markup produced by `instanceToHTML`.
   * @returns {HTMLElement} The parsed table.
   */
  function parseTableHTML(html: string): HTMLElement {
    const wrapper = document.createElement('div');

    wrapper.innerHTML = html;

    return wrapper.firstElementChild as HTMLElement;
  }

  it.each([
    ['plain values', [['A1', 'B1'], ['A2', 'B2']]],
    ['empty cells', [['A1', null], ['', 'B2']]],
    ['angle brackets', [['<script>alert(1)</script>', 'a > b']]],
    ['spaces and tabs', [['a  b', 'c\td']]],
    ['newlines', [['line1\nline2', 'a\r\nb\r\nc']]],
    ['a trailing newline', [['ends with\n', '\nstarts with']]],
    // A lone carriage return matches neither the encoder's newline pattern nor the split below, so
    // it survives into the string and the HTML parser normalizes it. Missed by the first version.
    ['a lone carriage return', [['before\rafter', 'a\r\rb']]],
    // The encoder escapes only `<` and `>`, so a character reference already present in the data
    // reached the parser intact and was decoded. Also missed by the first version.
    ['character references in the data', [['a&nbsp;b', '&amp;lt; &#38; &#x26;']]],
    ['a reference that could double-decode', [['&amp;lt;', '&amp;amp;nbsp;']]],
    ['tabs next to spaces', [['a\t b', ' \ta\t ']]],
  ])('should build the same table the parsed HTML form produced - %s', (_label, data) => {
    const hot = new Handsontable(document.createElement('div'), {
      data,
      colHeaders: true,
      rowHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const built = instanceToTableElement(hot, document);
    const parsed = parseTableHTML(instanceToHTML(hot));

    // `outerHTML` compares structure, attributes, and text in one assertion, and reports the
    // difference readably when the two diverge.
    expect(built.outerHTML).toBe(parsed.outerHTML);

    hot.destroy();
  });

  it('should keep markup in headers, as the parsed string form did', () => {
    // `colHeaders: ['<b>ID</b>']` is a documented pattern. Writing the header as text would render
    // the tags literally and silently change what `toTableElement()` returns.
    const hot = new Handsontable(document.createElement('div'), {
      data: [['A1', 'B1']],
      colHeaders: ['<b>ID</b>', 'Plain'],
      rowHeaders: ['<i>1</i>'],
      licenseKey: 'non-commercial-and-evaluation',
    });

    const built = instanceToTableElement(hot, document);

    expect(built.querySelector('thead th:nth-child(2)')!.innerHTML).toBe('<b>ID</b>');
    expect(built.outerHTML).toBe(parseTableHTML(instanceToHTML(hot)).outerHTML);

    hot.destroy();
  });

  it('should parse a payload that is not a plain string without normalizing it away', () => {
    // `replaceTdCellsWithTextContent()` walks `html.length`. A `TrustedHTML` has none, so
    // normalizing it returned an empty string and the parse found no table at all.
    const trustedLike = {
      toString: () => '<table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>',
    };

    expect(htmlToGridSettings(trustedLike, document)?.data).toEqual([['A1', 'B1']]);
  });

  it('should build a table without a thead when column headers are off', () => {
    const hot = new Handsontable(document.createElement('div'), {
      data: [['A1']],
      licenseKey: 'non-commercial-and-evaluation',
    });

    const built = instanceToTableElement(hot, document);

    expect(built.tHead).toBe(null);
    expect(built.outerHTML).toBe(parseTableHTML(instanceToHTML(hot)).outerHTML);

    hot.destroy();
  });
});

describe('header sanitizing parity between toHTML and toTableElement', () => {
  /**
   * Builds a grid with a header carrying markup.
   *
   * @param {Function} [sanitizer] The `sanitizer` option, when the test configures one.
   * @returns {object} The Handsontable instance.
   */
  function gridWithMarkupHeader(sanitizer?: (html: string) => string) {
    return new Handsontable(document.createElement('div'), {
      data: [['A1', 'B1']],
      colHeaders: ['<b>ID</b>', 'Name'],
      licenseKey: 'non-commercial-and-evaluation',
      ...(sanitizer ? { sanitizer } : {}),
    });
  }

  it('should put the header through the sanitizer in both representations', () => {
    const strip = (html: string) => html.replace(/<[^>]*>/g, '');
    const hot = gridWithMarkupHeader(strip);
    const fromString = instanceToHTML(hot as never);
    const fromDom = instanceToTableElement(hot as never, document);

    // These two describe the same grid. `toHTML()` used to interpolate the header raw, so a
    // stripping sanitizer left the `<b>` in one and removed it from the other.
    expect(fromString).toContain('<th>ID</th>');
    expect(fromString).not.toContain('<b>');
    expect(fromDom.querySelectorAll('th')[0].innerHTML).toBe('ID');

    hot.destroy();
  });

  it('should keep header markup in both representations when no sanitizer is configured', () => {
    const hot = gridWithMarkupHeader();
    const fromString = instanceToHTML(hot as never);
    const fromDom = instanceToTableElement(hot as never, document);

    expect(fromString).toContain('<th><b>ID</b></th>');
    expect(fromDom.querySelectorAll('th')[0].innerHTML).toBe('<b>ID</b>');

    hot.destroy();
  });

  it('should not warn about a missing sanitizer from either read-only API', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const hot = gridWithMarkupHeader();

    warnSpy.mockClear();
    instanceToHTML(hot as never);
    instanceToTableElement(hot as never, document);

    // Both are read-only: neither writes to the page, so "HTML content is being written to the
    // DOM" would name a surface the caller never looked at. The written markup is unchanged.
    expect(warnSpy.mock.calls.filter(c => String(c[0]).includes('without a sanitizer'))).toEqual([]);

    warnSpy.mockRestore();
    hot.destroy();
  });
});
