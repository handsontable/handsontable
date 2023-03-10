import { toUpperCaseFirst } from '../../../helpers/string';

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
  axis;
  /**
   * Reference to index mapper.
   *
   * @private
   * @type {IndexMapper}
   */
  indexMapper;
  /**
   * The index synchronizer for both axis (is storing some more general information).
   *
   * @private
   * @type {IndexSyncer}
   */
  indexSyncer;
  /**
   * Sequence of physical indexes stored for watching changes and calculating some transformations.
   *
   * @private
   * @type {Array<number>}
   */
  indexesSequence = [];
  /**
   * List of moved HF indexes, stored before performing move on HOT to calculate transformation needed on HF's engine.
   *
   * @private
   * @type {Array<number>}
   */
  movedIndexes = [];
  /**
   * Final HF's place where to move indexes, stored before performing move on HOT to calculate transformation needed on HF's engine.
   *
   * @private
   * @type {number|undefined}
   */
  finalIndex;
  /**
   * List of removed HF indexes, stored before performing removal on HOT to calculate transformation needed on HF's engine.
   *
   * @private
   * @type {Array<number>}
   */
  removedIndexes = [];
    
  constructor(axis, indexMapper, indexSyncer) {
    this.axis = axis;
    this.indexMapper = indexMapper;
    this.indexSyncer = indexSyncer;
  }

  /**
   * Gets physical indexes sequence for a particular axis.
   *
   * @private
   * @returns {Array<number>}
   */
  getPhysicalIndexesSequence() {
    return this[`${this.axis}IndexesSequence`];
  }

  /**
   * Sets physical indexes sequence for a particular axis.
   *
   * @private
   * @param {Array<number>} indexesSequence Sequence of physical indexes for certain axis.
   */
  setPhysicalIndexesSequence(indexesSequence) {
    this[`${this.axis}IndexesSequence`] = indexesSequence;
  }

  /**
   * Gets moved HF indexes for a particular axis (right before performing move on HOT).
   *
   * @private
   * @returns {Array<number>}
   */
  getMovedHfIndexes() {
    return this[`moved${toUpperCaseFirst(this.axis)}Indexes`];
  }

  /**
   * Sets moved HF indexes for certain axis (it should be done right before performing move on HOT).
   *
   * @private
   * @param {Array<number>} movedIndexes Sequence of moved HF indexes for certain axis.
   */
  setMovedHfIndexes(movedIndexes) {
    this[`moved${toUpperCaseFirst(this.axis)}Indexes`] = movedIndexes;
  }

  /**
   * Gets final HF index for moving indexes (right before performing move on HOT).
   *
   * @private
   * @returns {number}
   */
  getFinalHfIndex() {
    return this[`final${toUpperCaseFirst(this.axis)}Index`];
  }

  /**
   * Sets final HF index for moving indexes (it should be done right before performing move on HOT).
   *
   * @private
   * @param {number} finalIndex Final HF place where to move rows.
   */
  setFinalHfIndex(finalIndex) {
    this[`final${toUpperCaseFirst(this.axis)}Index`] = finalIndex;
  }

  /**
   * Gets removed HF indexes (right before performing removal on HOT).
   *
   * @returns {Array<number>} List of removed HF indexes.
   */
  getRemovedHfIndexes() {
    return this[`removed${toUpperCaseFirst(this.axis)}Indexes`];
  }

  /**
   * Sets removed HF indexes (it should be done right before performing move on HOT).
   *
   * @param {Array<number>} removedIndexes List of removed physical indexes.
   * @returns {Array<number>} List of removed visual indexes.
   */
  setRemovedHfIndexes(removedIndexes) {
    this[`removed${toUpperCaseFirst(this.axis)}Indexes`] =
      removedIndexes.map((physicalIndex) => {
        const visualIndex = this.indexMapper.getVisualFromPhysicalIndex(physicalIndex);

        return this.getHfIndexFromVisualIndex(visualIndex);
      });

    return this[`removed${toUpperCaseFirst(this.axis)}Indexes`];
  }

  /**
   * Gets corresponding HyperFormula index for particular visual index. It's respecting the idea that HF's engine
   * is fed also with trimmed indexes (business requirements for formula result calculation also for trimmed elements).
   *
   * @param {number} visualIndex Visual index.
   * @returns {number}
   */
  getHfIndexFromVisualIndex(visualIndex) {
    const indexesSequence = this.indexMapper.getIndexesSequence();
    const notTrimmedIndexes = this.indexMapper.getNotTrimmedIndexes();

    return indexesSequence.indexOf(notTrimmedIndexes[visualIndex]);
  }

  /**
   * Synchronizes moves done on HOT to HF engine (based on previously calculated positions).
   *
   * @private
   * @param {Array<{from: number, to: number}>} moves Calculated HF's move positions.
   */
  syncMoves(moves) {
    const NUMBER_OF_MOVED_INDEXES = 1;
    const SYNC_MOVE_METHOD_NAME = `move${toUpperCaseFirst(this.axis)}s`;

    this.indexSyncer.getEngine().batch(() => {
      moves.forEach((move) => {
        const moveToTheSamePosition = move.from !== move.to;
        // Moving from left to right (or top to bottom) to a line (drop index) right after already moved element.
        const anotherMoveWithoutEffect = move.from + 1 !== move.to;

        if (moveToTheSamePosition && anotherMoveWithoutEffect) {
          this.indexSyncer.getEngine()[SYNC_MOVE_METHOD_NAME](this.indexSyncer.getSheetId(), move.from,
            NUMBER_OF_MOVED_INDEXES, move.to);
        }
      });
    });
  }

  /**
   * Gets callback for hook triggered before moving elements.
   *
   * @returns {Function}
   */
  getBeforeMoveMethod() {
    return (movedVisualIndexes, visualFinalIndex, _, movePossible) => {
      if (movePossible === false) {
        return;
      }

      this.setMovedHfIndexes(movedVisualIndexes.map(index => this.getHfIndexFromVisualIndex(index)));
      this.setFinalHfIndex(this.getHfIndexFromVisualIndex(visualFinalIndex));
    };
  }

  /**
   * Gets first position where to move element (respecting the fact that some element will be sooner or later
   * taken out of the dataset in order to move them).
   *
   * @param {Array<number>} movedHfIndexes Sequence of moved HF indexes for certain axis.
   * @param {number} finalHfIndex Final HF place where to move rows.
   * @returns {number} HF's index informing where to move the first element.
   * @private
   */
  getMoveLine(movedHfIndexes, finalHfIndex) {
    const numberOfElements = this.indexMapper.getNumberOfIndexes();
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
   * @param {Array<number>} movedHfIndexes Sequence of moved HF indexes for certain axis.
   * @param {number} finalHfIndex Final HF place where to move rows.
   * @returns {Array<{from: number, to: number}>} Initially calculated HF's move positions.
   */
  getInitiallyCalculatedMoves(movedHfIndexes, finalHfIndex) {
    let moveLine = this.getMoveLine(movedHfIndexes, finalHfIndex);
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

      // Moved element from right to left (or bottom to top).
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
   * @returns {Function}
   */
  getIndexMoveSyncMethod() {
    return (_, __, ___, movePossible, orderChanged) => {
      const movedHfIndexes = this.getMovedHfIndexes();
      const finalHfIndex = this.getFinalHfIndex();

      if (this.indexSyncer.isPerformingUndoRedo()) {
        return;
      }

      if (movePossible === false || orderChanged === false) {
        return;
      }

      const calculatedMoves = this.adjustedCalculatedMoves(
        this.getInitiallyCalculatedMoves(movedHfIndexes, finalHfIndex)
      );

      if (this.indexSyncer.getSheetId() === null) {
        this.indexSyncer.getPostponeAction(() => this.syncMoves(calculatedMoves));

      } else {
        this.syncMoves(calculatedMoves);
      }
    };
  }

  /**
   * Gets callback for hook triggered after performing change of indexes order.
   *
   * @returns {Function}
   */
  getIndexesChangeSyncMethod() {
    const SYNC_ORDER_CHANGE_METHOD_NAME = `set${toUpperCaseFirst(this.axis)}Order`;

    return (source) => {
      if (this.indexSyncer.isPerformingUndoRedo()) {
        return;
      }

      const newSequence = this.indexMapper.getIndexesSequence();

      if (source === 'update') {
        const relativeTransformation =
          this.getPhysicalIndexesSequence().map(index => newSequence.indexOf(index));
        const sheetDimensions = this.indexSyncer.getEngine().getSheetDimensions(this.indexSyncer.getSheetId());
        let sizeForAxis;

        if (this.axis === 'row') {
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

        this.indexSyncer.getEngine()[SYNC_ORDER_CHANGE_METHOD_NAME](this.indexSyncer.getSheetId(),
          relativeTransformation);
      }

      this.setPhysicalIndexesSequence(newSequence);
    };
  }

  /**
   * Initialize the AxisSyncer.
   */
  init() {
    this.setPhysicalIndexesSequence(this.indexMapper.getIndexesSequence());
  }
}

export default AxisSyncer;
