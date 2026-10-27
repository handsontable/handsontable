import { warn } from '../../../helpers/console';
import { toUpperCaseFirst } from '../../../helpers/string';
import { getMoves } from '../../../helpers/moves';
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
 * own order, and the grid's sequence at the moment the engine's sheet was found empty.
 */
export interface EngineOrder {
  sequence: number[];
  fillSequence: number[] | null;
}

interface ParentIndexSyncer {
  getEngine(): HyperFormulaEngine | null;
  getSheetId(): number | null;
  getPostponeAction(callback?: Function): Function;
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
   * The grid's sequence at the moment the engine's sheet was found empty, or `null` while the engine holds
   * content it was fed. A sheet with no rows or columns is filled through addresses the grid computes from
   * that sequence, so it is what says which element each row or column the sheet gains belongs to.
   *
   * @type {Array<number>|null}
   */
  #fillSequence: number[] | null = null;
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
    this.#indexMapper.addLocalHook('cacheUpdated', (changes: { trimmedIndexesChanged: boolean }) => {
      if (changes.trimmedIndexesChanged) {
        this.#translationCache = null;
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
    const length = gridSequence.length;
    const sequence: number[] = [];
    const held = new Set<number>();
    const take = (physicalIndex: number) => {
      if (physicalIndex < length && !held.has(physicalIndex)) {
        sequence.push(physicalIndex);
        held.add(physicalIndex);
      }
    };

    this.#indexesSequence.forEach(take);
    this.#fillSequence?.forEach(take);

    for (let physicalIndex = 0; sequence.length < length; physicalIndex += 1) {
      take(physicalIndex);
    }

    return sequence;
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

    this.#orderHeld = held;
    this.#adoptedWhileHeld = false;
    this.#translationCache = null;

    const engine = this.#indexSyncer.getEngine();
    const sequence = this.#indexMapper.getIndexesSequence();

    if (!held && syncOnRelease && engine !== null && this.#indexSyncer.getSheetId() !== null
      && sequence.length > 0 && !this.#isSheetRemoved()) {
      this.#syncOrderWithEngine(sequence);
    }
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
    };
  }

  /**
   * Takes over an engine order `getEngineOrder()` returned, without sending anything to the engine:
   * the caller has just loaded a sheet that already holds its content in that order.
   *
   * @param {object} order The order to take over.
   */
  adoptEngineOrder(order: EngineOrder) {
    this.#indexesSequence = order.sequence.slice();
    this.#fillSequence = order.fillSequence === null ? null : order.fillSequence.slice();
    this.#adoptedWhileHeld = this.#orderHeld;
    this.#translationCache = null;
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

    engine.batch(() => {
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
   * gained is appended in physical order, which is the order it is fed in.
   *
   * @param {number} sizeForAxis Size of the engine's sheet along the synchronized axis.
   * @param {number[]} targetSequence The grid's sequence of physical indexes, in grid order.
   * @returns {number[]} Physical indexes, in engine order.
   */
  #getEngineElements(sizeForAxis: number, targetSequence: number[]): number[] {
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
   * Reorders the engine's sheet so that the elements it holds follow the grid's sequence.
   *
   * The engine takes an order exactly as long as its sheet, and every entry has to be a position inside that
   * sheet — anything else it rejects by throwing, and the throw unwinds whatever triggered the sequence
   * change. The sheet's own size is a poor fit for the grid's sequence in both directions: the engine extends
   * a sheet beyond the dataset to calculate values outside it (handsontable/hyperformula#1179), and it leaves
   * trailing empty rows and columns out of the sheet's extent.
   *
   * The order is therefore built from the elements the engine holds, ranked by where the grid's sequence puts
   * them. The grid's extra rows or columns are the empty tail the engine left out, and one behind the last
   * element the engine holds needs no row of its own. One in front of it does, so the sheet is extended to
   * hold it: translation reads HF index `i` as sequence position `i`, which finds the right row only while
   * the engine's order is the grid's.
   *
   * @param {number[]} targetSequence The grid's sequence of physical indexes, in grid order.
   * @returns {boolean} `true` when the engine holds the sequence's order, `false` when its sheet is empty or
   * cannot be extended to hold it.
   */
  #syncOrderWithEngine(targetSequence: number[]): boolean {
    const engine = this.#indexSyncer.getEngine()!;
    const sheetId = this.#indexSyncer.getSheetId()!;
    const sheetDimensions = engine.getSheetDimensions(sheetId);
    const sizeForAxis = this.#axis === 'row' ? sheetDimensions.height : sheetDimensions.width;

    // A sheet the workbook gained at runtime carries no data, so the engine holds no rows or columns to
    // reorder and reports the sheet as 0x0. The grid's order is replayed by the next sync that finds a
    // sheet to apply it to.
    if (sizeForAxis === 0) {
      this.#fillSequence = targetSequence.slice();
      this.#indexesSequence = [];

      return false;
    }

    const engineElements = this.#getEngineElements(sizeForAxis, targetSequence);
    const held = new Set<number>(engineElements);
    let lastHeldPosition = -1;

    targetSequence.forEach((physicalIndex, position) => {
      if (held.has(physicalIndex)) {
        lastHeldPosition = position;
      }
    });

    // The grid shows these ahead of an element the engine holds, so the engine needs a row or column
    // for each of them. They are empty: the sheet left them out because it ends at its content.
    for (let position = 0; position < lastHeldPosition; position += 1) {
      if (!held.has(targetSequence[position])) {
        engineElements.push(targetSequence[position]);
        held.add(targetSequence[position]);
      }
    }

    const rankOfEngineIndex = new Map<number, number>();
    const engineIndexOfPhysical = new Map<number, number>();

    engineElements.forEach((physicalIndex, engineIndex) => {
      engineIndexOfPhysical.set(physicalIndex, engineIndex);
    });

    // One pass over the target order hands out the ranks, instead of sorting one object per element —
    // this runs on every sequence change, mid-batch included, so a sort of a large grid pays for it.
    for (let position = 0; position < targetSequence.length; position += 1) {
      const physicalIndex = targetSequence[position];

      if (held.has(physicalIndex)) {
        rankOfEngineIndex.set(engineIndexOfPhysical.get(physicalIndex)!, rankOfEngineIndex.size);
      }
    }

    // An element the target sequence no longer covers (a mid-batch state the mapper can be in) keeps the
    // position it has, after everything the sequence did name.
    engineElements.forEach((physicalIndex, engineIndex) => {
      if (!rankOfEngineIndex.has(engineIndex)) {
        rankOfEngineIndex.set(engineIndex, rankOfEngineIndex.size);
      }
    });

    const heldSize = engineElements.length;
    const engineOrder: number[] = new Array<number>(heldSize);
    const reordered: number[] = new Array<number>(heldSize);

    rankOfEngineIndex.forEach((rank, engineIndex) => {
      engineOrder[engineIndex] = rank;
      reordered[rank] = engineElements[engineIndex];
    });

    // The engine records an undo entry and clears its redo stack for any order it is handed, so an order
    // that changes nothing costs the user their redo history. Compression makes that common: every sort
    // that leaves the engine's own elements in the same relative order ranks them identically.
    if (engineOrder.every((rank, engineIndex) => rank === engineIndex)) {
      this.#indexesSequence = reordered;
      this.#fillSequence = null;

      return true;
    }

    const setOrder = () => {
      engine[`set${toUpperCaseFirst(this.#axis)}Order`](sheetId, engineOrder);
    };

    if (heldSize === sizeForAxis) {
      setOrder();
    } else {
      // The engine ends a sheet at its content, and adding a row or column past it does not extend it.
      // Writing the last needed cell and clearing it does. The batch folds the write and the order into one
      // change list and one undo step; the cleared cell shows in it as a `null` change.
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

      engine.batch(() => {
        engine.setCellContents(lastCell, 0);
        engine.setCellContents(lastCell, null);
        setOrder();
      });
    }

    this.#indexesSequence = reordered;
    this.#fillSequence = null;

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
        }

        return;
      }

      // An insert, a removal or a move reaches the engine through its own call — `addRows`, `removeRows`,
      // `syncMoves` — and renumbers the physical indexes on both sides, so there is no order to send and
      // the stored order takes the grid's new sequence.
      this.#indexesSequence = newSequence;
    };
  }

  /**
   * Synchronizes the initial axis order with HF engine. When the IndexMapper's sequence is non-identity at
   * setup time (for example, an initial `manualColumnMove` or `manualRowMove` configuration), HF needs to
   * reorder its data so that HF visual order matches HOT visual order. Without this sync, downstream code
   * that translates visual indexes through `getHfIndexFromVisualIndex` reads the wrong cells.
   *
   * @private
   * @returns {boolean} `true` when the engine holds the sequence's order, `false` while it does not.
   */
  #syncInitialOrder(): boolean {
    const sequence = this.#indexMapper.getIndexesSequence();
    const isIdentity = sequence.every((value, index) => value === index);

    if (isIdentity || sequence.length === 0 || this.#orderHeld) {
      return true;
    }

    const engine = this.#indexSyncer.getEngine();
    const sheetId = this.#indexSyncer.getSheetId();

    if (engine === null || sheetId === null) {
      this.#indexSyncer.getPostponeAction()(() => this.#applyInitialOrder());

      return false;
    }

    return this.#syncOrderWithEngine(sequence);
  }

  /**
   * Synchronizes the initial order, and records the engine's own order when there is nothing to send. The
   * engine holds its content in physical order until an order reaches it, and that identity is what the
   * next transformation has to be measured against.
   *
   * @private
   */
  #applyInitialOrder() {
    // The engine holds the sheet it was just fed, in physical order, whatever order the previous sheet was
    // left in — so the stored order starts empty, which reads back as that physical order, rather than
    // carrying over what the engine used to hold.
    this.#indexesSequence = [];
    this.#fillSequence = null;
    this.#translationCache = null;

    this.#syncInitialOrder();
  }

  /**
   * Initialize the AxisSyncer.
   */
  init() {
    this.#applyInitialOrder();
  }
}

export default AxisSyncer;
