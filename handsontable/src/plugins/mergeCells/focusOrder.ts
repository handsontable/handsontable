import type { IndexMapper } from '../../translations';
import type { default as CellRange } from '../../3rdparty/walkontable/src/cell/range';
import type MergedCellCoords from './cellCoords';

/**
 * Data shape for focus order nodes.
 */
export interface FocusNodeData {
  selectionLayer: number;
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
}

/**
 * Geometry snapshot of a single selection layer, captured when the focus order is rebuilt.
 * The focus order walks these bounds lazily instead of materializing a node per selected cell.
 */
interface LayerGeometry {
  rowFrom: number;
  rowTo: number;
  colFrom: number;
  colTo: number;
  highlightRow: number;
  highlightCol: number;
}

/**
 * A cell position used while scanning a selection layer.
 */
interface ScanPosition {
  row: number;
  column: number;
}

/**
 * The traversal order of the focus: `horizontal` walks the selection row by row,
 * `vertical` walks it column by column.
 */
type FocusOrderDirection = 'horizontal' | 'vertical';

/**
 * Class responsible for providing the correct focus order (vertical and horizontal) within a selection that
 * contains merged cells.
 *
 * The order is computed lazily. A focus stop ("node") is either a visible non-merged cell or a merged
 * cell that is fully contained in the selection layer (anchored at its first visible cell in scan
 * order). Cells covered by a merged cell that sticks out of the layer produce no focus stop. Each
 * navigation step costs time relative to the merged cells it walks past — never to the selection area.
 *
 * @private
 */
export class FocusOrder {
  /**
   * Geometry snapshots of the selected ranges, one per selection layer. Recreated every time the
   * selection is changed.
   */
  #layers: LayerGeometry[] = [];
  /**
   * The currently highlighted node within the horizontal focus order.
   */
  #currentHorizontalNode: FocusNodeData | null = null;
  /**
   * The currently highlighted node within the vertical focus order.
   */
  #currentVerticalNode: FocusNodeData | null = null;
  /**
   * The merged cells getter function.
   */
  #mergedCellsGetter!: (row: number, column: number) => MergedCellCoords | false;
  /**
   * The row index mapper.
   */
  #rowIndexMapper!: IndexMapper;
  /**
   * The column index mapper.
   */
  #columnIndexMapper!: IndexMapper;

  /**
   * Initializes the focus order manager with the merged cell getter and row and column index mappers used to navigate focus through merged regions.
   */
  constructor({ mergedCellsGetter, rowIndexMapper, columnIndexMapper }: {
    mergedCellsGetter: (row: number, column: number) => MergedCellCoords | false,
    rowIndexMapper: IndexMapper, columnIndexMapper: IndexMapper
  }) {
    this.#mergedCellsGetter = mergedCellsGetter;
    this.#rowIndexMapper = rowIndexMapper;
    this.#columnIndexMapper = columnIndexMapper;
  }

  /**
   * Gets the currently selected node data from the vertical focus order.
   *
   * @returns {FocusNodeData | undefined}
   */
  getCurrentVerticalNode() {
    return this.#currentVerticalNode ?? undefined;
  }

  /**
   * Gets the first node data from the vertical focus order.
   *
   * @returns {FocusNodeData | undefined}
   */
  getFirstVerticalNode() {
    return this.#findFirstNode('vertical');
  }

  /**
   * Gets the next selected node data from the vertical focus order.
   *
   * @returns {FocusNodeData}
   */
  getNextVerticalNode(): FocusNodeData {
    // The cast mirrors the previous linked-list implementation: with no current node the method
    // returns `undefined` at runtime and the callers rely on that behavior.
    return this.#neighborNode(this.#currentVerticalNode, 'vertical', 1) as FocusNodeData;
  }

  /**
   * Gets the previous selected node data from the vertical focus order.
   *
   * @returns {FocusNodeData}
   */
  getPrevVerticalNode(): FocusNodeData {
    // See `getNextVerticalNode` for why the cast is kept.
    return this.#neighborNode(this.#currentVerticalNode, 'vertical', -1) as FocusNodeData;
  }

  /**
   * Gets the currently selected node data from the horizontal focus order.
   *
   * @returns {FocusNodeData | undefined}
   */
  getCurrentHorizontalNode() {
    return this.#currentHorizontalNode ?? undefined;
  }

  /**
   * Gets the first node data from the horizontal focus order.
   *
   * @returns {FocusNodeData | undefined}
   */
  getFirstHorizontalNode() {
    return this.#findFirstNode('horizontal');
  }

  /**
   * Gets the next selected node data from the horizontal focus order.
   *
   * @returns {FocusNodeData}
   */
  getNextHorizontalNode(): FocusNodeData {
    // See `getNextVerticalNode` for why the cast is kept.
    return this.#neighborNode(this.#currentHorizontalNode, 'horizontal', 1) as FocusNodeData;
  }

  /**
   * Gets the previous selected node data from the horizontal focus order.
   *
   * @returns {FocusNodeData}
   */
  getPrevHorizontalNode(): FocusNodeData {
    // See `getNextVerticalNode` for why the cast is kept.
    return this.#neighborNode(this.#currentHorizontalNode, 'horizontal', -1) as FocusNodeData;
  }

  /**
   * Sets the previous node in both focus orders as active.
   */
  setPrevNodeAsActive() {
    if (this.#currentVerticalNode) {
      this.#currentVerticalNode = this.#findNeighborNode(this.#currentVerticalNode, 'vertical', -1);
    }

    if (this.#currentHorizontalNode) {
      this.#currentHorizontalNode = this.#findNeighborNode(this.#currentHorizontalNode, 'horizontal', -1);
    }
  }

  /**
   * Sets the next node in both focus orders as active.
   */
  setNextNodeAsActive() {
    if (this.#currentVerticalNode) {
      this.#currentVerticalNode = this.#findNeighborNode(this.#currentVerticalNode, 'vertical', 1);
    }

    if (this.#currentHorizontalNode) {
      this.#currentHorizontalNode = this.#findNeighborNode(this.#currentHorizontalNode, 'horizontal', 1);
    }
  }

  /**
   * Rebuilds the focus order based on the provided selection. Only the layers' geometry is
   * captured — the focus stops themselves are computed lazily during navigation.
   *
   * @param {CellRange[]} selectedRanges The selected ranges to build the focus order for.
   */
  buildFocusOrder(selectedRanges: CellRange[]) {
    this.#layers = selectedRanges.map((range) => {
      const topStart = range.getTopStartCorner();
      const bottomEnd = range.getBottomEndCorner();
      const highlight = range.highlight.clone().normalize();

      return {
        rowFrom: topStart.row ?? 0,
        rowTo: bottomEnd.row ?? 0,
        colFrom: topStart.col ?? 0,
        colTo: bottomEnd.col ?? 0,
        highlightRow: highlight.row ?? 0,
        highlightCol: highlight.col ?? 0,
      };
    });

    let highlightNode: FocusNodeData | null = null;

    for (let selectionLayer = 0; selectionLayer < this.#layers.length; selectionLayer++) {
      const { highlightRow, highlightCol } = this.#layers[selectionLayer];
      const node = this.#getNodeAt(selectionLayer, highlightRow, highlightCol);

      if (node) {
        highlightNode = node;
      }
    }

    this.#currentHorizontalNode = highlightNode;
    this.#currentVerticalNode = highlightNode;
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
    // Without a layer index no node can match — kept for compatibility with the previous
    // implementation, which compared each node's layer against `undefined`.
    if (selectionLayerIndex === undefined) {
      return this;
    }

    const node = this.#getNodeAt(selectionLayerIndex, row, column);

    if (node) {
      this.#currentHorizontalNode = node;
      this.#currentVerticalNode = node;
    }

    return this;
  }

  /**
   * Gets the focus node that contains the provided cell within the provided selection layer, or
   * `null` when the cell produces no focus stop (outside the layer, hidden, or covered by a merged
   * cell that sticks out of the layer).
   *
   * @param {number} selectionLayer The selection layer index.
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   * @returns {FocusNodeData | null}
   */
  #getNodeAt(selectionLayer: number, row: number, column: number): FocusNodeData | null {
    const layer = this.#layers[selectionLayer];

    if (!layer) {
      return null;
    }

    const mergeParent = this.#mergedCellsGetter(row, column);

    if (mergeParent) {
      return this.#createMergeNode(selectionLayer, mergeParent);
    }

    if (
      row < layer.rowFrom || row > layer.rowTo ||
      column < layer.colFrom || column > layer.colTo ||
      this.#rowIndexMapper.isHidden(row) || this.#columnIndexMapper.isHidden(column)
    ) {
      return null;
    }

    return { selectionLayer, rowStart: row, rowEnd: row, colStart: column, colEnd: column };
  }

  /**
   * Creates a focus node for the provided merged cell, or `null` when the merged cell produces no
   * focus stop — it sticks out of the layer's bounds or has no visible cell to anchor at.
   *
   * @param {number} selectionLayer The selection layer index.
   * @param {MergedCellCoords} mergeParent The merged cell to create the node for.
   * @returns {FocusNodeData | null}
   */
  #createMergeNode(selectionLayer: number, mergeParent: MergedCellCoords): FocusNodeData | null {
    const layer = this.#layers[selectionLayer];
    const rowStart = mergeParent.row;
    const rowEnd = mergeParent.row + mergeParent.rowspan - 1;
    const colStart = mergeParent.col;
    const colEnd = mergeParent.col + mergeParent.colspan - 1;

    if (
      rowStart < layer.rowFrom || rowEnd > layer.rowTo ||
      colStart < layer.colFrom || colEnd > layer.colTo ||
      this.#findAnchor(rowStart, rowEnd, colStart, colEnd) === null
    ) {
      return null;
    }

    return { selectionLayer, rowStart, rowEnd, colStart, colEnd };
  }

  /**
   * Finds the anchor — the first visible cell in scan order — of the provided rectangle. Returns
   * `null` when the rectangle has no visible row or column.
   *
   * @param {number} rowStart The first visual row index of the rectangle.
   * @param {number} rowEnd The last visual row index of the rectangle.
   * @param {number} colStart The first visual column index of the rectangle.
   * @param {number} colEnd The last visual column index of the rectangle.
   * @returns {ScanPosition | null}
   */
  #findAnchor(rowStart: number, rowEnd: number, colStart: number, colEnd: number): ScanPosition | null {
    const row = this.#rowIndexMapper.getNearestNotHiddenIndex(rowStart, 1);
    const column = this.#columnIndexMapper.getNearestNotHiddenIndex(colStart, 1);

    if (row === null || row > rowEnd || column === null || column > colEnd) {
      return null;
    }

    return { row, column };
  }

  /**
   * Gets the position the lazy scan resumes from for the provided node — the node's anchor, or its
   * top-start corner when the anchor cannot be resolved anymore (e.g. hidden in the meantime).
   *
   * @param {FocusNodeData} node The node to resolve the scan position for.
   * @returns {ScanPosition}
   */
  #nodeScanPosition(node: FocusNodeData): ScanPosition {
    return this.#findAnchor(node.rowStart, node.rowEnd, node.colStart, node.colEnd)
      ?? { row: node.rowStart, column: node.colStart };
  }

  /**
   * Computes the neighboring node data of the provided node, or `undefined` when there is no node.
   *
   * @param {FocusNodeData | null} node The node to start from.
   * @param {FocusOrderDirection} order The traversal order.
   * @param {number} direction The traversal direction. `1` for next, `-1` for previous.
   * @returns {FocusNodeData | undefined}
   */
  #neighborNode(node: FocusNodeData | null, order: FocusOrderDirection, direction: 1 | -1) {
    if (!node) {
      return undefined;
    }

    return this.#findNeighborNode(node, order, direction) ?? undefined;
  }

  /**
   * Finds the neighboring node of the provided node, walking the selection layers circularly —
   * exactly like the previously materialized circular linked list did. When the provided node is
   * the only focus stop, the node itself is returned.
   *
   * @param {FocusNodeData} node The node to start from.
   * @param {FocusOrderDirection} order The traversal order.
   * @param {number} direction The traversal direction. `1` for next, `-1` for previous.
   * @returns {FocusNodeData | null}
   */
  #findNeighborNode(node: FocusNodeData, order: FocusOrderDirection, direction: 1 | -1): FocusNodeData | null {
    const totalLayers = this.#layers.length;

    if (totalLayers === 0) {
      return null;
    }

    const startLayer = this.#layers[node.selectionLayer] ? node.selectionLayer : 0;
    let foundNode = this.#findNodeInLayer(startLayer, this.#nodeScanPosition(node), order, direction);

    for (let step = 1; foundNode === null && step <= totalLayers; step++) {
      const rawLayer = (startLayer + (step * direction)) % totalLayers;
      const layer = (rawLayer + totalLayers) % totalLayers;

      foundNode = this.#findNodeInLayer(layer, null, order, direction);
    }

    return foundNode;
  }

  /**
   * Finds the first node of the whole focus order, or `undefined` when the selection produces no
   * focus stops.
   *
   * @param {FocusOrderDirection} order The traversal order.
   * @returns {FocusNodeData | undefined}
   */
  #findFirstNode(order: FocusOrderDirection) {
    for (let selectionLayer = 0; selectionLayer < this.#layers.length; selectionLayer++) {
      const node = this.#findNodeInLayer(selectionLayer, null, order, 1);

      if (node) {
        return node;
      }
    }

    return undefined;
  }

  /**
   * Finds the first focus node of the provided layer at or after the provided scan position
   * (exclusive). Passing `null` as the position scans the layer from its edge (inclusive).
   *
   * @param {number} selectionLayer The selection layer index.
   * @param {ScanPosition | null} fromPosition The position to start the scan from, or `null` to
   * scan from the layer's edge.
   * @param {FocusOrderDirection} order The traversal order.
   * @param {number} direction The traversal direction. `1` for forward, `-1` for backward.
   * @returns {FocusNodeData | null}
   */
  #findNodeInLayer(
    selectionLayer: number,
    fromPosition: ScanPosition | null,
    order: FocusOrderDirection,
    direction: 1 | -1,
  ): FocusNodeData | null {
    const layer = this.#layers[selectionLayer];

    if (!layer) {
      return null;
    }

    let position = fromPosition === null
      ? this.#layerEdgePosition(layer, direction)
      : this.#advance(layer, fromPosition, order, direction);

    while (position !== null) {
      const mergeParent = this.#mergedCellsGetter(position.row, position.column);

      if (!mergeParent) {
        return {
          selectionLayer,
          rowStart: position.row,
          rowEnd: position.row,
          colStart: position.column,
          colEnd: position.column,
        };
      }

      const mergeNode = this.#createMergeNode(selectionLayer, mergeParent);

      if (mergeNode && this.#emitsMergeNodeAt(mergeNode, position, order, direction)) {
        return mergeNode;
      }

      position = this.#skipMerge(layer, position, mergeParent, order, direction);
    }

    return null;
  }

  /**
   * Checks whether the merged cell's node is emitted at the provided scan position. Scanning
   * forward, a merged cell is emitted exactly at its anchor. Scanning backward, it is emitted as
   * soon as the scan enters the anchor's row (horizontal order) or column (vertical order) — every
   * cell between that position and the anchor belongs to the same merged cell.
   *
   * @param {FocusNodeData} mergeNode The merged cell's node.
   * @param {ScanPosition} position The current scan position (a cell of the merged cell).
   * @param {FocusOrderDirection} order The traversal order.
   * @param {number} direction The traversal direction. `1` for forward, `-1` for backward.
   * @returns {boolean}
   */
  #emitsMergeNodeAt(
    mergeNode: FocusNodeData,
    position: ScanPosition,
    order: FocusOrderDirection,
    direction: 1 | -1,
  ): boolean {
    const anchor = this.#findAnchor(mergeNode.rowStart, mergeNode.rowEnd, mergeNode.colStart, mergeNode.colEnd);

    if (anchor === null) {
      return false;
    }

    if (direction === 1) {
      return anchor.row === position.row && anchor.column === position.column;
    }

    return order === 'horizontal' ? anchor.row === position.row : anchor.column === position.column;
  }

  /**
   * Advances the scan position past the provided merged cell along the traversal order's inner
   * axis, so the scan cost stays relative to the merged cells walked past — not to their area.
   *
   * @param {LayerGeometry} layer The layer geometry.
   * @param {ScanPosition} position The current scan position (a cell of the merged cell).
   * @param {MergedCellCoords} mergeParent The merged cell to skip.
   * @param {FocusOrderDirection} order The traversal order.
   * @param {number} direction The traversal direction. `1` for forward, `-1` for backward.
   * @returns {ScanPosition | null}
   */
  #skipMerge(
    layer: LayerGeometry,
    position: ScanPosition,
    mergeParent: MergedCellCoords,
    order: FocusOrderDirection,
    direction: 1 | -1,
  ): ScanPosition | null {
    if (order === 'horizontal') {
      const column = direction === 1
        ? Math.min(mergeParent.col + mergeParent.colspan - 1, layer.colTo)
        : Math.max(mergeParent.col, layer.colFrom);

      return this.#advance(layer, { row: position.row, column }, order, direction);
    }

    const row = direction === 1
      ? Math.min(mergeParent.row + mergeParent.rowspan - 1, layer.rowTo)
      : Math.max(mergeParent.row, layer.rowFrom);

    return this.#advance(layer, { row, column: position.column }, order, direction);
  }

  /**
   * Gets the first (forward) or last (backward) visible cell position of the provided layer, or
   * `null` when the layer has no visible cell.
   *
   * @param {LayerGeometry} layer The layer geometry.
   * @param {number} direction The traversal direction. `1` for forward, `-1` for backward.
   * @returns {ScanPosition | null}
   */
  #layerEdgePosition(layer: LayerGeometry, direction: 1 | -1): ScanPosition | null {
    const row = direction === 1
      ? this.#rowIndexMapper.getNearestNotHiddenIndex(layer.rowFrom, 1)
      : this.#rowIndexMapper.getNearestNotHiddenIndex(layer.rowTo, -1);
    const column = direction === 1
      ? this.#columnIndexMapper.getNearestNotHiddenIndex(layer.colFrom, 1)
      : this.#columnIndexMapper.getNearestNotHiddenIndex(layer.colTo, -1);

    if (
      row === null || row < layer.rowFrom || row > layer.rowTo ||
      column === null || column < layer.colFrom || column > layer.colTo
    ) {
      return null;
    }

    return { row, column };
  }

  /**
   * Advances the scan position to the next (or previous) visible cell of the layer in the provided
   * traversal order, or `null` when the layer's end is reached.
   *
   * @param {LayerGeometry} layer The layer geometry.
   * @param {ScanPosition} position The current scan position.
   * @param {FocusOrderDirection} order The traversal order.
   * @param {number} direction The traversal direction. `1` for forward, `-1` for backward.
   * @returns {ScanPosition | null}
   */
  #advance(
    layer: LayerGeometry,
    position: ScanPosition,
    order: FocusOrderDirection,
    direction: 1 | -1,
  ): ScanPosition | null {
    if (order === 'horizontal') {
      const column = this.#columnIndexMapper.getNearestNotHiddenIndex(position.column + direction, direction);

      if (column !== null && column >= layer.colFrom && column <= layer.colTo) {
        return { row: position.row, column };
      }

      const row = this.#rowIndexMapper.getNearestNotHiddenIndex(position.row + direction, direction);
      const edgeColumn = direction === 1
        ? this.#columnIndexMapper.getNearestNotHiddenIndex(layer.colFrom, 1)
        : this.#columnIndexMapper.getNearestNotHiddenIndex(layer.colTo, -1);

      if (
        row === null || row < layer.rowFrom || row > layer.rowTo ||
        edgeColumn === null || edgeColumn < layer.colFrom || edgeColumn > layer.colTo
      ) {
        return null;
      }

      return { row, column: edgeColumn };
    }

    const row = this.#rowIndexMapper.getNearestNotHiddenIndex(position.row + direction, direction);

    if (row !== null && row >= layer.rowFrom && row <= layer.rowTo) {
      return { row, column: position.column };
    }

    const column = this.#columnIndexMapper.getNearestNotHiddenIndex(position.column + direction, direction);
    const edgeRow = direction === 1
      ? this.#rowIndexMapper.getNearestNotHiddenIndex(layer.rowFrom, 1)
      : this.#rowIndexMapper.getNearestNotHiddenIndex(layer.rowTo, -1);

    if (
      column === null || column < layer.colFrom || column > layer.colTo ||
      edgeRow === null || edgeRow < layer.rowFrom || edgeRow > layer.rowTo
    ) {
      return null;
    }

    return { row: edgeRow, column };
  }
}
