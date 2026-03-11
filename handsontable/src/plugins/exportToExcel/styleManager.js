/**
 * Manages Excel styles and produces the styles.xml content for XLSX export.
 *
 * Tracks unique combinations of font, fill, border, and number format properties
 * and assigns style indexes (xfId) that cells reference.
 *
 * @private
 */
export class StyleManager {
  #fonts = [];
  #fills = [];
  #borders = [];
  #numberFormats = [];
  #cellXfs = [];
  #fontKeyMap = new Map();
  #fillKeyMap = new Map();
  #borderKeyMap = new Map();
  #numFmtKeyMap = new Map();
  #xfKeyMap = new Map();
  #nextNumFmtId = 164;

  constructor() {
    this.#addDefaultFont();
    this.#addDefaultFills();
    this.#addDefaultBorder();
    this.#addDefaultCellXf();
  }

  /**
   * Register a cell style and return its xf index.
   *
   * @param {object} style The style descriptor.
   * @param {object} [style.font] Font properties.
   * @param {boolean} [style.font.bold] Bold text.
   * @param {boolean} [style.font.italic] Italic text.
   * @param {boolean} [style.font.underline] Underlined text.
   * @param {string} [style.font.color] Font color as hex (e.g. `'FF0000'`).
   * @param {number} [style.font.size] Font size in points.
   * @param {object} [style.fill] Fill properties.
   * @param {string} [style.fill.color] Background color as hex (e.g. `'FFFF00'`).
   * @param {object} [style.border] Border properties.
   * @param {object} [style.border.top] Top border.
   * @param {object} [style.border.bottom] Bottom border.
   * @param {object} [style.border.left] Left border.
   * @param {object} [style.border.right] Right border.
   * @param {object} [style.alignment] Alignment properties.
   * @param {string} [style.alignment.horizontal] Horizontal alignment.
   * @param {string} [style.alignment.vertical] Vertical alignment.
   * @param {boolean} [style.alignment.wrapText] Wrap text.
   * @param {string} [style.numberFormat] Excel number format string.
   * @returns {number} The xf index for use in worksheet cells.
   */
  registerStyle(style) {
    const fontId = this.#getOrCreateFont(style.font);
    const fillId = this.#getOrCreateFill(style.fill);
    const borderId = this.#getOrCreateBorder(style.border);
    const numFmtId = this.#getOrCreateNumberFormat(style.numberFormat);
    const alignment = style.alignment || null;

    const key = `${fontId}|${fillId}|${borderId}|${numFmtId}|${JSON.stringify(alignment)}`;

    if (this.#xfKeyMap.has(key)) {
      return this.#xfKeyMap.get(key);
    }

    const index = this.#cellXfs.length;

    this.#cellXfs.push({ fontId, fillId, borderId, numFmtId, alignment });
    this.#xfKeyMap.set(key, index);

    return index;
  }

  /**
   * Generate the styles.xml content.
   *
   * @returns {string}
   */
  toXml() {
    const parts = [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
      ' xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"',
      ' mc:Ignorable="x14ac"',
      ' xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">',
    ];

    this.#writeNumberFormats(parts);
    this.#writeFonts(parts);
    this.#writeFills(parts);
    this.#writeBorders(parts);
    this.#writeCellXfs(parts);
    parts.push('</styleSheet>');

    return parts.join('');
  }

  /**
   * Add the default font (Calibri 11pt).
   */
  #addDefaultFont() {
    this.#fonts.push({
      bold: false,
      italic: false,
      underline: false,
      color: null,
      size: 11,
      name: 'Calibri',
    });
    this.#fontKeyMap.set('default', 0);
  }

  /**
   * Add the two required default fills (none and gray125).
   */
  #addDefaultFills() {
    this.#fills.push({ pattern: 'none', color: null });
    this.#fills.push({ pattern: 'gray125', color: null });
    this.#fillKeyMap.set('none|null', 0);
    this.#fillKeyMap.set('gray125|null', 1);
  }

  /**
   * Add the default empty border.
   */
  #addDefaultBorder() {
    this.#borders.push({ top: null, bottom: null, left: null, right: null });
    this.#borderKeyMap.set('null|null|null|null', 0);
  }

  /**
   * Add the default cell format (xf index 0).
   */
  #addDefaultCellXf() {
    this.#cellXfs.push({
      fontId: 0,
      fillId: 0,
      borderId: 0,
      numFmtId: 0,
      alignment: null,
    });
    this.#xfKeyMap.set('0|0|0|0|null', 0);
  }

  /**
   * Get or create a font entry.
   *
   * @param {object} [font] Font properties.
   * @returns {number} Font index.
   */
  #getOrCreateFont(font) {
    if (!font) {
      return 0;
    }

    const key = `${font.bold || false}|${font.italic || false}` +
      `|${font.underline || false}|${font.color || 'null'}|${font.size || 11}`;

    if (this.#fontKeyMap.has(key)) {
      return this.#fontKeyMap.get(key);
    }

    const index = this.#fonts.length;

    this.#fonts.push({
      bold: font.bold || false,
      italic: font.italic || false,
      underline: font.underline || false,
      color: font.color || null,
      size: font.size || 11,
      name: 'Calibri',
    });
    this.#fontKeyMap.set(key, index);

    return index;
  }

  /**
   * Get or create a fill entry.
   *
   * @param {object} [fill] Fill properties.
   * @returns {number} Fill index.
   */
  #getOrCreateFill(fill) {
    if (!fill || !fill.color) {
      return 0;
    }

    const key = `solid|${fill.color}`;

    if (this.#fillKeyMap.has(key)) {
      return this.#fillKeyMap.get(key);
    }

    const index = this.#fills.length;

    this.#fills.push({ pattern: 'solid', color: fill.color });
    this.#fillKeyMap.set(key, index);

    return index;
  }

  /**
   * Get or create a border entry.
   *
   * @param {object} [border] Border properties.
   * @returns {number} Border index.
   */
  #getOrCreateBorder(border) {
    if (!border) {
      return 0;
    }

    const topKey = this.#borderSideKey(border.top);
    const bottomKey = this.#borderSideKey(border.bottom);
    const leftKey = this.#borderSideKey(border.left);
    const rightKey = this.#borderSideKey(border.right);
    const key = `${topKey}|${bottomKey}|${leftKey}|${rightKey}`;

    if (this.#borderKeyMap.has(key)) {
      return this.#borderKeyMap.get(key);
    }

    const index = this.#borders.length;

    this.#borders.push({
      top: border.top || null,
      bottom: border.bottom || null,
      left: border.left || null,
      right: border.right || null,
    });
    this.#borderKeyMap.set(key, index);

    return index;
  }

  /**
   * Create a cache key for a single border side.
   *
   * @param {object} [side] Border side properties.
   * @returns {string}
   */
  #borderSideKey(side) {
    if (!side) {
      return 'null';
    }

    return `${side.style || 'thin'}:${side.color || '000000'}`;
  }

  /**
   * Get or create a number format entry.
   *
   * @param {string} [format] Excel number format string.
   * @returns {number} Number format ID.
   */
  #getOrCreateNumberFormat(format) {
    if (!format) {
      return 0;
    }

    if (this.#numFmtKeyMap.has(format)) {
      return this.#numFmtKeyMap.get(format);
    }

    const id = this.#nextNumFmtId;

    this.#nextNumFmtId += 1;

    this.#numberFormats.push({ id, formatCode: format });
    this.#numFmtKeyMap.set(format, id);

    return id;
  }

  /**
   * Write the numFmts element.
   *
   * @param {string[]} parts XML parts array.
   */
  #writeNumberFormats(parts) {
    if (this.#numberFormats.length === 0) {
      return;
    }

    parts.push(`<numFmts count="${this.#numberFormats.length}">`);

    this.#numberFormats.forEach((fmt) => {
      parts.push(`<numFmt numFmtId="${fmt.id}" formatCode="${escapeXml(fmt.formatCode)}"/>`);
    });

    parts.push('</numFmts>');
  }

  /**
   * Write the fonts element.
   *
   * @param {string[]} parts XML parts array.
   */
  #writeFonts(parts) {
    parts.push(`<fonts count="${this.#fonts.length}" x14ac:knownFonts="1">`);

    this.#fonts.forEach((font) => {
      parts.push('<font>');

      if (font.bold) {
        parts.push('<b/>');
      }
      if (font.italic) {
        parts.push('<i/>');
      }
      if (font.underline) {
        parts.push('<u/>');
      }

      parts.push(`<sz val="${font.size}"/>`);

      if (font.color) {
        parts.push(`<color rgb="FF${font.color}"/>`);
      } else {
        parts.push('<color theme="1"/>');
      }

      parts.push(`<name val="${escapeXml(font.name)}"/>`);
      parts.push('</font>');
    });

    parts.push('</fonts>');
  }

  /**
   * Write the fills element.
   *
   * @param {string[]} parts XML parts array.
   */
  #writeFills(parts) {
    parts.push(`<fills count="${this.#fills.length}">`);

    this.#fills.forEach((fill) => {
      parts.push('<fill>');

      if (fill.pattern === 'none') {
        parts.push('<patternFill patternType="none"/>');
      } else if (fill.pattern === 'gray125') {
        parts.push('<patternFill patternType="gray125"/>');
      } else {
        parts.push('<patternFill patternType="solid">');
        parts.push(`<fgColor rgb="FF${fill.color}"/>`);
        parts.push('<bgColor indexed="64"/>');
        parts.push('</patternFill>');
      }

      parts.push('</fill>');
    });

    parts.push('</fills>');
  }

  /**
   * Write the borders element.
   *
   * @param {string[]} parts XML parts array.
   */
  #writeBorders(parts) {
    parts.push(`<borders count="${this.#borders.length}">`);

    this.#borders.forEach((border) => {
      parts.push('<border>');
      parts.push(this.#borderSideXml('left', border.left));
      parts.push(this.#borderSideXml('right', border.right));
      parts.push(this.#borderSideXml('top', border.top));
      parts.push(this.#borderSideXml('bottom', border.bottom));
      parts.push('<diagonal/>');
      parts.push('</border>');
    });

    parts.push('</borders>');
  }

  /**
   * Generate XML for a single border side.
   *
   * @param {string} name The border side name.
   * @param {object} [side] Border side properties.
   * @returns {string}
   */
  #borderSideXml(name, side) {
    if (!side) {
      return `<${name}/>`;
    }

    const style = side.style || 'thin';
    const color = side.color || '000000';

    return `<${name} style="${style}"><color rgb="FF${color}"/></${name}>`;
  }

  /**
   * Write the cellXfs element.
   *
   * @param {string[]} parts XML parts array.
   */
  #writeCellXfs(parts) {
    parts.push(`<cellXfs count="${this.#cellXfs.length}">`);

    this.#cellXfs.forEach((xf) => {
      const applyFont = xf.fontId > 0 ? ' applyFont="1"' : '';
      const applyFill = xf.fillId > 0 ? ' applyFill="1"' : '';
      const applyBorder = xf.borderId > 0 ? ' applyBorder="1"' : '';
      const applyNumFmt = xf.numFmtId > 0 ? ' applyNumberFormat="1"' : '';
      const applyAlignment = xf.alignment ? ' applyAlignment="1"' : '';

      const xfAttrs = `numFmtId="${xf.numFmtId}" fontId="${xf.fontId}"` +
        ` fillId="${xf.fillId}" borderId="${xf.borderId}"`;
      const applyAttrs = `${applyFont}${applyFill}${applyBorder}` +
        `${applyNumFmt}${applyAlignment}`;

      if (xf.alignment) {
        parts.push(`<xf ${xfAttrs}${applyAttrs}>`);
        parts.push(this.#alignmentXml(xf.alignment));
        parts.push('</xf>');
      } else {
        parts.push(`<xf ${xfAttrs}${applyAttrs}/>`);
      }
    });

    parts.push('</cellXfs>');
  }

  /**
   * Generate the alignment XML element.
   *
   * @param {object} alignment Alignment properties.
   * @returns {string}
   */
  #alignmentXml(alignment) {
    const attrs = [];

    if (alignment.horizontal) {
      attrs.push(`horizontal="${alignment.horizontal}"`);
    }
    if (alignment.vertical) {
      attrs.push(`vertical="${alignment.vertical}"`);
    }
    if (alignment.wrapText) {
      attrs.push('wrapText="1"');
    }

    return `<alignment ${attrs.join(' ')}/>`;
  }
}

/**
 * Escape special XML characters in a string.
 *
 * @param {string} str The input string.
 * @returns {string}
 */
export function escapeXml(str) {
  if (typeof str !== 'string') {
    return String(str ?? '');
  }

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
