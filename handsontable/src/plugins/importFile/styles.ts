import type { CellStyleSnapshot } from '../../utils/xlsxEngine/model';
import { READ_ONLY_FILL_ARGB, READ_ONLY_TEXT_ARGB } from '../../utils/xlsxEngine/readOnlyStyle';

/**
 * Prefix of every generated class name.
 */
export const IMPORTED_CLASS_PREFIX = 'htImported-';

/**
 * Excel's horizontal alignment values, mapped to the Handsontable alignment classes.
 *
 * Every read of these three tables goes through `Object.hasOwn`. They are plain objects, so a
 * workbook naming `constructor`, `toString` or `valueOf` — all legal text in an XML attribute —
 * would otherwise resolve to an inherited `Object.prototype` member and put a function into a class
 * list or a border width.
 */
const HORIZONTAL_CLASS: Record<string, string> = {
  left: 'htLeft', center: 'htCenter', right: 'htRight', justify: 'htJustify',
};

/**
 * Excel's vertical alignment values, mapped to the Handsontable alignment classes.
 */
const VERTICAL_CLASS: Record<string, string> = { top: 'htTop', middle: 'htMiddle', bottom: 'htBottom' };

/**
 * Excel's border styles, mapped to the pixel widths the `customBorders` plugin takes.
 */
const BORDER_WIDTH: Record<string, number> = { thin: 1, medium: 2, thick: 3 };

/**
 * The width an unknown or unmapped border style falls back to.
 */
const DEFAULT_BORDER_WIDTH = 1;

/**
 * Reads one of the lookup tables above only when the key is the table's own, never an inherited
 * `Object.prototype` member.
 */
function lookup<T>(table: Record<string, T>, key: string): T | undefined {
  return Object.hasOwn(table, key) ? table[key] : undefined;
}

/**
 * Shape a color read from a workbook must have before it may reach a CSS declaration: six or eight
 * hexadecimal digits and nothing else. ExcelJS hands back the raw `rgb` attribute of the file, so
 * an attacker-authored workbook can put arbitrary text there.
 */
const ARGB_PATTERN = /^[0-9a-fA-F]{6}$|^[0-9a-fA-F]{8}$/;

/**
 * Converts an ARGB (or RGB) hex string to a CSS `#rrggbb` color, or `null` when the workbook's
 * value is not a plain hex color.
 *
 * The `null` is a security boundary, not a nicety: the generated declarations are concatenated into
 * a stylesheet rule, so a value carrying `}` would close the rule and let the file inject CSS of its
 * own (`0000ff}*{background-image:url(https://attacker.example/x)}`). Every caller must treat `null`
 * as "this cell has no such color" rather than falling back to the raw string.
 */
export function argbToCssHex(argb: string): string | null {
  if (!ARGB_PATTERN.test(argb)) {
    return null;
  }

  const rgb = argb.length === 8 ? argb.slice(2) : argb;

  return `#${rgb.toLowerCase()}`;
}

/**
 * Maps Excel alignment to the Handsontable alignment class names the export reads back.
 */
export function alignmentClassNames(alignment: CellStyleSnapshot['alignment']): string[] {
  const classes: string[] = [];

  const horizontal = alignment?.horizontal ? lookup(HORIZONTAL_CLASS, alignment.horizontal) : undefined;
  const vertical = alignment?.vertical ? lookup(VERTICAL_CLASS, alignment.vertical) : undefined;

  if (horizontal) {
    classes.push(horizontal);
  }

  if (vertical) {
    classes.push(vertical);
  }

  return classes;
}

/**
 * Stable djb2 hash of a string, base36, so the same declarations always yield the same class.
 */
export function styleHash(declarations: string): string {
  /* eslint-disable no-bitwise */
  let hash = 5381;

  for (let index = 0; index < declarations.length; index++) {
    hash = ((hash * 33) ^ declarations.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
  /* eslint-enable no-bitwise */
}

/**
 * Pushes one color declaration onto a rule's parts, skipping a color the workbook did not set, the
 * export's own read-only sentinel on a read-only cell, and any value that is not a plain hex color.
 */
function pushColorDeclaration(
  parts: string[], property: string, argb: string | undefined, sentinel: string | null
): void {
  if (!argb || argb === sentinel) {
    return;
  }

  const color = argbToCssHex(argb);

  if (color !== null) {
    parts.push(`${property}:${color}`);
  }
}

/**
 * One generated CSS rule: the class a cell gets and the declarations behind it.
 */
export interface StyleRule {
  className: string;
  declarations: string;
}

/**
 * Builds the font and fill rule for a cell, or `null` when there is nothing to paint. On a
 * read-only cell the export's grey sentinel colors are skipped, since the grid paints those itself.
 */
export function fontFillRule(style: CellStyleSnapshot, options: { readOnly: boolean }): StyleRule | null {
  const parts: string[] = [];
  const { font, fill } = style;

  if (font?.bold) {
    parts.push('font-weight:bold');
  }

  if (font?.italic) {
    parts.push('font-style:italic');
  }

  if (font?.underline) {
    parts.push('text-decoration:underline');
  }

  pushColorDeclaration(parts, 'color', font?.color?.argb, options.readOnly ? READ_ONLY_TEXT_ARGB : null);
  pushColorDeclaration(
    parts, 'background-color', fill?.fgColor?.argb, options.readOnly ? READ_ONLY_FILL_ARGB : null
  );

  if (parts.length === 0) {
    return null;
  }

  const declarations = parts.join(';');

  return { className: `${IMPORTED_CLASS_PREFIX}${styleHash(declarations)}`, declarations };
}

/**
 * A `customBorders` setting entry for one cell. Excel's left/right become the plugin's start/end.
 */
export interface ImportedBorder {
  row: number;
  col: number;
  top?: { width: number; color: string };
  bottom?: { width: number; color: string };
  start?: { width: number; color: string };
  end?: { width: number; color: string };
}

/**
 * Maps one Excel border to a `customBorders` entry, or `null` when no side is set.
 */
export function borderEntry(border: CellStyleSnapshot['border'], row: number, col: number): ImportedBorder | null {
  if (!border) {
    return null;
  }

  type GridSide = 'top' | 'bottom' | 'start' | 'end';

  const sides: Array<['top' | 'bottom' | 'left' | 'right', GridSide]> = [
    ['top', 'top'], ['bottom', 'bottom'], ['left', 'start'], ['right', 'end'],
  ];
  const entry = { row, col } as ImportedBorder & Record<GridSide, { width: number; color: string }>;
  let hasSide = false;

  sides.forEach(([excelSide, gridSide]) => {
    const side = border[excelSide];

    if (side) {
      entry[gridSide] = {
        width: lookup(BORDER_WIDTH, side.style) ?? DEFAULT_BORDER_WIDTH,
        color: (side.color?.argb ? argbToCssHex(side.color.argb) : null) ?? '#000000',
      };
      hasSide = true;
    }
  });

  return hasSide ? entry : null;
}
