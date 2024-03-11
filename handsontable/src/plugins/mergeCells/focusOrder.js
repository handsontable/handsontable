import LinkedList from '../../utils/dataStructures/linkedList';

/**
 * Class responsible for providing the correct focus order (vertical and horizontal) within a selection that
 * contains merged cells.
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

  constructor(mergedCellsGetter) {
    this.#mergedCellsGetter = mergedCellsGetter;
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
   * Rebuilds the focus order list based on the provided selection.
   *
   * @param {CellRange} selectedRange The selected range to build the focus order for.
   */
  buildFocusOrder(selectedRange) {
    const topStart = selectedRange.getTopStartCorner();
    const bottomEnd = selectedRange.getBottomEndCorner();
    const visitedHorizontalCells = new WeakSet();

    this.#cellsHorizontalOrder = new LinkedList();

    for (let r = topStart.row; r <= bottomEnd.row; r++) {
      for (let c = topStart.col; c <= bottomEnd.col; c++) {
        const mergeParent = this.#mergedCellsGetter(r, c);
        const node = this.#pushOrderNode(selectedRange, this.#cellsHorizontalOrder, visitedHorizontalCells, r, c);

        if (node) {
          this.#currentHorizontalLinkedNode = node;
        }

        if (mergeParent) {
          c += mergeParent.colspan - 1;

          if (mergeParent.col < topStart.col) {
            c += mergeParent.col - topStart.col;
          }
        }
      }
    }

    // create circular linked list
    this.#cellsHorizontalOrder.first.prev = this.#cellsHorizontalOrder.last;
    this.#cellsHorizontalOrder.last.next = this.#cellsHorizontalOrder.first;

    const visitedVerticalCells = new WeakSet();

    this.#cellsVerticalOrder = new LinkedList();

    for (let c = topStart.col; c <= bottomEnd.col; c++) {
      for (let r = topStart.row; r <= bottomEnd.row; r++) {
        const mergeParent = this.#mergedCellsGetter(r, c);
        const node = this.#pushOrderNode(selectedRange, this.#cellsVerticalOrder, visitedVerticalCells, r, c);

        if (node) {
          this.#currentVerticalLinkedNode = node;
        }

        if (mergeParent) {
          r += mergeParent.rowspan - 1;

          if (mergeParent.row < topStart.row) {
            r += mergeParent.row - topStart.row;
          }
        }
      }
    }

    // create circular linked list
    this.#cellsVerticalOrder.first.prev = this.#cellsVerticalOrder.last;
    this.#cellsVerticalOrder.last.next = this.#cellsVerticalOrder.first;
  }

  /**
   * Pushes a new node to the provided list order.
   *
   * @param {CellRange} selectedRange The selected range to build the focus order for.
   * @param {LinkedList} listOrder The list order to push the node to.
   * @param {WeakSet} mergeCellsVisitor The set of visited cells.
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   * @returns {NodeStructure | null}
   */
  #pushOrderNode(selectedRange, listOrder, mergeCellsVisitor, row, column) {
    const topStart = selectedRange.getTopStartCorner();
    const bottomEnd = selectedRange.getBottomEndCorner();
    const highlight = selectedRange.highlight.clone().normalize();
    const mergeParent = this.#mergedCellsGetter(row, column);

    if (mergeParent && mergeCellsVisitor.has(mergeParent)) {
      return null;
    }

    const node = {
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
   */
  setActiveNode(row, column) {
    this.#cellsHorizontalOrder.inorder((node) => {
      const { rowStart, rowEnd, colStart, colEnd } = node.data;

      if (row >= rowStart && row <= rowEnd && column >= colStart && column <= colEnd) {
        this.#currentHorizontalLinkedNode = node;

        return false;
      }
    });

    this.#cellsVerticalOrder.inorder((node) => {
      const { rowStart, rowEnd, colStart, colEnd } = node.data;

      if (row >= rowStart && row <= rowEnd && column >= colStart && column <= colEnd) {
        this.#currentVerticalLinkedNode = node;

        return false;
      }
    });
  }
}
