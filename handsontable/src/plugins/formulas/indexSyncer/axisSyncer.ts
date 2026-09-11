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
   * Sequence of physical indexes stored for watching changes and calculating some transformations.
   *
   * @private
   * @type {Array<number>}
   */
  #indexesSequence: number[] = [];
  /**
   * Whether the engine still holds the order `#indexesSequence` describes. It stops describing it while the
   * engine's sheet is empty, because an order sent then would have nothing to apply to.
   *
   * @type {boolean}
   */
  #engineOrderStale = false;
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
   * Reshapes an order transformation into the permutation of `0..sizeForAxis - 1` the engine accepts.
   *
   * The engine takes an order exactly as long as its sheet, and every entry has to be a position within
   * that sheet — it rejects anything else by throwing, and the throw unwinds whatever triggered the
   * sequence change. Two things make the grid's own transformation a poor fit. The engine reports a sheet
   * by the extent of its content, so trailing empty rows and columns of the dataset are not counted, and
   * it also extends a sheet beyond the dataset to calculate values outside it
   * (handsontable/hyperformula#1179). The transformation is therefore padded when it is shorter than the
   * sheet, and compressed onto the elements the engine actually holds when it is longer, keeping their
   * relative order. Mid-batch entries the sequence no longer covers arrive as `-1` and are ranked last.
   *
   * @param {number[]} transformation Order transformation describing where each element the engine currently
   * holds should move to.
   * @param {number} sizeForAxis Size of the engine's sheet along the synchronized axis.
   * @returns {number[]} The order to hand to the engine.
   */
  static #toEngineOrder(transformation: number[], sizeForAxis: number): number[] {
    const positions = [];

    for (let position = 0; position < sizeForAxis; position += 1) {
      positions.push({
        index: position,
        target: position < transformation.length ? transformation[position] : position,
      });
    }

    positions.sort((left, right) => {
      if (left.target < 0 || right.target < 0) {
        return (left.target < 0 ? 1 : 0) - (right.target < 0 ? 1 : 0) || left.index - right.index;
      }

      return left.target - right.target || left.index - right.index;
    });

    const engineOrder: number[] = new Array<number>(sizeForAxis);

    positions.forEach(({ index }, rank) => {
      engineOrder[index] = rank;
    });

    return engineOrder;
  }

  /**
   * Sends an axis order transformation to the engine, reshaped to the engine sheet's size.
   *
   * @param {number[]} transformation Order transformation describing where each element the engine currently
   * holds should move to.
   * @param {number} sizeForAxis Size of the engine's sheet along the synchronized axis.
   * @returns {boolean} `true` when the engine received the order, `false` when there was nothing to send.
   */
  #syncOrderWithEngine(transformation: number[], sizeForAxis: number): boolean {
    // A sheet the workbook gained at runtime carries no data, so the engine holds no rows or columns to
    // reorder and reports the sheet as 0x0. There is nothing to send, and the grid's order is replayed
    // by the next sync that finds a sheet to apply it to.
    if (sizeForAxis === 0) {
      return false;
    }

    this.#indexSyncer.getEngine()![`set${toUpperCaseFirst(this.#axis)}Order`](
      this.#indexSyncer.getSheetId()!, AxisSyncer.#toEngineOrder(transformation, sizeForAxis));

    return true;
  }

  /**
   * Gets callback for hook triggered after performing change of indexes order.
   *
   * @returns {Function}
   */
  getIndexesChangeSyncMethod() {
    return (source: string) => {
      if (this.#indexSyncer.isPerformingUndoRedo()) {
        return;
      }

      const newSequence = this.#indexMapper.getIndexesSequence();

      if (source === 'update' && newSequence.length > 0) {
        // One-pass inverse lookup instead of `newSequence.indexOf` per element, which would make
        // every sort/unsort quadratic in the number of rows or columns.
        const positionOfPhysical: number[] = new Array<number>(newSequence.length);

        for (let position = 0; position < newSequence.length; position += 1) {
          positionOfPhysical[newSequence[position]] = position;
        }

        const relativeTransformation = this.#indexesSequence.map(index => positionOfPhysical[index] ?? -1);
        const sheetDimensions = this.#indexSyncer.getEngine()!.getSheetDimensions(this.#indexSyncer.getSheetId()!);
        const sizeForAxis = this.#axis === 'row' ? sheetDimensions.height : sheetDimensions.width;

        this.#engineOrderStale = !this.#syncOrderWithEngine(relativeTransformation, sizeForAxis);

        if (this.#engineOrderStale) {
          // The engine's sheet is empty, so whatever it is filled with later arrives in physical order.
          // Recording that identity keeps the next transformation absolute, which is what carries the
          // order the engine could not take when it becomes able to take one.
          this.#indexesSequence = newSequence.map((value, index) => index);

          return;
        }
      }

      // The stored sequence is the order the engine currently holds, and every transformation is relative
      // to it. While the engine has nothing to apply an order to, the sequence stays where it was —
      // recording the grid's would make the next transformation describe a move the engine never made,
      // and its axis order would drift away from the grid's. Every source is frozen, not just the one
      // that was skipped: a row inserted or moved in the meantime advances the grid's sequence too.
      if (this.#engineOrderStale) {
        return;
      }

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

    const sheetDimensions = engine.getSheetDimensions(sheetId);
    const sizeForAxis = this.#axis === 'row' ? sheetDimensions.height : sheetDimensions.width;
    // HF currently holds data in physical order ([0..n-1] identity). The transformation tells HF where each
    // currently-held element should move to, so that HF's visual order matches HOT's visual order. For each
    // current position `i`, the target position is the visual index of physical `i` — that is, the inverse
    // permutation of the sequence, built in one pass.
    const transformation: number[] = new Array<number>(sequence.length);

    for (let position = 0; position < sequence.length; position += 1) {
      transformation[sequence[position]] = position;
    }

    return this.#syncOrderWithEngine(transformation, sizeForAxis);
  }

  /**
   * Synchronizes the initial order and records the sequence the engine ended up holding. A sync the engine
   * could not take leaves the stored sequence behind, so the next transformation is measured against the
   * order the engine actually holds rather than one it never received.
   *
   * @private
   */
  #applyInitialOrder() {
    const sequence = this.#indexMapper.getIndexesSequence();

    this.#engineOrderStale = !this.#syncInitialOrder();
    // A sync the engine could not take leaves it in physical order, which is what the next transformation
    // has to be measured against — recording the grid's sequence would claim an order it never received.
    this.#indexesSequence = this.#engineOrderStale ? sequence.map((value, index) => index) : sequence;
  }

  /**
   * Initialize the AxisSyncer.
   */
  init() {
    this.#applyInitialOrder();
  }
}

export default AxisSyncer;
