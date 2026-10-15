import type { HotInstance } from '../../../../core/types';
import {
  contentPhaseMs,
  revealMarkDelayMs,
  revealMarkDurationMs,
  staggerStep,
  swapInDelayMs,
  swapInDurationMs,
  swapOutDurationMs,
} from '../switchTiming';
import { CellStyles, type CellContent, type TextStyle } from './cellStyles';
import { LayerBuilder, LAYER_CLASS } from './layerBuilder';
import {
  collectVisibleCells,
  isSameBox,
  masterHolder,
  type GridBox,
  type VisibleCell,
} from './visibleCells';

/**
 * The grid element attribute that carries the switch state. An attribute, not a class: core
 * styles hold attribute selectors on `class` in an ancestor position, so any class change on an
 * ancestor of the table restyles every cell, while this attribute invalidates only the elements
 * the switch styles match.
 */
const STATE_ATTRIBUTE = 'data-ht-sheet-switch';

/**
 * The switch state from the snapshot until the content swap ends.
 */
const PENDING_STATE = 'pending';

/**
 * The switch state while it waits for its server sheet's rows. It hides the selection like the
 * pending one, but keeps the focused cell's border shown, because the wait has no upper bound.
 */
const AWAITING_STATE = 'awaiting';

/**
 * The switch state that replaces the pending one for one transition after the swap.
 */
const REVEAL_STATE = 'reveal';

/**
 * The custom property that carries the delay between two column groups of a staggered entrance.
 */
const STAGGER_PROPERTY = '--ht-private-sheet-switch-stagger';

/**
 * The custom property that carries how long a column group's leaving copies take to fade out.
 */
const OUT_DURATION_PROPERTY = '--ht-private-sheet-switch-out-duration';

/**
 * The custom property that carries how long a column group's arriving copies wait, after the
 * group starts, before they fade in.
 */
const IN_DELAY_PROPERTY = '--ht-private-sheet-switch-in-delay';

/**
 * The custom property that carries how long a column group's arriving copies take to fade in.
 */
const IN_DURATION_PROPERTY = '--ht-private-sheet-switch-in-duration';

/**
 * The custom property that carries how long the selection marks wait before they fade in.
 */
const MARK_DELAY_PROPERTY = '--ht-private-sheet-switch-mark-delay';

/**
 * The custom property that carries how long the selection marks take to fade in.
 */
const MARK_DURATION_PROPERTY = '--ht-private-sheet-switch-mark-duration';

/**
 * The layer modifier of a fade: the arriving rows fade in where they are, with no leaving copies
 * and no stagger.
 */
const FADE_CLASS = `${LAYER_CLASS}--fade`;

/**
 * A switch that landed on a sheet whose rows are still being fetched.
 */
interface AwaitedRows {
  /**
   * The DataProvider context of the arriving sheet.
   */
  context: object;
  /**
   * The theme's base transition, in milliseconds.
   */
  transitionMs: number;
  /**
   * Whether the sheet's rows are being loaded into the grid. The load may resize or scroll the
   * grid, so the layout the switch was laid out for no longer applies from then on.
   */
  isArriving: boolean;
  /**
   * Whether the sheet's rows have been loaded into the grid, so the next paint shows them.
   */
  hasLanded: boolean;
}

/**
 * One cell of the outgoing sheet, kept until the arriving sheet is painted.
 */
interface CellSnapshot {
  /**
   * The cell as it was found on screen.
   */
  cell: VisibleCell;
  /**
   * The cell's text, compared for headers.
   */
  text: string;
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
 * The outgoing sheet's visible cells, taken before a switch.
 */
export interface SwitchSnapshot {
  /**
   * The theme's base transition, in milliseconds.
   */
  transitionMs: number;
  /**
   * How many visible column positions the outgoing cells span.
   */
  groupCount: number;
  /**
   * The outgoing cells by key.
   */
  cells: Map<string, CellSnapshot>;
  /**
   * The outgoing panes' visible boxes.
   */
  panes: Map<string, GridBox>;
}

/**
 * Tells whether an arriving header shows what the outgoing one showed, at the same place: the
 * same text, in the same pane, in the same box.
 */
function isUnchangedHeader(before: CellSnapshot, cell: VisibleCell): boolean {
  return before.cell.pane === cell.pane && isSameBox(before.cell.box, cell.box)
    && before.text === (cell.element.textContent ?? '');
}

/**
 * Adds an arriving cell to a layer: a cover that hides its real content, and an entering copy
 * of that content.
 */
function addArriving(builder: LayerBuilder, styles: CellStyles, cell: VisibleCell): void {
  builder.addCover(cell, styles.background(cell.element));
  builder.addCopy('in', { cell, style: styles.textStyle(cell.element), content: styles.content(cell.element) });
}

/**
 * Swaps the content of the visible cells column by column when the active sheet changes. It
 * takes a snapshot of the outgoing cells before the switch and, after it, draws the outgoing
 * copies leaving and the arriving copies entering in a layer above the grid. It is visual only:
 * it fires no hooks and changes no grid state.
 */
export class SheetSwitchAnimation {
  /**
   * The grid the animation draws over.
   */
  readonly #hot: HotInstance;
  /**
   * The snapshot that the next `play()` may use, or `null` when none is prepared.
   */
  #prepared: SwitchSnapshot | null = null;
  /**
   * The switch that waits for its sheet's rows to arrive, or `null` when none waits.
   */
  #awaited: AwaitedRows | null = null;
  /**
   * The layer of the running swap, or `null` when none runs.
   */
  #layer: HTMLElement | null = null;
  /**
   * The timeout that ends the running phase: the swap, or the reveal that follows it. The two
   * never overlap, because the swap's end schedules the reveal.
   */
  #timeout: ReturnType<typeof setTimeout> | null = null;
  /**
   * The scrollable part of the grid the running swap was laid out in.
   */
  #holder: HTMLElement | null = null;
  /**
   * The scroll offsets of the scrollable part and the window the running swap was laid out
   * for, as `top:left:windowX:windowY`, or `null` when no layout is recorded.
   */
  #offsets: string | null = null;
  /**
   * The root element size the running swap was laid out for, as `width×height`.
   */
  #rootSize = '';
  /**
   * The switch state the grid element carries, or `null` when it carries none. Kept here so
   * `finish()` knows, with no DOM read, whether there is a state to remove.
   */
  #state: string | null = null;
  /**
   * The transition the reveal timing on the grid element was written for, in milliseconds, or
   * `null` when none is written. A custom property on the grid element restyles everything
   * inside it, so it is written again only when the transition changes.
   */
  #revealTimingMs: number | null = null;

  /**
   * Binds the animation to a grid.
   */
  constructor(hot: HotInstance) {
    this.#hot = hot;
  }

  /**
   * Takes the snapshot of the outgoing sheet's visible cells and hides the selection until the
   * switch ends. Answers `null`, and does nothing at all, when the transition is zero. A
   * snapshot of a view with no visible cell, or with more than the animation allows, holds no
   * cells: its switch swaps no content and only fades the selection in.
   */
  prepare(transitionMs: number): SwitchSnapshot | null {
    this.#prepared = null;

    if (transitionMs <= 0) {
      return null;
    }

    const visible = collectVisibleCells(this.#hot);
    const cells = new Map<string, CellSnapshot>();

    if (visible !== null) {
      const styles = new CellStyles(this.#hot.rootWindow);

      visible.cells.forEach((cell) => {
        cells.set(cell.key, {
          cell,
          text: cell.isHeader ? (cell.element.textContent ?? '') : '',
          style: styles.textStyle(cell.element),
          content: styles.content(cell.element),
        });
      });
    }

    this.#prepared = {
      transitionMs,
      groupCount: visible?.groupCount ?? 0,
      cells,
      panes: visible?.panes ?? new Map<string, GridBox>(),
    };
    this.#writeRevealTiming(transitionMs);
    this.#setState(PENDING_STATE);

    return this.#prepared;
  }

  /**
   * Draws the swap from the snapshot `prepare()` took to the cells on screen now. A snapshot
   * that is not the prepared one (another switch or an interruption dropped it) draws nothing.
   * With no cells on either side to swap, the switch goes straight to the selection reveal. A
   * swap that fails to build ends the switch before the error leaves.
   */
  play(snapshot: SwitchSnapshot | null): void {
    if (snapshot === null || snapshot !== this.#prepared) {
      return;
    }

    this.#prepared = null;
    this.#finishOnThrow(() => this.#swap(snapshot));
  }

  /**
   * Builds and starts the swap from a snapshot to the cells on screen now.
   */
  #swap(snapshot: SwitchSnapshot): void {
    const visible = snapshot.cells.size === 0 ? null : collectVisibleCells(this.#hot);

    if (visible === null || visible.cells.length === 0) {
      this.#settle(snapshot.transitionMs);

      return;
    }

    const groupCount = Math.max(snapshot.groupCount, visible.groupCount);
    const layer = this.#buildLayer(snapshot, visible.cells, visible.panes);
    const { transitionMs } = snapshot;

    layer.style.setProperty(STAGGER_PROPERTY, `${staggerStep(transitionMs, groupCount)}ms`);
    layer.style.setProperty(OUT_DURATION_PROPERTY, `${swapOutDurationMs(transitionMs)}ms`);
    layer.style.setProperty(IN_DELAY_PROPERTY, `${swapInDelayMs(transitionMs)}ms`);
    layer.style.setProperty(IN_DURATION_PROPERTY, `${swapInDurationMs(transitionMs)}ms`);
    this.#start(layer, transitionMs, contentPhaseMs(transitionMs, groupCount));
  }

  /**
   * Ends the switch without a content swap, because the arriving sheet's rows are still being
   * fetched: the loading state is what arrives. The selection stays hidden until the rows land
   * and fade in (`rowsLanded()`, then `fadeInLandedRows()`); the focused cell's border stays
   * shown meanwhile. A swap or reveal still running ends first. A zero transition ends it at once.
   */
  awaitRows(context: object, transitionMs: number): void {
    this.#prepared = null;
    this.#clearTimeout();
    this.#removeLayer();

    if (transitionMs <= 0) {
      this.finish();

      return;
    }

    this.#awaited = { context, transitionMs, isArriving: false, hasLanded: false };
    this.#writeRevealTiming(transitionMs);
    this.#setState(AWAITING_STATE);
    this.#recordLayout();
  }

  /**
   * Tells whether a switch waits for rows that have not been loaded yet.
   */
  isAwaitingRows(): boolean {
    return this.#awaited !== null && !this.#awaited.hasLanded;
  }

  /**
   * Notes that the awaited rows are being loaded into the grid. From then on, a resize or a
   * scroll belongs to the load and no longer drops the wait.
   */
  rowsArriving(): void {
    if (this.#awaited !== null) {
      this.#awaited.isArriving = true;
    }
  }

  /**
   * Notes that the rows of a sheet were loaded into the grid. Rows of any other sheet than the
   * awaited one change nothing.
   */
  rowsLanded(context: object): void {
    if (this.#awaited !== null && this.#awaited.context === context) {
      this.#awaited.hasLanded = true;
    }
  }

  /**
   * Fades the visible rows in once the awaited rows were loaded and painted: a cover and an
   * entering copy per body cell and row header, all at once. The column headers were on screen
   * through the loading state and stay still. A no-op until the rows have landed. A fade that
   * fails to build ends the switch before the error leaves.
   */
  fadeInLandedRows(): void {
    const awaited = this.#awaited;

    if (awaited === null || !awaited.hasLanded) {
      return;
    }

    this.#awaited = null;
    this.#finishOnThrow(() => this.#fadeIn(awaited));
  }

  /**
   * Builds and starts the fade of the landed rows.
   */
  #fadeIn(awaited: AwaitedRows): void {
    const visible = collectVisibleCells(this.#hot);
    const rows = visible?.cells.filter(cell => !cell.isColumnHeader) ?? [];

    if (visible === null || rows.length === 0) {
      this.finish();

      return;
    }

    const builder = new LayerBuilder(this.#hot.rootDocument, name => visible.panes.get(name));
    const styles = new CellStyles(this.#hot.rootWindow);

    rows.forEach(cell => addArriving(builder, styles, cell));

    const layer = builder.build();

    layer.classList.add(FADE_CLASS);
    layer.style.setProperty(STAGGER_PROPERTY, '0ms');
    this.#start(layer, awaited.transitionMs, awaited.transitionMs);
  }

  /**
   * Ends a running swap, or a wait for rows, when the grid scrolled away from the offsets it
   * was laid out for. The switch restores its own scroll before the swap starts, so the scroll
   * event that follows it changes nothing and leaves the swap running.
   */
  finishIfScrolled(): void {
    if (!this.#watchesLayout() || this.#offsets === null) {
      return;
    }

    if (this.#readOffsets() !== this.#offsets) {
      this.finish();
    }
  }

  /**
   * Ends a running swap, or a wait for rows, when the grid was resized since it was laid out.
   */
  finishIfResized(): void {
    if (this.#watchesLayout() && this.#readRootSize() !== this.#rootSize) {
      this.finish();
    }
  }

  /**
   * Ends every phase at once: the layer goes, and the grid element loses the switch state.
   * A no-op that touches no DOM when nothing runs, because the grid calls it on every key press,
   * pointer press, and data change.
   */
  finish(): void {
    if (
      this.#layer === null && this.#awaited === null && this.#prepared === null
      && this.#timeout === null && this.#state === null
    ) {
      return;
    }

    this.#prepared = null;
    this.#awaited = null;
    this.#clearTimeout();
    this.#removeLayer();
    this.#setState(null);
  }

  /**
   * Ends every phase like `finish()` and removes the reveal timing from the grid element. Called
   * when the sheets bar is torn down for good.
   */
  release(): void {
    this.finish();

    if (this.#revealTimingMs !== null) {
      this.#revealTimingMs = null;
      this.#hot.rootGridElement.style.removeProperty(MARK_DELAY_PROPERTY);
      this.#hot.rootGridElement.style.removeProperty(MARK_DURATION_PROPERTY);
    }
  }

  /**
   * Writes the delay and the duration of the selection fade onto the grid element, where the
   * reveal styles read them, unless they are already written for this transition.
   */
  #writeRevealTiming(transitionMs: number): void {
    if (this.#revealTimingMs === transitionMs) {
      return;
    }

    const { style } = this.#hot.rootGridElement;

    this.#revealTimingMs = transitionMs;
    style.setProperty(MARK_DELAY_PROPERTY, `${revealMarkDelayMs(transitionMs)}ms`);
    style.setProperty(MARK_DURATION_PROPERTY, `${revealMarkDurationMs(transitionMs)}ms`);
  }

  /**
   * Runs a step that builds a phase, and ends the switch when the step throws, so no switch
   * state is left on the grid with nothing to remove it. The error is not swallowed.
   */
  #finishOnThrow(step: () => void): void {
    let isDone = false;

    try {
      step();
      isDone = true;
    } finally {
      if (!isDone) {
        this.finish();
      }
    }
  }

  /**
   * Writes the switch state onto the grid element, or removes it for `null`.
   */
  #setState(state: string | null): void {
    this.#state = state;

    if (state === null) {
      this.#hot.rootGridElement.removeAttribute(STATE_ATTRIBUTE);
    } else {
      this.#hot.rootGridElement.setAttribute(STATE_ATTRIBUTE, state);
    }
  }

  /**
   * Tells whether a running swap, or a wait for rows that are not arriving yet, depends on the
   * layout it was recorded for.
   */
  #watchesLayout(): boolean {
    return this.#layer !== null || (this.#awaited !== null && !this.#awaited.isArriving);
  }

  /**
   * Shows a built layer over the grid and schedules its end after `durationMs`, followed by the
   * reveal.
   */
  #start(layer: HTMLElement, transitionMs: number, durationMs: number): void {
    this.#recordLayout();
    this.#hot.rootGridElement.appendChild(layer);
    this.#layer = layer;
    this.#timeout = this.#hot._registerTimeout(() => this.#settle(transitionMs), durationMs);
  }

  /**
   * Ends the swap on schedule: the layer goes, and the reveal phase runs for one transition.
   */
  #settle(transitionMs: number): void {
    this.#timeout = null;
    this.#removeLayer();
    this.#setState(REVEAL_STATE);
    this.#timeout = this.#hot._registerTimeout(() => {
      this.#timeout = null;
      this.#setState(null);
    }, transitionMs);
  }

  /**
   * Removes the running swap's layer and forgets the layout it was drawn for.
   */
  #removeLayer(): void {
    this.#layer?.remove();
    this.#layer = null;
    this.#holder = null;
    this.#offsets = null;
  }

  /**
   * Clears the pending timeout.
   */
  #clearTimeout(): void {
    if (this.#timeout !== null) {
      clearTimeout(this.#timeout);
      this.#timeout = null;
    }
  }

  /**
   * Builds the whole layer off the document. An arriving cell gets a cover and an entering
   * copy, an outgoing cell a leaving copy. A header that kept its text, its pane, and its box is
   * left out on both sides; a body cell always swaps. A header that kept its text but moved, as
   * the column letters and row numbers do between sheets scrolled apart, swaps like any cell, so
   * no leaving copy is drawn over a real header left uncovered.
   */
  #buildLayer(snapshot: SwitchSnapshot, arriving: VisibleCell[], panes: Map<string, GridBox>): HTMLElement {
    const builder = new LayerBuilder(this.#hot.rootDocument, name => panes.get(name) ?? snapshot.panes.get(name));
    const styles = new CellStyles(this.#hot.rootWindow);
    const unchanged = new Set<string>();

    arriving.forEach((cell) => {
      const before = snapshot.cells.get(cell.key);

      if (cell.isHeader && before !== undefined && isUnchangedHeader(before, cell)) {
        unchanged.add(cell.key);

        return;
      }

      addArriving(builder, styles, cell);
    });
    snapshot.cells.forEach((before, key) => {
      if (!unchanged.has(key)) {
        builder.addCopy('out', before);
      }
    });

    return builder.build();
  }

  /**
   * Records the scroll offsets and the root size the running swap was laid out for.
   */
  #recordLayout(): void {
    this.#holder = masterHolder(this.#hot);
    this.#offsets = this.#readOffsets();
    this.#rootSize = this.#readRootSize();
  }

  /**
   * Reads the current scroll offsets of the scrollable part and the window, as
   * `top:left:windowX:windowY`.
   */
  #readOffsets(): string {
    const { rootWindow } = this.#hot;
    const holder = this.#holder;

    return `${holder?.scrollTop ?? 0}:${holder?.scrollLeft ?? 0}:${rootWindow.scrollX}:${rootWindow.scrollY}`;
  }

  /**
   * Reads the root element's layout size.
   */
  #readRootSize(): string {
    const { rootElement } = this.#hot;

    return `${rootElement.offsetWidth}x${rootElement.offsetHeight}`;
  }
}
