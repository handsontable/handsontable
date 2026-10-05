/**
 * @jest-environment node
 */
import {
  StyleTable, parseStyles, BUILT_IN_NUM_FMTS, builtInNumFmtId, EMPTY_STYLES,
} from '../adapters/native/parts/styles';
import { DroppedFeatures } from '../capabilities';

/**
 * Lists the names of the root element's direct children, in document order.
 * @param xml
 */
function topLevelChildren(xml) {
  const names = [];
  let depth = 0;

  for (const [, close, name, , selfClose] of xml.matchAll(/<(\/?)([A-Za-z][\w:.-]*)([^>]*?)(\/?)>/g)) {
    if (close) {
      depth -= 1;
    } else {
      if (depth === 1) {
        names.push(name);
      }

      depth += selfClose ? 0 : 1;
    }
  }

  return names;
}

describe('BUILT_IN_NUM_FMTS', () => {
  it('should map the ids Excel reserves and look them up by code', () => {
    expect(BUILT_IN_NUM_FMTS[14]).toBe('mm-dd-yy');
    expect(BUILT_IN_NUM_FMTS[22]).toBe('m/d/yy h:mm');
    expect(builtInNumFmtId('0.00%')).toBe(10);
    expect(builtInNumFmtId('#,##0.00 zł')).toBeUndefined();
  });
});

describe('StyleTable', () => {
  it('should answer 0 for an unstyled cell and never write an xf for it', () => {
    const table = new StyleTable();

    expect(table.xfIndex({ numFmt: null, style: null, locked: null })).toBe(0);
    // `locked: true` is the OOXML default: no <protection> element, so no xf of its own either.
    expect(table.xfIndex({ numFmt: null, style: null, locked: true })).toBe(0);
    expect(table.toXml()).toContain('<cellXfs count="1">');
  });

  it('should write the mandatory bootstrap entries Excel requires', () => {
    const xml = new StyleTable().toXml();

    expect(xml).toContain(
      '<fonts count="1"><font><sz val="11"/><color theme="1"/>'
      + '<name val="Calibri"/><family val="2"/><scheme val="minor"/></font></fonts>',
    );
    expect(xml).toContain(
      '<fills count="2"><fill><patternFill patternType="none"/>'
      + '</fill><fill><patternFill patternType="gray125"/></fill></fills>',
    );
    expect(xml).toContain('<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>');
    expect(xml).toContain(
      '<cellStyleXfs count="1">'
      + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
    );
    expect(xml).toContain('<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>');
    expect(xml).toContain('<dxfs count="0"/>');
    expect(xml.indexOf('<fonts')).toBeLessThan(xml.indexOf('<fills'));
    expect(xml.indexOf('<cellXfs')).toBeLessThan(xml.indexOf('<cellStyles'));
    expect(xml.indexOf('<cellStyles')).toBeLessThan(xml.indexOf('<dxfs'));
  });

  it('should write the styleSheet children in CT_Stylesheet order', () => {
    // A wrong order opens with Excel's repair dialog, while ExcelJS still reads every format back.
    const table = new StyleTable();

    table.xfIndex({
      numFmt: '0.000',
      style: {
        alignment: null,
        font: { bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } },
        border: { top: { style: 'thin' } },
      },
      locked: null,
    });
    table.dxfIndex({ font: { italic: true } });

    expect(topLevelChildren(table.toXml())).toEqual([
      'numFmts', 'fonts', 'fills', 'borders', 'cellStyleXfs', 'cellXfs', 'cellStyles', 'dxfs',
    ]);
  });

  it('should dedupe fonts, fills, borders, number formats and xfs', () => {
    const table = new StyleTable();
    const style = {
      alignment: { horizontal: 'center', vertical: 'middle' },
      font: { bold: true, underline: true, color: { argb: 'FFFF0000' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } },
      border: { top: { style: 'thin', color: { argb: 'FF0000FF' } }, left: { style: 'medium' } },
    };

    // Two separately built objects with the same values, not one reference used twice: the table
    // keys on the serialized shape, so passing the same reference would prove nothing.
    const sameStyle = {
      alignment: { horizontal: 'center', vertical: 'middle' },
      font: { bold: true, underline: true, color: { argb: 'FFFF0000' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } },
      border: { top: { style: 'thin', color: { argb: 'FF0000FF' } }, left: { style: 'medium' } },
    };

    const a = table.xfIndex({ numFmt: 'mm-dd-yyyy', style, locked: false });
    const b = table.xfIndex({ numFmt: 'mm-dd-yyyy', style: sameStyle, locked: false });
    const c = table.xfIndex({ numFmt: '0.00%', style: null, locked: null });

    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(c).toBe(2);

    const xml = table.toXml();

    expect(xml).toContain('<numFmts count="1"><numFmt numFmtId="164" formatCode="mm-dd-yyyy"/></numFmts>');
    expect(xml).toContain('<font><b/><u/><color rgb="FFFF0000"/><sz val="11"/><name val="Calibri"/></font>');
    expect(xml).toContain(
      // No companion `<bgColor indexed="64"/>`: a solid pattern needs only its foreground color,
      // and ExcelJS's writer emits none either (see `enginesParity.unit.js`'s fill case).
      '<fill><patternFill patternType="solid">'
      + '<fgColor rgb="FFF2F2F2"/></patternFill></fill>',
    );
    expect(xml).toContain(
      '<border><left style="medium"/><right/><top style="thin">'
      + '<color rgb="FF0000FF"/></top><bottom/><diagonal/></border>',
    );
    expect(xml).toContain(
      '<xf numFmtId="164" fontId="1" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1"'
      + ' applyFill="1" applyBorder="1" applyAlignment="1" applyProtection="1">'
      + '<alignment horizontal="center" vertical="center"/><protection locked="0"/></xf>',
    );
    // 0.00% is built-in id 10 and must not be written into <numFmts>.
    expect(xml).toContain('<xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>');
    expect(xml).toContain('<fonts count="2">');
  });

  it('should register a conditional-formatting style as a dxf using bgColor for the fill', () => {
    const table = new StyleTable();

    expect(table.dxfIndex({
      font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFC7CE' } },
    })).toBe(0);
    expect(table.dxfIndex({ font: { italic: true } })).toBe(1);
    expect(table.toXml()).toContain(
      '<dxfs count="2"><dxf><font><b/></font><fill><patternFill>'
      + '<bgColor rgb="FFFFC7CE"/></patternFill></fill></dxf><dxf><font><i/></font></dxf></dxfs>',
    );
  });

  it('should register a conditional-formatting rule number format and write it inside the dxf', () => {
    const table = new StyleTable();

    expect(table.dxfIndex({ font: { bold: true }, numFmt: '0.000' })).toBe(0);

    const xml = table.toXml();

    // The id has to reach `<numFmts>`, which is serialized BEFORE `<dxfs>`.
    expect(xml).toContain('<numFmts count="1"><numFmt numFmtId="164" formatCode="0.000"/></numFmts>');
    expect(xml).toContain(
      '<dxfs count="1"><dxf><font><b/></font><numFmt numFmtId="164" formatCode="0.000"/></dxf></dxfs>',
    );
  });

  it('should write a custom format code verbatim, XML-attribute-escaped only, and read it back unchanged', () => {
    const table = new StyleTable();

    // A backslash in a format code is Excel's own literal escape (`\ ` a literal space, `\%` a
    // literal percent sign that does NOT scale by 100). The writer must not add a second layer of
    // backslashes and the reader must not strip the user's own.
    table.xfIndex({ numFmt: '0.0\\ %', style: null, locked: null });
    table.xfIndex({ numFmt: '#,##0 "kr"', style: null, locked: null });
    table.dxfIndex({ font: { bold: true }, numFmt: '0.0\\%' });

    const xml = table.toXml();

    expect(xml).toContain('<numFmt numFmtId="164" formatCode="0.0\\ %"/>');
    expect(xml).toContain('<numFmt numFmtId="165" formatCode="#,##0 &quot;kr&quot;"/>');
    expect(xml).toContain('<dxf><font><b/></font><numFmt numFmtId="166" formatCode="0.0\\%"/></dxf>');

    const { cellXfs, dxfs } = parseStyles(xml);

    expect(cellXfs[1].numFmt).toBe('0.0\\ %');
    expect(cellXfs[2].numFmt).toBe('#,##0 "kr"');
    expect(dxfs[0].numFmt).toBe('0.0\\%');
  });

  it('should round-trip an accounting format code with its `* ` fill and `_` padding byte-identical', () => {
    const codes = [
      '_-* #,##0_-',
      '_($* #,##0.00_);_($* \\(#,##0.00\\);_($* "-"??_);_(@_)',
      '#,##0.00 [$EUR]',
    ];

    codes.forEach((code) => {
      const table = new StyleTable();

      table.xfIndex({ numFmt: code, style: null, locked: null });

      const xml = table.toXml();
      const written = xml.match(/formatCode="([^"]*)"/)[1].replace(/&quot;/g, '"');

      expect(written).toBe(code);
      expect(parseStyles(xml).cellXfs[1].numFmt).toBe(code);
    });
  });

  it('should share one xf between two requests that differ only in property order', () => {
    const table = new StyleTable();

    const a = table.xfIndex({
      numFmt: null,
      style: { alignment: { horizontal: 'center', vertical: 'middle' }, font: null, fill: null, border: null },
      locked: null,
    });
    const b = table.xfIndex({
      numFmt: null,
      style: { alignment: { vertical: 'middle', horizontal: 'center' }, font: null, fill: null, border: null },
      locked: null,
    });
    const c = table.xfIndex({
      numFmt: null,
      style: {
        border: { top: { color: { argb: 'FF0000FF' }, style: 'thin' } }, fill: null, font: null, alignment: null,
      },
      locked: null,
    });
    const d = table.xfIndex({
      numFmt: null,
      style: {
        alignment: null, font: null, fill: null, border: { top: { style: 'thin', color: { argb: 'FF0000FF' } } },
      },
      locked: null,
    });

    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(c).toBe(2);
    expect(d).toBe(2);
    expect(table.toXml()).toContain('<cellXfs count="3">');
    expect(table.toXml()).toContain('<borders count="2">');
  });

  it('should key font, fill, border and alignment on content at every depth, whatever the property order', () => {
    const table = new StyleTable();
    const style = {
      font: { bold: true, italic: true, color: { argb: 'FF112233' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFAABBCC' } },
      border: {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF00FF00' } },
      },
      alignment: { horizontal: 'left', vertical: 'top' },
    };
    const reordered = {
      alignment: { vertical: 'top', horizontal: 'left' },
      border: {
        left: { color: { argb: 'FF00FF00' }, style: 'medium' },
        top: { color: { argb: 'FF000000' }, style: 'thin' },
      },
      fill: { fgColor: { argb: 'FFAABBCC' }, pattern: 'solid', type: 'pattern' },
      font: { color: { argb: 'FF112233' }, italic: true, bold: true },
    };
    // Interleaved, so the second spelling is met both before and after the first one repeats.
    const ids = [style, reordered, style, reordered].map(s => table.xfIndex({
      numFmt: '0.00', style: s, locked: false,
    }));

    expect(ids).toEqual([1, 1, 1, 1]);

    const xml = table.toXml();

    expect(xml).toContain('<fonts count="2">');
    expect(xml).toContain('<fills count="3">');
    expect(xml).toContain('<borders count="2">');
    expect(xml).toContain('<cellXfs count="2">');
  });

  it('should keep two styles apart when they differ only in one nested leaf, known or unknown', () => {
    const table = new StyleTable();
    const request = font => ({
      numFmt: null,
      style: { font, fill: null, border: null, alignment: null },
      locked: null,
    });

    const base = table.xfIndex(request({ bold: true, color: { argb: 'FF000000' } }));
    const otherColor = table.xfIndex(request({ color: { argb: 'FF000001' }, bold: true }));
    // A property the snapshot type does not declare still takes part in the key, so a richer
    // style never collapses onto a plainer one.
    const extraA = table.xfIndex(request({ bold: true, color: { argb: 'FF000000', theme: 1 } }));
    const extraB = table.xfIndex(request({ bold: true, color: { argb: 'FF000000', theme: 2 } }));
    const extraAReordered = table.xfIndex(request({ color: { theme: 1, argb: 'FF000000' }, bold: true }));

    expect([base, otherColor, extraA, extraB, extraAReordered]).toEqual([1, 2, 3, 4, 3]);
    expect(table.toXml()).toContain('<fonts count="5">');
  });

  it('should share one dxf between two conditional-format styles that differ only in property order', () => {
    const table = new StyleTable();

    const red = { argb: 'FFFF0000' };
    const a = table.dxfIndex({ font: { bold: true, color: red }, fill: { bgColor: { argb: 'FF00FF00' } } });
    const b = table.dxfIndex({ fill: { bgColor: { argb: 'FF00FF00' } }, font: { color: red, bold: true } });
    const c = table.dxfIndex({ fill: { bgColor: { argb: 'FF00FF01' } }, font: { color: red, bold: true } });

    expect([a, b, c]).toEqual([0, 0, 1]);
  });
});

describe('parseStyles', () => {
  const xml = '<styleSheet xmlns="x">'
    + '<numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0.00"/></numFmts>'
    + '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font>'
    + '<font><b/><i val="0"/><u/><color rgb="ffff0000"/><sz val="11"/></font>'
    + '<font><color theme="4"/></font></fonts>'
    + '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'
    + '<fill><patternFill patternType="solid">'
    + '<fgColor rgb="FF00FF00"/><bgColor indexed="64"/></patternFill></fill></fills>'
    + '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>'
    + '<border><left style="thin"><color rgb="FF0000FF"/></left>'
    + '<right/><top style="thick"/><bottom/><diagonal/></border></borders>'
    + '<cellXfs count="5">'
    + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
    + '<xf numFmtId="164" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1">'
    + '<alignment horizontal="center" vertical="center"/></xf>'
    + '<xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0"><protection locked="0"/></xf>'
    + '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0"/>'
    + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><protection locked="1"/></xf>'
    + '</cellXfs>'
    + '<dxfs count="1"><dxf><font><b/><color rgb="FF9C0006"/></font><fill>'
    + '<patternFill><bgColor rgb="FFFFC7CE"/></patternFill></fill></dxf></dxfs>'
    + '</styleSheet>';

  it('should resolve every cellXf to the snapshot shape', () => {
    const { cellXfs } = parseStyles(xml);

    expect(cellXfs[0]).toEqual({ numFmt: null, style: null, locked: null });
    expect(cellXfs[1]).toEqual({
      numFmt: '"$"#,##0.00',
      style: {
        alignment: { horizontal: 'center', vertical: 'middle' },
        font: { bold: true, underline: true, color: { argb: 'FFFF0000' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00FF00' } },
        border: { left: { style: 'thin', color: { argb: 'FF0000FF' } }, top: { style: 'thick' } },
      },
      locked: null,
    });
    expect(cellXfs[2]).toEqual({ numFmt: 'mm-dd-yy', style: null, locked: false });
    // A theme color has no ARGB the model can carry; the font resolves to nothing.
    expect(cellXfs[3]).toEqual({ numFmt: null, style: null, locked: null });
    // `locked="1"` is the OOXML default and stays `null`, matching the ExcelJS adapter.
    expect(cellXfs[4]).toEqual({ numFmt: null, style: null, locked: null });
  });

  it('should read the default alignment LibreOffice writes on every xf as no style, and keep a bare bottom', () => {
    // LibreOffice writes `horizontal="general" vertical="bottom"` (plus zeroed rotation, indent and
    // wrap) on every `xf`. Read as an alignment, every cell of a plain LibreOffice file carried a
    // style, so the import reported `cellStyles` and `importStyles` put `htBottom` everywhere.
    const { cellXfs } = parseStyles('<styleSheet><cellXfs count="4">'
      + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="false">'
      + '<alignment horizontal="general" vertical="bottom" textRotation="0" wrapText="false" indent="0"'
      + ' shrinkToFit="false"/></xf>'
      + '<xf><alignment horizontal="general" vertical="top"/></xf>'
      + '<xf><alignment vertical="bottom"/></xf>'
      + '<xf><alignment horizontal="left" vertical="bottom"/></xf>'
      + '</cellXfs></styleSheet>');

    expect(cellXfs[0]).toEqual({ numFmt: null, style: null, locked: null });
    expect(cellXfs[1].style.alignment).toEqual({ vertical: 'top' });
    // The export writes exactly this for an `htBottom` cell, so it must survive a round trip.
    expect(cellXfs[2].style.alignment).toEqual({ vertical: 'bottom' });
    expect(cellXfs[3].style.alignment).toEqual({ horizontal: 'left', vertical: 'bottom' });
  });

  it('should keep the backslashes of a custom format code, which are Excel literal escapes', () => {
    const { cellXfs } = parseStyles(
      '<styleSheet><numFmts>'
      + '<numFmt numFmtId="165" formatCode="0.0\\ %"/>'
      + '<numFmt numFmtId="166" formatCode="0\\d"/>'
      + '</numFmts>'
      + '<cellXfs><xf numFmtId="165"/><xf numFmtId="166"/></cellXfs></styleSheet>',
    );

    // Stripping `\ ` to a space turned `0.0\ %` into a scaling percent (12.5 shown as 1250.0 %),
    // and `0\d` into `0d`, which the import then typed as a date.
    expect(cellXfs[0].numFmt).toBe('0.0\\ %');
    expect(cellXfs[1].numFmt).toBe('0\\d');
  });

  it('should resolve the locale date and time ids (27-36, 50-58) to a temporal stand-in code', () => {
    // Written from the documented intent (the ja-JP column of Excel's locale table, in ASCII), not
    // copied from `LOCALE_NUM_FMTS`, so a wrong entry there fails here: 30 is the short date every
    // locale shares, 32 and 33 are the clock times, and every other id is a calendar date.
    const expected = {
      27: 'yyyy/m/d',
      28: 'yyyy/m/d',
      29: 'yyyy/m/d',
      30: 'm/d/yy',
      31: 'yyyy/m/d',
      32: 'h:mm',
      33: 'h:mm:ss',
      34: 'yyyy/m/d',
      35: 'yyyy/m/d',
      36: 'yyyy/m/d',
      50: 'yyyy/m/d',
      51: 'yyyy/m/d',
      52: 'yyyy/m/d',
      53: 'yyyy/m/d',
      54: 'yyyy/m/d',
      55: 'yyyy/m/d',
      56: 'yyyy/m/d',
      57: 'yyyy/m/d',
      58: 'yyyy/m/d',
    };
    const ids = Object.keys(expected).map(Number);
    const { cellXfs } = parseStyles(
      `<styleSheet><cellXfs>${ids.map(id => `<xf numFmtId="${id}"/>`).join('')}</cellXfs></styleSheet>`,
    );

    // A bare serial with `numFmt: null` was the previous answer, so neither the import's type
    // inference nor the reader's `date1904` shift treated the cell as a date.
    expect(Object.fromEntries(ids.map((id, index) => [id, cellXfs[index].numFmt]))).toEqual(expected);
  });

  it('should resolve the currency (5-8) and accounting (41-44) ids to their en-US codes, read-only', () => {
    // A cell pointing at one of them with no `<numFmts>` entry used to read back with `numFmt: null`,
    // so a currency or accounting column imported as bare numbers with nothing in `dropped`.
    const ids = [5, 6, 7, 8, 41, 42, 43, 44];
    const { cellXfs } = parseStyles(
      `<styleSheet><cellXfs>${ids.map(id => `<xf numFmtId="${id}"/>`).join('')}</cellXfs></styleSheet>`,
    );
    const numFmts = Object.fromEntries(ids.map((id, index) => [id, cellXfs[index].numFmt]));

    expect(numFmts[7]).toBe('"$"#,##0.00_);\\("$"#,##0.00\\)');
    expect(numFmts[44]).toBe('_("$"* #,##0.00_);_("$"* \\(#,##0.00\\);_("$"* "-"??_);_(@_)');
    ids.forEach(id => expect(numFmts[id]).toEqual(expect.any(String)));
    // Never handed to the writer: Excel renders these in the install's currency.
    ids.forEach(id => expect(builtInNumFmtId(numFmts[id])).toBeUndefined());
  });

  it('should never hand a locale id out to the writer for the stand-in code', () => {
    // Excel renders id 27 as a Japanese era date on a ja-JP install; a workbook that asks for
    // `yyyy/m/d` must get a custom id, never the locale slot.
    expect(builtInNumFmtId('yyyy/m/d')).toBeUndefined();
    expect(builtInNumFmtId('h:mm')).toBe(20);
    expect(builtInNumFmtId('m/d/yy')).toBeUndefined();

    const table = new StyleTable();

    table.xfIndex({ numFmt: 'yyyy/m/d', style: null, locked: null });

    expect(table.toXml()).toContain('<numFmt numFmtId="164" formatCode="yyyy/m/d"/>');
  });

  it('should expose dxfs in the ExcelJS style shape for conditional formatting', () => {
    expect(parseStyles(xml).dxfs).toEqual([{
      font: { bold: true, color: { argb: 'FF9C0006' } },
      fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFC7CE' } },
    }]);
  });

  it('should fall back to a single empty xf when the part has none', () => {
    expect(parseStyles('<styleSheet/>').cellXfs).toEqual(EMPTY_STYLES.cellXfs);
  });

  it('should read a dxf number format without shadowing the workbook format table', () => {
    const { cellXfs, dxfs } = parseStyles('<styleSheet>'
      + '<numFmts><numFmt numFmtId="164" formatCode="0.00%"/></numFmts>'
      + '<cellXfs><xf numFmtId="164"/></cellXfs>'
      + '<dxfs><dxf><font><b/></font><numFmt numFmtId="164" formatCode="[Red]0.000"/></dxf></dxfs>'
      + '</styleSheet>');

    expect(dxfs).toEqual([{ font: { bold: true }, numFmt: '[Red]0.000' }]);
    // The cell format keeps the workbook table's code, not the rule's.
    expect(cellXfs[0].numFmt).toBe('0.00%');
  });

  it('should resolve a style index past the end of its table to no style', () => {
    // `styles.xml` comes from an untrusted file, so an out-of-range id must not leak `undefined`.
    const { cellXfs } = parseStyles('<styleSheet><fonts><font/></fonts>'
      + '<cellXfs><xf numFmtId="0" fontId="99" fillId="99" borderId="99"/></cellXfs></styleSheet>');

    expect(cellXfs[0]).toEqual({ numFmt: null, style: null, locked: null });
  });
});

describe('parseStyles: index attributes read as written', () => {
  it('should resolve numFmtId, fontId, fillId and borderId only from their unsignedInt form', () => {
    // `Number()` took `0x10` as 16 and `1e0` as 1, so a cell format resolved a built-in date
    // format and a font the file never pointed at; `''` read as 0 by accident.
    const styles = parseStyles('<styleSheet><fonts count="2"><font/><font><b/></font></fonts>'
      + '<cellXfs count="4"><xf numFmtId="14" fontId="1"/><xf numFmtId="0x10" fontId="1e0"/>'
      + '<xf numFmtId="" fontId=" 1"/><xf numFmtId="+14" fontId="+1"/></cellXfs></styleSheet>');

    expect(styles.cellXfs.map(xf => xf.numFmt)).toEqual(['mm-dd-yy', null, null, 'mm-dd-yy']);
    expect(styles.cellXfs.map(xf => xf.style?.font ?? null)).toEqual([{ bold: true }, null, null, { bold: true }]);
  });

  it('should not register a custom number format under an id that is not a whole number', () => {
    const styles = parseStyles('<styleSheet><numFmts count="2"><numFmt numFmtId="1e3" formatCode="0.000"/>'
      + '<numFmt numFmtId="164" formatCode="0.0"/></numFmts>'
      + '<cellXfs count="2"><xf numFmtId="1000"/><xf numFmtId="164"/></cellXfs></styleSheet>');

    expect(styles.cellXfs.map(xf => xf.numFmt)).toEqual([null, '0.0']);
  });
});

describe('parseStyles: the number-format code cap', () => {
  it('should drop a format code longer than 255 characters, once, and resolve its cells as General', () => {
    // Excel caps a code at 255 characters. An uncapped one was stored and handed to the import's
    // inference once per cell: a 1 MB code on 20 000 cells took 139 s.
    const longCode = `0.0${'"x"'.repeat(400_000)}`;
    const dropped = new DroppedFeatures();
    const styles = parseStyles('<styleSheet><numFmts count="2">'
      + `<numFmt numFmtId="164" formatCode="${longCode.replace(/"/g, '&quot;')}"/>`
      + `<numFmt numFmtId="165" formatCode="${'0'.repeat(255)}"/></numFmts>`
      + '<cellXfs count="3"><xf numFmtId="164"/><xf numFmtId="164"/><xf numFmtId="165"/></cellXfs>'
      + `<dxfs count="1"><dxf><numFmt numFmtId="166" formatCode="${'0'.repeat(256)}"/></dxf></dxfs>`
      + '</styleSheet>', dropped);

    expect(styles.cellXfs.map(xf => xf.numFmt)).toEqual([null, null, '0'.repeat(255)]);
    expect(styles.dxfs[0].numFmt).toBeUndefined();
    expect(dropped.list()).toEqual([`numFmt:0.0${'"x"'.repeat(20)}…`, `numFmt:${'0'.repeat(63)}…`]);
    expect(dropped.count(dropped.list()[0])).toBe(1);
  });
});
