import type { CellStyleSnapshot } from '../../../model';
import { createLocalName, tokenizeXml, type XmlAttributes } from '../xml/tokenizer';
import { XmlWriter } from '../xml/writer';
import { MAIN_NS } from './package';

/**
 * Number formats Excel keeps in its built-in table. A code that matches one reuses the id and
 * is not written to `<numFmts>`. Ids 5–8 (currency) and the locale ids are Excel-internal and
 * absent on purpose; a currency code is always custom.
 */
export const BUILT_IN_NUM_FMTS: Record<number, string> = {
  0: 'General',
  1: '0',
  2: '0.00',
  3: '#,##0',
  4: '#,##0.00',
  9: '0%',
  10: '0.00%',
  11: '0.00E+00',
  12: '# ?/?',
  13: '# ??/??',
  14: 'mm-dd-yy',
  15: 'd-mmm-yy',
  16: 'd-mmm',
  17: 'mmm-yy',
  18: 'h:mm AM/PM',
  19: 'h:mm:ss AM/PM',
  20: 'h:mm',
  21: 'h:mm:ss',
  22: 'm/d/yy h:mm',
  37: '#,##0 ;(#,##0)',
  38: '#,##0 ;[Red](#,##0)',
  39: '#,##0.00 ;(#,##0.00)',
  40: '#,##0.00 ;[Red](#,##0.00)',
  45: 'mm:ss',
  46: '[h]:mm:ss',
  47: 'mmss.0',
  48: '##0.0E+0',
  49: '@',
};

const BUILT_IN_BY_CODE = new Map<string, number>(
  Object.entries(BUILT_IN_NUM_FMTS).map(([id, code]) => [code, Number(id)]),
);

const FIRST_CUSTOM_NUM_FMT_ID = 164;

/**
 * The built-in id of a format code, or `undefined` when it is custom.
 */
export function builtInNumFmtId(code: string): number | undefined {
  return BUILT_IN_BY_CODE.get(code);
}

/**
 * Escapes a literal space in a CUSTOM format code with a backslash, the way Excel itself writes
 * one, so it survives serialization the way `parseStyles` reads it back:
 * `formatCode.replace(/\\(.)/g, '$1')` unescapes `\ ` to a plain space on read, and without this
 * the writer emitted that plain space verbatim — `0.0\ %` came back from `#numFmtId` as `0.0 %`
 * and was then written out unescaped, so a native round trip lost the backslash and the two
 * engines disagreed on the format code for the same file. A space inside a quoted string literal
 * (`"kr "`) is left alone: the quotes already make it literal there.
 */
function escapeNumFmtCode(code: string): string {
  let inQuotes = false;
  let escaped = '';

  for (const ch of code) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      escaped += ch;
    } else if (ch === ' ' && !inQuotes) {
      escaped += '\\ ';
    } else {
      escaped += ch;
    }
  }

  return escaped;
}

/**
 * What one cell asks the style table for.
 */
export interface XfRequest {
  numFmt: string | null;
  style: CellStyleSnapshot | null;
  locked: boolean | null;
}

/**
 * A conditional-formatting style, in the ExcelJS `Partial<Style>` shape the CF rules carry.
 */
export interface DxfStyle {
  font?: CellStyleSnapshot['font'];
  fill?: { type?: string; pattern?: string; fgColor?: { argb: string }; bgColor?: { argb: string } } | null;
  border?: CellStyleSnapshot['border'];
  numFmt?: string;
  /**
   * Filled in by `StyleTable#dxfIndex`, never by a caller: the id `numFmt` was registered under.
   */
  numFmtId?: number;
}

/**
 * One resolved `<xf>`, in the shape the cell snapshot needs.
 */
export interface ResolvedXf {
  numFmt: string | null;
  style: CellStyleSnapshot | null;
  locked: boolean | null;
}

/**
 * The parsed `xl/styles.xml`.
 */
export interface ParsedStyles {
  cellXfs: ResolvedXf[];
  dxfs: DxfStyle[];
}

/**
 * The resolved styles of a workbook whose package carries no styles part at all.
 */
export const EMPTY_STYLES: ParsedStyles = {
  cellXfs: [{ numFmt: null, style: null, locked: null }],
  dxfs: [],
};

type Font = NonNullable<CellStyleSnapshot['font']>;
type Fill = NonNullable<CellStyleSnapshot['fill']>;
type Border = NonNullable<CellStyleSnapshot['border']>;
type Alignment = NonNullable<CellStyleSnapshot['alignment']>;

const BORDER_EDGES = ['left', 'right', 'top', 'bottom'] as const;

/**
 * Writes one `<font>` (or `<dxf>` font) body.
 */
function writeFont(w: XmlWriter, font: Font, withDefaults: boolean): void {
  w.open('font');

  if (font.bold) {
    w.leaf('b');
  }

  if (font.italic) {
    w.leaf('i');
  }

  if (font.underline) {
    w.leaf('u');
  }

  if (font.color) {
    w.leaf('color', { rgb: font.color.argb });
  }

  if (withDefaults) {
    w.leaf('sz', { val: 11 });
    w.leaf('name', { val: 'Calibri' });
  }

  w.close();
}

/**
 * Writes one `<border>` body. Every edge element is present; only a styled edge carries attributes.
 */
function writeBorder(w: XmlWriter, border: Border): void {
  w.open('border');
  BORDER_EDGES.forEach((edge) => {
    const side = border[edge];

    if (side) {
      w.open(edge, { style: side.style });

      if (side.color) {
        w.leaf('color', { rgb: side.color.argb });
      }

      w.close();
    } else {
      w.leaf(edge);
    }
  });
  w.leaf('diagonal');
  w.close();
}

/**
 * A deduplicating list keyed by JSON.
 */
class KeyedList<T> {
  /**
   * Entries in insertion order.
   */
  readonly items: T[] = [];

  /**
   * Index by serialized key.
   */
  #index = new Map<string, number>();

  /**
   * Seeds the list with fixed entries.
   */
  constructor(seed: T[] = []) {
    seed.forEach(item => this.add(item));
  }

  /**
   * Adds an item, returning its index (existing or new).
   */
  add(item: T): number {
    const key = JSON.stringify(item);
    const existing = this.#index.get(key);

    if (existing !== undefined) {
      return existing;
    }

    this.items.push(item);
    this.#index.set(key, this.items.length - 1);

    return this.items.length - 1;
  }
}

/**
 * One `<xf>` before serialization.
 */
interface XfEntry {
  numFmtId: number;
  fontId: number;
  fillId: number;
  borderId: number;
  alignment: Alignment | null;
  locked: boolean | null;
}

/**
 * Writes one non-default `<xf>` of `<cellXfs>`, with the `apply…` flag of every table it points
 * at away from the bootstrap row.
 */
function writeCellXf(w: XmlWriter, xf: XfEntry): void {
  w.open('xf', {
    numFmtId: xf.numFmtId,
    fontId: xf.fontId,
    fillId: xf.fillId,
    borderId: xf.borderId,
    xfId: 0,
    applyNumberFormat: xf.numFmtId !== 0 ? '1' : undefined,
    applyFont: xf.fontId !== 0 ? '1' : undefined,
    applyFill: xf.fillId !== 0 ? '1' : undefined,
    applyBorder: xf.borderId !== 0 ? '1' : undefined,
    applyAlignment: xf.alignment ? '1' : undefined,
    applyProtection: xf.locked === false ? '1' : undefined,
  });

  if (xf.alignment) {
    w.leaf('alignment', {
      horizontal: xf.alignment.horizontal,
      vertical: xf.alignment.vertical === 'middle' ? 'center' : xf.alignment.vertical,
    });
  }

  if (xf.locked === false) {
    w.leaf('protection', { locked: '0' });
  }

  w.close();
}

/**
 * Writes one `<dxf>`, the differential style a conditional-formatting rule points at.
 */
function writeDxf(w: XmlWriter, dxf: DxfStyle): void {
  w.open('dxf');

  if (dxf.font) {
    writeFont(w, dxf.font, false);
  }

  // Child order inside `<dxf>` is font, numFmt, fill, border. Both halves must be present:
  // a format code with no registered id cannot be referenced.
  if (dxf.numFmt !== undefined && dxf.numFmtId !== undefined) {
    w.leaf('numFmt', { numFmtId: dxf.numFmtId, formatCode: escapeNumFmtCode(dxf.numFmt) });
  }

  if (dxf.fill && (dxf.fill.fgColor || dxf.fill.bgColor)) {
    w.open('fill').open('patternFill');

    if (dxf.fill.fgColor) {
      w.leaf('fgColor', { rgb: dxf.fill.fgColor.argb });
    }

    if (dxf.fill.bgColor) {
      w.leaf('bgColor', { rgb: dxf.fill.bgColor.argb });
    }

    w.close().close();
  }

  if (dxf.border) {
    writeBorder(w, dxf.border);
  }

  w.close();
}

/**
 * The style tables of a workbook being written. Index 0 of every table is the mandatory default
 * Excel expects; `xfIndex` hands out `0` for a cell with nothing to say.
 */
export class StyleTable {
  /**
   * Custom number formats by code, ids allocated from 164.
   */
  #numFmts = new Map<string, number>();

  /**
   * Fonts; index 0 is the default Calibri 11.
   */
  #fonts = new KeyedList<Font | null>([null]);

  /**
   * Fills; indexes 0 and 1 are the mandatory `none` and `gray125`.
   */
  #fills = new KeyedList<Fill | 'none' | 'gray125'>(['none', 'gray125']);

  /**
   * Borders; index 0 is the empty border.
   */
  #borders = new KeyedList<Border | null>([null]);

  /**
   * Cell formats; index 0 is the all-default xf.
   */
  #xfs = new KeyedList<XfEntry>([{
    numFmtId: 0, fontId: 0, fillId: 0, borderId: 0, alignment: null, locked: null,
  }]);

  /**
   * Conditional-formatting styles, referenced by `cfRule/@dxfId`.
   */
  #dxfs = new KeyedList<DxfStyle>();

  /**
   * Returns the `s` attribute for a cell.
   */
  xfIndex(request: XfRequest): number {
    const { numFmt, style } = request;
    // `locked: true` is the OOXML default and writes no `<protection>`, so it is the same xf as null.
    const locked = request.locked === true ? null : request.locked;

    if (numFmt === null && style === null && locked === null) {
      return 0;
    }

    return this.#xfs.add({
      numFmtId: numFmt === null || numFmt === '' ? 0 : this.#numFmtId(numFmt),
      fontId: style?.font ? this.#fonts.add(style.font) : 0,
      fillId: style?.fill ? this.#fills.add(style.fill) : 0,
      borderId: style?.border ? this.#borders.add(style.border) : 0,
      alignment: style?.alignment ?? null,
      locked,
    });
  }

  /**
   * Returns the `dxfId` for a conditional-formatting rule style.
   */
  dxfIndex(style: DxfStyle): number {
    // The number-format id is allocated HERE rather than while serializing, because `<numFmts>` is
    // written before `<dxfs>` — an id allocated during the dxf write would never reach the table.
    // ExcelJS allocates at the same point, in `addDxfStyle`, and shares the one id space.
    if (style.numFmt === undefined) {
      return this.#dxfs.add(style);
    }

    return this.#dxfs.add({ ...style, numFmtId: this.#numFmtId(style.numFmt) });
  }

  /**
   * Serializes `xl/styles.xml`. Child order is schema-fixed.
   */
  toXml(): string {
    const w = new XmlWriter().open('styleSheet', { xmlns: MAIN_NS });

    this.#writeNumFmts(w);
    this.#writeFonts(w);
    this.#writeFills(w);
    this.#writeBorders(w);

    w.open('cellStyleXfs', { count: 1 }).leaf('xf', {
      numFmtId: 0, fontId: 0, fillId: 0, borderId: 0,
    }).close();

    this.#writeCellXfs(w);

    w.open('cellStyles', { count: 1 }).leaf('cellStyle', { name: 'Normal', xfId: 0, builtinId: 0 }).close();

    this.#writeDxfs(w);

    return w.close().toString();
  }

  /**
   * Writes `<numFmts>`, which a workbook using only built-in codes does not have at all.
   */
  #writeNumFmts(w: XmlWriter): void {
    if (this.#numFmts.size === 0) {
      return;
    }

    w.open('numFmts', { count: this.#numFmts.size });
    this.#numFmts.forEach((id, code) => w.leaf('numFmt', { numFmtId: id, formatCode: escapeNumFmtCode(code) }));
    w.close();
  }

  /**
   * Writes `<fonts>`. Index 0 is the bootstrap Calibri 11 the sheet expects to find there.
   */
  #writeFonts(w: XmlWriter): void {
    w.open('fonts', { count: this.#fonts.items.length });
    this.#fonts.items.forEach((font) => {
      if (font === null) {
        w.open('font').leaf('sz', { val: 11 }).leaf('color', { theme: 1 }).leaf('name', { val: 'Calibri' })
          .leaf('family', { val: 2 }).leaf('scheme', { val: 'minor' }).close();
      } else {
        writeFont(w, font, true);
      }
    });
    w.close();
  }

  /**
   * Writes `<fills>`. Indexes 0 and 1 are the mandatory `none` and `gray125`.
   */
  #writeFills(w: XmlWriter): void {
    w.open('fills', { count: this.#fills.items.length });
    this.#fills.items.forEach((fill) => {
      w.open('fill');

      if (fill === 'none' || fill === 'gray125') {
        w.leaf('patternFill', { patternType: fill });
      } else {
        // No companion `<bgColor indexed="64"/>`: a solid pattern is fully described by its
        // foreground color, ExcelJS's writer emits none either, and emitting one made ExcelJS's
        // reader surface a `bgColor: { indexed: 64 }` on native-written bytes alone.
        w.open('patternFill', { patternType: 'solid' }).leaf('fgColor', { rgb: fill.fgColor.argb }).close();
      }

      w.close();
    });
    w.close();
  }

  /**
   * Writes `<borders>`. Index 0 is the empty border, written from an empty edge set.
   */
  #writeBorders(w: XmlWriter): void {
    w.open('borders', { count: this.#borders.items.length });
    this.#borders.items.forEach(border => writeBorder(w, border ?? {}));
    w.close();
  }

  /**
   * Writes `<cellXfs>`. Index 0 is the all-default xf `xfIndex` hands out for a cell with nothing
   * to say, and it carries no `apply…` flag at all.
   */
  #writeCellXfs(w: XmlWriter): void {
    w.open('cellXfs', { count: this.#xfs.items.length });
    this.#xfs.items.forEach((xf, index) => {
      if (index === 0) {
        w.leaf('xf', {
          numFmtId: 0, fontId: 0, fillId: 0, borderId: 0, xfId: 0,
        });

        return;
      }

      writeCellXf(w, xf);
    });
    w.close();
  }

  /**
   * Writes `<dxfs>`, which is present even when empty: `styles.xml` needs the bootstrap row.
   */
  #writeDxfs(w: XmlWriter): void {
    if (this.#dxfs.items.length === 0) {
      w.leaf('dxfs', { count: 0 });

      return;
    }

    w.open('dxfs', { count: this.#dxfs.items.length });
    this.#dxfs.items.forEach(dxf => writeDxf(w, dxf));
    w.close();
  }

  /**
   * Returns the id for a format code, allocating a custom id from 164 upwards when needed.
   */
  #numFmtId(code: string): number {
    const builtIn = builtInNumFmtId(code);

    if (builtIn !== undefined) {
      return builtIn;
    }

    const existing = this.#numFmts.get(code);

    if (existing !== undefined) {
      return existing;
    }

    const id = FIRST_CUSTOM_NUM_FMT_ID + this.#numFmts.size;

    this.#numFmts.set(code, id);

    return id;
  }
}

/**
 * Reads an `rgb` attribute as uppercase ARGB, or `undefined` for theme/indexed/auto colors the
 * model cannot carry.
 */
function argbOf(attrs: XmlAttributes): { argb: string } | undefined {
  const { rgb } = attrs;

  if (rgb === undefined || !/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(rgb)) {
    return undefined;
  }

  return { argb: (rgb.length === 6 ? `FF${rgb}` : rgb).toUpperCase() };
}

/**
 * Whether a boolean-valued element (`<b/>`, `<b val="0"/>`) is on.
 */
function flagOn(attrs: XmlAttributes): boolean {
  return attrs.val === undefined || (attrs.val !== '0' && attrs.val !== 'false');
}

/**
 * The four border edges as a set, for the type guard below.
 */
const BORDER_EDGE_SET = new Set<string>(BORDER_EDGES);

/**
 * Whether an element name is one of the four border edges.
 */
function isBorderEdge(name: string): name is (typeof BORDER_EDGES)[number] {
  return BORDER_EDGE_SET.has(name);
}

/**
 * The elements the font state machine owns. `<color>` is one of them: an edge color carries the
 * same element name and is applied separately, one level below its edge.
 */
const FONT_ELEMENTS = new Set(['font', 'b', 'i', 'u', 'color']);

/**
 * The elements the fill state machine owns.
 */
const FILL_ELEMENTS = new Set(['fill', 'patternFill', 'fgColor', 'bgColor']);

/**
 * The elements the cell-format state machine owns.
 */
const XF_ELEMENTS = new Set(['xf', 'alignment', 'protection']);

/**
 * One `<xf>` of `<cellXfs>` while its children are being read.
 */
interface XfState {
  numFmtId: number;
  fontId: number;
  fillId: number;
  borderId: number;
  alignment: Alignment | null;
  locked: boolean | null;
}

/**
 * The object itself when it carries anything, `null` when nothing was read into it.
 */
function nonEmpty<T extends object>(value: T | null): T | null {
  return value && Object.keys(value).length > 0 ? value : null;
}

/**
 * Applies a `<color>` to a font, ignoring a theme or indexed color the model cannot carry.
 */
function applyFontColor(font: Font, attrs: XmlAttributes): void {
  const color = argbOf(attrs);

  if (color) {
    font.color = color;
  }
}

/**
 * Reads an `<alignment>`, or `null` when it declares neither axis.
 */
function readAlignment(attrs: XmlAttributes): Alignment | null {
  const alignment: Alignment = {};

  if (attrs.horizontal !== undefined) {
    alignment.horizontal = attrs.horizontal;
  }

  if (attrs.vertical !== undefined) {
    alignment.vertical = attrs.vertical === 'center' ? 'middle' : attrs.vertical;
  }

  return Object.keys(alignment).length > 0 ? alignment : null;
}

/**
 * The state machine behind `parseStyles`. One instance reads one `xl/styles.xml`: the tokenizer is
 * forward-only, so every table is assembled from an element's open event, its children and its
 * close event, and the fields below are that half-built state.
 */
class StylesParser {
  /**
   * Custom number formats by the id the file gives them.
   */
  #customNumFmts = new Map<number, string>();

  /**
   * The workbook's fonts, by index.
   */
  #fonts: Array<Font | null> = [];

  /**
   * The workbook's fills, by index.
   */
  #fills: Array<Fill | null> = [];

  /**
   * The workbook's borders, by index.
   */
  #borders: Array<Border | null> = [];

  /**
   * The resolved cell formats, in `<cellXfs>` order.
   */
  #cellXfs: ResolvedXf[] = [];

  /**
   * The conditional-formatting styles, in `<dxfs>` order.
   */
  #dxfs: DxfStyle[] = [];

  /**
   * The open elements, innermost last. `#section()` reads the part's top-level table off it.
   */
  #path: string[] = [];

  /**
   * The `<font>` being read.
   */
  #font: Font | null = null;

  /**
   * The `<fill>` being read, when it is one of the workbook's own.
   */
  #fill: Fill | null = null;

  /**
   * The `<border>` being read.
   */
  #border: Border | null = null;

  /**
   * The border edge whose `<color>` child would apply, when one is open.
   */
  #edge: (typeof BORDER_EDGES)[number] | null = null;

  /**
   * The `<xf>` of `<cellXfs>` being read.
   */
  #xf: XfState | null = null;

  /**
   * The `<dxf>` being read.
   */
  #dxf: DxfStyle | null = null;

  /**
   * The `<fill>` being read, when it belongs to a `<dxf>`.
   */
  #dxfFill: { bgColor?: { argb: string }; fgColor?: { argb: string } } | null = null;

  /**
   * Strips the prefix this part's root element carries. Per instance, so it learns the prefix of
   * the one part being read.
   */
  #localName = createLocalName();

  /**
   * Reads the part and returns the tables it resolved.
   */
  parse(xml: string): ParsedStyles {
    tokenizeXml(xml, {
      open: (rawName, attrs, selfClosing) => this.#open(rawName, attrs, selfClosing),
      close: rawName => this.#close(rawName),
    });

    return {
      cellXfs: this.#cellXfs.length > 0 ? this.#cellXfs : EMPTY_STYLES.cellXfs,
      dxfs: this.#dxfs,
    };
  }

  /**
   * The section (`fonts`, `dxfs`, …) the parser is currently inside.
   */
  #section(): string | undefined {
    return this.#path[1];
  }

  /**
   * Handles an element's open event, and its close event too when it is self-closing.
   */
  #open(rawName: string, attrs: XmlAttributes, selfClosing: boolean): void {
    const name = this.#localName(rawName);
    const parent = this.#path[this.#path.length - 1];

    if (!selfClosing) {
      this.#path.push(name);
    }

    this.#openElement(name, attrs, parent);
    this.#applyEdgeColor(name, attrs);

    if (selfClosing) {
      // A self-closing element (`<b/>`, `<xf …/>`, `<protection locked="0"/>`) gets no close
      // event, so its close bookkeeping runs from here.
      this.#close(name);
    }
  }

  /**
   * Routes an open element to the state machine that owns it.
   */
  #openElement(name: string, attrs: XmlAttributes, parent: string | undefined): void {
    if (FONT_ELEMENTS.has(name)) {
      this.#openFontChild(name, attrs, parent);
    } else if (FILL_ELEMENTS.has(name)) {
      this.#openFillChild(name, attrs);
    } else if (name === 'border' || isBorderEdge(name)) {
      this.#openBorderChild(name, attrs);
    } else if (XF_ELEMENTS.has(name)) {
      this.#openXfChild(name, attrs);
    } else if (name === 'numFmt') {
      this.#openNumFmt(attrs);
    } else if (name === 'dxf') {
      this.#dxf = {};
    }
  }

  /**
   * Applies a `<color>` that belongs to a border edge, which lives one level below the edge
   * element and so is matched outside the font's own `<color>` handling.
   */
  #applyEdgeColor(name: string, attrs: XmlAttributes): void {
    if (name === 'color' && this.#edge && this.#border) {
      const side = this.#border[this.#edge];
      const color = argbOf(attrs);

      if (side && color) {
        side.color = color;
      }
    }
  }

  /**
   * Opens a `<numFmt>`, which belongs either to the workbook's table or to a `<dxf>`.
   */
  #openNumFmt(attrs: XmlAttributes): void {
    if (attrs.formatCode === undefined) {
      return;
    }

    const formatCode = attrs.formatCode.replace(/\\(.)/g, '$1');

    // A `<numFmt>` inside a `<dxf>` belongs to that rule's style, not to the workbook's
    // table, so it must not shadow an id the cell formats resolve against.
    if (this.#section() === 'dxfs' && this.#dxf) {
      this.#dxf.numFmt = formatCode;
    } else if (attrs.numFmtId !== undefined) {
      this.#customNumFmts.set(Number(attrs.numFmtId), formatCode);
    }
  }

  /**
   * Opens a `<font>` or one of its children.
   */
  #openFontChild(name: string, attrs: XmlAttributes, parent: string | undefined): void {
    if (name === 'font') {
      this.#font = {};

      return;
    }

    const font = this.#font;

    if (font === null) {
      return;
    }

    if (name === 'b' && flagOn(attrs)) {
      font.bold = true;
    } else if (name === 'i' && flagOn(attrs)) {
      font.italic = true;
    } else if (name === 'u' && attrs.val !== 'none') {
      font.underline = true;
    } else if (name === 'color' && parent === 'font') {
      applyFontColor(font, attrs);
    }
  }

  /**
   * Opens a `<fill>` or one of its children.
   */
  #openFillChild(name: string, attrs: XmlAttributes): void {
    if (name === 'fill') {
      this.#fill = null;
      this.#dxfFill = this.#section() === 'dxfs' ? {} : null;
    } else if (name === 'patternFill') {
      this.#openPatternFill(attrs);
    } else if (name === 'fgColor') {
      this.#openFgColor(attrs);
    } else if (name === 'bgColor') {
      this.#openBgColor(attrs);
    }
  }

  /**
   * Opens a `<patternFill>`. Only a solid pattern of the workbook's own table becomes a fill; its
   * color arrives with the `<fgColor>` child.
   */
  #openPatternFill(attrs: XmlAttributes): void {
    if (this.#section() === 'fills' && attrs.patternType === 'solid') {
      this.#fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
    }
  }

  /**
   * Applies an `<fgColor>` to whichever fill is open. A workbook fill whose color the model cannot
   * carry is dropped whole, because the fill is nothing but that color.
   */
  #openFgColor(attrs: XmlAttributes): void {
    const fill = this.#fill;
    const dxfFill = this.#dxfFill;

    if (fill && this.#section() === 'fills') {
      const color = argbOf(attrs);

      this.#fill = color ? { ...fill, fgColor: color } : null;
    } else if (dxfFill) {
      const color = argbOf(attrs);

      if (color) {
        dxfFill.fgColor = color;
      }
    }
  }

  /**
   * Applies a `<bgColor>`, which only a `<dxf>` fill carries.
   */
  #openBgColor(attrs: XmlAttributes): void {
    const dxfFill = this.#dxfFill;

    if (dxfFill) {
      const color = argbOf(attrs);

      if (color) {
        dxfFill.bgColor = color;
      }
    }
  }

  /**
   * Opens a `<border>` or one of its edges.
   */
  #openBorderChild(name: string, attrs: XmlAttributes): void {
    if (name === 'border') {
      this.#border = {};

      return;
    }

    if (!isBorderEdge(name)) {
      return;
    }

    const border = this.#border;

    if (border && attrs.style !== undefined && attrs.style !== 'none') {
      border[name] = { style: attrs.style };
      this.#edge = name;
    } else {
      this.#edge = null;
    }
  }

  /**
   * Opens an `<xf>` of `<cellXfs>` or one of its children.
   */
  #openXfChild(name: string, attrs: XmlAttributes): void {
    if (name === 'xf') {
      if (this.#section() === 'cellXfs') {
        this.#xf = {
          numFmtId: Number(attrs.numFmtId ?? 0),
          fontId: Number(attrs.fontId ?? 0),
          fillId: Number(attrs.fillId ?? 0),
          borderId: Number(attrs.borderId ?? 0),
          alignment: null,
          locked: null,
        };
      }

      return;
    }

    const xf = this.#xf;

    if (xf === null) {
      return;
    }

    if (name === 'alignment') {
      xf.alignment = readAlignment(attrs);
    } else if (name === 'protection' && (attrs.locked === '0' || attrs.locked === 'false')) {
      xf.locked = false;
    }
  }

  /**
   * Handles an element's close event, whether the tokenizer fired it or `#open` did.
   */
  #close(rawName: string): void {
    const name = this.#localName(rawName);

    if (this.#path[this.#path.length - 1] === name) {
      this.#path.pop();
    }

    this.#closeElement(name);
  }

  /**
   * Routes a closing element to the table it completes.
   */
  #closeElement(name: string): void {
    if (name === 'font') {
      this.#closeFont();
    } else if (name === 'fill') {
      this.#closeFill();
    } else if (isBorderEdge(name)) {
      this.#edge = null;
    } else if (name === 'border') {
      this.#closeBorder();
    } else if (name === 'xf') {
      this.#closeXf();
    } else if (name === 'dxf') {
      this.#closeDxf();
    }
  }

  /**
   * Files a finished `<font>` under the table it belongs to.
   */
  #closeFont(): void {
    const font = nonEmpty(this.#font);

    if (this.#section() === 'dxfs' && this.#dxf) {
      this.#dxf.font = font ?? undefined;
    } else if (this.#section() === 'fonts') {
      this.#fonts.push(font);
    }

    this.#font = null;
  }

  /**
   * Files a finished `<fill>` under the table it belongs to.
   */
  #closeFill(): void {
    const dxfFill = this.#dxfFill;

    if (this.#section() === 'dxfs' && this.#dxf && dxfFill && (dxfFill.bgColor || dxfFill.fgColor)) {
      this.#dxf.fill = { type: 'pattern', pattern: 'solid', ...dxfFill };
    } else if (this.#section() === 'fills') {
      this.#fills.push(this.#fill);
    }

    this.#fill = null;
    this.#dxfFill = null;
  }

  /**
   * Files a finished `<border>` under the table it belongs to.
   */
  #closeBorder(): void {
    const border = nonEmpty(this.#border);

    if (this.#section() === 'dxfs' && this.#dxf) {
      this.#dxf.border = border ?? undefined;
    } else if (this.#section() === 'borders') {
      this.#borders.push(border);
    }

    this.#border = null;
  }

  /**
   * Resolves a finished `<xf>` against the font, fill, border and number-format tables, which are
   * all complete by the time `<cellXfs>` is reached: the schema puts them before it.
   */
  #closeXf(): void {
    const xf = this.#xf;

    if (xf === null) {
      return;
    }

    const numFmt = xf.numFmtId === 0
      ? null
      : this.#customNumFmts.get(xf.numFmtId) ?? BUILT_IN_NUM_FMTS[xf.numFmtId] ?? null;
    const resolvedFont = this.#fonts[xf.fontId] ?? null;
    const resolvedFill = this.#fills[xf.fillId] ?? null;
    const resolvedBorder = this.#borders[xf.borderId] ?? null;
    const hasStyle = xf.alignment !== null || resolvedFont !== null
      || resolvedFill !== null || resolvedBorder !== null;

    this.#cellXfs.push({
      numFmt: numFmt === 'General' ? null : numFmt,
      style: hasStyle
        ? {
          alignment: xf.alignment, font: resolvedFont, fill: resolvedFill, border: resolvedBorder,
        }
        : null,
      locked: xf.locked,
    });
    this.#xf = null;
  }

  /**
   * Files a finished `<dxf>`, whose index is what a `cfRule/@dxfId` points at.
   */
  #closeDxf(): void {
    if (this.#dxf) {
      this.#dxfs.push(this.#dxf);
      this.#dxf = null;
    }
  }
}

/**
 * Parses `xl/styles.xml` into resolved cell formats and conditional-formatting styles.
 */
export function parseStyles(xml: string): ParsedStyles {
  return new StylesParser().parse(xml);
}
