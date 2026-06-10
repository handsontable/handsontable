import { toUpperCaseFirst } from '../../../helpers/string';
import { getMoves } from '../../../helpers/moves';
import type { HyperFormulaEngine } from '../engine/types';

interface AxisIndexMapper {
  getVisualFromPhysicalIndex(physicalIndex: number): number | null;
  getIndexesSequence(): number[];
  getNotTrimmedIndexes(): number[];
  getNumberOfIndexes(): number;
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
   * Initializes the axis syncer for the given axis with the corresponding index mapper and parent index syncer references.
   */
  constructor(axis: string, indexMapper: AxisIndexMapper, indexSyncer: ParentIndexSyncer) {
    this.#axis = axis;
    this.#indexMapper = indexMapper;
    this.#indexSyncer = indexSyncer;
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
   * Gets corresponding HyperFormula index for particular visual index. It's respecting the idea that HF's engine
   * is fed also with trimmed indexes (business requirements for formula result calculation also for trimmed elements).
   *
   * @param {number} visualIndex Visual index.
   * @returns {number}
   */
  getHfIndexFromVisualIndex(visualIndex: number) {
    const indexesSequence = this.#indexMapper.getIndexesSequence();
    const notTrimmedIndexes = this.#indexMapper.getNotTrimmedIndexes();

    // Optimization:
    // notTrimmedIndexes is a subset of indexesSequence,
    // so for every x indexesSequence.indexOf(x) is always >= notTrimmedIndexes.indexOf(x)
    return indexesSequence.indexOf(notTrimmedIndexes[visualIndex], visualIndex);
  }

  /**
   * Gets corresponding visual index for a HyperFormula index. Inverse of {@link getHfIndexFromVisualIndex}.
   * Returns -1 when the HF index points to a trimmed element (not visible to the user).
   *
   * @param {number} hfIndex HyperFormula index.
   * @returns {number}
   */
  getVisualIndexFromHfIndex(hfIndex: number) {
    const indexesSequence = this.#indexMapper.getIndexesSequence();
    const notTrimmedIndexes = this.#indexMapper.getNotTrimmedIndexes();
    const physicalIndex = indexesSequence[hfIndex];

    if (physicalIndex === undefined) {
      return -1;
    }

    return notTrimmedIndexes.indexOf(physicalIndex);
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
        const relativeTransformation = this.#indexesSequence.map(index => newSequence.indexOf(index));
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
    // current position `i`, the target position is the visual index of physical `i`, i.e. `sequence.indexOf(i)`.
    const transformation = Array.from({ length: sequence.length }, (_, i) => sequence.indexOf(i));

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
