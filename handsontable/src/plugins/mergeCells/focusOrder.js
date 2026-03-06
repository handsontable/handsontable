import LinkedList from '../../utils/dataStructures/linkedList';

/**
 * Class responsible for providing the correct focus order (vertical and horizontal) within a selection that
 * contains merged cells.
 *
 * @private
 */
export class FocusOrder {
  /**
   * The linked list of the all cells within the current selection in horizontal order. The list is
   * recreated every time the selection is changed.
   *
   * @type {LinkedList}
   */
  #cellsHorizontalOrder = new LinkedList();
  /**
   * The linked list of the all cells within the current selection in horizontal order. The list is
   * recreated every time the selection is changed.
   *
   * @type {LinkedList}
   */
  #cellsVerticalOrder = new LinkedList();
  /**
   * The currently highlighted cell within the horizontal linked list.
   *
   * @type {NodeStructure | null}
   */
  #currentHorizontalLinkedNode = null;
  /**
   * The currently highlighted cell within the vertical linked list.
   *
   * @type {NodeStructure | null}
   */
  #currentVerticalLinkedNode = null;
  /**
   * The merged cells getter function.
   *
   * @type {function(): {row: number, col: number, rowspan: number, colspan: number} | null}}
   */
  #mergedCellsGetter = null;
  /**
   * The row index mapper.
   *
   * @type {IndexMapper}
   */
  #rowIndexMapper = null;
  /**
   * The column index mapper.
   *
   * @type {IndexMapper}
   */
  #columnIndexMapper = null;

  constructor({ mergedCellsGetter, rowIndexMapper, columnIndexMapper }) {
    this.#mergedCellsGetter = mergedCellsGetter;
    this.#rowIndexMapper = rowIndexMapper;
    this.#columnIndexMapper = columnIndexMapper;
  }

  /**
   * Gets the currently selected node data from the vertical focus order list.
   *
   * @returns {NodeStructure}
   */
  getCurrentVerticalNode() {
    return this.#currentVerticalLinkedNode.data;
  }

  /**
   * Gets the first node data from the vertical focus order list.
   *
   * @returns {NodeStructure}
   */
  getFirstVerticalNode() {
    return this.#cellsVerticalOrder.first.data;
  }

  /**
   * Gets the next selected node data from the vertical focus order list.
   *
   * @returns {NodeStructure}
   */
  getNextVerticalNode() {
    return this.#currentVerticalLinkedNode.next.data;
  }

  /**
   * Gets the previous selected node data from the vertical focus order list.
   *
   * @returns {NodeStructure}
   */
  getPrevVerticalNode() {
    return this.#currentVerticalLinkedNode.prev.data;
  }

  /**
   * Gets the currently selected node data from the horizontal focus order list.
   *
   * @returns {NodeStructure}
   */
  getCurrentHorizontalNode() {
    return this.#currentHorizontalLinkedNode.data;
  }

  /**
   * Gets the first node data from the horizontal focus order list.
   *
   * @returns {NodeStructure}
   */
  getFirstHorizontalNode() {
    return this.#cellsHorizontalOrder.first.data;
  }

  /**
   * Gets the next selected node data from the horizontal focus order list.
   *
   * @returns {NodeStructure}
   */
  getNextHorizontalNode() {
    return this.#currentHorizontalLinkedNode.next.data;
  }

  /**
   * Gets the previous selected node data from the horizontal focus order list.
   *
   * @returns {NodeStructure}
   */
  getPrevHorizontalNode() {
    return this.#currentHorizontalLinkedNode.prev.data;
  }

  /**
   * Sets the previous node from the vertical focus order list as active.
   */
  setPrevNodeAsActive() {
    this.#currentVerticalLinkedNode = this.#currentVerticalLinkedNode.prev;
    this.#currentHorizontalLinkedNode = this.#currentHorizontalLinkedNode.prev;
  }

  /**
   * Sets the previous node from the horizontal focus order list as active.
   */
  setNextNodeAsActive() {
    this.#currentVerticalLinkedNode = this.#currentVerticalLinkedNode.next;
    this.#currentHorizontalLinkedNode = this.#currentHorizontalLinkedNode.next;
  }

  /**
   * Rebuilds the focus order list based on the provided selection.
   *
   * @param {CellRange[]} selectedRanges The selected ranges to build the focus order for.
   */
  buildFocusOrder(selectedRanges) {
    this.#cellsHorizontalOrder = new LinkedList();

    selectedRanges.forEach((range, selectionLayer) => {
      const visitedHorizontalCells = new WeakSet();
      const topStart = range.getTopStartCorner();
      const bottomEnd = range.getBottomEndCorner();

      for (let r = topStart.row; r <= bottomEnd.row; r++) {
        if (this.#rowIndexMapper.isHidden(r)) {
          // eslint-disable-next-line no-continue
          continue;
        }

        for (let c = topStart.col; c <= bottomEnd.col; c++) {
          if (this.#columnIndexMapper.isHidden(c)) {
            // eslint-disable-next-line no-continue
            continue;
          }

          const node = this.#pushOrderNode({
            selectedRange: range,
            selectionLayer,
            listOrder: this.#cellsHorizontalOrder,
            mergeCellsVisitor: visitedHorizontalCells,
            row: r,
            column: c
          });

          if (node) {
            this.#currentHorizontalLinkedNode = node;
          }
        }
      }
    });

    // create circular linked list
    if (this.#cellsHorizontalOrder.first) {
      this.#cellsHorizontalOrder.first.prev = this.#cellsHorizontalOrder.last;
      this.#cellsHorizontalOrder.last.next = this.#cellsHorizontalOrder.first;
    }

    this.#cellsVerticalOrder = new LinkedList();

    selectedRanges.forEach((range, selectionLayer) => {
      const visitedVerticalCells = new WeakSet();
      const topStart = range.getTopStartCorner();
      const bottomEnd = range.getBottomEndCorner();

      for (let c = topStart.col; c <= bottomEnd.col; c++) {
        if (this.#columnIndexMapper.isHidden(c)) {
          // eslint-disable-next-line no-continue
          continue;
        }

        for (let r = topStart.row; r <= bottomEnd.row; r++) {
          if (this.#rowIndexMapper.isHidden(r)) {
            // eslint-disable-next-line no-continue
            continue;
          }

          const node = this.#pushOrderNode({
            selectedRange: range,
            selectionLayer,
            listOrder: this.#cellsVerticalOrder,
            mergeCellsVisitor: visitedVerticalCells,
            row: r,
            column: c
          });

          if (node) {
            this.#currentVerticalLinkedNode = node;
          }
        }
      }
    });

    // create circular linked list
    if (this.#cellsVerticalOrder.first) {
      this.#cellsVerticalOrder.first.prev = this.#cellsVerticalOrder.last;
      this.#cellsVerticalOrder.last.next = this.#cellsVerticalOrder.first;
    }
  }

  /**
   * Pushes a new node to the provided list order.
   *
   * @param {object} options The options object.
   * @param {CellRange} options.selectedRange The selected range to build the focus order for.
   * @param {number} options.selectionLayer The selection layer index.
   * @param {LinkedList} options.listOrder The list order to push the node to.
   * @param {WeakSet} options.mergeCellsVisitor The set of visited cells.
   * @param {number} options.row The visual row index.
   * @param {number} options.column The visual column index.
   * @returns {NodeStructure | null}
   */
  #pushOrderNode({ selectedRange, selectionLayer, listOrder, mergeCellsVisitor, row, column }) {
    const topStart = selectedRange.getTopStartCorner();
    const bottomEnd = selectedRange.getBottomEndCorner();
    const highlight = selectedRange.highlight.clone().normalize();
    const mergeParent = this.#mergedCellsGetter(row, column);

    if (mergeParent && mergeCellsVisitor.has(mergeParent)) {
      return null;
    }

    const node = {
      selectionLayer,
      colStart: column,
      colEnd: column,
      rowStart: row,
      rowEnd: row,
    };

    if (mergeParent) {
      mergeCellsVisitor.add(mergeParent);

      if (
        mergeParent.row < topStart.row ||
        mergeParent.row + mergeParent.rowspan - 1 > bottomEnd.row ||
        mergeParent.col < topStart.col ||
        mergeParent.col + mergeParent.colspan - 1 > bottomEnd.col
      ) {
        return null;
      }

      node.colStart = mergeParent.col;
      node.colEnd = mergeParent.col + mergeParent.colspan - 1;
      node.rowStart = mergeParent.row;
      node.rowEnd = mergeParent.row + mergeParent.rowspan - 1;
    }

    const linkedNode = listOrder.push(node);

    if (
      row === highlight.row && column === highlight.col ||
      mergeParent &&
      (highlight.row >= mergeParent.row && highlight.row <= mergeParent.row + mergeParent.rowspan - 1 &&
      highlight.col >= mergeParent.col && highlight.col <= mergeParent.col + mergeParent.colspan - 1)
    ) {
      return linkedNode;
    }

    return null;
  }

  /**
   * Sets the active node based on the provided row and column.
   *
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   * @param {number} selectionLayerIndex The index of the selection layer to which the focus should be marked as active.
   * @returns {FocusOrder}
   */
  setActiveNode(row, column, selectionLayerIndex) {
    this.#cellsHorizontalOrder.inorder((node) => {
      const {
        selectionLayer,
        rowStart,
        rowEnd,
        colStart,
        colEnd,
      } = node.data;

      if (
        selectionLayer === selectionLayerIndex &&
        row >= rowStart && row <= rowEnd && column >= colStart && column <= colEnd
      ) {
        this.#currentHorizontalLinkedNode = node;

        return true;
      }
    });

    this.#cellsVerticalOrder.inorder((node) => {
      const {
        selectionLayer,
        rowStart,
        rowEnd,
        colStart,
        colEnd,
      } = node.data;

      if (
        selectionLayer === selectionLayerIndex &&
        row >= rowStart && row <= rowEnd && column >= colStart && column <= colEnd
      ) {
        this.#currentVerticalLinkedNode = node;

        return true;
      }
    });

    return this;
  }
}
