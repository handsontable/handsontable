import { PANE_CLASSES, type GridBox, type VisibleCell } from './visibleCells';
import type { CellContent, TextStyle } from './cellStyles';

/**
 * The class of the layer that draws the content swap, and the prefix of its parts.
 */
export const LAYER_CLASS = 'ht-sheet-switch';

/**
 * The largest difference, in pixels, two measures may have and still count as equal.
 */
const TOLERANCE = 0.01;

/**
 * The grid's own origin, which the pane boxes are relative to.
 */
const GRID_ORIGIN: GridBox = { left: 0, top: 0, width: 0, height: 0 };

/**
 * Which way a copy moves: the outgoing sheet's copies leave, the arriving sheet's enter.
 */
export type CopySide = 'in' | 'out';

/**
 * A copy of one cell's content.
 */
export interface CopyEntry {
  /**
   * The cell the content comes from.
   */
  cell: VisibleCell;
  /**
   * The cell's text styles.
   */
  style: TextStyle;
  /**
   * The cell's content.
   */
  content: CellContent;
}

/**
 * A cover that hides one cell's real arriving content.
 */
interface CoverEntry {
  /**
   * The cell the cover hides.
   */
  cell: VisibleCell;
  /**
   * The cell's background color.
   */
  background: string;
}

/**
 * Everything one pane draws, collected before the elements are built.
 */
interface PaneEntries {
  /**
   * The pane's visible box, relative to the grid.
   */
  box: GridBox;
  /**
   * The covers of each column group, by group position.
   */
  covers: Map<number, CoverEntry[]>;
  /**
   * The copies of each column group, by group position and side.
   */
  groups: Map<number, Record<CopySide, CopyEntry[]>>;
}

/**
 * Writes a box as an absolute position relative to an origin.
 */
function boxStyle(left: number, top: number, width: number, height: number, origin: GridBox): string {
  return `left:${left - origin.left}px;top:${top - origin.top}px;width:${width}px;height:${height}px;`;
}

/**
 * Tells whether two numbers are equal within the tolerance.
 */
function same(first: number, second: number): boolean {
  return Math.abs(first - second) <= TOLERANCE;
}

/**
 * Splits items, sorted by their top edge, into runs of evenly spaced items of one kind: the
 * same horizontal box and height, the same `kind`, and the same distance between tops.
 */
function evenRuns<T extends { cell: VisibleCell }>(items: T[], kind: (item: T) => string): T[][] {
  const sorted = items.slice().sort((first, second) => first.cell.box.top - second.cell.box.top);
  const runs: T[][] = [];
  let run: T[] = [];

  sorted.forEach((item) => {
    const first = run[0]?.cell.box;
    const last = run[run.length - 1]?.cell.box;
    const { box } = item.cell;
    const fits = first !== undefined && kind(run[0]) === kind(item)
      && same(first.left, box.left) && same(first.width, box.width) && same(first.height, box.height)
      && box.top - last.top > box.height
      && (run.length < 2 || same(box.top - last.top, run[1].cell.box.top - first.top));

    if (fits) {
      run.push(item);
    } else {
      run = [item];
      runs.push(run);
    }
  });

  return runs;
}

/**
 * Tells whether a copy can be drawn as one line of a column of lines: single-line text whose
 * line box position is known, in a cell that draws no mark of its own. A mark is drawn on the
 * copy's box, which a line shares with the other cells of its column.
 */
function isLine(entry: CopyEntry): boolean {
  const { text, marks } = entry.content;
  const { metrics } = entry.style;

  return text !== null && !text.includes('\n') && metrics !== null && marks.length === 0
    && entry.cell.box.height < metrics.paddingTop + metrics.paddingBottom + (2 * metrics.lineHeight);
}

/**
 * Returns the distance from a cell's top padding edge to the top of its line box.
 */
function lineOffset(entry: CopyEntry): number {
  const metrics = entry.style.metrics;

  if (metrics === null) {
    return 0;
  }

  const { lineHeight, paddingTop, paddingBottom, verticalAlign } = metrics;
  const { height } = entry.cell.box;

  if (verticalAlign === 'middle') {
    return paddingTop + ((height - paddingTop - paddingBottom - lineHeight) / 2);
  }

  return verticalAlign === 'bottom' ? height - paddingBottom - lineHeight : paddingTop;
}

/**
 * Returns the box of a column group, relative to the grid: from the leftmost to the rightmost
 * edge of its cells, and as tall as its pane.
 */
function columnBox(entries: CopyEntry[], pane: GridBox): GridBox {
  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;

  entries.forEach(({ cell: { box } }) => {
    left = Math.min(left, box.left);
    right = Math.max(right, box.left + box.width);
  });

  return { left, top: pane.top, width: right - left, height: pane.height };
}

/**
 * The least horizontal overlap, in pixels, that counts two column groups' copies as drawn over
 * each other. Cells that only share an edge stay apart.
 */
const OVERLAP_THRESHOLD = 0.5;

/**
 * Returns the horizontal span of a set of copies, or `null` for none.
 */
function horizontalSpan(entries: CopyEntry[]): { left: number, right: number } | null {
  if (entries.length === 0) {
    return null;
  }

  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;

  entries.forEach(({ cell: { box } }) => {
    left = Math.min(left, box.left);
    right = Math.max(right, box.left + box.width);
  });

  return { left, right };
}

/**
 * Returns, for each column group of a pane, the position its arriving copies keep time with: the
 * last group whose leaving copies are drawn where its arriving copies land, or its own position
 * when none comes later. A column that changed width between the sheets moves the columns after
 * it, so an arriving column can land over the next column's leaving copies, which start one
 * stagger later; it waits for them to be gone.
 */
function arrivalPositions(groups: Map<number, Record<CopySide, CopyEntry[]>>): Map<number, number> {
  const leaving = Array.from(groups, ([index, sides]) => ({ index, span: horizontalSpan(sides.out) }));
  const positions = new Map<number, number>();

  groups.forEach((sides, index) => {
    const arriving = horizontalSpan(sides.in);
    let position = index;

    leaving.forEach(({ index: other, span }) => {
      if (arriving !== null && span !== null && other > position
        && Math.min(arriving.right, span.right) - Math.max(arriving.left, span.left) > OVERLAP_THRESHOLD) {
        position = other;
      }
    });
    positions.set(index, position);
  });

  return positions;
}

/**
 * Builds the swap layer: one clipping box per pane, the covers that hide the real arriving
 * content, and per column group a leaving and an entering layer of copies. An evenly spaced
 * run of cells is drawn with one element, which keeps the layer small: one striped cover, and
 * one element of text lines per side, spaced like the rows.
 */
export class LayerBuilder {
  /**
   * The document the layer is built in.
   */
  readonly #doc: Document;
  /**
   * Resolves the visible box of a pane by its overlay class.
   */
  readonly #paneBox: (name: string) => GridBox | undefined;
  /**
   * The collected entries by pane.
   */
  readonly #panes = new Map<string, PaneEntries>();

  /**
   * Binds the builder to a document and to the pane boxes it clips with.
   */
  constructor(doc: Document, paneBox: (name: string) => GridBox | undefined) {
    this.#doc = doc;
    this.#paneBox = paneBox;
  }

  /**
   * Adds a cover over a cell. A cell of a pane without a visible box is left out.
   */
  addCover(cell: VisibleCell, background: string): void {
    const pane = this.#pane(cell.pane);

    if (pane === null) {
      return;
    }

    const covers = pane.covers.get(cell.group);

    if (covers === undefined) {
      pane.covers.set(cell.group, [{ cell, background }]);
    } else {
      covers.push({ cell, background });
    }
  }

  /**
   * Adds a copy of a cell's content to one side of its column group. A cell of a pane without
   * a visible box is left out.
   */
  addCopy(side: CopySide, entry: CopyEntry): void {
    const pane = this.#pane(entry.cell.pane);

    if (pane === null) {
      return;
    }

    let group = pane.groups.get(entry.cell.group);

    if (group === undefined) {
      group = { in: [], out: [] };
      pane.groups.set(entry.cell.group, group);
    }

    group[side].push(entry);
  }

  /**
   * Builds the layer off the document. The layer is inert: nothing in a copied cell takes the
   * focus or a pointer event.
   */
  build(): HTMLElement {
    const layer = this.#element(LAYER_CLASS);

    layer.setAttribute('aria-hidden', 'true');
    layer.inert = true;
    PANE_CLASSES.forEach((name) => {
      const pane = this.#panes.get(name);

      if (pane !== undefined) {
        layer.appendChild(this.#buildPane(name, pane));
      }
    });

    return layer;
  }

  /**
   * Returns the entries of a pane, creating them on first use, or `null` when the pane has no
   * visible box.
   */
  #pane(name: string): PaneEntries | null {
    let pane = this.#panes.get(name) ?? null;

    if (pane === null) {
      const box = this.#paneBox(name);

      if (box !== undefined) {
        pane = { box, covers: new Map(), groups: new Map() };
        this.#panes.set(name, pane);
      }
    }

    return pane;
  }

  /**
   * Builds one pane's clipping box with its covers and column groups.
   */
  #buildPane(name: string, pane: PaneEntries): HTMLElement {
    const element = this.#element(`${LAYER_CLASS}__pane`);
    const covers = this.#element(`${LAYER_CLASS}__covers`);
    const { box } = pane;

    element.setAttribute('data-pane', name);
    element.style.cssText = boxStyle(box.left, box.top, box.width, box.height, GRID_ORIGIN);
    pane.covers.forEach((group) => {
      evenRuns(group, cover => cover.background).forEach(run => covers.appendChild(this.#buildCover(run, box)));
    });
    element.appendChild(covers);

    const arrivals = arrivalPositions(pane.groups);

    Array.from(pane.groups.keys()).sort((first, second) => first - second).forEach((index) => {
      const sides = pane.groups.get(index);

      if (sides !== undefined) {
        element.appendChild(this.#buildGroup(index, arrivals.get(index) ?? index, sides, box));
      }
    });

    return element;
  }

  /**
   * Builds the cover of an evenly spaced run of cells: a stripe of the cell background per
   * row, over the grid background, with the grid lines between the rows left uncovered.
   */
  #buildCover(run: CoverEntry[], origin: GridBox): HTMLElement {
    const cover = this.#element(`${LAYER_CLASS}__cover`);
    const first = run[0].cell.box;
    const { background } = run[0];

    if (run.length === 1) {
      cover.style.cssText = `${boxStyle(first.left, first.top, first.width, first.height, origin)}`
        + `background-image:linear-gradient(${background},${background});`;

      return cover;
    }

    const pitch = run[1].cell.box.top - first.top;
    const height = ((run.length - 1) * pitch) + first.height;
    const stripe = (color: string) => (
      `repeating-linear-gradient(${color} 0 ${first.height}px,transparent ${first.height}px ${pitch}px)`
    );

    cover.style.cssText = `${boxStyle(first.left, first.top, first.width, height, origin)}`
      + `background:${stripe(background)},${stripe('var(--ht-background-color)')};`;

    return cover;
  }

  /**
   * Builds one column group with its leaving and entering layers. The group spans its column's
   * cells on both sides and the pane's height, so each animated layer is a column, not a pane.
   * An arriving side that keeps time with a later group carries that group's position too.
   */
  #buildGroup(index: number, arrival: number, sides: Record<CopySide, CopyEntry[]>, pane: GridBox): HTMLElement {
    const group = this.#element(`${LAYER_CLASS}__group`);
    const box = columnBox([...sides.out, ...sides.in], pane);

    group.style.cssText = boxStyle(box.left, box.top, box.width, box.height, pane);
    group.style.setProperty('--ht-private-sheet-switch-index', `${index}`);

    if (arrival !== index) {
      group.style.setProperty('--ht-private-sheet-switch-arrival-index', `${arrival}`);
    }

    (['out', 'in'] as const).forEach((side) => {
      if (sides[side].length > 0) {
        group.appendChild(this.#buildSide(side, sides[side], box));
      }
    });

    return group;
  }

  /**
   * Builds the leaving or the entering layer of a column group. The layer carries the text styles
   * of its first copy, the inherited ones as declarations and the others as variables, so a copy
   * styled the same way writes only its box.
   */
  #buildSide(side: CopySide, entries: CopyEntry[], origin: GridBox): HTMLElement {
    const layer = this.#element(`${LAYER_CLASS}__${side}`);
    const first = entries[0].style;
    const kind = (entry: CopyEntry) => (isLine(entry) ? entry.style.declarations + entry.style.boxDeclarations : '');

    layer.style.cssText = first.declarations + first.boxVariables;
    evenRuns(entries, kind).forEach((run) => {
      const own = ({ style }: CopyEntry) => (
        (style.declarations === first.declarations ? '' : style.declarations)
        + (style.boxDeclarations === first.boxDeclarations ? '' : style.boxDeclarations)
      );

      if (run.length > 1 && isLine(run[0])) {
        layer.appendChild(this.#buildLines(run, own(run[0]), origin));
      } else {
        run.forEach(entry => layer.appendChild(this.#buildCopy(entry, own(entry), origin)));
      }
    });

    return layer;
  }

  /**
   * Builds the copy of one cell's content at the cell's padding box, marked with the marks the
   * cell draws on itself.
   */
  #buildCopy(entry: CopyEntry, styles: string, origin: GridBox): HTMLElement {
    const copy = this.#element(`${LAYER_CLASS}__cell`);
    const { box } = entry.cell;
    const { text, fragment, marks } = entry.content;

    marks.forEach(mark => copy.classList.add(`${LAYER_CLASS}__cell--${mark}`));
    copy.style.cssText = boxStyle(box.left, box.top, box.width, box.height, origin) + styles;

    if (fragment !== null) {
      copy.appendChild(fragment);
    } else {
      copy.textContent = text;
    }

    return copy;
  }

  /**
   * Builds the copy of an evenly spaced run of single-line cells: one text element whose lines
   * are spaced like the rows. Each line box is as tall as the row pitch, and the element starts
   * the extra height's half above the first cell's line box, so every line's text sits where
   * its cell draws it. The half is rounded up: the browser places a line box on a whole pixel,
   * and a half-pixel start would land the text one pixel below the cell's own.
   */
  #buildLines(run: CopyEntry[], styles: string, origin: GridBox): HTMLElement {
    const copy = this.#element(`${LAYER_CLASS}__cell`);
    const first = run[0].cell.box;
    const pitch = run[1].cell.box.top - first.top;
    const lineHeight = run[0].style.metrics?.lineHeight ?? pitch;
    const top = first.top + lineOffset(run[0]) - Math.ceil((pitch - lineHeight) / 2);
    const lines = `display:block;padding-top:0;padding-bottom:0;line-height:${pitch}px;white-space:pre;`;

    copy.style.cssText = `${boxStyle(first.left, top, first.width, run.length * pitch, origin)}${styles}${lines}`;
    copy.textContent = run.map(entry => entry.content.text).join('\n');

    return copy;
  }

  /**
   * Creates a `div` with a class.
   */
  #element(className: string): HTMLElement {
    const element = this.#doc.createElement('div');

    element.className = className;

    return element;
  }
}
