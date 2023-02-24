import { toUpperCaseFirst } from '../../helpers/string';

/**
 * @private
 * @class IndexSyncer
 */
class IndexSyncer {
  constructor(rowIndexMapper, columnIndexMapper, postponeAction) {
    /**
     * Reference to row index mapper.
     *
     * @type {IndexMapper}
     */
    this.rowIndexMapper = rowIndexMapper;
    /**
     * Reference to column index mapper.
     *
     * @type {IndexMapper}
     */
    this.columnIndexMapper = columnIndexMapper;
    /**
     * Sequence of row indexes.
     *
     * @type {Array<number>}
     */
    this.rowIndexesSequence = [];
    /**
     * Sequence of column indexes.
     *
     * @type {Array<number>}
     */
    this.columnIndexesSequence = [];
    /**
     * Moved row indexes.
     *
     * @type {Array<number>}
     */
    this.movedRowIndexes = [];
    /**
     * Final place where to move rows.
     *
     * @type {number|undefined}
     */
    this.finalRowIndex = undefined;
    /**
     * Moved column indexes.
     *
     * @type {Array<number>}
     */
    this.movedColumnIndexes = [];
    /**
     * Final place where to move columns.
     *
     * @type {number|undefined}
     */
    this.finalColumnIndex = undefined;
    /**
     * Method which will postpone execution of some action.
     *
     * @type {Function}
     */
    this.postponeAction = postponeAction;
    /**
     * Flag informing whether undo is already performed.
     *
     * @type {boolean}
     */
    this.isPerformingUndo = false;
    /**
     * Flag informing whether redo is already performed.
     *
     * @type {boolean}
     */
    this.isPerformingRedo = false;
    /**
     * The HF's engine instance which will be synced.
     *
     * @type {HyperFormula|null}
     */
    this.engine = null;
    /**
     * HyperFormula's sheet name.
     *
     * @type {string|null}
     */
    this.sheetId = null;
  }

  /**
   * Sets flag informing whether an undo action is already performed.
   *
   * @param {boolean} flagValue Boolean value for the flag.
   */
  setPerformUndo(flagValue) {
    this.isPerformingUndo = flagValue;
  }

  /**
   * Sets flag informing whether a redo action is already performed.
   *
   * @param {boolean} flagValue Boolean value for the flag.
   */
  setPerformRedo(flagValue) {
    this.isPerformingRedo = flagValue;
  }

  /**
   * Gets index mapper related to an axis.
   *
   * @param {'row'|'column'} indexesType Type of an index.
   * @returns {IndexMapper}
   */
  getIndexMapper(indexesType) {
    return this[`${indexesType}IndexMapper`];
  }

  /**
   * Gets indexes sequence for certain axis.
   *
   * @param {'row'|'column'} indexesType Type of an index.
   * @returns {Array<number>}
   */
  getIndexesSequence(indexesType) {
    return this[`${indexesType}IndexesSequence`];
  }

  /**
   * Sets indexes sequence for certain axis.
   *
   * @param {'row'|'column'} indexesType Type of an index.
   * @param {Array<number>} indexesSequence Sequence of indexes for certain axis.
   */
  setIndexesSequence(indexesType, indexesSequence) {
    this[`${indexesType}IndexesSequence`] = indexesSequence;
  }

  /**
   * Gets moved indexes for certain axis.
   *
   * @param {'row'|'column'} indexesType Type of an index.
   * @returns {Array<number>}
   */
  getMovedIndexes(indexesType) {
    return this[`moved${toUpperCaseFirst(indexesType)}Indexes`];
  }

  /**
   * Sets moved indexes for certain axis.
   *
   * @param {'row'|'column'} indexesType Type of an index.
   * @param {Array<number>} movedIndexes Sequence of indexes for certain axis.
   */
  setMovedIndexes(indexesType, movedIndexes) {
    this[`moved${toUpperCaseFirst(indexesType)}Indexes`] = movedIndexes;
  }

  /**
   * Gets final index for moving indexes.
   *
   * @param {'row'|'column'} indexesType Type of an index.
   * @returns {Array<number>}
   */
  getFinalIndex(indexesType) {
    return this[`final${toUpperCaseFirst(indexesType)}Index`];
  }

  /**
   * Sets final index for moving indexes.
   *
   * @param {'row'|'column'} indexesType Type of an index.
   * @param {number} finalIndex Final place where to move rows.
   */
  setFinalIndex(indexesType, finalIndex) {
    this[`final${toUpperCaseFirst(indexesType)}Index`] = finalIndex;
  }

  /**
   * Gets name for move synchronization method.
   *
   * @param {'row'|'column'} indexesType Type of an index.
   * @returns {string}
   */
  getSyncMoveMethodName(indexesType) {
    return `move${toUpperCaseFirst(indexesType)}s`;
  }

  /**
   * Gets name for order changing synchronization method.
   *
   * @param {'row'|'column'} indexesType Type of an index.
   * @returns {string}
   */
  getSyncOrderChangeMethodName(indexesType) {
    return `set${toUpperCaseFirst(indexesType)}Order`;
  }

  /**
   * Gets name for order changing synchronization method.
   *
   * @param {'row'|'column'} indexesType Type of an index.
   * @param {number} visualIndex Visual index.
   * @returns {number}
   */
  getTrimmedIndex(indexesType, visualIndex) {
    const indexesSequence = this.getIndexMapper(indexesType).getIndexesSequence();
    const notTrimmedIndexes = this.getIndexMapper(indexesType).getNotTrimmedIndexes();

    return indexesSequence.indexOf(notTrimmedIndexes[visualIndex]);
  }

  /**
   * Synchronizes moves done on HOT to HF engine (based on previously calculated positions).
   *
   * @param {'row'|'column'} indexesType Type of an index.
   * @param {Array<number>} moves Calculated move positions.
   */
  syncMoves = (indexesType, moves) => {
    const NUMBER_OF_MOVED_INDEXES = 1;

    this.engine.batch(() => {
      moves.forEach((move) => {
        if (move.from !== move.to) {
          this.engine[this.getSyncMoveMethodName(indexesType)](this.sheetId, move.from,
            NUMBER_OF_MOVED_INDEXES, move.to);
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
      this.setMovedIndexes(indexesType, movedIndexes.map(index => this.getTrimmedIndex(indexesType, index)));
      this.setFinalIndex(indexesType, this.getTrimmedIndex(indexesType, finalIndex));
    };
  }

  /**
   * Gets callback for hook triggered after performing move.
   *
   * @param {'row'|'column'} indexesType Type of an index.
   * @returns {Function}
   */
  getIndexMoveSyncMethod(indexesType) {
    return (_, __, ___, movePossible, orderChanged) => {
      const movedIndexes = this.getMovedIndexes(indexesType);
      const finalIndex = this.getFinalIndex(indexesType);

      if (this.isPerformingRedo === true || this.isPerformingUndo === true) {
        return;
      }

      if (movePossible === false || orderChanged === false) {
        return;
      }

      const numberOfElements = this.getIndexMapper(indexesType).getNumberOfIndexes();
      const notMovedElements = Array.from(Array(numberOfElements).keys())
        .filter(index => movedIndexes.includes(index) === false);
      let moveLine;

      if (finalIndex === 0) {
        moveLine = notMovedElements[finalIndex] ?? 0;

      } else {
        moveLine = notMovedElements[finalIndex - 1] + 1;
      }

      const moves = [];

      movedIndexes.forEach((movedIndex) => {
        const move = {
          from: movedIndex,
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

      moves.forEach((move, index) => {
        const nextMoved = moves.slice(index + 1);

        nextMoved.forEach((nextMovedIndex) => {
          const isMovingFromStartToEnd = nextMovedIndex.from < nextMovedIndex.to;

          if (nextMovedIndex.from > move.from && isMovingFromStartToEnd) {
            nextMovedIndex.from -= 1;
          }

          return nextMovedIndex;
        });
      });

      if (this.sheetId === null) {
        this.postponeAction(() => this.syncMoves(indexesType, moves));

      } else {
        this.syncMoves(indexesType, moves);
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
    return (source) => {
      if (this.isPerformingRedo === true || this.isPerformingUndo === true || this.sheetId === null) {
        return;
      }

      const newSequence = this.getIndexMapper(indexesType).getIndexesSequence();

      if (source === 'update') {
        const relativeTransformation = this.getIndexesSequence(indexesType).map(index => newSequence.indexOf(index));

        this.engine[this.getSyncOrderChangeMethodName(indexesType)](this.sheetId, relativeTransformation);
      }

      this.setIndexesSequence(indexesType, newSequence);
    };
  }

  /**
   * Setups sychronization endpoint.
   *
   * @param {HyperFormula|null} engine The HF's engine instance which will be synced.
   * @param {string|null} sheetId HyperFormula's sheet name.
   */
  setupSyncEndpoint(engine, sheetId) {
    this.engine = engine;
    this.sheetId = sheetId;

    this.setIndexesSequence('row', this.rowIndexMapper.getIndexesSequence());
    this.setIndexesSequence('column', this.columnIndexMapper.getIndexesSequence());
  }
}

export default IndexSyncer;
