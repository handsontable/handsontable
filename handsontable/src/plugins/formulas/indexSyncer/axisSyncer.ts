import { warn, warnOnce } from '../../../helpers/console';
import { listEngineElements } from './engineElements';
import { toUpperCaseFirst } from '../../../helpers/string';
import { getMoves } from '../../../helpers/moves';
import { chooseOrderMoves, type OrderMove } from './orderMoves';
import { getDecreasedIndexes, getIncreasedIndexes } from '../../../translations/maps/utils/actionsOnIndexes';
import { runEngineBatch } from '../engine/evaluationHold';
import type { HyperFormulaEngine } from '../engine/types';

interface AxisIndexMapper {
  getVisualFromPhysicalIndex(physicalIndex: number): number | null;
  getIndexesSequence(): number[];
  getNotTrimmedIndexes(): number[];
  getNumberOfIndexes(): number;
  addLocalHook(key: string, callback: Function): unknown;
}

interface HfTranslationCache {
  /**
   * Snapshot of the physical indexes sequence. The position in this array is the HF index,
   * the value is the physical index.
   */
  physicalIndexOfHf: number[];
  /**
   * Inverse of the sequence. The position in this array is the physical index, the value is the HF index.
   */
  hfIndexOfPhysical: number[];
  /**
   * Translation from a physical index to its visual index, or `-1` when the physical index is trimmed.
   */
  visualIndexOfPhysical: number[];
}

/**
 * What an axis syncer knows about the engine's order: the physical indexes the engine holds, in its
 * own order, the grid's sequence at the moment the engine's sheet was found empty, the held
 * indexes whose line was only added to carry an order (`paddedElements`), and how far the orders the
 * engine was handed moved each line (`orderShifts`, `[physicalIndex, shift]` pairs, see
 * `AxisSyncer#getOrderShift()`).
 */
export interface EngineOrder {
  sequence: number[];
  fillSequence: number[] | null;
  paddedElements: number[];
  orderShifts?: Array<[number, number]>;
  orderBase?: number[] | null;
  orderPoint?: number[] | null;
}

interface ParentIndexSyncer {
  getEngine(): HyperFormulaEngine | null;
  getSheetId(): number | null;
  getPostponeAction(callback?: Function): Function;
  getOwnEngineWrite(): <T>(engine: HyperFormulaEngine, fn: () => T) => T;
  isOrderSorted?(): boolean;
  onOrderSent?(): void;
  onOrderReset?(): void;
}

/**
 * @private
 * @class IndexSyncer
 * @description
 *
 * Indexes synchronizer responsible for providing logic for particular axis. It respects an idea to represent trimmed
 * elements in HF's engine to perform formulas calculations on them. It also provides method for translation from visual
 * row/column indexes to HF's row/column indexes.
 */
class AxisSyncer {
  /**
   * The axis for which the actions are performed.
   *
   * @private
   * @type {'row'|'column'}
   */
  readonly #axis: string;
  /**
   * Reference to index mapper.
   *
   * @private
   * @type {IndexMapper}
   */
  readonly #indexMapper;
  /**
   * The index synchronizer for both axis (is storing some more general information).
   *
   * @private
   * @type {IndexSyncer}
   */
  readonly #indexSyncer;
  /**
   * Physical indexes the engine's sheet holds, in the order the engine holds them. Every order sent to the
   * engine is relative to it, so it only ever advances when the engine accepts one.
   *
   * @private
   * @type {Array<number>}
   */
  #indexesSequence: number[] = [];
  /**
   * The grid's sequence when the engine was last ordered (or found empty), or `null` while the rows and
   * columns the engine gains belong in physical order. The grid writes a row or column the sheet gains at
   * the position its sequence puts it, so that sequence says which element each of them belongs to.
   *
   * @type {Array<number>|null}
   */
  #fillSequence: number[] | null = null;
  /**
   * Physical indexes whose engine row or column was only added to carry a reorder, so it held nothing then.
   * An order that puts one of them at its very end does not extend the sheet to it: the line is empty, so
   * it takes whichever place the content leaves free, and what it was labelled with does not matter.
   *
   * @type {Set<number>}
   */
  #paddedElements = new Set<number>();
  /**
   * How far the orders the engine was handed (`setRowOrder()`, `setColumnOrder()`) moved each line since the
   * engine's order was last physical, by physical index; a line they left in place has no entry. The engine
   * moves a line's formulas keeping their relative offsets on such an order, while a move (`moveRows()`,
   * `moveColumns()`), an insert, and a removal keep every reference on its cell.
   *
   * @type {Map<number, number>}
   */
  #orderShifts = new Map<number, number>();
  /**
   * The order the engine held, reached by moves alone, when the first order (`setRowOrder()`,
   * `setColumnOrder()`) since its order was last physical was sent: the physical index at each engine line, as
   * long as the grid's sequence. A reload replays the moves to it as moves and only the rest as one order, so
   * it reproduces how the grid reached its order. `null` while no order was sent on top of moves, and dropped
   * with the shifts, and on an insert or a removal, whose renumbering the recorded moves no longer describe.
   *
   * @type {Array<number>|null}
   */
  #orderBase: number[] | null = null;
  /**
   * The grid's sequence the engine was brought to by the last order it took as one order (a sort, a sequence set, a
   * load's order on an engine where moves were refused), while that order's shifts are kept. Moves after it keep the
   * shifts, so an engine order whose grid order goes back to this point differs from it by moves alone: a release
   * that finds the grid there sends the difference as moves (`releaseAdoptedOrderAsMoves()`). `null` while no order
   * was sent, and dropped with the shifts and wherever `#orderBase` is.
   *
   * @type {Array<number>|null}
   */
  #orderPoint: number[] | null = null;
  /**
   * List of moved HF indexes, stored before performing move on HOT to calculate transformation needed on HF's engine.
   *
   * @private
   * @type {Array<number>}
   */
  #movedIndexes: number[] = [];
  /**
   * Final HF's place where to move indexes, stored before performing move on HOT to calculate transformation needed on HF's engine.
   *
   * @private
   * @type {number|undefined}
   */
  #finalIndex: number | undefined;
  /**
   * List of removed HF indexes, stored before performing removal on HOT to calculate transformation needed on HF's engine.
   *
   * @private
   * @type {Array<number>}
   */
  #removedIndexes: number[] = [];
  /**
   * Cached translation tables between physical, visual, and HF indexes. Built lazily on the first
   * translation call and invalidated whenever the indexes sequence or the trimmed indexes change.
   * Keeping the tables makes both translation methods O(1) per call — they are called for every
   * rendered cell, so a per-call sequence scan would scale with the dataset size.
   *
   * @private
   * @type {HfTranslationCache|null}
   */
  #translationCache: HfTranslationCache | null = null;
  /**
   * Whether the grid's order changes are kept from the engine (see `setOrderHeld()`). While it is set,
   * the engine keeps the order it holds, and the translation reads that order instead of the grid's.
   *
   * @type {boolean}
   */
  #orderHeld = false;
  /**
   * Whether an engine order was taken over while the order is held (see `adoptEngineOrder()`). Only then
   * are the grid's moves kept from the engine: a move is computed against the grid's order, which the
   * adopted engine order does not follow until the hold ends.
   *
   * @type {boolean}
   */
  #adoptedWhileHeld = false;
  /**
   * Whether the engine was fed its content again while the order is held, so it holds the content in physical
   * order and the hold's release sends the whole grid order as a reload would (see `#syncOrderWithGrid()`).
   * `null` when no reload happened in the hold, otherwise whether that order was reached by moves alone.
   *
   * @type {boolean|null}
   */
  #reloadedWhileHeld: boolean | null = null;
  /**
   * Whether an order change other than a move (a sort, `setIndexesSequence()`) was held back while the order
   * is held. The release then sends the order as one order, as that change would have reached the engine.
   *
   * @type {boolean}
   */
  #orderChangedWhileHeld = false;
  /**
   * The order moves reached under an order (`#orderBase`) that a reload inside the hold read before it reset
   * the stored order, kept for the release to replay as moves. Dropped by any order change in the hold.
   *
   * @type {Array<number>|null}
   */
  #heldOrderBase: number[] | null = null;
  /**
   * Whether the hold's release sends the grid's order as moves to an engine order adopted in the hold
   * (`releaseAdoptedOrderAsMoves()`): the sheet a grid returns to, which the engine kept as the grid left it.
   * Cleared by every release, by a later adoption or reload in the hold, and by any order change other than a move.
   *
   * @type {boolean}
   */
  #adoptedByMoves = false;

  /**
   * Initializes the axis syncer for the given axis with the corresponding index mapper and parent index syncer references.
   */
  constructor(axis: string, indexMapper: AxisIndexMapper, indexSyncer: ParentIndexSyncer) {
    this.#axis = axis;
    this.#indexMapper = indexMapper;
    this.#indexSyncer = indexSyncer;

    // The sequence hook fires synchronously on every sequence mutation (also mid-batch), the
    // `cacheUpdated` hook fires when the mapper rebuilds its own `notTrimmedIndexes` cache — the
    // same moment from which the translation methods would read the new trimming state.
    this.#indexMapper.addLocalHook('indexesSequenceChange', () => {
      this.#translationCache = null;
    });
    this.#indexMapper.addLocalHook('cacheUpdated', (
      changes: { trimmedIndexesChanged: boolean; indexesSequenceChanged: boolean }
    ) => {
      // The sequence hook above fires before the mapper rebuilds its not-trimmed cache (inside a suspended
      // execution, long before it), so a table built in between holds the previous visual order.
      if (changes.trimmedIndexesChanged || changes.indexesSequenceChanged) {
        this.#translationCache = null;
      }
    });
    // An insert or a removal renumbers the physical indexes the padded ones are kept by, the same way it
    // renumbers the grid's sequence. A row inserted into the engine is an empty line like a padded one, so it
    // joins them. A removed index stays in the set: the engine line that carried it is not always removed with
    // it (an undo removes the grid's row only), and what the set holds is a line that may be empty, not a row.
    this.#indexMapper.addLocalHook('indexesInserted', (insertedIndexes: number[]) => {
      this.#orderBase = null;
      this.#orderPoint = null;

      if (this.#paddedElements.size > 0) {
        this.#paddedElements = new Set(
          getIncreasedIndexes(Array.from(this.#paddedElements), insertedIndexes).concat(insertedIndexes),
        );
      }

      if (this.#orderShifts.size > 0) {
        const lines = Array.from(this.#orderShifts.keys());
        const renumbered = getIncreasedIndexes(lines, insertedIndexes);

        this.#orderShifts = new Map(lines.map((line, index) => [renumbered[index], this.#orderShifts.get(line)!]));
      }
    });
    this.#indexMapper.addLocalHook('indexesRemoved', (removedIndexes: number[]) => {
      this.#orderBase = null;
      this.#orderPoint = null;

      if (this.#paddedElements.size > 0) {
        this.#paddedElements = new Set(getDecreasedIndexes(Array.from(this.#paddedElements), removedIndexes));
      }

      if (this.#orderShifts.size > 0) {
        const removed = new Set(removedIndexes);
        const lines = Array.from(this.#orderShifts.keys()).filter(line => !removed.has(line));
        const renumbered = getDecreasedIndexes(lines, removedIndexes);

        this.#orderShifts = new Map(lines.map((line, index) => [renumbered[index], this.#orderShifts.get(line)!]));
      }
    });
  }

  /**
   * Gets the cached translation tables between physical, visual, and HF indexes, building them when needed.
   *
   * @returns {HfTranslationCache}
   */
  #getTranslationCache(): HfTranslationCache {
    if (this.#translationCache === null) {
      const gridSequence = this.#indexMapper.getIndexesSequence();
      const physicalIndexOfHf = this.#orderHeld ? this.#getHeldEngineSequence(gridSequence) : gridSequence;
      const notTrimmedIndexes = this.#indexMapper.getNotTrimmedIndexes();
      const hfIndexOfPhysical: number[] = new Array<number>(physicalIndexOfHf.length);
      const visualIndexOfPhysical: number[] = new Array<number>(physicalIndexOfHf.length).fill(-1);

      for (let hfIndex = 0; hfIndex < physicalIndexOfHf.length; hfIndex += 1) {
        hfIndexOfPhysical[physicalIndexOfHf[hfIndex]] = hfIndex;
      }

      for (let visualIndex = 0; visualIndex < notTrimmedIndexes.length; visualIndex += 1) {
        visualIndexOfPhysical[notTrimmedIndexes[visualIndex]] = visualIndex;
      }

      this.#translationCache = { physicalIndexOfHf, hfIndexOfPhysical, visualIndexOfPhysical };
    }

    return this.#translationCache;
  }

  /**
   * Returns the physical indexes in the order the engine holds them, as long as the grid's sequence: the
   * elements the stored engine order names first, then the ones the order an empty sheet was filled in
   * names (`#fillSequence`), then every other physical index in ascending order, the order a sheet fed its
   * content holds them in. The same order `#getEngineElements()` reads. Used while the order is held, when
   * the grid's sequence and the engine's order can differ.
   *
   * @param {number[]} gridSequence The grid's sequence of physical indexes.
   * @returns {number[]}
   */
  #getHeldEngineSequence(gridSequence: number[]): number[] {
    return listEngineElements(this.#indexesSequence, this.#fillSequence, gridSequence.length);
  }

  /**
   * Keeps the grid's order changes from the engine, or sends the grid's current order once the hold
   * ends. While the order is held, the engine keeps the order it holds, and every translation reads
   * that order, so a cell read in between still finds its own value. A caller that changes the grid's
   * order several times on the way to a known end order holds it around the changes: each order the
   * engine is handed moves formula cells (references shift with them, `#REF!` past the first row), so
   * the intermediate orders would leave their mark even when the end order is the one the engine already
   * holds.
   *
   * @param {boolean} held Whether the order is held.
   * @param {boolean} [syncOnRelease=true] Whether ending the hold sends the grid's current order.
   */
  setOrderHeld(held: boolean, syncOnRelease: boolean = true) {
    if (this.#orderHeld === held) {
      return;
    }

    const reloadedByMoves = this.#reloadedWhileHeld === true && !this.#orderChangedWhileHeld
      && !this.#isOrderSorted();
    const adoptedByMoves = this.#adoptedByMoves && this.#adoptedWhileHeld && !this.#orderChangedWhileHeld
      && !this.#isOrderSorted() && (this.#orderShifts.size === 0 || this.#isAtOrderPoint());
    const heldOrderBase = this.#reloadedWhileHeld === false ? this.#heldOrderBase : null;

    this.#orderHeld = held;
    this.#adoptedWhileHeld = false;
    this.#adoptedByMoves = false;
    this.#reloadedWhileHeld = null;
    this.#orderChangedWhileHeld = false;
    this.#heldOrderBase = null;
    this.#translationCache = null;

    if (!held && syncOnRelease) {
      this.#syncOrderWithGrid(reloadedByMoves || adoptedByMoves, heldOrderBase, adoptedByMoves);
    }
  }

  /**
   * Marks the engine order adopted in the current hold (`adoptEngineOrder()`) as one the hold's release sends the
   * grid's order to as moves. The caller has loaded a sheet the engine kept as the grid left it, without writing
   * it, so every reference in it, in other sheets and in named expressions follows the moves that order was reached
   * by; the grid's order on the return (the move plugins' arrays applied again) is reached from it by moves too. One
   * order between them kept each moved formula's relative offsets: a reference across the moved lines turned into
   * `#REF!` or read another line. An order qualifies when moves alone reached it from the engine's physical order
   * (no order shifts, no order base), or from the last order it took as one order (`#orderPoint`) when the grid's
   * order at the release is that point again (`#isAtOrderPoint()`): the difference is then the moves undone. A sort
   * or a sequence set on the visit before that the grid does not return to, or one set in the hold, still sends one
   * order, as such a reset reaches the engine on a grid that stays on the sheet.
   */
  releaseAdoptedOrderAsMoves() {
    this.#adoptedByMoves = this.#orderHeld && this.#adoptedWhileHeld && this.#orderBase === null
      && (this.#orderShifts.size === 0 || this.#orderPoint !== null);
  }

  /**
   * Tells whether the grid's current order is the one the last order the engine took as one order brought it to
   * (`#orderPoint`).
   *
   * @returns {boolean}
   */
  #isAtOrderPoint(): boolean {
    const point = this.#orderPoint;
    const sequence = this.#indexMapper.getIndexesSequence();

    return point !== null && point.length === sequence.length
      && point.every((physicalIndex, position) => physicalIndex === sequence[position]);
  }

  /**
   * Sends the grid's current order to the engine, when there is a sheet to send it to.
   *
   * The release of a hold in which the engine was fed its content again follows the reload's rule: the
   * engine holds that content in physical order, so an order the grid reached by moves alone goes as moves,
   * as `#syncInitialOrder()` would have sent it outside the hold. Any other release (an adopted engine order,
   * a sort or a sequence set in the hold, an order taken over by `adoptEngineOrder()`) sends one order.
   *
   * A release over a reload whose order was moves and then an order replays the moves to the order they
   * reached (`orderBase`) as moves first, as a reload outside the hold does (`#syncInitialOrder()`).
   *
   * A release over an adopted order marked with `releaseAdoptedOrderAsMoves()` sends the grid's order as moves to
   * a sheet the engine kept (`sheetKept`), which no reload replaced.
   *
   * @param {boolean} [asMoves=false] Whether the order is sent as moves.
   * @param {number[]|null} [orderBase=null] The order moves reached before an order was sent on top of them.
   * @param {boolean} [sheetKept=false] Whether the engine kept the sheet rather than being fed it again.
   */
  #syncOrderWithGrid(asMoves: boolean = false, orderBase: number[] | null = null, sheetKept: boolean = false) {
    const sequence = this.#indexMapper.getIndexesSequence();

    if (this.#indexSyncer.getEngine() !== null && this.#indexSyncer.getSheetId() !== null
      && sequence.length > 0 && !this.#isSheetRemoved()) {
      if (orderBase !== null && orderBase.length === sequence.length) {
        this.#syncOrderWithEngine(orderBase, true, true);
      }

      this.#syncOrderWithEngine(sequence, asMoves, false, sheetKept);
    }
  }

  /**
   * Tells whether the grid's order on this axis is a sort's (ColumnSorting or MultiColumnSorting). A syncer
   * built after the sort has no record of it in `#orderShifts`, so the grid answers.
   *
   * @returns {boolean}
   */
  #isOrderSorted(): boolean {
    return this.#axis === 'row' && this.#indexSyncer.isOrderSorted?.() === true;
  }

  /**
   * Tells whether the engine holds its elements in physical order: no order reached it since it was fed
   * its content, or the orders it got cancel out.
   *
   * @returns {boolean}
   */
  isEngineOrderPhysical() {
    return this.#fillSequence === null
      && this.#indexesSequence.every((physicalIndex, engineIndex) => physicalIndex === engineIndex);
  }

  /**
   * Tells whether the engine holds its lines in the grid's current order, as far as the syncer knows: the
   * order is not held, and the lines the engine holds, followed by the ones it gains, are the grid's sequence.
   * A grid whose order changed without reaching the engine (a data load reset it) answers `false`.
   *
   * @returns {boolean}
   */
  holdsGridOrder(): boolean {
    if (this.#orderHeld) {
      return false;
    }

    const gridSequence = this.#indexMapper.getIndexesSequence();
    const engineSequence = this.#getHeldEngineSequence(gridSequence);

    return engineSequence.every((physicalIndex, position) => physicalIndex === gridSequence[position]);
  }

  /**
   * Sets removed HF indexes (it should be done right before performing move on HOT).
   *
   * The indexes are translated physically. A removal can include trimmed rows – NestedRows removes every
   * descendant of a removed or detached parent, including one trimmed by another plugin – and the engine holds
   * trimmed rows too. A trimmed row has no visual index, so a visual translation would report it as `-1`.
   *
   * @param {Array<number>} removedIndexes List of removed physical indexes.
   * @returns {Array<number>} List of removed HF indexes.
   */
  setRemovedHfIndexes(removedIndexes: number[]) {
    this.#removedIndexes = removedIndexes.map((physicalIndex: number) => {
      return this.getHfIndexFromPhysicalIndex(physicalIndex);
    });

    return this.#removedIndexes;
  }

  /**
   * Gets removed HF indexes (right before performing removal on HOT).
   *
   * @returns {Array<number>} List of removed HF indexes.
   */
  getRemovedHfIndexes() {
    return this.#removedIndexes;
  }

  /**
   * Returns what the syncer knows about the engine's order on this axis, for UndoRedo to put back
   * with `adoptEngineOrder()`.
   *
   * @returns {object}
   */
  getEngineOrder(): EngineOrder {
    return {
      sequence: this.#indexesSequence.slice(),
      fillSequence: this.#fillSequence === null ? null : this.#fillSequence.slice(),
      paddedElements: Array.from(this.#paddedElements),
      orderShifts: Array.from(this.#orderShifts),
      ...(this.#orderBase === null ? {} : { orderBase: this.#orderBase.slice() }),
      ...(this.#orderPoint === null ? {} : { orderPoint: this.#orderPoint.slice() }),
    };
  }

  /**
   * Returns how far the orders the engine was handed moved a line since its order was last physical. The
   * engine moves formulas keeping their relative offsets on such an order (a sort, an order a hold sends
   * when it ends), so a formula the engine holds reads its relative references this many lines away from
   * where the data has it. A move, an insert, and a removal keep every reference on its cell and add
   * nothing. `0` while the engine's order is physical, where the engine's text is the data's.
   *
   * @param {number} physicalIndex The line's physical index.
   * @returns {number}
   */
  getOrderShift(physicalIndex: number): number {
    return this.#orderShifts.get(physicalIndex) ?? 0;
  }

  /**
   * Takes over an engine order `getEngineOrder()` returned: the caller has just loaded a sheet that already
   * holds its content in that order. The order was recorded earlier, so the grid can have left it since (a
   * reorder made after the recorded step). Unless the order is held, the engine then follows the grid's
   * current order, as it would have had the reorder come after the load.
   *
   * @param {object} order The order to take over.
   */
  adoptEngineOrder(order: EngineOrder) {
    this.#indexesSequence = order.sequence.slice();
    this.#fillSequence = order.fillSequence === null ? null : order.fillSequence.slice();
    this.#adoptedWhileHeld = this.#orderHeld;
    this.#adoptedByMoves = false;
    this.#reloadedWhileHeld = null;

    const held = new Set<number>(order.sequence);

    this.#paddedElements = new Set<number>(order.paddedElements.filter(physicalIndex => held.has(physicalIndex)));
    this.#orderShifts = new Map(order.orderShifts ?? []);
    this.#orderBase = order.orderBase && this.#orderShifts.size > 0 ? order.orderBase.slice() : null;
    this.#orderPoint = order.orderPoint && this.#orderShifts.size > 0 ? order.orderPoint.slice() : null;
    this.#heldOrderBase = null;
    this.#translationCache = null;

    if (!this.#orderHeld) {
      this.#syncOrderWithGrid();
    }
  }

  /**
   * Checks whether HyperFormula's index order still matches Handsontable's physical order.
   *
   * A move or a sort reorders the engine's rows/columns (`syncMoves` calls `engine.moveRows`), while
   * the source data keeps its own physical order. From that point the formulas the engine holds are
   * written in a different reference frame than the ones stored in the source data, and the two must
   * not be copied across.
   *
   * @returns {boolean}
   */
  isHfOrderPhysical() {
    if (this.#orderHeld) {
      return this.isEngineOrderPhysical();
    }

    const physicalIndexOfHf = this.#indexMapper.getIndexesSequence();

    for (let hfIndex = 0; hfIndex < physicalIndexOfHf.length; hfIndex += 1) {
      if (physicalIndexOfHf[hfIndex] !== hfIndex) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gets corresponding HyperFormula index for particular visual index. It's respecting the idea that HF's engine
   * is fed also with trimmed indexes (business requirements for formula result calculation also for trimmed elements).
   *
   * @param {number} visualIndex Visual index.
   * @returns {number}
   */
  getHfIndexFromVisualIndex(visualIndex: number) {
    const physicalIndex = this.#indexMapper.getNotTrimmedIndexes()[visualIndex];

    if (physicalIndex === undefined) {
      return -1;
    }

    // The `?? -1` covers a mid-batch state in which the mapper's not-trimmed cache still holds a
    // physical index that is no longer part of the sequence.
    return this.#getTranslationCache().hfIndexOfPhysical[physicalIndex] ?? -1;
  }

  /**
   * Gets the corresponding HyperFormula index for a physical index. Unlike
   * {@link getHfIndexFromVisualIndex} this one also answers for trimmed elements: the engine is fed
   * trimmed rows too, so a physical index that points at one of them still has an HF index, while it
   * has no visual index to translate through. Returns -1 when the physical index is outside the
   * dataset.
   *
   * @param {number} physicalIndex Physical index.
   * @returns {number}
   */
  getHfIndexFromPhysicalIndex(physicalIndex: number) {
    return this.#getTranslationCache().hfIndexOfPhysical[physicalIndex] ?? -1;
  }

  /**
   * Gets the corresponding physical index for a HyperFormula index. Unlike
   * {@link getVisualIndexFromHfIndex} this one also answers for trimmed elements: the engine is fed
   * trimmed rows too, so an index read back out of the engine has no visual counterpart whenever it
   * points at one of them. Returns -1 when the HF index is outside the dataset, which happens
   * because the engine extends its own sheet dimensions to calculate values.
   *
   * @param {number} hfIndex HyperFormula index.
   * @returns {number}
   */
  getPhysicalIndexFromHfIndex(hfIndex: number) {
    return this.#getTranslationCache().physicalIndexOfHf[hfIndex] ?? -1;
  }

  /**
   * Gets corresponding visual index for a HyperFormula index. Inverse of {@link getHfIndexFromVisualIndex}.
   * Returns -1 when the HF index points to a trimmed element (not visible to the user).
   *
   * @param {number} hfIndex HyperFormula index.
   * @returns {number}
   */
  getVisualIndexFromHfIndex(hfIndex: number) {
    const { physicalIndexOfHf, visualIndexOfPhysical } = this.#getTranslationCache();
    const physicalIndex = physicalIndexOfHf[hfIndex];

    if (physicalIndex === undefined) {
      return -1;
    }

    return visualIndexOfPhysical[physicalIndex];
  }

  /**
   * Synchronizes moves done on HOT to HF engine (based on previously calculated positions).
   *
   * @private
   * @param {Array<{from: number, to: number}>} moves Calculated HF's move positions.
   */
  syncMoves(moves: Array<{ from: number; to: number }>) {
    const NUMBER_OF_MOVED_INDEXES = 1;
    const SYNC_MOVE_METHOD_NAME = `move${toUpperCaseFirst(this.#axis)}s`;
    const engine = this.#indexSyncer.getEngine();

    if (!engine) {
      return;
    }

    this.#indexSyncer.getOwnEngineWrite()(engine, () => {
      runEngineBatch(engine, () => {
        moves.forEach((move: { from: number; to: number }) => {
          const moveToTheSamePosition = move.from !== move.to;
          // Moving from left to right (or top to bottom) to a line (drop index) right after already moved element.
          const anotherMoveWithoutEffect = move.from + 1 !== move.to;

          if (moveToTheSamePosition && anotherMoveWithoutEffect) {
            engine[SYNC_MOVE_METHOD_NAME](this.#indexSyncer.getSheetId()!, move.from,
              NUMBER_OF_MOVED_INDEXES, move.to);
          }
        });
      });
    });
  }

  /**
   * Stores information about performed HOT moves for purpose of calculating where to move HF elements.
   *
   * @param {Array<number>} movedVisualIndexes Sequence of moved visual indexes for certain axis.
   * @param {number} visualFinalIndex Final visual place where to move HOT indexes.
   * @param {boolean} movePossible Indicates if it's possible to move HOT indexes to the desired position.
   */
  storeMovesInformation(movedVisualIndexes: number[], visualFinalIndex: number, movePossible: boolean) {
    if (movePossible === false) {
      return;
    }

    this.#movedIndexes = movedVisualIndexes.map((index: number) => this.getHfIndexFromVisualIndex(index));
    this.#finalIndex = this.getHfIndexFromVisualIndex(visualFinalIndex);
  }

  /**
   * Calculating where to move HF elements and performing already calculated moves. While an engine order
   * taken over in the hold is held, a move is an order change like a sort: nothing is sent, and the release
   * sends the order the grid ends on. Without one, the move reaches the engine as it does outside the hold,
   * so a sheet loaded in the hold calculates as a plain grid loading it does. A move sent then was computed against the engine's held order, not the grid's, and asked the engine
   * for a target position it does not have.
   *
   * @param {boolean} movePossible Indicates if it was possible to move HOT indexes to the desired position.
   * @param {boolean} orderChanged Indicates if order of HOT indexes was changed by move.
   */
  calculateAndSyncMoves(movePossible: boolean, orderChanged: boolean) {
    if (movePossible === false || orderChanged === false || this.#adoptedWhileHeld) {
      return;
    }

    const calculatedMoves = getMoves(this.#movedIndexes, this.#finalIndex ?? 0, this.#indexMapper.getNumberOfIndexes());

    if (this.#indexSyncer.getSheetId() === null) {
      this.#indexSyncer.getPostponeAction(() => this.syncMoves(calculatedMoves));

    } else {
      this.syncMoves(calculatedMoves);
    }
  }

  /**
   * Lists the physical indexes the engine's sheet holds, in the order the engine holds them.
   *
   * The stored sequence names them, but the sheet can have grown or shrunk since the last sync — the engine
   * sizes a sheet by the extent of its content, so typing into a blank row widens it. Content the engine
   * gained is labelled by the sequence the grid had when it ordered the engine (it wrote that content at
   * the positions that sequence gave), or in physical order, which is the order a sheet is fed in.
   *
   * @param {number} sizeForAxis Size of the engine's sheet along the synchronized axis.
   * @returns {number[]} Physical indexes, in engine order.
   */
  #getEngineElements(sizeForAxis: number): number[] {
    const elements = this.#indexesSequence.slice(0, sizeForAxis);
    const held = new Set<number>(elements);
    const fillSequence = this.#fillSequence;

    // A sheet that was empty is filled through addresses the grid computes, so its first row is whichever
    // row the grid showed first WHEN it was filled — not in the order the grid happens to be in now.
    if (fillSequence !== null) {
      for (let position = 0; position < fillSequence.length && elements.length < sizeForAxis; position += 1) {
        if (!held.has(fillSequence[position])) {
          elements.push(fillSequence[position]);
          held.add(fillSequence[position]);
        }
      }
    }

    // A sheet that was fed its content — at load, or by the engine's own insert — holds it in physical
    // order, and the engine can also carry rows past the grid's own sequence (hyperformula#1179).
    for (let physicalIndex = 0; elements.length < sizeForAxis; physicalIndex += 1) {
      if (!held.has(physicalIndex)) {
        elements.push(physicalIndex);
        held.add(physicalIndex);
      }
    }

    return elements;
  }

  /**
   * Tells whether a row or column of the engine's sheet holds nothing.
   *
   * @param {HyperFormulaEngine} engine The engine.
   * @param {number} sheetId The sheet the axis is synced with.
   * @param {number} engineIndex Index of the row or column in the engine.
   * @param {number} sizeForOtherAxis Size of the sheet along the other axis.
   * @returns {boolean}
   */
  #isEngineLineEmpty(engine: HyperFormulaEngine, sheetId: number, engineIndex: number, sizeForOtherAxis: number) {
    for (let other = 0; other < sizeForOtherAxis; other += 1) {
      const address = this.#axis === 'row'
        ? { sheet: sheetId, row: engineIndex, col: other }
        : { sheet: sheetId, row: other, col: engineIndex };

      if (!engine.isCellEmpty(address)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Tells whether nothing needs a row or column of the engine's sheet: it holds no content, and no formula
   * reads a cell of it (an empty cell a formula reads still counts towards the sheet's size).
   *
   * @param {HyperFormulaEngine} engine The engine.
   * @param {number} sheetId The sheet the axis is synced with.
   * @param {number} engineIndex Index of the row or column in the engine.
   * @param {number} sizeForOtherAxis Size of the sheet along the other axis.
   * @returns {boolean}
   */
  #isEngineLineUnused(engine: HyperFormulaEngine, sheetId: number, engineIndex: number, sizeForOtherAxis: number) {
    for (let other = 0; other < sizeForOtherAxis; other += 1) {
      const address = this.#axis === 'row'
        ? { sheet: sheetId, row: engineIndex, col: other }
        : { sheet: sheetId, row: other, col: engineIndex };

      if (!engine.isCellEmpty(address) || engine.getCellDependents(address).length > 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Removes the rows or columns at the end of the engine's sheet that nothing needs, down to `minSize`.
   * Replacing a sheet's content never shrinks it, so the line an insert added stays behind when an undo
   * restores the sheet without it, and every insert and undo would add one more. The floor is the size the
   * sheet had in the state that is restored, so only what the step added is taken away.
   *
   * @param {number} minSize The size along this axis the sheet keeps at least.
   */
  trimUnusedTail(minSize: number) {
    const engine = this.#indexSyncer.getEngine()!;
    const sheetId = this.#indexSyncer.getSheetId()!;
    const { width, height } = engine.getSheetDimensions(sheetId);
    const isRowAxis = this.#axis === 'row';
    const size = isRowAxis ? height : width;
    let usedSize = size;

    while (usedSize > minSize && this.#isEngineLineUnused(engine, sheetId, usedSize - 1, isRowAxis ? width : height)) {
      usedSize -= 1;
    }

    if (usedSize < size) {
      engine[`remove${toUpperCaseFirst(this.#axis)}s`](sheetId, [usedSize, size - usedSize]);
    }
  }

  /**
   * Plans the order that puts every element the engine holds where the grid's sequence puts it.
   *
   * Translation reads HF index `i` as sequence position `i`, so an element with content goes to the engine
   * line of its own position, and the sheet reaches up to the last such position. What sits between those
   * lines is empty, so the empty lines the engine holds fill the places the content leaves free, and the sheet
   * is extended only for the ones it lacks. An empty line at the end of the sequence is one that was only
   * added to carry an earlier order (`#paddedElements`): it is not content, and counting it as such made
   * every order after one that moved a blank row to the top extend the sheet through everything between.
   *
   * @param {number[]} engineElements Physical indexes the engine holds, in engine order.
   * @param {number[]} targetSequence The grid's sequence of physical indexes, in grid order.
   * @param {Function} isEmpty Tells whether the engine line at the given index holds nothing.
   * @returns {object} The order to send, the physical index each line holds after it, and the lines that hold
   * nothing.
   */
  #planOrder(engineElements: number[], targetSequence: number[], isEmpty: (engineIndex: number) => boolean) {
    const engineIndexOfPhysical = new Map<number, number>();
    const emptyLines = new Set<number>();
    const freedElements: number[] = [];
    let lastContentPosition = -1;

    engineElements.forEach((physicalIndex, engineIndex) => {
      engineIndexOfPhysical.set(physicalIndex, engineIndex);
    });

    // Only the lines the engine holds need a position, and the grid can have far more rows than that.
    const positionOfEngineLine = new Array<number | undefined>(engineElements.length);

    let found = 0;

    for (let position = 0; position < targetSequence.length && found < engineElements.length; position += 1) {
      const engineIndex = engineIndexOfPhysical.get(targetSequence[position]);

      if (engineIndex !== undefined) {
        positionOfEngineLine[engineIndex] = position;
        found += 1;
      }
    }

    for (let position = targetSequence.length - 1; position >= 0 && lastContentPosition < 0; position -= 1) {
      const physicalIndex = targetSequence[position];
      const engineIndex = engineIndexOfPhysical.get(physicalIndex);

      if (engineIndex !== undefined) {
        if (this.#paddedElements.has(physicalIndex) && isEmpty(engineIndex)) {
          emptyLines.add(engineIndex);
          freedElements.push(physicalIndex);
        } else {
          lastContentPosition = position;
        }
      }
    }

    const heldSize = Math.max(engineElements.length, lastContentPosition + 1);

    for (let engineIndex = engineElements.length; engineIndex < heldSize; engineIndex += 1) {
      emptyLines.add(engineIndex);
    }

    const engineOrder: number[] = new Array<number>(heldSize);
    const takenPlaces: boolean[] = new Array<boolean>(heldSize).fill(false);
    const unplaced: number[] = [];

    for (let engineIndex = 0; engineIndex < heldSize; engineIndex += 1) {
      const position = emptyLines.has(engineIndex) ? undefined : positionOfEngineLine[engineIndex];

      if (position === undefined) {
        unplaced.push(engineIndex);
      } else {
        engineOrder[engineIndex] = position;
        takenPlaces[position] = true;
      }
    }

    const leftover: number[] = [];

    // An element the target sequence no longer covers (a mid-batch state the mapper can be in, or a row the
    // engine carries past the grid's own) keeps the place it has, when no element of the sequence needs it.
    unplaced.forEach((engineIndex) => {
      if (emptyLines.has(engineIndex) || takenPlaces[engineIndex]) {
        leftover.push(engineIndex);
      } else {
        engineOrder[engineIndex] = engineIndex;
        takenPlaces[engineIndex] = true;
      }
    });

    let nextPlace = 0;

    leftover.forEach((engineIndex) => {
      while (takenPlaces[nextPlace]) {
        nextPlace += 1;
      }

      engineOrder[engineIndex] = nextPlace;
      takenPlaces[nextPlace] = true;
    });

    const reordered: number[] = new Array<number>(heldSize);

    engineOrder.forEach((place, engineIndex) => {
      reordered[place] = emptyLines.has(engineIndex)
        ? (targetSequence[place] ?? engineElements[engineIndex])
        : engineElements[engineIndex];
    });

    const padded = new Set<number>(this.#paddedElements);

    freedElements.forEach(physicalIndex => padded.delete(physicalIndex));
    emptyLines.forEach(engineIndex => padded.add(reordered[engineOrder[engineIndex]]));

    return { engineOrder, reordered, padded };
  }

  /**
   * Tells whether the rows or columns the engine gains behind its stored order cannot be told from physical
   * order, so that `#fillSequence` has nothing to add.
   *
   * @param {number[]} reordered The physical indexes the engine's lines hold, in engine order.
   * @param {number[]} targetSequence The grid's sequence of physical indexes, in grid order.
   * @returns {boolean}
   */
  #followsPhysicalOrderBehind(reordered: number[], targetSequence: number[]): boolean {
    const covered = Math.min(reordered.length, targetSequence.length);

    for (let position = 0; position < covered; position += 1) {
      if (reordered[position] !== targetSequence[position]) {
        return false;
      }
    }

    for (let position = covered + 1; position < targetSequence.length; position += 1) {
      if (targetSequence[position - 1] > targetSequence[position]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Reorders the engine's sheet so that the elements it holds follow the grid's sequence.
   *
   * The engine takes an order exactly as long as its sheet, and every entry has to be a position inside that
   * sheet — anything else it rejects by throwing, and the throw unwinds whatever triggered the sequence
   * change. The sheet's own size is a poor fit for the grid's sequence in both directions: the engine extends
   * a sheet beyond the dataset to calculate values outside it (handsontable/hyperformula#1179), and it leaves
   * trailing empty rows and columns out of the sheet's extent.
   *
   * The grid's extra rows or columns are the empty tail the engine left out, and one behind the last
   * element with content needs no row of its own. One in front of it does, so the sheet is extended to
   * hold it: translation reads HF index `i` as sequence position `i`, which finds the right row only while
   * the engine's order is the grid's (see `#planOrder()`).
   *
   * With `asMoves`, the order reaches the engine as `moveRows()`/`moveColumns()` calls instead of one
   * `setRowOrder()`/`setColumnOrder()`: a move keeps every reference on the cell it names, while an order
   * keeps each moved formula's relative offsets, so a reference across the moved lines turns into `#REF!` or
   * reads another line. An order whose moves would cost more than one order (`chooseOrderMoves()`) is sent as
   * one order anyway, and then counts as one: it leaves its shifts in `#orderShifts`.
   *
   * @param {number[]} targetSequence The grid's sequence of physical indexes, in grid order.
   * @param {boolean} [asMoves=false] Whether the order is sent as moves.
   * @param {boolean} [movesOnly=false] Whether to send nothing when the order cannot go as moves.
   * @param {boolean} [sheetKept=false] Whether the engine kept the sheet rather than being fed it again, so the
   * references other sheets and named expressions hold into it follow the moves too (`#planSafeMoves()`).
   * @returns {boolean} `true` when the engine holds the sequence's order, `false` when its sheet is empty or
   * cannot be extended to hold it, or the moves `movesOnly` asks for cannot be sent.
   */
  #syncOrderWithEngine(
    targetSequence: number[],
    asMoves: boolean = false,
    movesOnly: boolean = false,
    sheetKept: boolean = false,
  ): boolean {
    const engine = this.#indexSyncer.getEngine();

    // No endpoint: every path that binds or fills a sheet points the syncers at it first (`#loadSheet()`,
    // `#writeSheet()`, `#clearRejectedSheet()`, `#adoptEngineSheet()`, and the `enablePlugin()` and `updatePlugin()`
    // paths that add a sheet or bind one the engine still holds, for a grid built with `data` and for one built
    // from an engine sheet), so no known path reaches this. The one shape left in theory, not reproduced, is an
    // enable whose `#addSheet()` the engine refuses (its `addSheet()` throws), which binds nothing. The last two
    // windows found (a shared-engine re-enable before its resync drained, and any re-enable of a grid built from an
    // engine sheet) are pinned in `__tests__/enableOnLiveGridSyncEndpoint.unit.js`. It warns, once per syncer,
    // rather than throwing: the order is lost and the formula results stay where they were, which a warning names.
    // A throw would end the user's sort or move half-done (before DEV-3760 this line threw a `TypeError`).
    if (engine === null) {
      warnOnce(this, 'noSyncEndpoint', `The Formulas plugin got a ${this.#axis} order before it was bound to an ` +
        'engine sheet, so the engine keeps its previous order and formulas may read the wrong cells.');

      return false;
    }

    const sheetId = this.#indexSyncer.getSheetId()!;
    const sheetDimensions = engine.getSheetDimensions(sheetId);
    const isRowAxis = this.#axis === 'row';
    const sizeForAxis = isRowAxis ? sheetDimensions.height : sheetDimensions.width;
    const sizeForOtherAxis = isRowAxis ? sheetDimensions.width : sheetDimensions.height;

    // A sheet the workbook gained at runtime carries no data, so the engine holds no rows or columns to
    // reorder and reports the sheet as 0x0. The grid's order is replayed by the next sync that finds a
    // sheet to apply it to.
    if (sizeForAxis === 0) {
      this.#fillSequence = targetSequence.slice();
      this.#indexesSequence = [];
      this.#paddedElements = new Set<number>();
      this.#orderShifts = new Map<number, number>();
      this.#orderBase = null;
      this.#orderPoint = null;

      return false;
    }

    const engineElements = this.#getEngineElements(sizeForAxis);
    const { engineOrder, reordered, padded } = this.#planOrder(
      engineElements,
      targetSequence,
      engineIndex => this.#isEngineLineEmpty(engine, sheetId, engineIndex, sizeForOtherAxis),
    );
    const heldSize = engineOrder.length;
    let sentAsMoves = false;
    let sentOrder = false;

    // The engine records an undo entry and clears its redo stack for any order it is handed, so an order
    // that changes nothing costs the user their redo history. Compression makes that common: every sort
    // that leaves the engine's own elements in the same relative order ranks them identically.
    if (engineOrder.some((place, engineIndex) => place !== engineIndex)) {
      if (!this.#isOrderAllowed(engine, sheetId, engineOrder, sizeForAxis, sizeForOtherAxis)) {
        // A `movesOnly` call only tries the moves to an order base, and the call that follows warns once.
        if (movesOnly) {
          return false;
        }

        warn(`The engine cannot reorder the ${this.#axis}s an array formula spans, so it keeps its previous ` +
          `${this.#axis} order. Formulas may read the wrong cells until the grid takes an order that leaves ` +
          'them in place.');

        return false;
      }

      const moves = asMoves
        ? this.#planSafeMoves(engine, sheetId, engineOrder, sizeForAxis, sizeForOtherAxis, sheetKept)
        : null;

      sentAsMoves = moves !== null;

      if (movesOnly && !sentAsMoves) {
        return false;
      }

      if (!sentAsMoves) {
        this.#recordOrderBase(targetSequence);
      }

      const setOrder = moves !== null
        ? () => this.#sendMoves(engine, sheetId, moves)
        : () => {
          engine[`set${toUpperCaseFirst(this.#axis)}Order`](sheetId, engineOrder);
          // An order keeps the moved formulas' relative offsets, so the engine's text no longer follows the
          // data's: whoever skips writing the data again has to know.
          this.#indexSyncer.onOrderSent?.();
        };

      // The pad and the order are one write of this grid's own, so the grids sharing the engine paint once.
      const written = this.#indexSyncer.getOwnEngineWrite()(engine, () => {
        if (heldSize === sizeForAxis) {
          setOrder();

          return true;
        }

        return this.#extendAndSetOrder(engine, sheetId, heldSize, setOrder);
      });

      if (!written) {
        return false;
      }

      sentOrder = !sentAsMoves;
    }

    // A move keeps every reference on its cell, so the engine's text keeps the data's meaning.
    if (!sentAsMoves) {
      this.#addOrderShifts(engineElements, engineOrder);
    }

    if (sentOrder) {
      this.#orderPoint = targetSequence.slice();
    }
    this.#indexesSequence = reordered;
    this.#fillSequence = this.#followsPhysicalOrderBehind(reordered, targetSequence) ? null : targetSequence.slice();
    this.#paddedElements = padded;
    this.#clearOrderShiftsWhenPhysical();

    return true;
  }

  /**
   * Sends planned moves (`planOrderMoves()`) to the engine. Every move keeps the references to the moved lines
   * on their cells, so the engine ends where the same moves made one by one would leave it, which is what a
   * drag sends (`syncMoves()`). Outside a batch of the host's own, the moves go in one `engine.batch()`: one
   * change list and one undo entry. Inside one, `engine.batch()` would end the host's batch, so the moves are
   * made directly and the host's batch folds them.
   *
   * @param {HyperFormulaEngine} engine The engine.
   * @param {number} sheetId The sheet the axis is synced with.
   * @param {OrderMove[]} moves The moves, in order.
   */
  #sendMoves(engine: HyperFormulaEngine, sheetId: number, moves: OrderMove[]) {
    const moveMethod = `move${toUpperCaseFirst(this.#axis)}s`;

    this.#runBatched(engine, () => {
      moves.forEach(({ start, count, target }) => {
        engine[moveMethod](sheetId, start, count, target);
      });
    });
  }

  /**
   * Runs several engine calls as one step. Outside a batch of the host's own, they go in one
   * `engine.batch()`: one change list and one undo entry. A batch of the host's (or a `suspendEvaluation()`)
   * is already open otherwise, and `engine.batch()` would end it: it resumes the evaluation the host
   * suspended and commits a batch mode the host's own commit then finds closed, so the calls are made
   * directly and the host's batch folds them. A suspension a grid holds (`formulas.batchEvaluation`) starts
   * here when none is open yet, and the calls join it (see `runEngineBatch()`).
   *
   * @param {HyperFormulaEngine} engine The engine.
   * @param {Function} calls The engine calls.
   */
  #runBatched(engine: HyperFormulaEngine, calls: () => void) {
    runEngineBatch(engine, calls, { joinsAnySuspension: true });
  }

  /**
   * Plans the moves that bring the engine to `engineOrder`, or returns `null` when the order has to go as one
   * order: the moves would cost more than one order (`chooseOrderMoves()`), or the engine could not
   * take them, or they would change what is read from outside this sheet. Checked before anything is sent,
   * because a batch of moves is not rolled back when one of them throws.
   *
   * - **Array formulas.** A move throws `SourceLocationHasArrayError` for any line it displaces that an array
   *   spans, not only for the lines the order moves (`#isOrderAllowed()` asks about those). Every move of the
   *   plan displaces only the lines between its block and its target, and each one starts at or after the
   *   place the one before settled, so the lines ever displaced are among the lines from the lowest start or
   *   target to the highest block end or target, read before the moves.
   * - **Size limits.** A move adds `count` lines before it moves them, so it throws
   *   `SheetSizeLimitExceededError` when the sheet plus the block would pass the engine's `maxRows` or
   *   `maxColumns`.
   * - **Readers outside the sheet.** A reload replaces only this sheet's content, so the references other
   *   sheets and named expressions hold into it already follow the order; a move would move them again. An
   *   engine with another sheet or with a named expression therefore gets one order, which leaves them alone.
   *   A sheet the engine kept (`sheetKept`, a return to a sheet the grid left) was not replaced: its readers
   *   followed every move that reached it, as they follow a drag, so the moves go as moves there.
   *
   * @param {HyperFormulaEngine} engine The engine.
   * @param {number} sheetId The sheet the axis is synced with.
   * @param {number[]} engineOrder The order to send, possibly longer than the sheet.
   * @param {number} sizeForAxis Size of the engine's sheet along the synchronized axis.
   * @param {number} sizeForOtherAxis Size of the sheet along the other axis.
   * @param {boolean} [sheetKept=false] Whether the engine kept the sheet rather than being fed it again.
   * @returns {OrderMove[]|null}
   */
  #planSafeMoves(
    engine: HyperFormulaEngine,
    sheetId: number,
    engineOrder: number[],
    sizeForAxis: number,
    sizeForOtherAxis: number,
    sheetKept: boolean = false,
  ): OrderMove[] | null {
    if (!sheetKept && (engine.getSheetNames().length > 1 || engine.listNamedExpressions().length > 0
      || engine.listNamedExpressions(sheetId).length > 0)) {
      return null;
    }

    const moves = chooseOrderMoves(engineOrder);

    if (moves === null || moves.length === 0) {
      return moves;
    }

    const limit = engine.getConfig()[this.#axis === 'row' ? 'maxRows' : 'maxColumns'];
    let largestBlock = 0;
    let firstLine = Infinity;
    let lastLine = -1;

    moves.forEach(({ start, count, target }) => {
      largestBlock = Math.max(largestBlock, count);
      // A move up displaces the lines from its target to its block's end, a move down those from its block's
      // start to its target.
      firstLine = Math.min(firstLine, start, target);
      lastLine = Math.max(lastLine, start + count - 1, target - 1);
    });

    if (typeof limit === 'number' && engineOrder.length + largestBlock > limit) {
      return null;
    }

    lastLine = Math.min(lastLine, sizeForAxis - 1);

    for (let line = firstLine; line <= lastLine; line += 1) {
      for (let other = 0; other < sizeForOtherAxis; other += 1) {
        const address = this.#axis === 'row'
          ? { sheet: sheetId, row: line, col: other }
          : { sheet: sheetId, row: other, col: line };

        if (engine.isCellPartOfArray(address)) {
          return null;
        }
      }
    }

    return moves;
  }

  /**
   * Adds how far an order the engine took moved each line it held to `#orderShifts`.
   *
   * @param {number[]} engineElements Physical indexes the engine held, in engine order, before the order.
   * @param {number[]} engineOrder The order sent: the new place of each engine line.
   */
  #addOrderShifts(engineElements: number[], engineOrder: number[]) {
    engineElements.forEach((physicalIndex, engineIndex) => {
      const shift = (this.#orderShifts.get(physicalIndex) ?? 0) + engineOrder[engineIndex] - engineIndex;

      if (shift === 0) {
        this.#orderShifts.delete(physicalIndex);
      } else {
        this.#orderShifts.set(physicalIndex, shift);
      }
    });
  }

  /**
   * Forgets the shifts once the engine holds its lines in physical order again: from there, the engine's text
   * is what the data holds, so the next order is measured from it.
   */
  #clearOrderShiftsWhenPhysical() {
    if (this.#orderShifts.size > 0 && this.isEngineOrderPhysical()) {
      this.#orderShifts = new Map<number, number>();
    }

    if (this.#orderShifts.size === 0) {
      this.#orderBase = null;
      this.#orderPoint = null;
    }
  }

  /**
   * Records the order the engine holds as `#orderBase` when the order about to be sent is the first one on top
   * of what moves alone reached: no order shifts are recorded, and the engine's order is not physical.
   *
   * @param {number[]} targetSequence The grid's sequence of physical indexes, in grid order.
   */
  #recordOrderBase(targetSequence: number[]) {
    if (this.#orderShifts.size === 0 && this.#orderBase === null && !this.isEngineOrderPhysical()) {
      this.#orderBase = this.#getHeldEngineSequence(targetSequence);
    }
  }

  /**
   * Tells whether the engine takes the order, before anything is written: it throws for an order that moves
   * a line an array formula spans, and by then the sheet may be extended already. Only the lines the sheet
   * has are checked, as the lines added to carry the order hold nothing. The engine checks the lines an
   * order moves and ignores where they go, so a rotation of the same lines asks the same question.
   *
   * @param {HyperFormulaEngine} engine The engine.
   * @param {number} sheetId The sheet the axis is synced with.
   * @param {number[]} engineOrder The order to send, possibly longer than the sheet.
   * @param {number} sizeForAxis Size of the engine's sheet along the synchronized axis.
   * @param {number} sizeForOtherAxis Size of the sheet along the other axis.
   * @returns {boolean}
   */
  #isOrderAllowed(
    engine: HyperFormulaEngine,
    sheetId: number,
    engineOrder: number[],
    sizeForAxis: number,
    sizeForOtherAxis: number,
  ) {
    const movedLines: number[] = [];

    for (let engineIndex = 0; engineIndex < sizeForAxis; engineIndex += 1) {
      if (engineOrder[engineIndex] !== engineIndex) {
        movedLines.push(engineIndex);
      }
    }

    // A line cannot be rotated on its own, so the single line is read cell by cell.
    if (movedLines.length === 1) {
      for (let other = 0; other < sizeForOtherAxis; other += 1) {
        const address = this.#axis === 'row'
          ? { sheet: sheetId, row: movedLines[0], col: other }
          : { sheet: sheetId, row: other, col: movedLines[0] };

        if (engine.isCellPartOfArray(address)) {
          return false;
        }
      }

      return true;
    }

    const rotation = Array.from({ length: sizeForAxis }, (_, engineIndex) => engineIndex);

    movedLines.forEach((engineIndex, position) => {
      rotation[engineIndex] = movedLines[(position + 1) % movedLines.length];
    });

    return engine[`isItPossibleToSet${toUpperCaseFirst(this.#axis)}Order`](sheetId, rotation) as boolean;
  }

  /**
   * Extends the engine's sheet to `heldSize` lines and sets the order in the same step.
   *
   * The engine ends a sheet at its content, and adding a row or column past it does not extend it. Writing
   * the last needed cell and clearing it does. Outside a batch of the host's own, the write and the order go
   * in one `engine.batch()`: one change list, which shows the cleared cell as a `null` change, and one undo
   * step. A batch of the host's (or a `suspendEvaluation()`) is already open then, and `engine.batch()` would
   * end it: it resumes the evaluation the host suspended and commits a batch mode the host's own commit then
   * finds closed, so the three calls are made directly and the host's batch folds them.
   *
   * @param {HyperFormulaEngine} engine The engine.
   * @param {number} sheetId The sheet the axis is synced with.
   * @param {number} heldSize Number of lines the sheet has to hold.
   * @param {Function} setOrder Sends the order to the engine.
   * @returns {boolean} `false` when the engine cannot hold that many lines.
   */
  #extendAndSetOrder(engine: HyperFormulaEngine, sheetId: number, heldSize: number, setOrder: () => void) {
    const lastCell = this.#axis === 'row'
      ? { sheet: sheetId, row: heldSize - 1, col: 0 }
      : { sheet: sheetId, row: 0, col: heldSize - 1 };

    // The engine's `maxRows` and `maxColumns` cap the sheet. The grid has already taken its new order and
    // cannot be handed back, so the engine keeps its own order and the two stay apart until the grid
    // takes an order the engine can hold. The stored order stays what the engine holds.
    if (!engine.isItPossibleToSetCellContents(lastCell)) {
      warn(`The engine cannot hold ${heldSize} ${this.#axis}s, so it keeps its previous ${this.#axis} order. ` +
        'Formulas may read the wrong cells until the order fits the engine\'s size limits.');

      return false;
    }

    this.#runBatched(engine, () => {
      engine.setCellContents(lastCell, 0);
      engine.setCellContents(lastCell, null);
      setOrder();
    });

    return true;
  }

  /**
   * Tells whether the sheet this axis is synced with was removed from the engine behind the grid's back.
   *
   * @returns {boolean}
   */
  #isSheetRemoved(): boolean {
    const engine = this.#indexSyncer.getEngine();
    const sheetId = this.#indexSyncer.getSheetId();

    return engine !== null && sheetId !== null && engine.getSheetName(sheetId) === undefined;
  }

  /**
   * Gets callback for hook triggered after performing change of indexes order.
   *
   * @returns {Function}
   */
  getIndexesChangeSyncMethod() {
    return (source: string) => {
      const newSequence = this.#indexMapper.getIndexesSequence();

      if (source === 'move' && this.#adoptedWhileHeld) {
        return;
      }

      if (source === 'update' && newSequence.length > 0) {
        // A sheet the host removed from the engine has no order to follow: asking its size throws.
        if (!this.#orderHeld && !this.#isSheetRemoved()) {
          this.#syncOrderWithEngine(newSequence);
        } else if (this.#orderHeld) {
          this.#orderChangedWhileHeld = true;
          this.#adoptedByMoves = false;
          this.#heldOrderBase = null;
        }

        return;
      }

      // An insert, a removal or a move reaches the engine through its own call — `addRows`, `removeRows`,
      // `syncMoves` — and renumbers the physical indexes on both sides, so there is no order to send and
      // the stored order takes the grid's new sequence, which names every line the engine can gain, so
      // `#fillSequence` has nothing to add. The padded elements stay, as the mapper renumbers them (see the
      // constructor); any other change starts over.
      const engineHeldGridOrder = this.isEngineOrderPhysical()
        && newSequence.every((physicalIndex, position) => physicalIndex === position);

      this.#indexesSequence = newSequence;
      this.#fillSequence = null;
      // The moves recorded under an order no longer lead to the grid's order once it changes again.
      this.#heldOrderBase = null;

      if (source !== 'move' && source !== 'insert' && source !== 'remove') {
        this.#paddedElements = new Set<number>();
        this.#orderShifts = new Map<number, number>();
        this.#orderBase = null;
        this.#orderPoint = null;

        // The grid's order was reset (`initIndexMappers()`, a `columns` update without `data`) and no engine
        // call followed it, so the engine still holds the order it had, and the order stored above is not it.
        // An engine already in physical order holds the reset order, so nothing needs writing again.
        if (!engineHeldGridOrder) {
          this.#indexSyncer.onOrderReset?.();
        }
      }

      this.#clearOrderShiftsWhenPhysical();
    };
  }

  /**
   * Synchronizes the initial axis order with HF engine. When the IndexMapper's sequence is non-identity at
   * setup time (for example, an initial `manualColumnMove` or `manualRowMove` configuration), HF needs to
   * reorder its data so that HF visual order matches HOT visual order. Without this sync, downstream code
   * that translates visual indexes through `getHfIndexFromVisualIndex` reads the wrong cells.
   *
   * The engine was just fed its content in physical order, with the references the data names. When the
   * grid reached its order by moves alone (a `manualRowMove` or `manualColumnMove` array, the user's drags),
   * the order is sent as moves, which keep those references on their cells; the grid shows the same values
   * as when the engine followed each move. An order a sort or `setIndexesSequence()` set reached the engine
   * as an order (`#orderShifts`), and is sent as one again: the moves the grid made before it to the order it
   * was sent on (`orderBase`) as moves, and the rest as one order. An order whose moves cost more than one order
   * (`chooseOrderMoves()`) goes as an order too (a known limit).
   *
   * @private
   * @param {boolean} [reachedByMoves=true] Whether the grid's order was reached by moves alone.
   * @param {number[]|null} [orderBase=null] The order moves reached before an order was sent on top of them.
   * @returns {boolean} `true` when the engine holds the sequence's order, `false` while it does not.
   */
  #syncInitialOrder(reachedByMoves: boolean = true, orderBase: number[] | null = null): boolean {
    const sequence = this.#indexMapper.getIndexesSequence();
    const isIdentity = sequence.every((value, index) => value === index);

    if (isIdentity || sequence.length === 0 || this.#orderHeld) {
      return true;
    }

    const engine = this.#indexSyncer.getEngine();
    const sheetId = this.#indexSyncer.getSheetId();

    if (engine === null || sheetId === null) {
      this.#indexSyncer.getPostponeAction()(() => this.#applyInitialOrder(reachedByMoves, orderBase));

      return false;
    }

    // An order sent on top of moves: the moves go as moves first, when they can, and the rest as one order.
    if (!reachedByMoves && orderBase !== null && orderBase.length === sequence.length) {
      this.#syncOrderWithEngine(orderBase, true, true);
    }

    return this.#syncOrderWithEngine(sequence, reachedByMoves);
  }

  /**
   * Synchronizes the initial order, and records the engine's own order when there is nothing to send. The
   * engine holds its content in physical order until an order reaches it, and that identity is what the
   * next transformation has to be measured against.
   *
   * An order the engine took as an order left shifts behind, while moves left none, so the kind is read
   * before the reset. A syncer built after a sort (Formulas got its engine later, or followed a new one) has
   * no shifts to read, so the grid's sort state answers for it. A postponed call carries the kind read when
   * it was postponed, because by then the shifts are reset.
   *
   * An order sent on top of moves left the order those moves reached (`#orderBase`), which is read before the
   * reset too: the reload sends the moves to it as moves and only the rest as one order.
   *
   * @private
   * @param {boolean} [reachedByMoves] Whether the grid's order was reached by moves alone.
   * @param {number[]|null} [orderBase] The order moves reached before the first order was sent on top of them.
   * @param {boolean} [syncOrder=true] Whether to send the grid's current order to the engine (see `init()`).
   */
  #applyInitialOrder(
    reachedByMoves: boolean = this.#orderShifts.size === 0 && !this.#isOrderSorted(),
    orderBase: number[] | null = this.#orderBase,
    syncOrder: boolean = true,
  ) {
    // The engine holds the sheet it was just fed, in physical order, whatever order the previous sheet was
    // left in — so the stored order starts empty, which reads back as that physical order, rather than
    // carrying over what the engine used to hold.
    this.#indexesSequence = [];
    this.#fillSequence = null;
    this.#paddedElements = new Set<number>();
    this.#orderShifts = new Map<number, number>();
    this.#orderBase = null;
    this.#orderPoint = null;
    this.#translationCache = null;

    if (this.#orderHeld) {
      this.#adoptedByMoves = false;
      this.#reloadedWhileHeld = reachedByMoves;
      this.#heldOrderBase = reachedByMoves ? null : orderBase;
    }

    if (syncOrder) {
      this.#syncInitialOrder(reachedByMoves, orderBase);
    }
  }

  /**
   * Initialize the AxisSyncer.
   *
   * @param {boolean} [syncOrder=true] Whether to send the grid's current order to the engine. `false` when
   * the grid is about to load the sheet's data, which resets its order: whatever order the grid then takes
   * reaches the engine through the sequence and move hooks.
   */
  init(syncOrder: boolean = true) {
    this.#applyInitialOrder(undefined, undefined, syncOrder);
  }
}

export default AxisSyncer;
