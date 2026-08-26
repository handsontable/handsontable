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
   * Gets callback for hook triggered after performing change of indexes order.
   *
   * @returns {Function}
   */
  getIndexesChangeSyncMethod() {
    const SYNC_ORDER_CHANGE_METHOD_NAME = `set${toUpperCaseFirst(this.#axis)}Order`;

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
        let sizeForAxis;

        if (this.#axis === 'row') {
          sizeForAxis = sheetDimensions.height;

        } else {
          sizeForAxis = sheetDimensions.width;
        }

        const numberOfReorganisedIndexes = relativeTransformation.length;

        // Sheet dimension can be changed by HF's engine for purpose of calculating values. It extends dependency
        // graph to calculate values outside of a defined dataset. This part of code could be removed after resolving
        // feature request from HF issue board (handsontable/hyperformula#1179).
        for (let i = numberOfReorganisedIndexes; i < sizeForAxis; i += 1) {
          relativeTransformation.push(i);
        }

        this.#indexSyncer.getEngine()![SYNC_ORDER_CHANGE_METHOD_NAME](this.#indexSyncer.getSheetId()!,
          relativeTransformation);
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
   */
  #syncInitialOrder() {
    const sequence = this.#indexMapper.getIndexesSequence();
    const isIdentity = sequence.every((value, index) => value === index);

    if (isIdentity || sequence.length === 0) {
      return;
    }

    const engine = this.#indexSyncer.getEngine();
    const sheetId = this.#indexSyncer.getSheetId();

    if (engine === null || sheetId === null) {
      this.#indexSyncer.getPostponeAction()(() => this.#syncInitialOrder());

      return;
    }

    const SYNC_ORDER_CHANGE_METHOD_NAME = `set${toUpperCaseFirst(this.#axis)}Order`;
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

    for (let i = transformation.length; i < sizeForAxis; i += 1) {
      transformation.push(i);
    }

    engine[SYNC_ORDER_CHANGE_METHOD_NAME](sheetId, transformation);
  }

  /**
   * Initialize the AxisSyncer.
   */
  init() {
    this.#syncInitialOrder();
    this.#indexesSequence = this.#indexMapper.getIndexesSequence();
  }
}

export default AxisSyncer;
