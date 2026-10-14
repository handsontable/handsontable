import { copyPassiveContent, visibleText } from './passiveContent';

/**
 * The inherited computed text styles a content copy carries over from its cell, so it keeps its
 * font, color, and alignment outside the grid's own selectors.
 */
const INHERITED_TEXT_PROPERTIES = [
  'color',
  'direction',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'letter-spacing',
  'line-height',
  'overflow-wrap',
  'text-align',
  'white-space',
  'word-break',
];

/**
 * The computed text styles a content copy carries over from its cell that do not inherit, so
 * each copy writes them itself. A copy that took them with `inherit` would be restyled on every
 * frame its animating parent changes.
 */
const BOX_TEXT_PROPERTIES = [
  'padding-bottom',
  'padding-left',
  'padding-right',
  'padding-top',
  'text-decoration-line',
  'text-overflow',
];

/**
 * The prefix of the custom property that carries each of `BOX_TEXT_PROPERTIES`, and the
 * `justify-content`, on a side of a column group (`_sheets-bar.scss` reads them).
 */
const BOX_VARIABLE_PREFIX = '--ht-private-sheet-switch-cell-';

/**
 * Every computed text style a content copy carries over from its cell.
 */
const TEXT_STYLE_PROPERTIES = [...INHERITED_TEXT_PROPERTIES, ...BOX_TEXT_PROPERTIES];

/**
 * The computed styles an element inside a content copy carries over from its source element.
 * A header label's wrapper, for example, takes its padding and flex layout from selectors that
 * only match inside a header cell, and a header's sort indicator and menu button take their
 * size, their surface, and their centering transform from them.
 */
const DESCENDANT_STYLE_PROPERTIES = [
  ...TEXT_STYLE_PROPERTIES,
  'align-items',
  'background-color',
  'border-color',
  'border-radius',
  'border-style',
  'border-width',
  'bottom',
  'box-sizing',
  'display',
  'flex-basis',
  'flex-direction',
  'flex-grow',
  'flex-shrink',
  'gap',
  'justify-content',
  'left',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'margin-top',
  'max-height',
  'max-width',
  'min-height',
  'min-width',
  'opacity',
  'overflow',
  'position',
  'right',
  'top',
  'transform',
  'vertical-align',
  'visibility',
];

/**
 * The computed size an element inside a content copy carries over from its source element when it
 * draws no text: a header's menu button or a hidden-column caret, sized by selectors that only
 * match inside the grid. An element that draws text takes its size from that text, which differs
 * from cell to cell, so it is laid out again in the copy.
 */
const DESCENDANT_SIZE_PROPERTIES = ['height', 'width'];

/**
 * The cell classes that draw a mark on the cell itself, through a pseudo-element a copy of the
 * cell's content cannot carry, by the name of the mark a copy draws in their place.
 */
const CELL_MARK_CLASSES: Array<[string, string]> = [
  ['htCommentCell', 'comment'],
];

/**
 * Maps a cell's `vertical-align` to the flex alignment that places a copy's content the same way.
 */
const VERTICAL_ALIGNMENT: Record<string, string> = {
  top: 'flex-start',
  middle: 'center',
  bottom: 'flex-end',
};

/**
 * How a cell places its single line of text: the measures that decide where the line box sits
 * inside the cell's padding box.
 */
export interface LineMetrics {
  /**
   * The line height, in pixels.
   */
  lineHeight: number;
  /**
   * The top padding, in pixels.
   */
  paddingTop: number;
  /**
   * The bottom padding, in pixels.
   */
  paddingBottom: number;
  /**
   * The cell's `vertical-align`: `top`, `middle`, or `bottom`.
   */
  verticalAlign: string;
}

/**
 * The text styles of a cell, as inline declarations and as line metrics.
 */
export interface TextStyle {
  /**
   * The inline declarations of the inherited text styles, which a copy may take from its parent.
   */
  declarations: string;
  /**
   * The inline declarations of the text styles that do not inherit, which a copy writes when they
   * differ from the ones its side carries as variables.
   */
  boxDeclarations: string;
  /**
   * The same text styles as custom properties, which a side of a column group carries for the
   * copies whose own styles match: the copy rule reads them, so a copy writes no declaration of
   * them, and a custom property is no `inherit`, so an animating side restyles none of its copies.
   */
  boxVariables: string;
  /**
   * The cell's line metrics, or `null` when its line height is not a pixel length or its
   * vertical alignment is not one a copy can reproduce.
   */
  metrics: LineMetrics | null;
}

/**
 * The content of a cell, kept for a copy.
 */
export interface CellContent {
  /**
   * The cell's text when its content is one text node, or the text it shows when its content
   * holds an element a copy may not contain, otherwise `null`.
   */
  text: string | null;
  /**
   * A copy of any other content, built from the elements that only draw, or `null` for text.
   */
  fragment: DocumentFragment | null;
  /**
   * The marks the cell draws on itself, such as a comment's corner, which the copy draws too.
   */
  marks: string[];
}

/**
 * Writes property and value pairs as inline declarations, each name prefixed.
 */
function declarationsOf(values: Array<[string, string]>, prefix = ''): string {
  return values.map(([name, value]) => `${prefix}${name}:${value};`).join('');
}

/**
 * Identifies what decides a cell's styling: its tag, its classes, its row's classes, and its
 * inline styles.
 */
function styleKey(element: Element): string {
  const rowClassName = element.parentElement?.getAttribute('class') ?? '';
  const className = element.getAttribute('class') ?? '';

  return `${element.tagName}|${className}|${rowClassName}|${element.getAttribute('style') ?? ''}`;
}

/**
 * Reads computed cell styles, once per distinct cell styling.
 */
export class CellStyles {
  /**
   * The window the styles are computed in.
   */
  readonly #rootWindow: Window;
  /**
   * The text styles by cell styling key.
   */
  readonly #text = new Map<string, TextStyle>();
  /**
   * The background colors by cell styling key.
   */
  readonly #background = new Map<string, string>();
  /**
   * The styles of elements inside cells, by cell and element styling key.
   */
  readonly #descendant = new Map<string, string>();

  /**
   * Binds the reader to the window the cells live in.
   */
  constructor(rootWindow: Window) {
    this.#rootWindow = rootWindow;
  }

  /**
   * Returns the text styles of a cell.
   */
  textStyle(element: HTMLElement): TextStyle {
    const key = styleKey(element);
    let style = this.#text.get(key);

    if (style === undefined) {
      const computed = this.#rootWindow.getComputedStyle(element);
      const verticalAlign = computed.getPropertyValue('vertical-align');
      const justify = VERTICAL_ALIGNMENT[verticalAlign];
      const lineHeight = computed.getPropertyValue('line-height');
      const valuesOf = (names: string[]): Array<[string, string]> => names
        .map(name => [name, computed.getPropertyValue(name)]);
      const boxValues = valuesOf(BOX_TEXT_PROPERTIES).concat([['justify-content', justify ?? 'flex-start']]);

      style = {
        declarations: declarationsOf(valuesOf(INHERITED_TEXT_PROPERTIES)),
        boxDeclarations: declarationsOf(boxValues),
        boxVariables: declarationsOf(boxValues, BOX_VARIABLE_PREFIX),
        metrics: justify === undefined || !lineHeight.endsWith('px') ? null : {
          lineHeight: Number.parseFloat(lineHeight),
          paddingTop: Number.parseFloat(computed.getPropertyValue('padding-top')),
          paddingBottom: Number.parseFloat(computed.getPropertyValue('padding-bottom')),
          verticalAlign,
        },
      };
      this.#text.set(key, style);
    }

    return style;
  }

  /**
   * Returns the cell's computed background color.
   */
  background(element: HTMLElement): string {
    const key = styleKey(element);
    let color = this.#background.get(key);

    if (color === undefined) {
      color = this.#rootWindow.getComputedStyle(element).getPropertyValue('background-color');
      this.#background.set(key, color);
    }

    return color;
  }

  /**
   * Keeps a cell's content for a copy: its text when it is a single text node, otherwise a copy
   * built from the elements that only draw, each carrying the computed styles of its source
   * element (`copyPassiveContent()`). A cell holding any other element is kept as its visible
   * text, drawn with the cell's text styles. Also keeps the marks the cell draws on itself.
   */
  content(element: HTMLElement): CellContent {
    const { childNodes, classList } = element;
    const marks = CELL_MARK_CLASSES.filter(([className]) => classList.contains(className)).map(([, mark]) => mark);

    if (childNodes.length === 1 && childNodes[0].nodeType === element.TEXT_NODE) {
      return { text: childNodes[0].nodeValue ?? '', fragment: null, marks };
    }

    const cellKey = `${styleKey(element)}|${element.clientWidth}x${element.clientHeight}`;
    const fragment = copyPassiveContent(element, source => this.#descendantStyle(cellKey, source));

    return fragment === null
      ? { text: visibleText(element), fragment: null, marks }
      : { text: null, fragment, marks };
  }

  /**
   * Returns the inline styles that make a copied element inside a cell look like its source. The
   * cell key carries the cell's size, so a size an element resolves against its cell is never
   * taken from a cell of another size.
   */
  #descendantStyle(cellKey: string, element: Element): string {
    const isSized = (element.textContent ?? '').trim() === '';
    const key = `${cellKey}>${styleKey(element)}${isSized ? '|sized' : ''}`;
    let style = this.#descendant.get(key);

    if (style === undefined) {
      const computed = this.#rootWindow.getComputedStyle(element);
      const names = isSized
        ? [...DESCENDANT_STYLE_PROPERTIES, ...DESCENDANT_SIZE_PROPERTIES]
        : DESCENDANT_STYLE_PROPERTIES;

      style = names.map(name => `${name}:${computed.getPropertyValue(name)};`).join('');
      this.#descendant.set(key, style);
    }

    return style;
  }
}
