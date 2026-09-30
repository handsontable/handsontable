import type { HotInstance } from '../../core/types';
import { arrayEach } from '../../helpers/array';
import { warn } from '../../helpers/console';
import { roundFloat } from './utils';
import type { ColumnSummary } from './columnSummary';

/**
 * `HotInstance` augmented with the internal `_setCellMetaDeclarative` method. The method exists on the
 * Core runtime object but is intentionally NOT part of the public `HotInstance` type, so it is not
 * exposed to third-party code (it is an implementation detail of how built-in plugins apply
 * configuration-derived cell meta that must survive the viewport meta eviction but reset on
 * `updateSettings`, without firing the public `setCellMeta` hooks). ColumnSummary is an internal
 * consumer and reaches it through this local type.
 */
type HotInstanceInternal = HotInstance & {
  _setCellMetaDeclarative(row: number, column: number, key: string, value: unknown): void;
};

export interface EndpointConfig {
  ranges?: number[][];
  reversedRowCoords?: boolean;
  destinationRow?: number;
  destinationColumn?: number;
  sourceColumn?: number;
  type?: string;
  forceNumeric?: boolean;
  suppressDataTypeErrors?: boolean;
  customFunction?: ((endpoint: Record<string, unknown>) => number | string) | null;
  readOnly?: boolean;
  roundFloat?: number | boolean;
  result?: number | string;
  alterRowOffset?: number;
  alterColumnOffset?: number;
  [key: string]: unknown;
}

/**
 * Class used to make all endpoint-related operations.
 *
 * @private
 * @class Endpoints
 */
class Endpoints {
  /**
   * The main plugin instance.
   */
  declare plugin: ColumnSummary;
  /**
   * Handsontable instance. Typed as `HotInstanceInternal` so this internal consumer can call the
   * non-public `_setCellMetaDeclarative` method (see the type's note).
   *
   * @type {object}
   */
  declare hot: HotInstanceInternal;
  /**
   * Array of declared plugin endpoints (calculation destination points).
   *
   * @type {Array}
   * @default {Array} Empty array.
   */
  endpoints: EndpointConfig[] = [];
  /**
   * The plugin settings, taken from Handsontable configuration.
   *
   * @type {object|Function}
   * @default null
   */
  declare settings: EndpointConfig[] | ((...args: unknown[]) => EndpointConfig[]);
  /**
   * Settings type. Can be either 'array' or 'function'.
   *
   * @type {string}
   * @default {'array'}
   */
  settingsType = 'array';
  /**
   * The current endpoint (calculation destination point) in question.
   *
   * @type {object}
   * @default null
   */
  currentEndpoint: EndpointConfig | null = null;
  /**
   * Array containing a list of changes to be applied.
   *
   * @private
   * @type {Array}
   * @default {[]}
   */
  cellsToSetCache: [number, number | undefined, unknown][] = [];
  /**
   * Destination columns keyed by physical destination row, built once per refresh pass, each mapped
   * to whether its endpoint is `readOnly`. Used to keep summary results out of other summaries when
   * their row is trimmed and the `columnSummaryResult` class is unreachable, and to lock the
   * `readOnly` state of a read-only summary cell.
   */
  #summaryDestinations: Map<number, Map<number, boolean>> | null = null;

  /**
   * Initializes the endpoints manager with a reference to the ColumnSummary plugin and the summary endpoint configuration.
   */
  constructor(plugin: ColumnSummary, settings: EndpointConfig[] | ((...args: unknown[]) => EndpointConfig[])) {
    this.plugin = plugin;
    // `_setCellMetaDeclarative` is defined on the Core runtime object but kept off the public
    // `HotInstance` type; this internal plugin reaches it through the `HotInstanceInternal` view.
    this.hot = this.plugin.hot as HotInstanceInternal;
    this.settings = settings;
  }

  /**
   * Initialize the endpoints provided in the settings.
   */
  initEndpoints() {
    this.endpoints = this.parseSettings() as EndpointConfig[];
    this.refreshAllEndpoints();
  }

  /**
   * Get a single endpoint object.
   *
   * @param {number} index Index of the endpoint.
   * @returns {object}
   */
  getEndpoint(index: number): EndpointConfig {
    if (this.settingsType === 'function') {
      return this.fillMissingEndpointData(this.settings as (...args: unknown[]) => EndpointConfig[])[index];
    }

    return this.endpoints[index];
  }

  /**
   * Returns the number of physical rows the dataset holds, ignoring trimming.
   *
   * Endpoint destination rows and calculation ranges are physical indexes, so they must never be
   * compared against `countRows()` - that counts only the *visible* rows and shrinks whenever a
   * plugin trims rows (NestedRows collapsing a group, TrimRows, the Filters plugin).
   *
   * @returns {number}
   */
  countPhysicalRows(): number {
    return this.hot.rowIndexMapper.getNumberOfIndexes();
  }

  /**
   * Returns the number of rows an endpoint may address, that is the physical row count capped by
   * `maxRows`. Used for the settings defaults that need a row count rather than a bounds check.
   *
   * `maxRows` is normalized the same way `DataMap#getLength` does it: `0` or less means zero rows,
   * anything falsy means no cap.
   *
   * @returns {number}
   */
  countAddressableRows(): number {
    const maxRows = this.hot.getSettings().maxRows as number | undefined;
    let cap;

    if ((maxRows ?? 0) < 0 || maxRows === 0) {
      cap = 0;
    } else {
      cap = maxRows || Infinity;
    }

    return Math.min(this.countPhysicalRows(), cap);
  }

  /**
   * Checks whether an endpoint points outside the table.
   *
   * A *trimmed* destination row is not out of bounds - the row exists, it is only hidden - so it is
   * deliberately not reported here. A row that is visible but sits past `maxRows` is out of bounds,
   * because the grid renders no cell for it.
   *
   * @param {object} endpoint Contains the endpoint information.
   * @param {number} [rowOffset=0] Row offset to apply before the check.
   * @param {number} [colOffset=0] Column offset to apply before the check.
   * @returns {boolean}
   */
  isEndpointOutOfBounds(endpoint: EndpointConfig, rowOffset = 0, colOffset = 0): boolean {
    const destinationRow = endpoint.destinationRow! + rowOffset;
    const destinationVisualRow = this.hot.toVisualRow(destinationRow);

    return destinationRow >= this.countPhysicalRows() ||
      endpoint.destinationColumn! + colOffset >= this.hot.countCols() ||
      (destinationVisualRow !== null && destinationVisualRow >= this.hot.countRows());
  }

  /**
   * Get an array with all the endpoints.
   *
   * @returns {Array}
   */
  getAllEndpoints(): EndpointConfig[] {
    if (this.settingsType === 'function') {
      return this.fillMissingEndpointData(this.settings as (...args: unknown[]) => EndpointConfig[]);
    }

    return this.endpoints;
  }

  /**
   * Records the destinations of the endpoints a refresh pass is about to calculate.
   *
   * The resolved endpoints are passed in rather than read through `getAllEndpoints()`, which would
   * re-invoke a settings function and could describe a different layout than the pass is working on.
   *
   * @param {object[]} endpoints The endpoints the current pass will calculate.
   */
  cacheSummaryDestinations(endpoints: EndpointConfig[]) {
    this.#summaryDestinations = new Map();

    arrayEach(endpoints, (endpoint: EndpointConfig) => {
      let columns = this.#summaryDestinations!.get(endpoint.destinationRow!);

      if (columns === undefined) {
        columns = new Map();
        this.#summaryDestinations!.set(endpoint.destinationRow!, columns);
      }

      // Two endpoints sharing one destination is a misconfiguration. The last one wins, as it does
      // when `setEndpointValue` writes the cell's `readOnly`, so the lock always matches the meta.
      columns.set(endpoint.destinationColumn!, Boolean(endpoint.readOnly));
    });
  }

  /**
   * Checks whether a physical cell holds the result of an endpoint.
   *
   * `getCellValue` normally recognizes a result by its `columnSummaryResult` class, but cell meta is
   * addressed by visual coordinates, so a trimmed row has no readable class. Without this check a
   * hidden summary row is summed as if it were plain data and inflates every summary covering it.
   *
   * @param {number} physicalRow Physical row index.
   * @param {number} column Column index.
   * @returns {boolean}
   */
  isSummaryDestination(physicalRow: number, column: number): boolean {
    if (this.#summaryDestinations === null) {
      this.cacheSummaryDestinations(this.getAllEndpoints());
    }

    return this.#summaryDestinations!.get(physicalRow)?.has(column) === true;
  }

  /**
   * Checks whether a physical cell holds the result of an endpoint configured as `readOnly`.
   *
   * The plugin owns the `readOnly` state of such a cell, so it is locked against any other write
   * (see `ColumnSummary#isLockedSummaryCell`). An endpoint configured `readOnly: false` is not
   * reported, which leaves its cell as toggleable as any other.
   *
   * @param {number} physicalRow Physical row index.
   * @param {number} column Column index.
   * @returns {boolean}
   */
  isReadOnlyDestination(physicalRow: number, column: number): boolean {
    if (this.#summaryDestinations === null) {
      this.cacheSummaryDestinations(this.getAllEndpoints());
    }

    return this.#summaryDestinations!.get(physicalRow)?.get(column) === true;
  }

  /**
   * Used to fill the blanks in the endpoint data provided by a settings function.
   *
   * @private
   * @param {Function} func Function provided in the HOT settings.
   * @returns {Array} An array of endpoints.
   */
  fillMissingEndpointData(func: (...args: unknown[]) => EndpointConfig[]): EndpointConfig[] {
    return this.parseSettings(func.call(this)) as EndpointConfig[];
  }

  /**
   * Parse plugin's settings.
   *
   * @param {Array} settings The settings array.
   * @returns {object[]}
   */
  parseSettings(settings?: EndpointConfig[]): EndpointConfig[] | undefined {
    const endpointsArray: EndpointConfig[] = [];
    let settingsArray = settings;

    if (!settingsArray && typeof this.settings === 'function') {
      this.settingsType = 'function';

      return;
    }

    if (!settingsArray) {
      settingsArray = this.settings as EndpointConfig[];
    }

    arrayEach(settingsArray, (val: EndpointConfig) => {
      const newEndpoint: EndpointConfig = {};

      this.assignSetting(val, newEndpoint, 'ranges', [[0, this.countAddressableRows() - 1]]);
      this.assignSetting(val, newEndpoint, 'reversedRowCoords', false);
      this.assignSetting(val, newEndpoint, 'destinationRow', new Error(`
        You must provide a destination row for the Column Summary plugin in order to work properly!
      `));
      this.assignSetting(val, newEndpoint, 'destinationColumn', new Error(`
        You must provide a destination column for the Column Summary plugin in order to work properly!
      `));
      this.assignSetting(val, newEndpoint, 'sourceColumn', val.destinationColumn);
      this.assignSetting(val, newEndpoint, 'type', 'sum');
      this.assignSetting(val, newEndpoint, 'forceNumeric', false);
      this.assignSetting(val, newEndpoint, 'suppressDataTypeErrors', true);
      this.assignSetting(val, newEndpoint, 'customFunction', null);
      this.assignSetting(val, newEndpoint, 'readOnly', true);
      this.assignSetting(val, newEndpoint, 'roundFloat', false);

      endpointsArray.push(newEndpoint);
    });

    return endpointsArray;
  }

  /**
   * Setter for the internal setting objects.
   *
   * @param {object} settings Object with the settings.
   * @param {object} endpoint Contains information about the endpoint for the the calculation.
   * @param {string} name Settings name.
   * @param {object} defaultValue Default value for the settings.
   */
  assignSetting(settings: EndpointConfig, endpoint: EndpointConfig, name: string, defaultValue: unknown) {
    if (name === 'ranges' && settings[name] === undefined) {
      endpoint[name] = defaultValue as number[][];

      return;
    } else if (name === 'ranges' && (settings[name] as number[][]).length === 0) {
      return;
    }

    if (settings[name] === undefined) {
      if (defaultValue instanceof Error) {
        throw defaultValue;

      }

      endpoint[name] = defaultValue;

    } else {
      /* eslint-disable no-lonely-if */
      if (name === 'destinationRow' && endpoint.reversedRowCoords) {
        // Keep the caller's offset-from-the-bottom so the destination can be re-derived after a
        // structure alteration (DEV-144); resolving it here loses it otherwise. This is an INTERNAL
        // field carried on the endpoint object through the interface's index signature - it is not a
        // public option, so it is deliberately not declared on `EndpointConfig` and a caller cannot
        // set it (`parseSettings` never copies it).
        endpoint.reversedRowOffset = settings[name] as number;
        endpoint[name] = this.countAddressableRows() - (settings[name] as number) - 1;

      } else {
        endpoint[name] = settings[name];
      }
    }
  }

  /**
   * Resets the endpoint setup before the structure alteration (like inserting or removing rows/columns). Used for settings provided as a function.
   *
   * @private
   * @param {string} action Type of the action performed.
   * @param {number} index Row/column index.
   * @param {number} number Number of rows/columns added/removed.
   */
  resetSetupBeforeStructureAlteration(action: string, index: number, number: number) {
    if (this.settingsType !== 'function') {
      return;
    }

    const type = action.indexOf('row') > -1 ? 'row' : 'col';
    const endpoints = this.getAllEndpoints();

    arrayEach(endpoints, (val: EndpointConfig) => {
      if (type === 'row' && val.destinationRow! >= index) {
        if (action === 'insert_row') {
          val.alterRowOffset = number;
        } else if (action === 'remove_row') {
          val.alterRowOffset = (-1) * number;
        }
      }

      if (type === 'col' && val.destinationColumn! >= index) {
        if (action === 'insert_col') {
          val.alterColumnOffset = number;
        } else if (action === 'remove_col') {
          val.alterColumnOffset = (-1) * number;
        }
      }
    });

    this.resetAllEndpoints(endpoints, false);
  }

  /**
   * AfterCreateRow/afterCreateCol/afterRemoveRow/afterRemoveCol hook callback. Reset and reenables the summary functionality
   * after changing the table structure.
   *
   * @private
   * @param {string} action Type of the action performed.
   * @param {number} index Visual row/column index the alteration hook reported.
   * @param {number} number Number of rows/columns added/removed.
   * @param {Array} [removedPhysicalIndexes] Physical indexes a removal took out.
   * @param {string} [source] Source of change.
   * @param {boolean} [forceRefresh] `true` of the endpoints should refresh after completing the function.
   */
  resetSetupAfterStructureAlteration(
    action: string, index: number, number: number,
    removedPhysicalIndexes: number[] | null | undefined, source: string, forceRefresh = true
  ) {
    // Automatic row/column creation (`minSpareRows`/`minSpareCols`) should not trigger the endpoint recalculation.
    // An automatic removal still does: a lowered minimum size gives its rows back that way, and the endpoints
    // must follow it like any other removal.
    if (source === 'auto' && action.indexOf('insert') === 0) {
      return;
    }

    if (this.settingsType === 'function') {
      // We need to run it on a next avaiable hook, because the TrimRows' `afterCreateRow` hook triggers after this one,
      // and it needs to be run to properly calculate the endpoint value.
      const beforeViewRenderCallback = () => {
        this.hot.removeHook('beforeViewRender', beforeViewRenderCallback);

        return this.refreshAllEndpoints();
      };

      this.hot.addHookOnce('beforeViewRender', beforeViewRenderCallback);

      return;
    }

    const type = action.indexOf('row') > -1 ? 'row' : 'col';
    const multiplier = action.indexOf('remove') > -1 ? -1 : 1;
    const endpoints = this.getAllEndpoints();
    const shiftIndex = this.#createPhysicalIndexShift(type, action, index, number, removedPhysicalIndexes);

    arrayEach(endpoints, (endpoint: EndpointConfig) => {
      if (type === 'row') {
        endpoint.alterRowOffset = shiftIndex(endpoint.destinationRow!) - endpoint.destinationRow!;
      } else {
        endpoint.alterColumnOffset = shiftIndex(endpoint.destinationColumn!) - endpoint.destinationColumn!;
      }
    });

    this.resetAllEndpoints(endpoints);

    arrayEach(endpoints, (endpoint: EndpointConfig) => {
      this.shiftEndpointCoordinates(endpoint, type, shiftIndex);
    });

    if (type === 'row') {
      const isRemoval = multiplier === -1;

      arrayEach(endpoints, (endpoint: EndpointConfig) => {
        const reversedRowOffset = endpoint.reversedRowOffset;

        // A reversed endpoint is anchored to the bottom of the table, so a row inserted or removed
        // re-derives its destination from the current physical row count (DEV-144). The generic
        // shift above only moves an endpoint whose destination sits at or below the alteration,
        // which misses a row appended past the anchor. A row move never reaches this method - it
        // leaves the row count unchanged, so the anchor cannot have moved.
        if (!endpoint.reversedRowCoords || typeof reversedRowOffset !== 'number') {
          return;
        }

        const newDestinationRow = this.countAddressableRows() - reversedRowOffset - 1;

        // Enough removals drive `count - reversedRowOffset - 1` below zero (the generic shift above can
        // have already left `destinationRow` negative, so this is checked before the equality guard).
        // Warn instead of letting the summary vanish silently. The negative index is left as-is rather
        // than added to `isEndpointOutOfBounds`, whose result feeds the all-or-nothing gate in
        // `resetAllEndpoints` - catching negatives there would make one below-zero endpoint skip
        // clearing every sibling (DEV-144).
        if (newDestinationRow < 0) {
          this.throwOutOfBoundsWarning();

          return;
        }

        // The generic shift already set `destinationRow` to where the old summary cell now sits, so it
        // is both the comparison point and the cell whose declarative meta must be dropped on a move.
        const oldDestinationRow = endpoint.destinationRow!;

        if (newDestinationRow === oldDestinationRow) {
          return;
        }

        // On a REMOVAL the re-derived anchor can land on a row that already holds user data, and the
        // refresh right after would overwrite it (DEV-144). Leave the endpoint parked in that case:
        // `resetAllEndpoints` cleared the old cell and the refresh rewrites the summary there, which
        // matches the pre-fix (non-destructive) behavior. An INSERT re-anchoring onto data is
        // allowed - it matches what the initial parse does when it plants the anchor on the reversed
        // slot, whatever that slot holds. `getSourceDataAtCell` takes a physical row but a VISUAL column,
        // so the physical `destinationColumn` is translated first.
        const destinationVisualColumn = this.hot.toVisualColumn(endpoint.destinationColumn!);

        if (isRemoval) {
          // A column that cannot be read cannot be proven empty either, so the endpoint stays parked.
          const targetValue = destinationVisualColumn === null
            ? null
            : this.hot.getSourceDataAtCell(newDestinationRow, destinationVisualColumn);

          if (destinationVisualColumn === null ||
            (targetValue !== null && targetValue !== undefined && targetValue !== '')) {
            return;
          }
        }

        // Moving the anchor: the old cell's value was cleared by `resetAllEndpoints`, so drop its
        // declarative `readOnly` and result class too, or it stays an uneditable cell that
        // `getCellValue` keeps treating as a summary result. `readOnly` is reset to `false` (the
        // schema default), not to a column-level override the cell may have carried - it had already
        // shadowed that override since the initial parse, so this is not a new shadow.
        const oldDestinationVisualRow = this.hot.toVisualRow(oldDestinationRow);

        if (oldDestinationVisualRow !== null && destinationVisualColumn !== null) {
          this.hot._setCellMetaDeclarative(oldDestinationVisualRow, destinationVisualColumn, 'readOnly', false);
          this.hot._setCellMetaDeclarative(oldDestinationVisualRow, destinationVisualColumn, 'className', '');
        }

        endpoint.destinationRow = newDestinationRow;
      });
    }

    if (forceRefresh) {
      this.refreshAllEndpoints();
    }
  }

  /**
   * Moves every coordinate of an endpoint on the altered axis to the physical index it holds after a
   * structure alteration. Each coordinate is shifted on its own, because the destination, the source column
   * and the range bounds can sit on different sides of the alteration.
   *
   * A range start is shifted as a start: when its own row is removed, it moves onto the next surviving row
   * rather than the previous one. A range whose rows were all removed is dropped.
   *
   * @private
   * @param {object} endpoint Endpoint object.
   * @param {string} axis The altered axis, `'row'` or `'col'`.
   * @param {Function} shiftIndex Maps a physical index from before the alteration to the one it holds after it.
   */
  shiftEndpointCoordinates(
    endpoint: EndpointConfig, axis: 'row' | 'col', shiftIndex: (index: number, isRangeStart?: boolean) => number
  ) {
    if (axis === 'row') {
      endpoint.destinationRow = shiftIndex(endpoint.destinationRow!);

      // `ranges: []` leaves the setting unset, so there can be nothing to shift.
      if (endpoint.ranges) {
        endpoint.ranges = this.#shiftRanges(endpoint.ranges, shiftIndex);
      }

    } else {
      endpoint.destinationColumn = shiftIndex(endpoint.destinationColumn!);
      endpoint.sourceColumn = shiftIndex(endpoint.sourceColumn!);
    }

    endpoint.alterRowOffset = undefined;
    endpoint.alterColumnOffset = undefined;
  }

  /**
   * Resets (removes) the endpoints from the table.
   *
   * @param {Array} [endpoints] Array containing the endpoints.
   * @param {boolean} [useOffset=true] Use the cell offset value.
   */
  resetAllEndpoints(endpoints = this.getAllEndpoints(), useOffset = true) {
    const anyEndpointOutOfRange = endpoints.some((endpoint: EndpointConfig) => {
      return this.isEndpointOutOfBounds(endpoint, endpoint.alterRowOffset || 0, endpoint.alterColumnOffset || 0);
    });

    if (anyEndpointOutOfRange) {
      return;
    }

    this.cellsToSetCache = [];

    arrayEach(endpoints, (endpoint: EndpointConfig) => {
      this.resetEndpointValue(endpoint, useOffset);
    });

    if (this.cellsToSetCache.length) {
      this.hot.setDataAtCell(this.cellsToSetCache as unknown[][], null, undefined, 'ColumnSummary.reset');
    }

    this.cellsToSetCache = [];
  }

  /**
   * Calculate and refresh all defined endpoints.
   */
  refreshAllEndpoints() {
    const endpoints = this.getAllEndpoints();

    this.cellsToSetCache = [];
    this.cacheSummaryDestinations(endpoints);

    arrayEach(endpoints, (value: EndpointConfig) => {
      this.currentEndpoint = value;
      this.plugin.calculate(value as unknown as Parameters<typeof this.plugin.calculate>[0]);
      this.setEndpointValue(value, 'init');
    });
    this.currentEndpoint = null;

    if (this.cellsToSetCache.length) {
      this.hot.setDataAtCell(this.cellsToSetCache as unknown[][], null, undefined, 'ColumnSummary.reset');
    }

    this.cellsToSetCache = [];
  }

  /**
   * Calculate and refresh endpoints only in the changed columns.
   *
   * @param {Array} changes Array of changes from the `afterChange` hook.
   */
  refreshChangedEndpoints(changes: unknown[][]) {
    const endpoints = this.getAllEndpoints();
    const needToRefresh: number[] = [];

    this.cellsToSetCache = [];
    this.cacheSummaryDestinations(endpoints);

    arrayEach(changes, (value: unknown, key: number, changesObj: unknown[]) => {
      const change = value as unknown[];

      if (`${change[2] || ''}` === `${change[3]}`) {
        return;
      }

      // `propToCol` answers with a visual column, while `sourceColumn` is physical.
      const visualColumn = this.hot.propToCol((changesObj[key] as unknown[])[1] as string | number);
      const physicalColumn = typeof visualColumn === 'number' ? this.hot.toPhysicalColumn(visualColumn) : null;

      if (physicalColumn === null) {
        return;
      }

      arrayEach(endpoints, (endpoint: EndpointConfig, j: number) => {
        if (physicalColumn === endpoint.sourceColumn && needToRefresh.indexOf(j) === -1) {
          needToRefresh.push(j);
        }
      });
    });

    arrayEach(needToRefresh, (value: number) => {
      this.refreshEndpoint(endpoints[value]);
    });

    if (this.cellsToSetCache.length) {
      this.hot.setDataAtCell(this.cellsToSetCache as unknown[][], null, undefined, 'ColumnSummary.reset');
    }

    this.cellsToSetCache = [];
  }

  /**
   * Calculate and refresh endpoints whose `sourceColumn` (physical) matches any of the provided columns.
   *
   * @param {Set<number>|number[]} physicalColumns Physical column indexes to match against.
   */
  refreshEndpointsBySourceColumns(physicalColumns: Set<number> | number[]) {
    const columnsSet = physicalColumns instanceof Set ? physicalColumns : new Set(physicalColumns);
    const endpoints = this.getAllEndpoints();
    const matched = endpoints.filter(endpoint => columnsSet.has(endpoint.sourceColumn!));

    if (matched.length === 0) {
      return;
    }

    this.cellsToSetCache = [];
    // Every endpoint is cached, not just the matched ones - a summary result must stay excluded from
    // the ranges of the endpoints being refreshed, whatever their own source column is.
    this.cacheSummaryDestinations(endpoints);

    arrayEach(matched, (endpoint) => {
      this.refreshEndpoint(endpoint as EndpointConfig);
    });

    if (this.cellsToSetCache.length) {
      this.hot.setDataAtCell(this.cellsToSetCache as unknown[][], null, undefined, 'ColumnSummary.reset');
    }

    this.cellsToSetCache = [];
  }

  /**
   * Refreshes the cell meta information for the all endpoints after the `updateSettings` method call which in some
   * cases (call with `columns` option) can reset the cell metas to the initial state.
   */
  refreshCellMetas() {
    // Declarative writes: kept on the cell meta (so they survive the viewport meta eviction) but not
    // recorded as user-defined, so an `updateSettings` cache reset clears them and they are re-applied
    // for the current endpoints. `_setCellMetaDeclarative` does not fire `beforeSetCellMeta`/
    // `afterSetCellMeta` and cannot be vetoed - matching the previous direct-write behavior.
    // `getAllEndpoints()`, not `this.endpoints`: the function form leaves that array unset.
    this.getAllEndpoints().forEach((endpoint: EndpointConfig) => {
      const destinationVisualRow = this.hot.toVisualRow(endpoint.destinationRow!);
      const destinationVisualColumn = this.hot.toVisualColumn(endpoint.destinationColumn!);

      if (destinationVisualRow !== null && destinationVisualColumn !== null) {
        this.hot._setCellMetaDeclarative(destinationVisualRow, destinationVisualColumn, 'readOnly', endpoint.readOnly);
        this.hot._setCellMetaDeclarative(
          destinationVisualRow, destinationVisualColumn, 'className', 'columnSummaryResult'
        );
      }
    });
  }

  /**
   * Calculate and refresh a single endpoint.
   *
   * @param {object} endpoint Contains the endpoint information.
   */
  refreshEndpoint(endpoint: EndpointConfig) {
    this.currentEndpoint = endpoint;
    this.plugin.calculate(endpoint as unknown as Parameters<typeof this.plugin.calculate>[0]);
    this.setEndpointValue(endpoint, undefined);
    this.currentEndpoint = null;
  }

  /**
   * Reset the endpoint value.
   *
   * @param {object} endpoint Contains the endpoint information.
   * @param {boolean} [useOffset=true] Use the cell offset value.
   */
  resetEndpointValue(endpoint: EndpointConfig, useOffset = true) {
    const alterRowOffset = endpoint.alterRowOffset || 0;
    const alterColOffset = endpoint.alterColumnOffset || 0;
    const destinationVisualRow = this.hot.toVisualRow(endpoint.destinationRow! + (useOffset ? alterRowOffset : 0));
    const destinationVisualColumn = this.hot.toVisualColumn(
      endpoint.destinationColumn! + (useOffset ? alterColOffset : 0)
    );

    // The destination row is trimmed (for example it sits inside a collapsed NestedRows group), so
    // there is no cell to clear.
    if (destinationVisualRow === null || destinationVisualColumn === null) {
      return;
    }

    this.cellsToSetCache.push([destinationVisualRow, destinationVisualColumn, '']);
  }

  /**
   * Set the endpoint value.
   *
   * @param {object} endpoint Contains the endpoint information.
   * @param {string} [source] Source of the call information.
   * @param {boolean} [render=false] `true` if it needs to render the table afterwards.
   */
  setEndpointValue(endpoint: EndpointConfig, source: string | undefined, render = false) {
    if (this.isEndpointOutOfBounds(endpoint)) {
      this.throwOutOfBoundsWarning();

      return;
    }

    const destinationVisualRow = this.hot.toVisualRow(endpoint.destinationRow!);
    // The endpoint coordinates are physical, while every call below addresses a visual cell.
    const destinationVisualColumn = this.hot.toVisualColumn(endpoint.destinationColumn!);
    const hasDestinationCell = destinationVisualRow !== null && destinationVisualColumn !== null;

    if (hasDestinationCell) {
      const cellMeta = this.hot.getCellMetaTransient(destinationVisualRow, destinationVisualColumn);

      if (source === 'init' || cellMeta.readOnly !== endpoint.readOnly) {
        // Declarative writes (see `refreshCellMetas`) so the styling survives viewport meta eviction
        // without firing the public `setCellMeta` hooks or being vetoable.
        this.hot._setCellMetaDeclarative(destinationVisualRow, destinationVisualColumn, 'readOnly', endpoint.readOnly);
        this.hot._setCellMetaDeclarative(
          destinationVisualRow, destinationVisualColumn, 'className', 'columnSummaryResult'
        );
      }
    }

    endpoint.result = roundFloat(endpoint.result, endpoint.roundFloat) as string | number;

    // A trimmed destination row has no cell to write to - writing one throws in `DataMap.set`. The
    // result stays on the endpoint; the cell keeps its previous value until the next recalculation
    // that runs while the row is visible. Nothing re-runs the endpoints on untrim, so a destination
    // hidden at the moment of a change shows a stale value until then.
    if (hasDestinationCell) {
      if (render) {
        this.hot.setDataAtCell(destinationVisualRow, destinationVisualColumn, endpoint.result, 'ColumnSummary.set');
      } else {
        this.cellsToSetCache.push([destinationVisualRow, destinationVisualColumn, endpoint.result]);
      }
    }

    endpoint.alterRowOffset = undefined;
    endpoint.alterColumnOffset = undefined;
  }

  /**
   * Throw an error for the calculation range being out of boundaries.
   *
   * @private
   */
  throwOutOfBoundsWarning() {
    warn('One of the Column Summary plugins\' destination points you provided is beyond the table boundaries!');
  }

  /**
   * Shifts row ranges through a structure alteration and drops the ones whose rows were all removed. A
   * single-row range (`[row]`) keeps its one-element form, and a range configured backwards is shifted
   * but never dropped.
   *
   * @param {number[][]} ranges The ranges to shift.
   * @param {Function} shiftIndex Maps a physical index from before the alteration to the one it holds after it.
   * @returns {number[][]}
   */
  #shiftRanges(ranges: number[][], shiftIndex: (index: number, isRangeStart?: boolean) => number): number[][] {
    const shiftedRanges: number[][] = [];

    arrayEach(ranges, (range: number[]) => {
      const isSingleRow = range.length < 2;
      const originalEnd = isSingleRow ? range[0] : range[1];
      const start = shiftIndex(range[0], true);
      const end = shiftIndex(originalEnd);

      // Every row of the range was removed. A range that was already backwards (`[5, 2]`) is kept as it
      // was configured: only a removal can turn a valid range backwards.
      if (end < start && originalEnd >= range[0]) {
        return;
      }

      shiftedRanges.push(isSingleRow ? [start] : [start, end]);
    });

    return shiftedRanges;
  }

  /**
   * Builds the function that maps a physical index recorded before a structure alteration to the physical
   * index it holds after it.
   *
   * Endpoint coordinates are physical, while the alteration hooks report a visual index. The two agree only
   * until a row or column is moved (or rows are sorted), so the shift is worked out in the physical space:
   * an insertion moves every index at or past the first inserted physical index, and a removal moves an
   * index down by the number of removed physical indexes at or before it. A range start passes
   * `isRangeStart`, so a removal counts only the indexes BEFORE it: a removed start then lands on the next
   * surviving row instead of pulling the range onto the previous record.
   *
   * @param {string} axis The altered axis, `'row'` or `'col'`.
   * @param {string} action Type of the action performed.
   * @param {number} index The visual index the alteration hook reported.
   * @param {number} amount Number of rows or columns inserted or removed.
   * @param {number[]} [removedPhysicalIndexes] Physical indexes the removal took out.
   * @returns {Function}
   */
  #createPhysicalIndexShift(
    axis: 'row' | 'col', action: string, index: number, amount: number,
    removedPhysicalIndexes: number[] | null | undefined
  ): (physicalIndex: number, isRangeStart?: boolean) => number {
    if (action.indexOf('remove') === 0) {
      const removed = removedPhysicalIndexes ?? Array.from({ length: amount }, (_, offset) => index + offset);

      return (physicalIndex, isRangeStart = false) => physicalIndex - removed.filter(
        removedIndex => (isRangeStart ? removedIndex < physicalIndex : removedIndex <= physicalIndex)
      ).length;
    }

    // Nothing was inserted (for example `maxRows` was already reached), so nothing moves.
    if (typeof index !== 'number' || amount === 0) {
      return physicalIndex => physicalIndex;
    }

    // After an insertion the hook's visual index points at the first inserted row or column, so translating
    // it back gives the physical index the insertion started at. A trimmed insertion has no visual index to
    // translate; it falls back to the visual one, which is what the plugin compared against before.
    const firstInsertedIndex = (axis === 'row' ? this.hot.toPhysicalRow(index) : this.hot.toPhysicalColumn(index))
      ?? index;

    return physicalIndex => (physicalIndex >= firstInsertedIndex ? physicalIndex + amount : physicalIndex);
  }
}

export default Endpoints;
