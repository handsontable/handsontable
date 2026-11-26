import type { HotInstance } from '../../core/types';
import type { IndexMapper } from '../../translations';
import type { OperationHold } from '../../core/operationScope';
import { announce } from '../a11yAnnouncer';
import * as C from '../../i18n/constants';
import { EDITOR_EDIT_GROUP, GRID_GROUP } from '../../shortcuts/contexts';
import { isRowSelection } from '../manualResize/axis';
import { getRestoreDropIndex, getStepDropIndex, type StepDirection } from './stepMove';

/**
 * The keys that do not end a keyboard move: its own (the arrows of the axis, `Enter`, `Escape`) and the modifiers
 * alone. Any other key ends the move where the block is, as any other key ends a keyboard resize.
 */
const MODE_KEYS = new Set(['Enter', 'Escape', 'Shift', 'Control', 'Alt', 'Meta']);

/**
 * The plugin that owns the moves: ManualColumnMove or ManualRowMove. The mover never touches an index map itself,
 * every move goes through the plugin's own `drag*()` method, so the hooks and the `isMovePossible()` bounds are the
 * drag's.
 */
export interface MoveOwner {
  /**
   * Tells whether moving without a drag is available: the plugin is enabled, and nothing moves the tracks by a
   * path of its own.
   */
  isEnabled(): boolean;
  /**
   * Moves the indexes to the drop index (`dragColumns()` or `dragRows()`).
   */
  drag(indexes: number[], dropIndex: number): boolean;
  /**
   * Converts a drop index into the final index (`countFinalIndex()`).
   */
  countFinalIndex(indexes: number[], dropIndex: number): number;
  /**
   * Tells whether the move is possible (`isMovePossible()`).
   */
  isMovePossible(indexes: number[], finalIndex: number): boolean;
  /**
   * Returns the drop index right after the visible index, the one a pointer drop at its far edge gives.
   */
  dropIndexAfter(visualIndex: number): number;
}

/**
 * The axis a mover moves along.
 */
export interface MoveAxis {
  /**
   * The name of the shortcut group the mover registers its keys in.
   */
  shortcutsGroup: string;
  /**
   * The name of the operation (and of the undo step) a move records.
   */
  operationName: string;
  /**
   * The source of that operation.
   */
  operationSource: string;
  /**
   * The phrase announced when the keyboard move starts.
   */
  startedPhrase: string;
  /**
   * The phrase announced after each step, with `[position]` and `[count]`.
   */
  positionPhrase: string;
  /**
   * The arrow keys that move the block toward the lower and the higher visual indexes.
   */
  getArrowKeys(hot: HotInstance): [string, string];
  /**
   * Tells whether the selection belongs to this axis, so that one selection never starts both moves.
   */
  ownsSelection(hot: HotInstance): boolean;
  /**
   * Tells whether the selection selects whole tracks of this axis through their headers.
   */
  isSelectedByHeader(hot: HotInstance): boolean;
  /**
   * Gets the index mapper of the axis.
   */
  getIndexMapper(hot: HotInstance): IndexMapper;
  /**
   * Gets the number of visual indexes the grid draws on the axis (`countCols()` or `countRows()`, capped by
   * `maxCols` or `maxRows`), the ones a move may reach.
   */
  getLength(hot: HotInstance): number;
  /**
   * Reads the index of the axis from coordinates.
   */
  getIndex(coords: { row: number | null; col: number | null }): number;
  /**
   * Returns the coordinates moved by `delta` along the axis.
   */
  offset(coords: { row: number | null; col: number | null }, delta: number): { row: number; col: number };
  /**
   * Selects whole tracks of the axis, from `start` to `end`, with the focus on `focus`.
   */
  selectTracks(hot: HotInstance, start: number, end: number, focus: { row: number; col: number }): void;
}

/**
 * The column axis.
 */
export const COLUMN_MOVE_AXIS: MoveAxis = {
  shortcutsGroup: 'manualColumnMove',
  operationName: 'col_move',
  operationSource: 'manualColumnMove.col_move',
  startedPhrase: C.MANUAL_MOVE_COLUMN_STARTED,
  positionPhrase: C.MANUAL_MOVE_COLUMN_POSITION,
  getArrowKeys(hot) {
    // The arrows act in the direction they point on the screen, so a right-to-left grid swaps them.
    return hot.isRtl() ? ['ArrowRight', 'ArrowLeft'] : ['ArrowLeft', 'ArrowRight'];
  },
  ownsSelection(hot) {
    const highlight = hot.getSelectedRangeActive()?.highlight;

    return !!highlight && highlight.col !== null && highlight.col >= 0 && !isRowSelection(hot);
  },
  isSelectedByHeader(hot) {
    return hot.selection.isSelectedByColumnHeader();
  },
  getIndexMapper(hot) {
    return hot.columnIndexMapper;
  },
  getLength(hot) {
    return hot.countCols();
  },
  getIndex(coords) {
    return coords.col ?? -1;
  },
  offset({ row, col }, delta) {
    return { row: row ?? 0, col: (col ?? 0) + delta };
  },
  selectTracks(hot, start, end, focus) {
    hot.selectColumns(start, end, focus);
  },
};

/**
 * The row axis.
 */
export const ROW_MOVE_AXIS: MoveAxis = {
  shortcutsGroup: 'manualRowMove',
  operationName: 'row_move',
  operationSource: 'manualRowMove.row_move',
  startedPhrase: C.MANUAL_MOVE_ROW_STARTED,
  positionPhrase: C.MANUAL_MOVE_ROW_POSITION,
  getArrowKeys() {
    return ['ArrowUp', 'ArrowDown'];
  },
  ownsSelection(hot) {
    return isRowSelection(hot);
  },
  isSelectedByHeader(hot) {
    return hot.selection.isSelectedByRowHeader();
  },
  getIndexMapper(hot) {
    return hot.rowIndexMapper;
  },
  getLength(hot) {
    return hot.countRows();
  },
  getIndex(coords) {
    return coords.row ?? -1;
  },
  offset({ row, col }, delta) {
    return { row: (row ?? 0) + delta, col: col ?? 0 };
  },
  selectTracks(hot, start, end, focus) {
    hot.selectRows(start, end, focus);
  },
};

interface Block {
  start: number;
  end: number;
}

interface StepTarget {
  indexes: number[];
  dropIndex: number;
  finalIndex: number;
}

/**
 * Moves the selected columns or rows one visible place at a time, without a drag: from the keyboard (a mode that
 * `Ctrl`/`Cmd`+`Alt`+`G` starts, the arrow keys step, `Enter` ends and `Escape` cancels) and from the menu items
 * (one step per click). Each step is one `drag*()` call, so one pair of move hooks, and the selection follows the
 * moved block. A keyboard move is one undo step, however many steps it took; a menu step is one undo step.
 */
export class KeyboardMove {
  /**
   * The Handsontable instance.
   */
  #hot: HotInstance;
  /**
   * The axis the mover moves along.
   */
  #axis: MoveAxis;
  /**
   * The plugin that owns the moves.
   */
  #owner: MoveOwner;
  /**
   * Whether the keyboard move is running.
   */
  #active = false;
  /**
   * The visual index the block started at when the keyboard move started, for `Escape`.
   */
  #originStart = 0;
  /**
   * Whether the mover is laying the selection itself, so its own selection change does not end the keyboard move.
   */
  #relaying = false;
  /**
   * The undo step the keyboard move holds open from its start to its end, so all its steps undo together.
   */
  #pendingStep: OperationHold | null = null;

  /**
   * @param {HotInstance} hot The Handsontable instance.
   * @param {MoveAxis} axis The axis the mover moves along.
   * @param {MoveOwner} owner The plugin that owns the moves.
   */
  constructor(hot: HotInstance, axis: MoveAxis, owner: MoveOwner) {
    this.#hot = hot;
    this.#axis = axis;
    this.#owner = owner;
  }

  /**
   * Registers the shortcuts in the grid context: the one that starts the keyboard move, and the ones that steer it
   * while it runs. The plugin calls it from `enablePlugin()`, and `unregisterShortcuts()` from `disablePlugin()`.
   */
  registerShortcuts() {
    const context = this.#hot.getShortcutManager().getContext('grid');
    const group = this.#axis.shortcutsGroup;
    const whileActive = {
      runOnlyIf: () => this.#active,
      group,
      relativeToGroup: GRID_GROUP,
      position: 'before' as const,
      // the grid's own arrow keys, Enter and Escape must not run after these
      stopPropagation: true,
    };

    context?.addShortcut({
      keys: [['Control/Meta', 'Alt', 'G']],
      callback: () => {
        this.start();

        // `false` ends the walk through the actions of the key, so the grid does not take the letter as an edit
        return false;
      },
      runOnlyIf: () => !this.#active && this.#getBlock() !== null,
      group,
      // the key is a letter, which the grid would otherwise take as the start of an edit
      stopPropagation: true,
      relativeToGroup: GRID_GROUP,
      position: 'before',
    });
    context?.addShortcut({
      // Both layouts use the same pair, only their meaning flips (`getArrowKeys()` is read again on each press).
      keys: this.#axis.getArrowKeys(this.#hot).map(key => [key]),
      callback: (event: KeyboardEvent) => {
        const [lower] = this.#axis.getArrowKeys(this.#hot);

        this.#keyboardStep(event.key === lower ? -1 : 1);

        return false;
      },
      ...whileActive,
    });
    context?.addShortcut({
      keys: [['Enter']],
      callback: () => {
        this.#finish();

        return false;
      },
      ...whileActive,
      // the grid opens the editor on Enter from the group of the editor, not from its default one
      relativeToGroup: EDITOR_EDIT_GROUP,
    });
    context?.addShortcut({
      keys: [['Escape']],
      callback: () => {
        this.#cancelKeyboardMove();

        return false;
      },
      ...whileActive,
    });
  }

  /**
   * Removes the shortcuts `registerShortcuts()` added. The keyboard move keeps running: a plugin that is disabled
   * for good ends it with `cancel()`, and the `disablePlugin(); enablePlugin();` cycle a framework wrapper sends on
   * every render must not end it.
   */
  unregisterShortcuts() {
    this.#hot.getShortcutManager().getContext('grid')?.removeShortcutsByGroup(this.#axis.shortcutsGroup);
  }

  /**
   * Starts the keyboard move of the selected columns or rows.
   *
   * @returns {boolean} `true` when the move started.
   */
  start(): boolean {
    const block = this.#getBlock();

    if (!block || this.#active) {
      return false;
    }

    const scope = this.#hot._getOperationScope();

    this.#active = true;
    this.#originStart = block.start;
    // Every step of the move runs in this one transaction, so one undo puts the whole move back, and a move that
    // `Escape` puts back records nothing.
    scope.run(this.#axis.operationName, this.#axis.operationSource, () => {
      this.#pendingStep = scope.hold();
    });
    announce(String(this.#hot.getTranslatedPhrase(this.#axis.startedPhrase) ?? ''), 'polite');

    return true;
  }

  /**
   * Ends the keyboard move where the block is now, without announcing or moving anything. The plugins call it when
   * the indexes it holds stop meaning the same tracks (new data, a new column order, a disabled plugin).
   */
  cancel() {
    this.#finish();
  }

  /**
   * Forgets the keyboard move without recording it, for a grid that is being destroyed.
   */
  dispose() {
    this.#active = false;
    this.#pendingStep = null;
  }

  /**
   * Tells whether the selection belongs to this axis and moving is available, so the menu shows the move items of
   * this axis.
   *
   * @returns {boolean}
   */
  appliesToSelection(): boolean {
    return this.#owner.isEnabled() && this.#axis.ownsSelection(this.#hot);
  }

  /**
   * Tells whether the selected block can move one visible place in the direction.
   *
   * @param {StepDirection} direction The direction of the move.
   * @returns {boolean}
   */
  canStep(direction: StepDirection): boolean {
    return this.#getPossibleStep(direction) !== null;
  }

  /**
   * Moves the selected block one visible place in the direction, and lays the selection on the moved block. A step
   * that cannot be made does nothing and fires no hook.
   *
   * @param {StepDirection} direction The direction of the move.
   * @returns {boolean} `true` when the order changed.
   */
  step(direction: StepDirection): boolean {
    const target = this.#getPossibleStep(direction);

    if (target === null) {
      return false;
    }

    return this.#moveTo(target);
  }

  /**
   * Ends the keyboard move when the selection changes by anything but the mover itself. The plugin registers it on
   * `afterSelection`.
   */
  onSelectionChange = () => {
    if (!this.#relaying) {
      this.#finish();
    }
  };

  /**
   * Ends the keyboard move on any key that is not one of its own, before the key does what it normally does. The
   * plugin registers it on `beforeKeyDown`.
   *
   * @param {KeyboardEvent} event The key event.
   */
  onBeforeKeyDown = (event: KeyboardEvent) => {
    if (this.#active && !MODE_KEYS.has(event.key) && !this.#axis.getArrowKeys(this.#hot).includes(event.key)) {
      this.#finish();
    }
  };

  /**
   * Makes one step of the keyboard move, inside the undo step the move holds, and announces when the block cannot
   * move further that way.
   *
   * @param {StepDirection} direction The direction of the move.
   */
  #keyboardStep(direction: StepDirection) {
    const moved = this.#runInStep(() => this.step(direction));

    if (!moved) {
      announce(String(this.#hot.getTranslatedPhrase(C.MANUAL_MOVE_BLOCKED) ?? ''), 'polite');
    }
  }

  /**
   * Ends the keyboard move and releases its undo step, which records it.
   */
  #finish() {
    const step = this.#pendingStep;

    this.#active = false;
    this.#pendingStep = null;
    step?.release();
  }

  /**
   * Runs the callback inside the undo step the keyboard move holds.
   *
   * @param {Function} callback The callback.
   * @returns {boolean}
   */
  #runInStep(callback: () => boolean): boolean {
    return this.#pendingStep === null ? callback() : this.#pendingStep.resume(callback);
  }

  /**
   * Puts the block back where the keyboard move started, and ends the move.
   */
  #cancelKeyboardMove() {
    const block = this.#getBlock();

    if (block && block.start !== this.#originStart) {
      const indexes = this.#indexesOf(block);
      const dropIndex = getRestoreDropIndex(block.start, this.#originStart, indexes.length);
      const finalIndex = this.#owner.countFinalIndex(indexes, dropIndex);

      this.#runInStep(() => this.#moveTo({ indexes, dropIndex, finalIndex }, false));
    }

    this.#finish();
    announce(String(this.#hot.getTranslatedPhrase(C.ARMED_PICK_CANCELED) ?? ''), 'polite');
  }

  /**
   * Moves the indexes to the drop index and, when the order changed, lays the selection on them.
   *
   * @param {StepTarget} target The move.
   * @param {boolean} [announcePosition=true] Whether to announce the new position.
   * @returns {boolean} `true` when the order changed.
   */
  #moveTo({ indexes, dropIndex, finalIndex }: StepTarget, announcePosition = true): boolean {
    const moved = this.#owner.drag(indexes, dropIndex);

    if (!moved) {
      return false;
    }

    // `moveColumns()` and `moveRows()` leave the render to the caller, as a drop does.
    this.#hot.render();
    this.#followSelection(finalIndex - indexes[0]!);

    if (announcePosition) {
      this.#announcePosition(finalIndex);
    }

    return true;
  }

  /**
   * Gets what one step in the direction would do, or `null` when it cannot be made: nothing is selected on this
   * axis, no visible index is left that way, or the plugin refuses the move (`isMovePossible()`).
   *
   * @param {StepDirection} direction The direction of the move.
   * @returns {StepTarget | null}
   */
  #getPossibleStep(direction: StepDirection): StepTarget | null {
    const block = this.#getBlock();

    if (block === null) {
      return null;
    }

    const mapper = this.#axis.getIndexMapper(this.#hot);
    const dropIndex = getStepDropIndex(block.start, block.end, direction, {
      length: this.#axis.getLength(this.#hot),
      isHidden: (visualIndex) => {
        const physicalIndex = mapper.getPhysicalFromVisualIndex(visualIndex);

        return physicalIndex === null || mapper.isHidden(physicalIndex);
      },
      dropIndexAfter: visualIndex => this.#owner.dropIndexAfter(visualIndex),
    });

    if (dropIndex === null) {
      return null;
    }

    const indexes = this.#indexesOf(block);
    const finalIndex = this.#owner.countFinalIndex(indexes, dropIndex);

    return this.#owner.isMovePossible(indexes, finalIndex) ? { indexes, dropIndex, finalIndex } : null;
  }

  /**
   * Gets the block the selection holds on this axis, or `null` when there is nothing to move: no selection, a
   * selection of several ranges (a drag refuses those too), a selection that belongs to the other axis, or moving
   * that is not available.
   *
   * @returns {Block | null}
   */
  #getBlock(): Block | null {
    const hot = this.#hot;
    const range = hot.getSelectedRangeActive();

    if (!this.#owner.isEnabled() || !range || hot.selection.isNonContiguous() || !this.#axis.ownsSelection(hot)) {
      return null;
    }

    const from = this.#axis.getIndex(range.from);
    const to = this.#axis.getIndex(range.to);
    const start = Math.max(0, Math.min(from, to));
    const end = Math.max(from, to);

    return end < 0 ? null : { start, end };
  }

  /**
   * Lists the visual indexes of the block.
   *
   * @param {Block} block The block.
   * @returns {number[]}
   */
  #indexesOf(block: Block): number[] {
    const indexes = [];

    for (let index = block.start; index <= block.end; index++) {
      indexes.push(index);
    }

    return indexes;
  }

  /**
   * Lays the selection on the moved block: the same shape, the same focus, moved by the distance the block moved.
   * A header selection goes through `selectColumns()` / `selectRows()`, because `selectCell()` refuses a range that
   * holds headers and is not a single header.
   *
   * @param {number} delta The number of visual indexes the block moved by.
   */
  #followSelection(delta: number) {
    const hot = this.#hot;
    const range = hot.getSelectedRangeActive();

    if (!range || delta === 0) {
      return;
    }

    const from = this.#axis.offset(range.from, delta);
    const to = this.#axis.offset(range.to, delta);
    const highlight = this.#axis.offset(range.highlight, delta);

    this.#relaying = true;

    try {
      if (this.#axis.isSelectedByHeader(hot)) {
        this.#axis.selectTracks(hot, this.#axis.getIndex(from), this.#axis.getIndex(to), highlight);

      } else {
        hot.selectCell(from.row, from.col, to.row, to.col);

        if (highlight.row !== from.row || highlight.col !== from.col) {
          hot.selection.setRangeFocus(hot._createCellCoords(highlight.row, highlight.col));
        }
      }
    } finally {
      this.#relaying = false;
    }
  }

  /**
   * Announces where the block landed, counted in the tracks the grid shows.
   *
   * @param {number} finalIndex The visual index the block starts at.
   */
  #announcePosition(finalIndex: number) {
    const mapper = this.#axis.getIndexMapper(this.#hot);
    // The block starts at a visible index after a step, so it has a renderable index.
    const renderable = mapper.getRenderableFromVisualIndex(finalIndex) ?? 0;
    const phrase = this.#hot.getTranslatedPhrase(this.#axis.positionPhrase, {
      position: renderable + 1,
      count: mapper.getRenderableIndexesLength(),
    });

    announce(String(phrase ?? ''), 'polite');
  }
}
