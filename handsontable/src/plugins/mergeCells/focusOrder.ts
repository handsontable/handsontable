import LinkedList, { NodeStructure } from '../../utils/dataStructures/linkedList';
import type { IndexMapper } from '../../translations';
import type { default as CellRange } from '../../3rdparty/walkontable/src/cell/range';

/**
 * Data shape for focus order linked list nodes.
 */
export interface FocusNodeData {
  selectionLayer: number;
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
}

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
   */
  #cellsHorizontalOrder = new LinkedList();
  /**
   * The linked list of the all cells within the current selection in vertical order. The list is
   * recreated every time the selection is changed.
   */
  #cellsVerticalOrder = new LinkedList();
  /**
   * The currently highlighted cell within the horizontal linked list.
   */
  #currentHorizontalLinkedNode: NodeStructure | null = null;
  /**
   * The currently highlighted cell within the vertical linked list.
   */
  #currentVerticalLinkedNode: NodeStructure | null = null;
  /**
   * The merged cells getter function.
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  #mergedCellsGetter!: Function;
  /**
   * The row index mapper.
   */
  #rowIndexMapper!: IndexMapper;
  /**
   * The column index mapper.
   */
  #columnIndexMapper!: IndexMapper;

  constructor({ mergedCellsGetter, rowIndexMapper, columnIndexMapper }: {
    mergedCellsGetter: Function, rowIndexMapper: IndexMapper, columnIndexMapper: IndexMapper
  }) {
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
    return this.#currentVerticalLinkedNode?.data;
  }

  /**
   * Gets the first node data from the vertical focus order list.
   *
   * @returns {NodeStructure}
   */
  getFirstVerticalNode() {
    return this.#cellsVerticalOrder.first?.data;
  }

  /**
   * Gets the next selected node data from the vertical focus order list.
   *
   * @returns {FocusNodeData}
   */
  getNextVerticalNode(): FocusNodeData {
    return this.#currentVerticalLinkedNode?.next?.data as FocusNodeData;
  }

  /**
   * Gets the previous selected node data from the vertical focus order list.
   *
   * @returns {FocusNodeData}
   */
  getPrevVerticalNode(): FocusNodeData {
    return this.#currentVerticalLinkedNode?.prev?.data as FocusNodeData;
  }

  /**
   * Gets the currently selected node data from the horizontal focus order list.
   *
   * @returns {NodeStructure}
   */
  getCurrentHorizontalNode() {
    return this.#currentHorizontalLinkedNode?.data;
  }

  /**
   * Gets the first node data from the horizontal focus order list.
   *
   * @returns {NodeStructure}
   */
  getFirstHorizontalNode() {
    return this.#cellsHorizontalOrder.first?.data;
  }

  /**
   * Gets the next selected node data from the horizontal focus order list.
   *
   * @returns {FocusNodeData}
   */
  getNextHorizontalNode(): FocusNodeData {
    return this.#currentHorizontalLinkedNode?.next?.data as FocusNodeData;
  }

  /**
   * Gets the previous selected node data from the horizontal focus order list.
   *
   * @returns {FocusNodeData}
   */
  getPrevHorizontalNode(): FocusNodeData {
    return this.#currentHorizontalLinkedNode?.prev?.data as FocusNodeData;
  }

  /**
   * Sets the previous node from the vertical focus order list as active.
   */
  setPrevNodeAsActive() {
    if (this.#currentVerticalLinkedNode) {
      this.#currentVerticalLinkedNode = this.#currentVerticalLinkedNode.prev;
    }

    if (this.#currentHorizontalLinkedNode) {
      this.#currentHorizontalLinkedNode = this.#currentHorizontalLinkedNode.prev;
    }
  }

  /**
   * Sets the previous node from the horizontal focus order list as active.
   */
  setNextNodeAsActive() {
    if (this.#currentVerticalLinkedNode) {
      this.#currentVerticalLinkedNode = this.#currentVerticalLinkedNode.next;
    }

    if (this.#currentHorizontalLinkedNode) {
      this.#currentHorizontalLinkedNode = this.#currentHorizontalLinkedNode.next;
    }
  }

  /**
   * Rebuilds the focus order list based on the provided selection.
   *
   * @param {CellRange[]} selectedRanges The selected ranges to build the focus order for.
   */
  buildFocusOrder(selectedRanges: CellRange[]) {
    this.#cellsHorizontalOrder = new LinkedList();

    selectedRanges.forEach((range: CellRange, selectionLayer: number) => {
      const visitedHorizontalCells = new WeakSet();
      const topStart = range.getTopStartCorner();
      const bottomEnd = range.getBottomEndCorner();
      const rowFrom = topStart.row ?? 0;
      const rowTo = bottomEnd.row ?? 0;
      const colFrom = topStart.col ?? 0;
      const colTo = bottomEnd.col ?? 0;

      for (let r = rowFrom; r <= rowTo; r++) {
        if (this.#rowIndexMapper.isHidden(r)) {
          // eslint-disable-next-line no-continue
          continue;
        }

        for (let c = colFrom; c <= colTo; c++) {
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
    if (this.#cellsHorizontalOrder.first && this.#cellsHorizontalOrder.last) {
      this.#cellsHorizontalOrder.first.prev = this.#cellsHorizontalOrder.last;
      this.#cellsHorizontalOrder.last.next = this.#cellsHorizontalOrder.first;
    }

    this.#cellsVerticalOrder = new LinkedList();

    selectedRanges.forEach((range: CellRange, selectionLayer: number) => {
      const visitedVerticalCells = new WeakSet();
      const topStart = range.getTopStartCorner();
      const bottomEnd = range.getBottomEndCorner();
      const rowFrom = topStart.row ?? 0;
      const rowTo = bottomEnd.row ?? 0;
      const colFrom = topStart.col ?? 0;
      const colTo = bottomEnd.col ?? 0;

      for (let c = colFrom; c <= colTo; c++) {
        if (this.#columnIndexMapper.isHidden(c)) {
          // eslint-disable-next-line no-continue
          continue;
        }

        for (let r = rowFrom; r <= rowTo; r++) {
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
    if (this.#cellsVerticalOrder.first && this.#cellsVerticalOrder.last) {
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
  #pushOrderNode({ selectedRange, selectionLayer, listOrder, mergeCellsVisitor, row, column }: {
    selectedRange: CellRange, selectionLayer: number, listOrder: LinkedList,
    mergeCellsVisitor: WeakSet<object>, row: number, column: number
  }) {
    const topStart = selectedRange.getTopStartCorner();
    const bottomEnd = selectedRange.getBottomEndCorner();
    const topStartRow = topStart.row ?? 0;
    const topStartCol = topStart.col ?? 0;
    const bottomEndRow = bottomEnd.row ?? 0;
    const bottomEndCol = bottomEnd.col ?? 0;
    const highlight = selectedRange.highlight.clone().normalize();
    const highlightRow = highlight.row ?? 0;
    const highlightCol = highlight.col ?? 0;
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
        mergeParent.row < topStartRow ||
        mergeParent.row + mergeParent.rowspan - 1 > bottomEndRow ||
        mergeParent.col < topStartCol ||
        mergeParent.col + mergeParent.colspan - 1 > bottomEndCol
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
      row === highlightRow && column === highlightCol ||
      mergeParent &&
      (highlightRow >= mergeParent.row && highlightRow <= mergeParent.row + mergeParent.rowspan - 1 &&
      highlightCol >= mergeParent.col && highlightCol <= mergeParent.col + mergeParent.colspan - 1)
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
  setActiveNode(row: number, column: number, selectionLayerIndex?: number) {
    this.#cellsHorizontalOrder.inorder((node: NodeStructure) => {
      const {
        selectionLayer,
        rowStart,
        rowEnd,
        colStart,
        colEnd,
      } = node.data as Record<string, number>;

      if (
        selectionLayer === selectionLayerIndex &&
        row >= rowStart && row <= rowEnd && column >= colStart && column <= colEnd
      ) {
        this.#currentHorizontalLinkedNode = node;

        return true;
      }
    });

    this.#cellsVerticalOrder.inorder((node: NodeStructure) => {
      const {
        selectionLayer,
        rowStart,
        rowEnd,
        colStart,
        colEnd,
      } = node.data as Record<string, number>;

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
