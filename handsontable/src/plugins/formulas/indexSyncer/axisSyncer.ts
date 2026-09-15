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

interface ParentIndexSyncer {
  getEngine(): HyperFormulaEngine | null;
  getSheetId(): number | null;
  getPostponeAction(callback?: Function): Function;
  isPerformingUndoRedo(): boolean;
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
      const physicalIndexOfHf = this.#indexMapper.getIndexesSequence();
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
   * Sets removed HF indexes (it should be done right before performing move on HOT).
   *
   * @param {Array<number>} removedIndexes List of removed physical indexes.
   * @returns {Array<number>} List of removed visual indexes.
   */
  setRemovedHfIndexes(removedIndexes: number[]) {
    this.#removedIndexes = removedIndexes.map((physicalIndex: number) => {
      const visualIndex = this.#indexMapper.getVisualFromPhysicalIndex(physicalIndex);

      return this.getHfIndexFromVisualIndex(visualIndex ?? -1);
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
   * Calculating where to move HF elements and performing already calculated moves.
   *
   * @param {boolean} movePossible Indicates if it was possible to move HOT indexes to the desired position.
   * @param {boolean} orderChanged Indicates if order of HOT indexes was changed by move.
   */
  calculateAndSyncMoves(movePossible: boolean, orderChanged: boolean) {
    if (this.#indexSyncer.isPerformingUndoRedo()) {
      return;
    }

    if (movePossible === false || orderChanged === false) {
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
   * them. That reproduces the grid's order exactly as long as those elements still occupy the sequence's
   * leading positions, which is what a sheet shorter than the grid means: the grid's extra rows or columns
   * are the empty tail the engine left out. A reorder that moves one of them in FRONT of an element the
   * engine holds cannot be expressed at all — the engine addresses its rows positionally, and it has no row
   * to shift the others past — so nothing is sent and the caller is told, rather than an order being applied
   * that the grid's index translation would then read differently.
   *
   * @param {number[]} targetSequence The grid's sequence of physical indexes, in grid order.
   * @returns {boolean} `true` when the engine holds the sequence's order, `false` when it could not be sent.
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

    const leadingPositionsAreHeld = targetSequence
      .slice(0, sizeForAxis)
      .every(physicalIndex => held.has(physicalIndex));

    if (!leadingPositionsAreHeld) {
      return false;
    }

    const engineOrder: number[] = new Array<number>(sizeForAxis);
    const reordered: number[] = new Array<number>(sizeForAxis);

    rankOfEngineIndex.forEach((rank, engineIndex) => {
      engineOrder[engineIndex] = rank;
      reordered[rank] = engineElements[engineIndex];
    });

    // The engine records an undo entry and clears its redo stack for any order it is handed, so an order
    // that changes nothing costs the user their redo history. Compression makes that common: every sort
    // that leaves the engine's own elements in the same relative order ranks them identically.
    this.#indexesSequence = reordered;
    this.#fillSequence = null;

    if (engineOrder.every((rank, engineIndex) => rank === engineIndex)) {
      return true;
    }

    engine[`set${toUpperCaseFirst(this.#axis)}Order`](sheetId, engineOrder);

    return true;
  }

  /**
   * Gets callback for hook triggered after performing change of indexes order.
   *
   * @returns {Function}
   */
  getIndexesChangeSyncMethod() {
    return (source: string) => {
      const newSequence = this.#indexMapper.getIndexesSequence();

      // The engine reverts its own axis order from its own undo stack, so nothing is sent here — but the
      // stored order is the only record of what the engine holds, and it has to follow the revert. Both
      // sides come out of an undo on the sequence the grid ends up with.
      if (this.#indexSyncer.isPerformingUndoRedo()) {
        this.#indexesSequence = newSequence;

        return;
      }

      if (source === 'update' && newSequence.length > 0) {
        this.#syncOrderWithEngine(newSequence);

        return;
      }

      // An insert, a removal or a move reaches the engine through its own call — `addRows`, `removeRows`,
      // `syncMoves` — and renumbers the physical indexes on both sides, so the engine ends up holding the
      // grid's new sequence and the stored order has to follow it there.
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

    if (isIdentity || sequence.length === 0) {
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
