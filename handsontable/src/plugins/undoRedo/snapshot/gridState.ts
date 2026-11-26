import type { HotInstance } from '../../../core/types';
import type { BasePlugin, PluginRestoreContext } from '../../base';
import { getPluginsNames } from '../../registry';
import {
  IndexMapperStateTracker,
  type IndexMapperSnapshot,
} from '../../../translations/indexMapperSnapshot';

/**
 * The table settings an action can change without going through a plugin: `alter()` shifts the
 * frozen row and column counts and splices an array `colHeaders`, and ManualColumnFreeze changes
 * the frozen column count.
 */
export interface GridSettingsSnapshot {
  readonly fixedRowsTop: number;
  readonly fixedRowsBottom: number;
  readonly fixedColumnsStart: number;
  readonly fixedColumnsEnd: number;
  readonly colHeaders: readonly string[] | null;
}

/**
 * Everything UndoRedo puts back when it restores a step, apart from the data and the cell meta,
 * which travel as a journal. Every part is shared by reference with the snapshot before it when it
 * did not change, so a chain of snapshots costs memory only for what actually changed.
 */
export interface GridStateSnapshot {
  readonly rows: IndexMapperSnapshot;
  readonly columns: IndexMapperSnapshot;
  readonly settings: GridSettingsSnapshot;
  /**
   * The state each enabled plugin returned from `captureState()`, by plugin name.
   */
  readonly plugins: ReadonlyMap<string, unknown>;
  /**
   * The source shape each enabled plugin returned from `captureSourceStructure()`, by plugin name.
   */
  readonly sourceStructures: ReadonlyMap<string, unknown>;
}

/**
 * Tells whether two settings snapshots describe the same settings.
 *
 * @param {GridSettingsSnapshot} left One snapshot.
 * @param {GridSettingsSnapshot} right The other snapshot.
 * @returns {boolean}
 */
function areSettingsEqual(left: GridSettingsSnapshot, right: GridSettingsSnapshot): boolean {
  return left.fixedRowsTop === right.fixedRowsTop &&
    left.fixedRowsBottom === right.fixedRowsBottom &&
    left.fixedColumnsStart === right.fixedColumnsStart &&
    left.fixedColumnsEnd === right.fixedColumnsEnd &&
    areHeadersEqual(left.colHeaders, right.colHeaders);
}

/**
 * Tells whether two captured `colHeaders` arrays hold the same headers.
 *
 * @param {Array|null} left One capture.
 * @param {Array|null} right The other capture.
 * @returns {boolean}
 */
function areHeadersEqual(left: readonly string[] | null, right: readonly string[] | null): boolean {
  if (left === null || right === null) {
    return left === right;
  }

  return left.length === right.length && left.every((header, index) => header === right[index]);
}

/**
 * Builds the settings an undo step leaves behind: each setting the step changed takes the target
 * value, and every other one keeps the value it had before the restore – a row replay moves the
 * frozen counts, and a change made outside any step since must survive.
 *
 * @param {GridSettingsSnapshot} target The settings on the side of the step being restored.
 * @param {GridSettingsSnapshot} other The settings on the other side of the step.
 * @param {GridSettingsSnapshot} base The settings before the restore started.
 * @returns {GridSettingsSnapshot}
 */
function mergeChangedSettings(
  target: GridSettingsSnapshot, other: GridSettingsSnapshot, base: GridSettingsSnapshot,
): GridSettingsSnapshot {
  return {
    fixedRowsTop: target.fixedRowsTop === other.fixedRowsTop ? base.fixedRowsTop : target.fixedRowsTop,
    fixedRowsBottom: target.fixedRowsBottom === other.fixedRowsBottom ? base.fixedRowsBottom : target.fixedRowsBottom,
    fixedColumnsStart: target.fixedColumnsStart === other.fixedColumnsStart ?
      base.fixedColumnsStart : target.fixedColumnsStart,
    fixedColumnsEnd: target.fixedColumnsEnd === other.fixedColumnsEnd ? base.fixedColumnsEnd : target.fixedColumnsEnd,
    colHeaders: areHeadersEqual(target.colHeaders, other.colHeaders) ? base.colHeaders : target.colHeaders,
  };
}

/**
 * Tells whether two maps hold the same values under the same keys.
 *
 * @param {Map} left One map.
 * @param {Map} right The other map.
 * @returns {boolean}
 */
function areMapsEqual(left: ReadonlyMap<string, unknown>, right: ReadonlyMap<string, unknown>): boolean {
  if (left.size !== right.size) {
    return false;
  }

  for (const [key, value] of left) {
    if (!right.has(key) || right.get(key) !== value) {
      return false;
    }
  }

  return true;
}

/**
 * The method a plugin implements to take part in a snapshot.
 */
type CaptureMethodName = 'captureState' | 'captureSourceStructure';

/**
 * The grid plugins that implement one capture method, by registered name, in the plugin priority order.
 */
type CapturingPlugins = ReadonlyArray<readonly [string, BasePlugin]>;

/**
 * Captures and restores the grid state UndoRedo snapshots. See `GridStateSnapshot`.
 */
export class GridStateTracker {
  /**
   * The Handsontable instance.
   */
  #hot: HotInstance;
  /**
   * Tracks the row index maps.
   */
  #rows: IndexMapperStateTracker;
  /**
   * Tracks the column index maps.
   */
  #columns: IndexMapperStateTracker;
  /**
   * The previous capture.
   */
  #last: GridStateSnapshot | null = null;
  /**
   * The grid plugins that implement each capture method, resolved on the first capture. A grid creates
   * all its plugins in its constructor (a plugin registered later never gets an instance on it), so the
   * list never changes. A capture runs twice per recorded action, and walking every registered plugin
   * there dominated a loop of cheap actions.
   */
  #capturingPlugins: Map<CaptureMethodName, CapturingPlugins> | null = null;

  /**
   * Starts tracking the grid.
   *
   * @param {HotInstance} hot The Handsontable instance.
   */
  constructor(hot: HotInstance) {
    this.#hot = hot;
    this.#rows = new IndexMapperStateTracker(hot.rowIndexMapper);
    this.#columns = new IndexMapperStateTracker(hot.columnIndexMapper);
  }

  /**
   * Captures the grid state. When nothing changed since the previous capture, the previous snapshot
   * itself is returned.
   *
   * @returns {GridStateSnapshot}
   */
  capture(): GridStateSnapshot {
    const previous = this.#last;
    const rows = this.#rows.capture();
    const columns = this.#columns.capture();
    const settings = this.#captureSettings(previous?.settings);
    const plugins = this.#capturePlugins('captureState', previous?.plugins);
    const sourceStructures = this.#capturePlugins('captureSourceStructure', previous?.sourceStructures);

    if (
      previous !== null &&
      previous.rows === rows &&
      previous.columns === columns &&
      previous.settings === settings &&
      previous.plugins === plugins &&
      previous.sourceStructures === sourceStructures
    ) {
      return previous;
    }

    this.#last = { rows, columns, settings, plugins, sourceStructures };

    return this.#last;
  }

  /**
   * Tells whether every plugin that recorded a source shape in the snapshot can put it back. A shape
   * that cannot be restored leaves the recorded rows without the data they address.
   *
   * @param {GridStateSnapshot} snapshot The snapshot to restore.
   * @returns {boolean}
   */
  canRestoreSourceStructures(snapshot: GridStateSnapshot): boolean {
    return Array.from(snapshot.sourceStructures.keys()).every((pluginName) => {
      const plugin: BasePlugin | undefined = this.#hot.getPlugin(pluginName);

      return plugin?.enabled === true && typeof plugin.restoreSourceStructure === 'function';
    });
  }

  /**
   * Puts back the source shape of every plugin that recorded one. Runs before any recorded data
   * change is replayed. With `changedFrom` (see `restore()`), a shape the step did not change is kept.
   *
   * @param {GridStateSnapshot} snapshot The snapshot to restore.
   * @param {GridStateSnapshot} [changedFrom] The snapshot from the other side of the step.
   */
  restoreSourceStructures(snapshot: GridStateSnapshot, changedFrom?: GridStateSnapshot) {
    this.#forEachEnabledPlugin('captureSourceStructure', snapshot.sourceStructures, (plugin, state, name) => {
      if (typeof plugin.restoreSourceStructure === 'function' && changedFrom?.sourceStructures.get(name) !== state) {
        plugin.restoreSourceStructure(state);
      }
    });
  }

  /**
   * Puts the index maps, the plugin states and the settings back, in that order: a plugin's restore
   * reads the visual index space, which the maps define.
   *
   * Given `changedFrom` – the snapshot from the other side of an undo step – only the parts the step
   * changed are written back (the two snapshots share every part the step left alone), so a change
   * made outside any step since, such as a trim a settings update applied, survives the undo. A step
   * that inserts or removes rows or columns changes the length of every index map, so the two
   * snapshots share no map; `restoreStep()` puts back the trims and hides such a step left alone
   * after this call. Without `changedFrom`, everything the snapshot records is written back.
   *
   * @param {GridStateSnapshot} snapshot The snapshot to restore.
   * @param {object} [options] Restore options.
   * @param {GridStateSnapshot} [options.changedFrom] The snapshot from the other side of the step.
   * @param {GridStateSnapshot} [options.base] The state before the restore started. The settings the
   *   step did not change are put back to it, and so are, with `forceOrder`, the plugin states the
   *   step did not change – a journal replay can move both. Without it, they are left as they are.
   * @param {boolean} [options.forceOrder=false] Write the row and column order and the trimming maps back
   *   even when the step did not change them – a replay reset them to the physical order.
   * @param {string} [options.direction] `'undo'` or `'redo'`, handed to the plugins with `changedFrom`.
   * @param {Function} [options.toRestoredIndex] Maps a physical index of `changedFrom` to the restored grid,
   *   handed to the plugins with `changedFrom` when `forceOrder` is set.
   */
  restore(
    snapshot: GridStateSnapshot,
    { changedFrom, base, forceOrder = false, direction, toRestoredIndex }: {
      changedFrom?: GridStateSnapshot, base?: GridStateSnapshot, forceOrder?: boolean, direction?: 'undo' | 'redo',
      toRestoredIndex?: PluginRestoreContext['toRestoredIndex'],
    } = {},
  ) {
    // Each axis takes the length the data implies, the one `updateData()` fits it to. With no source
    // rows the data implies no column count (plain arrays count the columns in the first row), while
    // the grid keeps its columns – the replay left them where the step recorded them.
    const rowCount = this.#hot.countSourceRows();

    const restoreRows = () => this.#rows.restore(snapshot.rows, {
      changedFrom: changedFrom?.rows, forceOrder, length: rowCount,
    });
    const followers = changedFrom !== undefined && !forceOrder ?
      this.#readShownRowsFollowers(snapshot, changedFrom) : [];

    // The row maps update their cache here, before any plugin state is restored, so this is the one
    // place the selection can be told to move with its rows. The plugin states that only change which
    // rows are shown are put back first (again below, which changes nothing), so a selection listener
    // the follow runs reads the restored state, as it does after the action itself.
    if (followers.length > 0) {
      followers.forEach(({ plugin, state, name }) => {
        plugin.restoreState?.(state, {
          other: changedFrom!.plugins.get(name),
          direction,
          reordered: forceOrder,
          toRestoredIndex,
        });
      });
      this.#hot.selection.followRecordsWhile('row', restoreRows);
    } else {
      restoreRows();
    }

    this.#columns.restore(snapshot.columns, {
      changedFrom: changedFrom?.columns,
      forceOrder,
      length: rowCount === 0 ? this.#hot.columnIndexMapper.getNumberOfIndexes() : this.#hot.getInitialColumnCount(),
    });

    this.#forEachEnabledPlugin('captureState', snapshot.plugins, (plugin, state, name) => {
      if (typeof plugin.restoreState !== 'function') {
        return;
      }

      if (changedFrom?.plugins.get(name) !== state) {
        plugin.restoreState(state, changedFrom === undefined ? undefined : {
          other: changedFrom.plugins.get(name),
          direction,
          reordered: forceOrder,
          toRestoredIndex,
        });

      } else if (forceOrder && base?.plugins.has(name)) {
        // The step left this state alone, but the row and column replay may have moved it (a merge
        // shifted by a replayed removal), so it goes back to what it was before the restore. Only a
        // state the replay did move: re-applied, an unmoved one loses what no capture holds (Filters
        // would drop a condition added but not applied yet).
        const baseState = base.plugins.get(name);

        if (plugin.captureState?.(baseState) !== baseState) {
          plugin.restoreState(baseState);
        }
      }
    });

    if (changedFrom === undefined) {
      this.#restoreSettings(snapshot.settings);
    } else if (base !== undefined || changedFrom.settings !== snapshot.settings) {
      const baseSettings = base?.settings ?? this.#captureSettings(undefined);

      this.#restoreSettings(mergeChangedSettings(snapshot.settings, changedFrom.settings, baseSettings));
    }

    // The grid holds the snapshot's parts only where they were written back; the next capture
    // re-reads the rest.
    this.#last = null;
  }

  /**
   * Resets the row and column order to the identity and lifts every trim, so a visual index names
   * the physical index of the same number while a journal is replayed. Hiding maps are left alone:
   * they do not move visual indexes. The caller restores the snapshot afterwards.
   */
  resetToPhysicalOrder() {
    [this.#hot.rowIndexMapper, this.#hot.columnIndexMapper].forEach((mapper) => {
      const length = mapper.indexesSequence.getLength();
      const identity = new Array<number>(length);

      for (let index = 0; index < length; index += 1) {
        identity[index] = index;
      }

      mapper.suspendOperations();

      try {
        mapper.setIndexesSequence(identity);
        mapper.trimmingMapsCollection.get().forEach(map => map.setDefaultValues(length));
      } finally {
        mapper.resumeOperations();
      }
    });
  }

  /**
   * Forgets the previous capture, so the next one copies everything again.
   */
  reset() {
    this.#rows.reset();
    this.#columns.reset();
    this.#last = null;
  }

  /**
   * Stops tracking the grid.
   */
  destroy() {
    this.#rows.destroy();
    this.#columns.destroy();
    this.#last = null;
    this.#capturingPlugins = null;
  }

  /**
   * Captures the table settings an action can change, reusing the previous snapshot when equal.
   *
   * @param {GridSettingsSnapshot} [previous] The previous snapshot.
   * @returns {GridSettingsSnapshot}
   */
  #captureSettings(previous: GridSettingsSnapshot | undefined): GridSettingsSnapshot {
    const tableMeta = this.#hot.getSettings();
    const settings: GridSettingsSnapshot = {
      fixedRowsTop: tableMeta.fixedRowsTop ?? 0,
      fixedRowsBottom: tableMeta.fixedRowsBottom ?? 0,
      fixedColumnsStart: tableMeta.fixedColumnsStart ?? 0,
      fixedColumnsEnd: tableMeta.fixedColumnsEnd ?? 0,
      colHeaders: Array.isArray(tableMeta.colHeaders) ? tableMeta.colHeaders.slice() : null,
    };

    return previous !== undefined && areSettingsEqual(previous, settings) ? previous : settings;
  }

  /**
   * Writes the captured settings back into the table meta. The frozen counts are written by
   * reference, the way `alter()` changes them, and an array `colHeaders` is refilled in place, so
   * whoever holds the array keeps seeing the grid's headers.
   *
   * @param {GridSettingsSnapshot} settings The settings to restore.
   */
  #restoreSettings(settings: GridSettingsSnapshot) {
    const tableMeta = this.#hot.getSettings();

    tableMeta.fixedRowsTop = settings.fixedRowsTop;
    tableMeta.fixedRowsBottom = settings.fixedRowsBottom;
    tableMeta.fixedColumnsEnd = settings.fixedColumnsEnd;

    if ((tableMeta.fixedColumnsStart ?? 0) !== settings.fixedColumnsStart) {
      // `fixedColumnsStart` reads back `_fixedColumnsStart`, the internal property `alter()` and
      // ManualColumnFreeze write – it is not part of the settings type.
      Reflect.set(tableMeta, '_fixedColumnsStart', settings.fixedColumnsStart);
    }

    const headers = tableMeta.colHeaders;

    if (settings.colHeaders !== null && Array.isArray(headers)) {
      // Refilled in place (no spread: the header count is the column count).
      headers.length = settings.colHeaders.length;
      settings.colHeaders.forEach((header, index) => {
        headers[index] = header;
      });
    }
  }

  /**
   * Captures one kind of plugin state from every enabled plugin that provides it, reusing the
   * previous map when no plugin's state changed.
   *
   * @param {string} methodName `captureState` or `captureSourceStructure`.
   * @param {Map} [previous] The previous capture of that kind.
   * @returns {Map<string, *>}
   */
  #capturePlugins(
    methodName: CaptureMethodName,
    previous: ReadonlyMap<string, unknown> | undefined,
  ): ReadonlyMap<string, unknown> {
    const states = new Map<string, unknown>();

    this.#getCapturingPlugins(methodName).forEach(([pluginName, plugin]) => {
      const capture = plugin[methodName];

      // Enabled is read on every capture: a plugin can be turned on or off between two actions.
      if (!plugin.enabled || typeof capture !== 'function') {
        return;
      }

      const state: unknown = capture.call(plugin, previous?.get(pluginName));

      if (state !== undefined) {
        states.set(pluginName, state);
      }
    });

    return previous !== undefined && areMapsEqual(previous, states) ? previous : states;
  }

  /**
   * Returns the grid plugins that implement a capture method, in the plugin priority order. The lists
   * are resolved on the first call. A plugin takes part only through the methods its class defines.
   *
   * @param {string} methodName `captureState` or `captureSourceStructure`.
   * @returns {Array}
   */
  #getCapturingPlugins(methodName: CaptureMethodName): CapturingPlugins {
    if (this.#capturingPlugins === null) {
      const byMethod = new Map<CaptureMethodName, Array<readonly [string, BasePlugin]>>([
        ['captureState', []],
        ['captureSourceStructure', []],
      ]);

      getPluginsNames().forEach((pluginName) => {
        const plugin: BasePlugin | undefined = this.#hot.getPlugin(pluginName);

        if (plugin === undefined) {
          return;
        }

        byMethod.forEach((plugins, method) => {
          if (typeof plugin[method] === 'function') {
            plugins.push([pluginName, plugin]);
          }
        });
      });

      this.#capturingPlugins = byMethod;
    }

    return this.#capturingPlugins.get(methodName) ?? [];
  }

  /**
   * Lists the plugins whose state the step changed when the step changed which rows are shown and
   * nothing else on the row axis: every row trimming map it changed is declared by an enabled plugin
   * (`getShownRowsTrimmingMaps()`), and it did not reshape the source. Any other trim the step made
   * (a filter in the same batch) and any reshape (a row move, which renumbers the rows) keep the
   * default repair, so the list is empty then.
   *
   * @param {GridStateSnapshot} snapshot The snapshot to restore.
   * @param {GridStateSnapshot} changedFrom The snapshot from the other side of the step.
   * @returns {Array} The plugins to restore before the row maps, with their states and names.
   */
  #readShownRowsFollowers(
    snapshot: GridStateSnapshot,
    changedFrom: GridStateSnapshot,
  ): Array<{ plugin: BasePlugin, state: unknown, name: string }> {
    const isReshaped = Array.from(snapshot.sourceStructures)
      .some(([name, state]) => changedFrom.sourceStructures.get(name) !== state);

    if (isReshaped) {
      return [];
    }

    const declaredMaps = new Set<string>();
    const followers: Array<{ plugin: BasePlugin, state: unknown, name: string }> = [];

    this.#forEachEnabledPlugin('captureState', snapshot.plugins, (plugin, state, name) => {
      const mapNames = plugin.getShownRowsTrimmingMaps?.() ?? [];

      mapNames.forEach(mapName => declaredMaps.add(mapName));

      if (mapNames.length > 0 && changedFrom.plugins.get(name) !== state) {
        followers.push({ plugin, state, name });
      }
    });

    const changedTrimmingMaps = Array.from(snapshot.rows.trimming.keys())
      .filter(mapName => changedFrom.rows.trimming.get(mapName) !== snapshot.rows.trimming.get(mapName));

    if (changedTrimmingMaps.length === 0 || changedTrimmingMaps.some(mapName => !declaredMaps.has(mapName))) {
      return [];
    }

    return followers;
  }

  /**
   * Calls the callback for every plugin a snapshot recorded a state for that is still enabled. A
   * plugin disabled or unregistered since is skipped – its part of the grid is restored anyway.
   *
   * @param {string} methodName The capture method that recorded the states.
   * @param {Map} states The recorded states, by plugin name.
   * @param {Function} callback Called with the plugin, its state and its name.
   */
  #forEachEnabledPlugin(
    methodName: CaptureMethodName,
    states: ReadonlyMap<string, unknown>,
    callback: (plugin: BasePlugin, state: unknown, pluginName: string) => void,
  ) {
    if (states.size === 0) {
      return;
    }

    this.#getCapturingPlugins(methodName).forEach(([pluginName, plugin]) => {
      if (states.has(pluginName) && plugin.enabled) {
        callback(plugin, states.get(pluginName), pluginName);
      }
    });
  }
}
