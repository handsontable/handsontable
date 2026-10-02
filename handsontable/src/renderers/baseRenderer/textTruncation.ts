import type { CellProperties } from '../../settings';

/**
 * The class a cell gets when its text is truncated to a single line with an ellipsis.
 *
 * @type {string}
 */
export const TEXT_ELLIPSIS_CLASS_NAME = 'htTextEllipsis';

/**
 * The class a cell gets when its text is clamped to a number of lines.
 *
 * @type {string}
 */
export const TEXT_LINE_CLAMP_CLASS_NAME = 'htTextLineClamp';

/**
 * The class of the element inside a clamped cell that holds the text. A table cell can't clamp its own
 * lines (`-webkit-line-clamp` needs a box that is not a table cell), so the text renderer writes the
 * value into this wrapper.
 *
 * @type {string}
 */
export const LINE_CLAMP_WRAPPER_CLASS_NAME = 'htLineClamp';

/**
 * The CSS custom property that carries the number of lines on the wrapper element.
 *
 * @type {string}
 */
export const LINE_CLAMP_CSS_VARIABLE = '--ht-text-line-clamp';

/**
 * The way a cell truncates its text.
 *
 * - `none` - the text wraps and is never truncated.
 * - `ellipsis` - the text stays on one line and ends with an ellipsis.
 * - `clamp` - the text wraps and ends with an ellipsis after `lines` lines.
 */
export type TextTruncation = Readonly<
  | { mode: 'none' }
  | { mode: 'ellipsis' }
  | { mode: 'clamp'; lines: number }
>;

const NO_TRUNCATION: TextTruncation = Object.freeze({ mode: 'none' });
const ELLIPSIS_TRUNCATION: TextTruncation = Object.freeze({ mode: 'ellipsis' });

/**
 * Resolves the `textEllipsis` option of a cell into the way the cell truncates its text.
 *
 * A boolean keeps its meaning: `true` is a single line with an ellipsis. An integer of `1` is the same
 * single line, and an integer of `2` or more clamps the text to that many lines. A number that is not
 * a positive integer (`0`, a negative, a fraction, `NaN`, `Infinity`) falls back to the default, `false`.
 * Any other truthy value keeps acting as `true`, as it did before the option accepted numbers.
 *
 * The `wordWrap: false` option wins over a line count: the text can't wrap, so it stays on one line.
 *
 * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
 * @returns {TextTruncation}
 */
export function getTextTruncation(cellProperties: CellProperties): TextTruncation {
  const option: unknown = cellProperties.textEllipsis;

  if (typeof option === 'number') {
    if (!Number.isInteger(option) || option < 1) {
      return NO_TRUNCATION;
    }

    if (option === 1 || cellProperties.wordWrap === false) {
      return ELLIPSIS_TRUNCATION;
    }

    return { mode: 'clamp', lines: option };
  }

  return option ? ELLIPSIS_TRUNCATION : NO_TRUNCATION;
}
