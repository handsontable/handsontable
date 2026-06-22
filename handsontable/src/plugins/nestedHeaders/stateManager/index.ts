import { arrayMap } from '../../../helpers/array';
import SourceSettings from './sourceSettings';
import type { SourceHeaderCell } from './sourceSettings';
import type { HeaderNodeData } from './headersTree';
import HeadersTree from './headersTree';
import { triggerNodeModification } from './nodeModifiers';
import type { NodeModificationResult } from './nodeModifiers';
import { isDeclarativeGroup } from './nodeModifiers/utils/tree';
import { generateMatrix } from './matrixGenerator';
import { syncVisibilityOnTree } from './syncVisibility';
import { deriveVisualSettings, computeOwnerIndex } from './deriveSettings';
import type { MembershipOverrides } from './deriveSettings';
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
   * Per-column membership overrides set by column moves (`physical -> level -> owner identity`). They
   * re-parent a moved column into the cohesive (`splittable: false`) group it was dropped inside, or
   * mark it standalone when it left its group - the piece a pure derive cannot infer from the final
   * arrangement alone. Consumed by `#deriveTree`. Empty means "use the authored structure".
   */
  #membershipOverrides: MembershipOverrides = new Map();

  /**
   * Sets a new state for the nested headers plugin based on settings passed
   * directly to the plugin.
   *
   * @param {Array[]} nestedHeadersSettings The user-defined settings.
   * @returns {boolean} Returns `true` if the settings are processed correctly, `false` otherwise.
   */
  setState(nestedHeadersSettings: unknown[][]) {
    this.#sourceSettings.setData(nestedHeadersSettings);
    // A fresh authored configuration invalidates move-driven membership overrides (their owner
    // identities index the previous structure), so reset them.
    this.#membershipOverrides = new Map();
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
   * Inserts `amount` columns into the source settings, then rebuilds the tree and re-derives
   * visibility. Headers spanning the insertion point are extended; columns inserted at a header
   * boundary become standalone headers.
   *
   * The authored source settings are keyed by physical column, while the collapsed state is keyed by
   * visual column - so the insertion takes both indexes. They are equal when no column move is active;
   * after a move they differ, and using each in its own space keeps headers and collapse aligned.
   *
   * @param {number} visualColumnIndex The visual index the columns were inserted at (collapse space).
   * @param {number} physicalColumnIndex The physical index the columns were inserted at (source space).
   * @param {number} amount The number of columns to insert.
   */
  insertColumns(visualColumnIndex: number, physicalColumnIndex: number, amount: number) {
    this.#rebuildPreservingCollapse(
      () => this.#sourceSettings.insertColumns(physicalColumnIndex, amount),
      c => (c >= visualColumnIndex ? c + amount : c)
    );
  }

  /**
   * Removes the given columns from the source settings, then rebuilds the tree and re-derives
   * visibility. Headers overlapping the removed columns are shrunk, re-anchored, or dropped when they
   * lose all their columns.
   *
   * The removed columns are identified by physical index (authored source settings are physical-keyed)
   * and may be non-contiguous after a column move; they are removed highest-index-first so the lower
   * indexes stay valid. The collapsed state is shifted in visual space, which an insert/remove always
   * changes the same way regardless of any active move.
   *
   * @param {number} visualColumnIndex The visual index the columns were removed from (collapse space).
   * @param {number} amount The number of columns removed (length of `physicalColumns`).
   * @param {number[]} physicalColumns The physical indexes of the removed columns (source space).
   */
  removeColumns(visualColumnIndex: number, amount: number, physicalColumns: number[]) {
    const endIndex = visualColumnIndex + amount;

    this.#rebuildPreservingCollapse(
      () => {
        [...physicalColumns]
          .sort((a, b) => b - a)
          .forEach(physicalColumn => this.#sourceSettings.removeColumns(physicalColumn, 1));
      },
      (c) => {
        if (c < visualColumnIndex) {
          return c;
        }

        // The anchor column was removed but the group may survive - re-anchor to the range start.
        return c >= endIndex ? c - amount : visualColumnIndex;
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
    const results: unknown[] = [];

    // getRoots() returns TreeNode<HeaderNodeData>, so node.data is already HeaderNodeData here - the
    // previous `as TreeNode`/`as unknown[]` casts only threw that type away. Walk and collect directly.
    this.#headersTree.getRoots().forEach((rootNode) => {
      rootNode.walkDown((node) => {
        const result: unknown = callback(node.data);

        if (result !== undefined) {
          results.push(result);
        }
      });
    });

    return results;
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

    this.#derivedSettings.setNormalizedData(
      deriveVisualSettings(this.#sourceSettings.getData(), arrangement, this.#membershipOverrides)
    );
    this.#headersTree.buildTree();
  }

  /**
   * Re-parents the moved columns after a column move, recording membership overrides the derive uses
   * to keep `splittable: false` groups cohesive. For each moved column, at each group level: if it
   * stays adjacent to a sibling of its current group it keeps that group; otherwise, if it was dropped
   * strictly between two members of one cohesive group it joins that group; otherwise it goes
   * standalone. The decisions are taken from the pre-update layout, then applied, so a whole group
   * moved together (each member adjacent to a sibling) stays intact. Call before `rebuildState()`.
   *
   * @param {number[]} movedVisualColumns - The post-move visual indexes of the columns that moved.
   */
  reparentColumns(movedVisualColumns: number[]) {
    const arrangement = this.#columnArrangement ?? createIdentityColumnArrangement();
    const authoredLayers = this.#sourceSettings.getData();
    const layersCount = authoredLayers.length;
    const columnsCount = layersCount > 0 ? authoredLayers[0].length : 0;

    if (layersCount <= 1 || columnsCount === 0) {
      return; // a single header level is all leaves - nothing to re-parent
    }

    const ownerIndexByLevel = authoredLayers.map(layer => computeOwnerIndex(layer));
    const effectiveOwnerAt = (visualColumn: number, level: number): number => {
      const physical = arrangement.getPhysicalFromVisual(visualColumn);
      const override = this.#membershipOverrides.get(physical)?.get(level);

      if (override !== undefined) {
        return override >= 0 ? override : -1 - physical;
      }

      const owner = ownerIndexByLevel[level][physical];

      return owner === undefined ? -1 - physical : owner;
    };

    const authoredOwnerAt = (visualColumn: number, level: number): number => {
      const physical = arrangement.getPhysicalFromVisual(visualColumn);
      const owner = ownerIndexByLevel[level][physical];

      return owner === undefined ? -1 - physical : owner;
    };

    // Decide from the current layout first, then apply, so moved siblings see each other's old owner.
    const decisions: { physical: number, level: number, identity: number | null }[] = [];

    movedVisualColumns.forEach((visualColumn) => {
      const physical = arrangement.getPhysicalFromVisual(visualColumn);
      // The effective owner this column resolved to at the enclosing (outer) level. Threaded inward so
      // an inner adoption is constrained to refine the outer owner - an inner group may only be joined
      // when its authored parent matches where the column landed outside, never crossing a boundary.
      let resolvedOuterOwner: number | null = null;

      for (let level = 0; level < layersCount - 1; level++) {
        const identity = this.#resolveMovedMembership(
          visualColumn, level, columnsCount, authoredLayers,
          effectiveOwnerAt, authoredOwnerAt, ownerIndexByLevel, resolvedOuterOwner
        );

        decisions.push({ physical, level, identity });
        // The effective owner at this level becomes the outer constraint for the next inner level.
        resolvedOuterOwner = identity ?? authoredOwnerAt(visualColumn, level);
      }
    });

    decisions.forEach(({ physical, level, identity }) => {
      this.#setMembershipOverride(physical, level, identity);
    });
  }

  /**
   * Records or clears one membership override.
   *
   * @param {number} physical - The physical column index.
   * @param {number} level - The header level.
   * @param {number|null} identity - The owner identity to record (`>= 0` group, `< 0` standalone), or
   *   `null` to clear it (fall back to the authored structure).
   */
  #setMembershipOverride(physical: number, level: number, identity: number | null) {
    if (identity === null) {
      const levels = this.#membershipOverrides.get(physical);

      levels?.delete(level);

      if (levels?.size === 0) {
        this.#membershipOverrides.delete(physical);
      }

      return;
    }

    if (!this.#membershipOverrides.has(physical)) {
      this.#membershipOverrides.set(physical, new Map());
    }

    this.#membershipOverrides.get(physical)!.set(level, identity);
  }

  /**
   * Resolves the owner identity a moved column takes at one group level (see `reparentColumns`).
   * Returns `null` (clear) for anything that matches the authored structure, so a `splittable: true`
   * group still splits and an intact group is left untouched - only genuine re-parents are recorded.
   *
   * @param {number} visualColumn - The column's post-move visual index.
   * @param {number} level - The header level being resolved.
   * @param {number} columnsCount - The number of columns the structure spans.
   * @param {SourceHeaderCell[][]} authoredLayers - The authored header layers.
   * @param {Function} effectiveOwnerAt - Resolves the current effective owner of a (visual, level).
   * @param {Function} authoredOwnerAt - Resolves the authored owner of a (visual, level).
   * @param {number[][]} ownerIndexByLevel - The authored owner column index per (level, column).
   * @param {number|null} resolvedOuterOwner - The effective owner this column took at the enclosing
   *   (outer) level, or `null` at the outermost level. Constrains the adoption so an inner run never
   *   crosses an outer group boundary.
   * @returns {number|null} The owner identity to record, or `null` to clear.
   */
  #resolveMovedMembership(
    visualColumn: number,
    level: number,
    columnsCount: number,
    authoredLayers: SourceHeaderCell[][],
    effectiveOwnerAt: (visualColumn: number, level: number) => number,
    authoredOwnerAt: (visualColumn: number, level: number) => number,
    ownerIndexByLevel: number[][],
    resolvedOuterOwner: number | null
  ): number | null {
    const isCohesive = (owner: number): boolean =>
      owner >= 0 && authoredLayers[level][owner]?.splittable !== true;
    const hasLeft = visualColumn > 0;
    const hasRight = visualColumn < columnsCount - 1;
    const authoredOwner = authoredOwnerAt(visualColumn, level);
    const ownEffective = effectiveOwnerAt(visualColumn, level);
    const leftEffective = hasLeft ? effectiveOwnerAt(visualColumn - 1, level) : -Infinity;
    const rightEffective = hasRight ? effectiveOwnerAt(visualColumn + 1, level) : -Infinity;
    const leftAuthored = hasLeft ? authoredOwnerAt(visualColumn - 1, level) : -Infinity;
    const rightAuthored = hasRight ? authoredOwnerAt(visualColumn + 1, level) : -Infinity;
    let target: number;

    if (leftEffective === rightEffective && isCohesive(leftEffective)) {
      // Dropped strictly inside a cohesive group - adopt it, but only when that group nests under the
      // outer owner this column already took; otherwise the inner run would straddle an outer boundary
      // (e.g. a cohesive inner group whose outer parent is splittable and did not adopt), so stand alone.
      const nestsUnderOuter = level === 0 || ownerIndexByLevel[level - 1][leftEffective] === resolvedOuterOwner;

      target = nestsUnderOuter ? leftEffective : -1;
    } else if (isCohesive(authoredOwner) && (leftAuthored === authoredOwner || rightAuthored === authoredOwner)) {
      // Back beside its authored cohesive group (e.g. an undone move, or a whole group moved together)
      // - revert to the authored structure.
      target = authoredOwner;
    } else if (isCohesive(ownEffective)) {
      target = -1; // left a cohesive group with nowhere cohesive to land -> standalone
    } else {
      target = authoredOwner; // splittable:true / standalone -> authored derive (splits / unchanged)
    }

    return target === authoredOwner ? null : target;
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
    this.#membershipOverrides = new Map();
  }
}
