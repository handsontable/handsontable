import { arrayMap, arrayReduce } from '../../../helpers/array';
import SourceSettings from './sourceSettings';
import type { HeaderNodeData } from './headersTree';
import HeadersTree from './headersTree';
import { triggerNodeModification } from './nodeModifiers';
import type { NodeModificationResult } from './nodeModifiers';
import { isDeclarativeGroup } from './nodeModifiers/utils/tree';
import { generateMatrix } from './matrixGenerator';
import { syncVisibilityOnTree } from './syncVisibility';
import { deriveVisualSettings } from './deriveSettings';
import { createIdentityColumnArrangement } from './columnArrangement';
import type { ColumnArrangement } from './columnArrangement';
import type { ColumnVisibility } from './columnVisibility';
import type TreeNode from '../../../utils/dataStructures/tree';
import { TRAVERSAL_DF_PRE } from '../../../utils/dataStructures/tree';

/**
 * The state manager is a source of truth for nested headers configuration.
 *
 * @class StateManager
 */
export default class StateManager {
  /**
   * The authored (physical-order) source settings - the normalized user configuration. All
   * structural mutations (setData, mergeWith, map, insertColumns, removeColumns) operate on this.
   *
   * @private
   * @type {SourceSettings}
   */
  readonly #sourceSettings = new SourceSettings();
  /**
   * Visual-order settings derived from #sourceSettings through deriveVisualSettings(). The headers
   * tree is built from these, so the rendered structure follows the current column arrangement. With
   * an identity arrangement they equal the authored settings, so the built tree is unchanged.
   *
   * @private
   * @type {SourceSettings}
   */
  readonly #derivedSettings = new SourceSettings();
  /**
   * The instance of the headers tree.
   *
   * @private
   * @type {HeadersTree}
   */
  readonly #headersTree = new HeadersTree(this.#derivedSettings);
  /**
   * Cached matrix which is generated from the tree structure.
   *
   * @private
   * @type {Array[]}
   */
  #stateMatrix: unknown[][] = [[]];
  /**
   * The last column-visibility adapter passed to syncVisibility(). Stored so that
   * mapState()/mergeStateWith() can re-apply it after rebuilding the tree.
   */
  #lastColumnVisibility: ColumnVisibility | null = null;
  /**
   * The column arrangement the headers tree is derived against. When null, an identity arrangement
   * (visual equals physical) is used, which reproduces the authored structure. The plugin sets a
   * live adapter so the structure follows column moves.
   */
  #columnArrangement: ColumnArrangement | null = null;

  /**
   * Sets a new state for the nested headers plugin based on settings passed
   * directly to the plugin.
   *
   * @param {Array[]} nestedHeadersSettings The user-defined settings.
   * @returns {boolean} Returns `true` if the settings are processed correctly, `false` otherwise.
   */
  setState(nestedHeadersSettings: unknown[][]) {
    this.#sourceSettings.setData(nestedHeadersSettings);
    let hasError = false;

    try {
      this.#deriveTree();
    } catch (ex) {
      this.#headersTree.clear();
      this.#derivedSettings.clear();
      this.#sourceSettings.clear();
      hasError = true;
    }

    this.#applySyncVisibility();

    return hasError;
  }

  /**
   * Sets columns limit to the state will be trimmed.
   *
   * @param {number} columnsCount The number of columns to limit to.
   */
  setColumnsLimit(columnsCount: number) {
    this.#sourceSettings.setColumnsLimit(columnsCount);
  }

  /**
   * Sets the column arrangement the headers tree is derived against. Pass a live adapter (backed by
   * the column index mapper) so the rendered structure follows column moves, or `null` to fall back
   * to the identity arrangement (authored structure). Does not rebuild on its own - call
   * `rebuildState()` (or any structural mutation) to re-derive the tree.
   *
   * @param {ColumnArrangement|null} columnArrangement The arrangement to derive against, or null.
   */
  setColumnArrangement(columnArrangement: ColumnArrangement | null) {
    this.#columnArrangement = columnArrangement;
  }

  /**
   * Re-derives the headers tree from the current authored settings and column arrangement, preserving
   * the collapsed state and re-applying visibility. Call this when only the arrangement changed (a
   * column move) and no structural mutation of the authored settings is needed.
   *
   * Collapse is re-attached by authored group identity (not visual column index, which the move just
   * changed): a group that stayed contiguous is re-collapsed at its new position; a group split apart
   * by the move auto-expands (its collapse is dropped), since a non-contiguous group cannot stay
   * collapsed coherently.
   */
  rebuildState() {
    const collapsedGroups = this.#snapshotCollapsedGroups();

    this.#deriveTree();
    this.#deriveVisibility();
    this.#reapplyCollapsedGroupsByIdentity(collapsedGroups);
    this.#applySyncVisibility();
  }

  /**
   * Captures the header level and authored group identity of every currently collapsed group, so the
   * collapsed state can be re-attached after a move re-derives the tree.
   *
   * @returns {Array<{headerLevel: number, authoredColumnIndex: number}>}
   */
  #snapshotCollapsedGroups(): { headerLevel: number, authoredColumnIndex: number }[] {
    const groups: { headerLevel: number, authoredColumnIndex: number }[] = [];

    this.#headersTree.getRoots().forEach((rootNode) => {
      rootNode.walkDown((node) => {
        const { isCollapsed, headerLevel, authoredColumnIndex } = node.data;

        if (isCollapsed && typeof authoredColumnIndex === 'number' && authoredColumnIndex >= 0) {
          groups.push({ headerLevel, authoredColumnIndex });
        }
      });
    });

    return groups;
  }

  /**
   * Re-collapses the groups captured by #snapshotCollapsedGroups() on the freshly re-derived tree,
   * matching by authored identity. A group that maps to exactly one node stayed contiguous and is
   * re-collapsed; a group that maps to more than one node was split by the move and is left expanded.
   *
   * @param {Array<{headerLevel: number, authoredColumnIndex: number}>} collapsedGroups The captured groups.
   */
  #reapplyCollapsedGroupsByIdentity(collapsedGroups: { headerLevel: number, authoredColumnIndex: number }[]) {
    collapsedGroups.forEach(({ headerLevel, authoredColumnIndex }) => {
      const matches = this.#findNodesByAuthoredIdentity(headerLevel, authoredColumnIndex);

      if (matches.length === 1) {
        this.triggerNodeModification('collapse', headerLevel, matches[0].data.columnIndex);
      }
    });
  }

  /**
   * Finds every tree node at the given header level that was derived from the given authored owner
   * column. More than one match means the authored group is split across non-adjacent visual columns.
   *
   * @param {number} headerLevel Header level index.
   * @param {number} authoredColumnIndex The authored owner column index identifying the group.
   * @returns {TreeNode[]} The matching nodes.
   */
  #findNodesByAuthoredIdentity(headerLevel: number, authoredColumnIndex: number): TreeNode<HeaderNodeData>[] {
    const matches: TreeNode<HeaderNodeData>[] = [];

    this.#headersTree.getRoots().forEach((rootNode) => {
      rootNode.walkDown((node) => {
        if (node.data.headerLevel === headerLevel && node.data.authoredColumnIndex === authoredColumnIndex) {
          matches.push(node);
        }
      });
    });

    return matches;
  }

  /**
   * Merges settings with current plugin state.
   *
   * @param {object[]} settings An array of objects to merge with the current source settings.
   */
  mergeStateWith(settings: { row: number, col: number, [key: string]: unknown }[]) {
    const transformedSettings = arrayMap(settings, ({ row, ...rest }) => {
      // Negative rows are header-coordinate; map them to a header level. An out-of-range row keeps
      // its (negative) value, which getHeaderSettings() resolves to no match - same as before.
      return {
        row: row < 0 ? (this.rowCoordsToLevel(row) ?? row) : row,
        ...rest,
      };
    });

    this.#rebuildPreservingCollapse(
      () => this.#sourceSettings.mergeWith(transformedSettings),
      columnIndex => columnIndex
    );
  }

  /**
   * Maps the current state with a callback.
   *
   * @param {Function} callback A function that is called for every header source settings.
   */
  mapState(callback: (headerSettings: Record<string, unknown>) => unknown) {
    this.#rebuildPreservingCollapse(() => this.#sourceSettings.map(callback), columnIndex => columnIndex);
  }

  /**
   * Inserts `amount` columns into the source settings at the visual `columnIndex`, then rebuilds
   * the tree and re-derives visibility. Headers spanning the insertion point are extended; columns
   * inserted at a header boundary become standalone headers.
   *
   * @param {number} columnIndex A visual column index at which the new columns are inserted.
   * @param {number} amount The number of columns to insert.
   */
  insertColumns(columnIndex: number, amount: number) {
    this.#rebuildPreservingCollapse(
      () => this.#sourceSettings.insertColumns(columnIndex, amount),
      c => (c >= columnIndex ? c + amount : c)
    );
  }

  /**
   * Removes `amount` columns from the source settings starting at the visual `columnIndex`, then
   * rebuilds the tree and re-derives visibility. Headers overlapping the removed range are shrunk,
   * re-anchored, or dropped when they lose all their columns.
   *
   * @param {number} columnIndex A visual column index from which the columns are removed.
   * @param {number} amount The number of columns to remove.
   */
  removeColumns(columnIndex: number, amount: number) {
    const endIndex = columnIndex + amount;

    this.#rebuildPreservingCollapse(
      () => this.#sourceSettings.removeColumns(columnIndex, amount),
      (c) => {
        if (c < columnIndex) {
          return c;
        }

        // The anchor column was removed but the group may survive - re-anchor to the range start.
        return c >= endIndex ? c - amount : columnIndex;
      }
    );
  }

  /**
   * Rebuilds the header tree after a structural mutation while preserving the collapsed state.
   *
   * Visibility is derived BEFORE re-collapsing, so collapseNode picks the correct first *visible*
   * representative (and clones the right children) even when columns are hidden by an external
   * source; then it is derived again to reflect the re-applied collapse. Re-running the collapse -
   * rather than only restoring the `isCollapsed` flag - rebuilds the `clonedTree` needed to expand
   * the group again.
   *
   * @param {Function} mutate Applies the structural change to the source settings.
   * @param {Function} shiftColumnIndex Maps a pre-rebuild collapsed column index to its new position.
   */
  #rebuildPreservingCollapse(mutate: () => void, shiftColumnIndex: (columnIndex: number) => number) {
    const collapsedNodes = this.#snapshotCollapsedNodes();

    mutate();
    this.#deriveTree();
    // Derive visibility before re-collapsing, but skip the matrix here - #reapplyCollapsedNodes
    // reads the tree (not the matrix) and the trailing #applySyncVisibility regenerates it once,
    // so building the matrix at this point would only be discarded work.
    this.#deriveVisibility();
    this.#reapplyCollapsedNodes(collapsedNodes, shiftColumnIndex);
    this.#applySyncVisibility();
  }

  /**
   * Captures the header level and visual column index of every currently collapsed node, so the
   * collapsed state can be re-applied after a tree rebuild (e.g. after inserting/removing columns).
   *
   * @returns {Array<{headerLevel: number, columnIndex: number}>}
   */
  #snapshotCollapsedNodes(): { headerLevel: number, columnIndex: number }[] {
    const collapsedNodes: { headerLevel: number, columnIndex: number }[] = [];

    this.#headersTree.getRoots().forEach((rootNode) => {
      rootNode.walkDown((node) => {
        const data = node.data;

        if (data.isCollapsed) {
          collapsedNodes.push({ headerLevel: data.headerLevel, columnIndex: data.columnIndex });
        }
      });
    });

    return collapsedNodes;
  }

  /**
   * Re-collapses the nodes captured by #snapshotCollapsedNodes() on the freshly rebuilt tree. The
   * `shiftColumnIndex` callback maps a pre-rebuild visual column index to its post-rebuild position.
   * Re-running the collapse reconstructs both the `isCollapsed` flag (header indicator) and the
   * `clonedTree` needed to expand the group later.
   *
   * @param {Array<{headerLevel: number, columnIndex: number}>} collapsedNodes The captured nodes.
   * @param {Function} shiftColumnIndex Maps an old visual column index to the new one.
   */
  #reapplyCollapsedNodes(
    collapsedNodes: { headerLevel: number, columnIndex: number }[],
    shiftColumnIndex: (columnIndex: number) => number
  ) {
    collapsedNodes.forEach(({ headerLevel, columnIndex }) => {
      this.triggerNodeModification('collapse', headerLevel, shiftColumnIndex(columnIndex));
    });
  }

  /**
   * Maps the current tree nodes with a callback.
   *
   * @param {Function} callback A function that is called for every tree node.
   * @returns {Array}
   */
  mapNodes(callback: Function) {
    return arrayReduce(this.#headersTree.getRoots(), (acc, rootNode) => {
      (rootNode as TreeNode).walkDown((node: TreeNode) => {
        const result: unknown = callback(node.data);

        if (result !== undefined) {
          (acc as unknown[]).push(result);
        }
      });

      return acc;
    }, []);
  }

  /**
   * Triggers an action from the NodeModifiers module.
   *
   * @param {string} action An action name to trigger.
   * @param {number} headerLevel Header level index.
   * @param {number} columnIndex A visual column index.
   * @returns {object|undefined}
   */
  triggerNodeModification(
    action: string, headerLevel: number, columnIndex: number
  ): NodeModificationResult | undefined {
    if (headerLevel < 0) {
      headerLevel = this.rowCoordsToLevel(headerLevel) ?? 0;
    }

    const nodeToProcess = this.#headersTree.getNode(headerLevel, columnIndex);
    let actionResult;

    if (nodeToProcess) {
      actionResult = triggerNodeModification(action, nodeToProcess, columnIndex);

      this.#stateMatrix = generateMatrix(this.#headersTree.getRoots());
    }

    return actionResult ?? undefined;
  }

  /**
   * Triggers an action from the NodeModifiers module starting from the lowest header.
   *
   * @param {string} action An action name to trigger.
   * @param {number} columnIndex A visual column index.
   * @returns {object|undefined}
   */
  triggerColumnModification(
    action: string, columnIndex: number
  ): NodeModificationResult | undefined {
    return this.triggerNodeModification(action, -1, columnIndex);
  }

  /**
   * Derives tree-node visibility state (colspan, crossHiddenColumns, isHidden) from an external
   * ColumnVisibility port, then regenerates the state matrix. Call this whenever the hiding map
   * changes (HiddenColumns, CollapsibleColumns) or after column sequence changes.
   *
   * @param {ColumnVisibility} columnVisibility The visibility port.
   */
  syncVisibility(columnVisibility: ColumnVisibility) {
    this.#lastColumnVisibility = columnVisibility;
    syncVisibilityOnTree(this.#headersTree.getRoots(), columnVisibility);
    this.#stateMatrix = generateMatrix(this.#headersTree.getRoots());
  }

  /**
   * Re-applies the last column visibility adapter after a tree rebuild, so that mapState() and
   * mergeStateWith() calls from CollapsibleColumns do not discard visibility state set earlier.
   * The collapsed state is restored separately by #rebuildPreservingCollapse re-running the collapse.
   */
  #applySyncVisibility() {
    this.#deriveVisibility();
    this.#stateMatrix = generateMatrix(this.#headersTree.getRoots());
  }

  /**
   * Re-derives tree-node visibility (colspan, isHidden, crossHiddenColumns) from the last column
   * visibility adapter WITHOUT regenerating the state matrix. Used as the first pass of
   * #rebuildPreservingCollapse, where the matrix would be immediately discarded by re-collapsing.
   */
  #deriveVisibility() {
    if (this.#lastColumnVisibility) {
      syncVisibilityOnTree(this.#headersTree.getRoots(), this.#lastColumnVisibility);
    }
  }

  /**
   * Derives the visual-order settings from the authored source settings, then builds the headers
   * tree from them. The headers tree is therefore always a function of the authored configuration
   * and the current column arrangement. With the identity arrangement the derived settings equal the
   * authored ones, so the built tree is identical to building directly from the authored settings; a
   * non-identity arrangement (a column move) makes the structure follow the data.
   */
  #deriveTree() {
    const arrangement = this.#columnArrangement ?? createIdentityColumnArrangement();

    this.#derivedSettings.setNormalizedData(deriveVisualSettings(this.#sourceSettings.getData(), arrangement));
    this.#headersTree.buildTree();
  }

  /**
   * @memberof StateManager#
   * @function rowCoordsToLevel
   *
   * Translates row coordinates into header level.
   *
   * @param {number} rowIndex A visual row index.
   * @returns {number|null} Returns unsigned number.
   */
  rowCoordsToLevel(rowIndex: number): number | null {
    if (rowIndex >= 0) {
      return null;
    }

    const headerLevel = rowIndex + Math.max(this.getLayersCount(), 1);

    if (headerLevel < 0) {
      return null;
    }

    return headerLevel;
  }

  /**
   * @memberof StateManager#
   * @function levelToRowCoords
   *
   * Translates header level into row coordinates.
   *
   * @param {number} headerLevel Header level index.
   * @returns {number} Returns negative number.
   */
  levelToRowCoords(headerLevel: number): number | null {
    if (headerLevel < 0) {
      return null;
    }

    const rowIndex = headerLevel - Math.max(this.getLayersCount(), 1);

    if (rowIndex >= 0) {
      return null;
    }

    return rowIndex;
  }

  /**
   * Gets column header settings for a specified column and header index.
   *
   * @param {number} headerLevel Header level.
   * @param {number} columnIndex A visual column index.
   * @returns {object|null}
   */
  getHeaderSettings(headerLevel: number, columnIndex: number) {
    if (headerLevel < 0) {
      headerLevel = this.rowCoordsToLevel(headerLevel) ?? 0;
    }

    if (headerLevel === null || headerLevel >= this.getLayersCount()) {
      return null;
    }

    return ((this.#stateMatrix[headerLevel] as unknown[])?.[columnIndex] ?? null) as HeaderNodeData | null;
  }

  /**
   * Gets tree data that is connected to the column header.
   *
   * @param {number} headerLevel Header level.
   * @param {number} columnIndex A visual column index.
   * @returns {object|null}
   */
  getHeaderTreeNodeData(headerLevel: number, columnIndex: number) {
    const node = this.getHeaderTreeNode(headerLevel, columnIndex);

    if (!node) {
      return null;
    }

    return {
      ...(node.data as HeaderNodeData),
    };
  }

  /**
   * Gets tree node that is connected to the column header.
   *
   * @param {number} headerLevel Header level.
   * @param {number} columnIndex A visual column index.
   * @returns {TreeNode|null}
   */
  getHeaderTreeNode(headerLevel: number, columnIndex: number): TreeNode | null {
    let resolvedLevel: number | null = headerLevel;

    if (headerLevel < 0) {
      resolvedLevel = this.rowCoordsToLevel(headerLevel);
    }

    if (resolvedLevel === null || resolvedLevel >= this.getLayersCount()) {
      return null;
    }

    const node = this.#headersTree.getNode(resolvedLevel, columnIndex);

    if (!node) {
      return null;
    }

    return node;
  }

  /**
   * Finds the most top header level of the column header.
   *
   * @param {number} columnIndexFrom A visual column index.
   * @param {number} [columnIndexTo] A visual column index.
   * @returns {number} Returns a header level in format -1 to -N.
   */
  findTopMostEntireHeaderLevel(columnIndexFrom: number, columnIndexTo = columnIndexFrom) {
    const columnsWidth = (columnIndexTo - columnIndexFrom) + 1;
    let atLeastOneRootFound = false;
    let headerLevel: number | null = null;

    for (let columnIndex = columnIndexFrom; columnIndex <= columnIndexTo; columnIndex++) {
      const rootNode = this.#headersTree.getRootByColumn(columnIndex);

      if (!rootNode) {
        break;
      }

      atLeastOneRootFound = true;

      // eslint-disable-next-line no-loop-func
      rootNode.walkDown((node: TreeNode) => {
        const {
          columnIndex: nodeColumnIndex,
          headerLevel: nodeHeaderLevel,
          origColspan,
          isHidden,
        } = node.data as HeaderNodeData;

        if (isHidden) {
          return;
        }

        if (origColspan <= columnsWidth &&
            nodeColumnIndex >= columnIndexFrom &&
            nodeColumnIndex + origColspan - 1 <= columnIndexTo &&
            (headerLevel === null || nodeHeaderLevel < headerLevel)) {

          headerLevel = nodeHeaderLevel;
        }
      }, TRAVERSAL_DF_PRE);
    }

    if (atLeastOneRootFound && headerLevel === null) {
      return -1;
    }

    return this.levelToRowCoords(headerLevel ?? 0);
  }

  /**
   * Finds the left-most column index where the nested header begins.
   *
   * @param {number} headerLevel Header level.
   * @param {number} columnIndex A visual column index.
   * @returns {number}
   */
  findLeftMostColumnIndex(headerLevel: number, columnIndex: number) {
    const {
      isRoot
    } = (this.getHeaderSettings(headerLevel, columnIndex) as HeaderNodeData | null) ?? { isRoot: true };

    if (isRoot) {
      return columnIndex;
    }

    let stepBackColumn = columnIndex - 1;

    while (stepBackColumn >= 0) {
      const {
        isRoot: isRootNode
      } = (this.getHeaderSettings(headerLevel, stepBackColumn) as HeaderNodeData | null) ?? { isRoot: true };

      if (isRootNode) {
        break;
      }

      stepBackColumn -= 1;
    }

    return stepBackColumn;
  }

  /**
   * Finds the right-most column index where the nested header ends.
   *
   * @param {number} headerLevel Header level.
   * @param {number} columnIndex A visual column index.
   * @returns {number}
   */
  findRightMostColumnIndex(headerLevel: number, columnIndex: number) {
    const {
      isRoot,
      origColspan,
    } = (this.getHeaderSettings(headerLevel, columnIndex) as HeaderNodeData | null) ?? { isRoot: true, origColspan: 1 };

    if (isRoot) {
      return columnIndex + origColspan - 1;
    }

    let stepForthColumn = columnIndex + 1;

    while (stepForthColumn < this.getColumnsCount()) {
      const {
        isRoot: isRootNode,
      } = (this.getHeaderSettings(headerLevel, stepForthColumn) as HeaderNodeData | null) ?? { isRoot: true };

      if (isRootNode) {
        break;
      }

      stepForthColumn += 1;
    }

    return stepForthColumn - 1;
  }

  /**
   * Gets a total number of headers levels.
   *
   * @returns {number}
   */
  getLayersCount() {
    return this.#sourceSettings.getLayersCount();
  }

  /**
   * Gets the number of columns the rendered header structure spans (the visual width). This reads
   * the derived settings, so it matches the generated matrix and the current column arrangement.
   * With an identity arrangement it equals the authored column count.
   *
   * @returns {number}
   */
  getColumnsCount() {
    return this.#derivedSettings.getColumnsCount();
  }

  /**
   * Computes the visual column indexes that should be hidden purely by the `visibleWhen` rules of
   * declarative collapsible groups (issue #10243), given each group's current `isCollapsed` state.
   *
   * A group is "declarative" when at least one of its direct children declares an explicit
   * `visibleWhen` ('collapsed', 'expanded', or 'always'); legacy groups (no markers) are left to the
   * regular first-visible-child collapse path and are skipped here. Within a declarative group a child
   * with no marker defaults to `'expanded'` - it is hidden when the group collapses, matching the
   * default collapse behavior; `'always'` is the explicit opt-in for staying visible in both states.
   * Only `collapsible` groups are considered. At least one column per group always stays visible so the
   * group's collapse indicator survives. The result is a pure function of the tree shape, the markers,
   * and the `isCollapsed` flags, so it stays correct across tree rebuilds.
   *
   * @returns {number[]} Visual column indexes to hide.
   */
  getVisibleWhenHiddenColumns(): number[] {
    const columnsToHide: number[] = [];

    this.#headersTree.getRoots().forEach((rootNode) => {
      rootNode.walkDown((node) => {
        const childNodes = node.childs;

        if (node.data.collapsible !== true || childNodes.length === 0) {
          return;
        }

        // Only declarative groups (at least one explicit `visibleWhen` marker) are handled here;
        // legacy groups keep the first-visible-child collapse path. The predicate lives in one place
        // so this computation and the collapse/expand modifiers agree on what "declarative" means.
        if (!isDeclarativeGroup(node)) {
          return;
        }

        const isGroupCollapsed = node.data.isCollapsed === true;
        const childrenToHide = childNodes.filter((childNode) => {
          // An unset child defaults to 'expanded' (hidden on collapse).
          const visibility = childNode.data.visibleWhen ?? 'expanded';

          return (visibility === 'expanded' && isGroupCollapsed) ||
            (visibility === 'collapsed' && !isGroupCollapsed);
        });

        // Never hide every column of the group through `visibleWhen` - the collapse indicator renders
        // on the group's first visible column, so keep the first child visible when a (mis)configuration
        // would otherwise blank the whole group and leave no way to expand it back. Known limitation:
        // if that kept column is independently hidden by another source (HiddenColumns or trimming) the
        // indicator can still be lost. Reading the external hidden state here is avoided on purpose -
        // this set feeds the hiding map that syncVisibility consumes, so a node's `isHidden` flag
        // already carries this set's own previous effect and cannot be trusted as an external-only signal.
        if (childrenToHide.length === childNodes.length) {
          childrenToHide.shift();
        }

        childrenToHide.forEach(({ data: { columnIndex, origColspan } }) => {
          for (let i = 0; i < origColspan; i++) {
            columnsToHide.push(columnIndex + i);
          }
        });
      });
    });

    return columnsToHide;
  }

  /**
   * Gets every currently collapsed group as its header level and the visual column span it covers
   * (its left-edge visual column index and original colspan). Used to detect, before a column move,
   * whether the move would split a collapsed group.
   *
   * @returns {Array<{headerLevel: number, columnIndex: number, origColspan: number}>}
   */
  getCollapsedGroups(): { headerLevel: number, columnIndex: number, origColspan: number }[] {
    const groups: { headerLevel: number, columnIndex: number, origColspan: number }[] = [];

    this.#headersTree.getRoots().forEach((rootNode) => {
      rootNode.walkDown((node) => {
        const { isCollapsed, headerLevel, columnIndex, origColspan } = node.data;

        if (isCollapsed) {
          groups.push({ headerLevel, columnIndex, origColspan });
        }
      });
    });

    return groups;
  }

  /**
   * Clears the column state manager to the initial state.
   */
  clear() {
    this.#stateMatrix = [];
    this.#sourceSettings.clear();
    this.#derivedSettings.clear();
    this.#headersTree.clear();
    this.#lastColumnVisibility = null;
  }
}
