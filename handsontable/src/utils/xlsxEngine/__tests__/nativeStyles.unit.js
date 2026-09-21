/**
 * @jest-environment node
 */
import {
  StyleTable, parseStyles, BUILT_IN_NUM_FMTS, builtInNumFmtId, EMPTY_STYLES,
} from '../adapters/native/parts/styles';

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

  it('should dedupe fonts, fills, borders, number formats and xfs', () => {
    const table = new StyleTable();
    const style = {
      alignment: { horizontal: 'center', vertical: 'middle' },
      font: { bold: true, underline: true, color: { argb: 'FFFF0000' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } },
      border: { top: { style: 'thin', color: { argb: 'FF0000FF' } }, left: { style: 'medium' } },
    };

    const a = table.xfIndex({ numFmt: 'mm-dd-yyyy', style, locked: false });
    const b = table.xfIndex({ numFmt: 'mm-dd-yyyy', style, locked: false });
    const c = table.xfIndex({ numFmt: '0.00%', style: null, locked: null });

    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(c).toBe(2);

    const xml = table.toXml();

    expect(xml).toContain('<numFmts count="1"><numFmt numFmtId="164" formatCode="mm-dd-yyyy"/></numFmts>');
    expect(xml).toContain('<font><b/><u/><color rgb="FFFF0000"/><sz val="11"/><name val="Calibri"/></font>');
    expect(xml).toContain(
      '<fill><patternFill patternType="solid">'
      + '<fgColor rgb="FFF2F2F2"/><bgColor indexed="64"/></patternFill></fill>',
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

  it('should unescape backslashes in a custom format code', () => {
    const { cellXfs } = parseStyles(
      '<styleSheet><numFmts><numFmt numFmtId="165" formatCode="0.0\\ %"/></numFmts>'
      + '<cellXfs><xf numFmtId="165"/></cellXfs></styleSheet>',
    );

    expect(cellXfs[0].numFmt).toBe('0.0 %');
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
});
