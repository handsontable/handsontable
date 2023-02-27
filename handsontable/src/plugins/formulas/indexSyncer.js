import { toUpperCaseFirst } from '../../helpers/string';

/**
 * @private
 * @class IndexSyncer
 * @description
 *
 * Indexes synchronizer responsible for providing logic for syncing actions done on indexes for HOT to actions performed
 * on HF's. It respects an idea to represent trimmed elements in HF's engine to perform formulas calculations on them.
 * It also provides method for translation from visual row/column indexes to HF's row/column indexes.
 *
 */
class IndexSyncer {
  constructor(rowIndexMapper, columnIndexMapper, postponeAction) {
    /**
     * Reference to row index mapper.
     *
     * @private
     * @type {IndexMapper}
     */
    this.rowIndexMapper = rowIndexMapper;
    /**
     * Reference to column index mapper.
     *
     * @private
     * @type {IndexMapper}
     */
    this.columnIndexMapper = columnIndexMapper;
    /**
     * Sequence of physical row indexes stored for watching changes and calculating some transformations.
     *
     * @private
     * @type {Array<number>}
     */
    this.rowIndexesSequence = [];
    /**
     * Sequence of physical column indexes, stored for watching changes and calculating some transformations.
     *
     * @private
     * @type {Array<number>}
     */
    this.columnIndexesSequence = [];
    /**
     * List of moved HF row indexes, stored before performing move on HOT to calculate transformation needed on HF's engine.
     *
     * @private
     * @type {Array<number>}
     */
    this.movedRowIndexes = [];
    /**
     * Final HF's place where to move rows, stored before performing move on HOT to calculate transformation needed on HF's engine.
     *
     * @private
     * @type {number|undefined}
     */
    this.finalRowIndex = undefined;
    /**
     * List of moved HF column indexes, stored before performing move on HOT to calculate transformation needed on HF's engine.
     *
     * @private
     * @type {Array<number>}
     */
    this.movedColumnIndexes = [];
    /**
     * Final HF's place where to move rows, stored before performing move on HOT to calculate transformation needed on HF's engine.
     *
     * @private
     * @type {number|undefined}
     */
    this.finalColumnIndex = undefined;
    /**
     * List of removed HF row indexes, stored before performing removal on HOT to calculate transformation needed on HF's engine.
     *
     * @private
     * @type {Array<number>}
     */
    this.removedRowIndexes = [];
    /**
     * List of removed HF column indexes, stored before performing removal on HOT to calculate transformation needed on HF's engine.
     *
     * @private
     * @type {Array<number>}
     */
    this.removedColumnIndexes = [];
    /**
     * Method which will postpone execution of some action (needed when synchronization endpoint isn't setup yet).
     *
     * @private
     * @type {Function}
     */
    this.postponeAction = postponeAction;
    /**
     * Flag informing whether undo is already performed (we don't perform synchronization in such case).
     *
     * @private
     * @type {boolean}
     */
    this.isPerformingUndo = false;
    /**
     * Flag informing whether redo is already performed (we don't perform synchronization in such case).
     *
     * @private
     * @type {boolean}
     */
    this.isPerformingRedo = false;
    /**
     * The HF's engine instance which will be synced.
     *
     * @private
     * @type {HyperFormula|null}
     */
    this.engine = null;
    /**
     * HyperFormula's sheet name.
     *
     * @private
     * @type {string|null}
     */
    this.sheetId = null;
  }

  /**
   * Sets flag informing whether an undo action is already performed (we don't execute synchronization in such case).
   *
   * @param {boolean} flagValue Boolean value for the flag.
   */
  setPerformUndo(flagValue) {
    this.isPerformingUndo = flagValue;
  }

  /**
   * Sets flag informing whether a redo action is already performed (we don't execute synchronization in such case).
   *
   * @param {boolean} flagValue Boolean value for the flag.
   */
  setPerformRedo(flagValue) {
    this.isPerformingRedo = flagValue;
  }

  /**
   * Gets information whether redo or undo action is already performed (we don't execute synchronization in such case).
   *
   * @private
   * @returns {boolean}
   */
  isPerformingUndoRedo() {
    return this.isPerformingUndo || this.isPerformingRedo;
  }

  /**
   * Gets index mapper for a particular axis.
   *
   * @private
   * @param {'row'|'column'} indexesType Type of an index.
   * @returns {IndexMapper}
   */
  getIndexMapper(indexesType) {
    return this[`${indexesType}IndexMapper`];
  }

  /**
   * Gets physical indexes sequence for a particular axis.
   *
   * @private
   * @param {'row'|'column'} indexesType Type of an index.
   * @returns {Array<number>}
   */
  getPhysicalIndexesSequence(indexesType) {
    return this[`${indexesType}IndexesSequence`];
  }

  /**
   * Sets physical indexes sequence for a particular axis.
   *
   * @private
   * @param {'row'|'column'} indexesType Type of an index.
   * @param {Array<number>} indexesSequence Sequence of physical indexes for certain axis.
   */
  setPhysicalIndexesSequence(indexesType, indexesSequence) {
    this[`${indexesType}IndexesSequence`] = indexesSequence;
  }

  /**
   * Gets moved HF indexes for a particular axis (right before performing move on HOT).
   *
   * @private
   * @param {'row'|'column'} indexesType Type of an index.
   * @returns {Array<number>}
   */
  getMovedHfIndexes(indexesType) {
    return this[`moved${toUpperCaseFirst(indexesType)}Indexes`];
  }

  /**
   * Sets moved HF indexes for certain axis (it should be done right before performing move on HOT).
   *
   * @private
   * @param {'row'|'column'} indexesType Type of an index.
   * @param {Array<number>} movedIndexes Sequence of moved HF indexes for certain axis.
   */
  setMovedHfIndexes(indexesType, movedIndexes) {
    this[`moved${toUpperCaseFirst(indexesType)}Indexes`] = movedIndexes;
  }

  /**
   * Gets final HF index for moving indexes (right before performing move on HOT).
   *
   * @private
   * @param {'row'|'column'} indexesType Type of an index.
   * @returns {number}
   */
  getFinalHfIndex(indexesType) {
    return this[`final${toUpperCaseFirst(indexesType)}Index`];
  }

  /**
   * Sets final HF index for moving indexes (it should be done right before performing move on HOT).
   *
   * @private
   * @param {'row'|'column'} indexesType Type of an index.
   * @param {number} finalIndex Final HF place where to move rows.
   */
  setFinalHfIndex(indexesType, finalIndex) {
    this[`final${toUpperCaseFirst(indexesType)}Index`] = finalIndex;
  }

  /**
   * Gets removed HF indexes (right before performing removal on HOT).
   *
   * @param {'row'|'column'} indexesType Type of an index.
   * @returns {Array<number>} List of removed HF indexes.
   */
  getRemovedHfIndexes(indexesType) {
    return this[`removed${toUpperCaseFirst(indexesType)}Indexes`];
  }

  /**
   * Sets removed HF indexes (it should be done right before performing move on HOT).
   *
   * @param {'row'|'column'} indexesType Type of an index.
   * @param {Array<number>} removedIndexes List of removed physical indexes.
   * @returns {Array<number>} List of removed visual indexes.
   */
  setRemovedHfIndexes(indexesType, removedIndexes) {
    this[`removed${toUpperCaseFirst(indexesType)}Indexes`] =
      removedIndexes.map((physicalIndex) => {
        const visualIndex = this.getIndexMapper(indexesType).getVisualFromPhysicalIndex(physicalIndex);

        return this.getHfIndexFromVisualIndex(indexesType, visualIndex);
      });

    return this[`removed${toUpperCaseFirst(indexesType)}Indexes`];
  }

  /**
   * Gets corresponding HyperFormula index for particular visual index. It's respecting the idea that HF's engine
   * is fed also with trimmed indexes (business requirements for formula result calculation also for trimmed elements).
   *
   * @param {'row'|'column'} indexesType Type of an index.
   * @param {number} visualIndex Visual index.
   * @returns {number}
   */
  getHfIndexFromVisualIndex(indexesType, visualIndex) {
    const indexesSequence = this.getIndexMapper(indexesType).getIndexesSequence();
    const notTrimmedIndexes = this.getIndexMapper(indexesType).getNotTrimmedIndexes();

    return indexesSequence.indexOf(notTrimmedIndexes[visualIndex]);
  }

  /**
   * Synchronizes moves done on HOT to HF engine (based on previously calculated positions).
   *
   * @private
   * @param {'row'|'column'} indexesType Type of an index.
   * @param {Array<{from: number, to: number}>} moves Calculated HF's move positions.
   */
  syncMoves = (indexesType, moves) => {
    const NUMBER_OF_MOVED_INDEXES = 1;
    const SYNC_MOVE_METHOD_NAME = `move${toUpperCaseFirst(indexesType)}s`;

    this.engine.batch(() => {
      moves.forEach((move) => {
        if (move.from !== move.to) {
          this.engine[SYNC_MOVE_METHOD_NAME](this.sheetId, move.from, NUMBER_OF_MOVED_INDEXES, move.to);
        }
      });
    });
  }

  /**
   * Gets callback for hook triggered before moving elements.
   *
   * @param {'row'|'column'} indexesType Type of an index.
   * @returns {Function}
   */
  getBeforeMoveMethod(indexesType) {
    return (movedIndexes, finalIndex) => {
      this.setMovedHfIndexes(
        indexesType, movedIndexes.map(index => this.getHfIndexFromVisualIndex(indexesType, index)));
      this.setFinalHfIndex(indexesType, this.getHfIndexFromVisualIndex(indexesType, finalIndex));
    };
  }

  /**
   * Gets first position where to move element (respecting the fact that some element will be sooner or later
   * taken out of the dataset in order to move them).
   *
   * @private
   * @param {'row'|'column'} indexesType Type of an index.
   * @param {Array<number>} movedHfIndexes Sequence of moved HF indexes for certain axis.
   * @param {number} finalHfIndex Final HF place where to move rows.
   * @returns {number} HF's index informing where to move the first element.
   * @private
   */
  getMoveLine(indexesType, movedHfIndexes, finalHfIndex) {
    const numberOfElements = this.getIndexMapper(indexesType).getNumberOfIndexes();
    const notMovedElements = Array.from(Array(numberOfElements).keys())
      .filter(index => movedHfIndexes.includes(index) === false);

    if (finalHfIndex === 0) {
      return notMovedElements[finalHfIndex] ?? 0; // Moving before the first dataset's element.
    }

    return notMovedElements[finalHfIndex - 1] + 1; // Moving before another element.
  }

  /**
   * Gets initially calculated HF's move positions.
   *
   * @private
   * @param {'row'|'column'} indexesType Type of an index.
   * @param {Array<number>} movedHfIndexes Sequence of moved HF indexes for certain axis.
   * @param {number} finalHfIndex Final HF place where to move rows.
   * @returns {Array<{from: number, to: number}>} Initially calculated HF's move positions.
   */
  getInitiallyCalculatedMoves(indexesType, movedHfIndexes, finalHfIndex) {
    let moveLine = this.getMoveLine(indexesType, movedHfIndexes, finalHfIndex);
    const moves = [];

    movedHfIndexes.forEach((movedHfIndex) => {
      const move = {
        from: movedHfIndex,
        to: moveLine,
      };

      moves.forEach((previouslyMovedIndex) => {
        const isMovingFromEndToStart = previouslyMovedIndex.from > previouslyMovedIndex.to;
        const isMovingElementBefore = previouslyMovedIndex.to <= move.from;
        const isMovingAfterElement = previouslyMovedIndex.from > move.from;

        if (isMovingAfterElement && isMovingElementBefore && isMovingFromEndToStart) {
          move.from += 1;
        }
      });

      // Moved element from right to left.
      if (move.from >= moveLine) {
        moveLine += 1;
      }

      moves.push(move);
    });

    return moves;
  }

  /**
   * Gets finally calculated HF's move positions (after adjusting).
   *
   * @private
   * @param {Array<{from: number, to: number}>} moves Initially calculated HF's move positions.
   * @returns {Array<{from: number, to: number}>} Finally calculated HF's move positions (after adjusting).
   */
  adjustedCalculatedMoves(moves) {
    moves.forEach((move, index) => {
      const nextMoved = moves.slice(index + 1);

      nextMoved.forEach((nextMovedIndex) => {
        const isMovingFromStartToEnd = nextMovedIndex.from < nextMovedIndex.to;

        if (nextMovedIndex.from > move.from && isMovingFromStartToEnd) {
          nextMovedIndex.from -= 1;
        }
      });
    });

    return moves;
  }

  /**
   * Gets callback for hook triggered after performing move.
   *
   * @param {'row'|'column'} indexesType Type of an index.
   * @returns {Function}
   */
  getIndexMoveSyncMethod(indexesType) {
    return (_, __, ___, movePossible, orderChanged) => {
      const movedHfIndexes = this.getMovedHfIndexes(indexesType);
      const finalHfIndex = this.getFinalHfIndex(indexesType);

      if (this.isPerformingUndoRedo()) {
        return;
      }

      if (movePossible === false || orderChanged === false) {
        return;
      }

      const calculatedMoves = this.adjustedCalculatedMoves(
        this.getInitiallyCalculatedMoves(indexesType, movedHfIndexes, finalHfIndex)
      );

      if (this.sheetId === null) {
        this.postponeAction(() => this.syncMoves(indexesType, calculatedMoves));

      } else {
        this.syncMoves(indexesType, calculatedMoves);
      }
    };
  }

  /**
   * Gets callback for hook triggered after performing change of indexes order.
   *
   * @param {'row'|'column'} indexesType Type of an index.
   * @returns {Function}
   */
  getIndexesChangeSyncMethod(indexesType) {
    const SYNC_ORDER_CHANGE_METHOD_NAME = `set${toUpperCaseFirst(indexesType)}Order`;

    return (source) => {
      if (this.isPerformingUndoRedo()) {
        return;
      }

      const newSequence = this.getIndexMapper(indexesType).getIndexesSequence();

      if (source === 'update') {
        const relativeTransformation =
          this.getPhysicalIndexesSequence(indexesType).map(index => newSequence.indexOf(index));

        this.engine[SYNC_ORDER_CHANGE_METHOD_NAME](this.sheetId, relativeTransformation);
      }

      this.setPhysicalIndexesSequence(indexesType, newSequence);
    };
  }

  /**
   * Setups a synchronization endpoint.
   *
   * @param {HyperFormula|null} engine The HF's engine instance which will be synced.
   * @param {string|null} sheetId HyperFormula's sheet name.
   */
  setupSyncEndpoint(engine, sheetId) {
    this.engine = engine;
    this.sheetId = sheetId;

    this.setPhysicalIndexesSequence('row', this.rowIndexMapper.getIndexesSequence());
    this.setPhysicalIndexesSequence('column', this.columnIndexMapper.getIndexesSequence());
  }
}

export default IndexSyncer;
