import type { HotInstance } from '../core/types';
import type { default as DataSourceInstance } from './dataSource';
import type { default as MetaManagerInstance } from './metaManager';
import { toUpperCaseFirst } from '../helpers/string';
import { isFunction } from '../helpers/function';
import DataMap from './dataMap';
import { deepClone } from '../helpers/object';
import { setAttribute } from '../helpers/dom/element';
import { A11Y_COLCOUNT, A11Y_ROWCOUNT } from '../helpers/a11y';
import { runSourceDataValidators } from './sourceDataValidator';
import { throwWithCause } from '../helpers/errors';
import { isDefined } from '../helpers/mixed';
import { warnOnce } from '../helpers/console';
import { countFirstRowKeys } from '../helpers/data';

/**
 * Configuration for the replaceData function.
 */
interface ReplaceDataConfig {
  hotInstance: HotInstance;
  dataMap: DataMap | { destroy(): void; [key: string]: unknown } | null;
  dataSource: DataSourceInstance;
  internalSource: string;
  source: string;
  metaManager: MetaManagerInstance;
  firstRun: boolean | [null, string];
}

/**
 * Builds the initial empty dataset rows when `data` is `null`.
 *
 * @param {HotInstance} hotInstance The Handsontable instance.
 * @param {DataMap} newDataMap The newly created DataMap instance.
 * @param {object} tableMeta The current table settings.
 * @returns {unknown[]} The generated data array.
 */
function buildNullData(
  hotInstance: HotInstance,
  newDataMap: DataMap,
  tableMeta: ReturnType<HotInstance['getSettings']>
): unknown[] {
  const dataSchema = newDataMap.getSchema();
  const data: unknown[] = [];

  for (let r = 0, rlen = tableMeta.startRows as number; r < rlen; r++) {
    let row;

    if ((hotInstance.dataType === 'object' || hotInstance.dataType === 'function') && tableMeta.dataSchema) {
      row = deepClone(dataSchema);

    } else if (hotInstance.dataType === 'array') {
      row = deepClone((dataSchema as unknown[])[0]);

    } else {
      row = [];

      for (let c = 0, clen = tableMeta.startCols as number; c < clen; c++) {
        row.push(null);
      }
    }

    data.push(row);
  }

  return data;
}

/**
 * Warns, once per instance, when the loaded dataset resolves to rows with no columns and nothing in the
 * configuration declares any.
 *
 * Without `columns` or `dataSchema`, the column count is read from the first data row alone. A first
 * row that is empty or not a row at all (`[null]`, `[{}]`, `[[], [1, 2]]`) therefore leaves a grid
 * that displays rows with no cells, and says nothing about it.
 *
 * The degenerate shape stays supported, so this only warns. Three cases stay silent:
 * - An empty `data: []`. Any rows the grid has then come from `minRows` or `minSpareRows`, not from
 * the user's data, and an empty dataset is how a grid is bootstrapped.
 * - An array-of-arrays grid whose rows are all empty (`[[]]`), while `allowInsertColumn` is on:
 * writing to it creates the columns (`applyChanges()` in `core.ts` is gated on that option).
 * - Any grid that ends up with columns, including through `minCols` or `minSpareCols`.
 *
 * An object-rowed grid cannot gain a column, and a later row with values means data the grid does not
 * display, so both are warned about.
 *
 * @param {HotInstance} hotInstance The Handsontable instance.
 * @param {unknown[]} data The loaded dataset.
 * @param {number} loadedRowsCount The number of rows in `data` as it was passed in, before
 * `minRows` and `minSpareRows` added any.
 */
function warnAboutUndetectableColumns(hotInstance: HotInstance, data: unknown[], loadedRowsCount: number) {
  const { columns, dataSchema, maxCols, allowInsertColumn } = hotInstance.getSettings();
  // Mirrors what `Core#getInitialColumnCount()` counts as configured: only an array or a function
  // `columns`, and a `dataSchema` other than `null`. Any other value still leaves the column count
  // to the first data row, so it must not silence the warning.
  const declaresColumns = Array.isArray(columns) || isFunction(columns);
  const declaresSchema = isDefined(dataSchema) && dataSchema !== null;

  if (
    loadedRowsCount === 0 ||
    hotInstance.countSourceRows() === 0 ||
    hotInstance.columnIndexMapper.getNumberOfIndexes() > 0 ||
    declaresColumns ||
    declaresSchema ||
    maxCols === 0
  ) {
    return;
  }

  // An index loop, not `data.some()`: `data` may be a duck-typed collection (`push` and `splice`
  // are all `replaceData()` checks for), with no Array methods of its own.
  let hidesValues = false;

  for (let index = 1; index < data.length && !hidesValues; index++) {
    hidesValues = countFirstRowKeys([data[index]]) > 0;
  }

  if (hotInstance.dataType === 'array' && !hidesValues && allowInsertColumn) {
    return;
  }

  const hiddenFieldsNote = hidesValues ? ', while later rows have fields that no column displays' : '';

  warnOnce(hotInstance, 'replaceData.undetectableColumns',
    'Handsontable found no columns in the data source, so the grid displays rows with no cells. ' +
    'Without the `columns` or `dataSchema` option, the number of columns is read from the first ' +
    `row of \`data\`, and it has no fields${hiddenFieldsNote}. Define the columns with the ` +
    '`columns` or `dataSchema` option, or start `data` with a row that contains every field.');
}

/**
 * Loads new data to Handsontable.
 *
 * @private
 * @param {Array} data Array of arrays or array of objects containing data.
 * @param {Function} setDataMapFunction Function that updates the datamap instance.
 * @param {Function} callbackFunction Function that takes care of updating Handsontable to the new dataset. Called
 * right before the `after-` hooks.
 * @param {object} config The configuration object containing all the needed dependency references and information.
 * @param {Handsontable.Core} config.hotInstance The Handsontable instance.
 * @param {DataMap} config.dataMap The current `dataMap` instance.
 * @param {DataSource} config.dataSource The current `dataSource` instance.
 * @param {string} config.internalSource The immediate internal source of the `replaceData` call.
 * @param {string} config.source The source of the call.
 * @param {boolean} config.firstRun `true` if it's a first call in the Handsontable lifecycle, `false` otherwise.
 * @fires Hooks#beforeLoadData
 * @fires Hooks#beforeUpdateData
 * @fires Hooks#afterLoadData
 * @fires Hooks#afterUpdateData
 * @fires Hooks#afterChange
 */
function replaceData(
  data: unknown[],
  setDataMapFunction: (dataMap: DataMap) => void,
  callbackFunction: (dataMap: DataMap) => void,
  config: ReplaceDataConfig
) {
  const {
    hotInstance,
    dataMap,
    dataSource,
    internalSource,
    source,
    metaManager,
    firstRun
  } = config;
  const capitalizedInternalSource = toUpperCaseFirst(internalSource);
  const tableMeta = hotInstance.getSettings();

  if (Array.isArray(tableMeta.dataSchema)) {
    hotInstance.dataType = 'array';
  } else if (isFunction(tableMeta.dataSchema)) {
    hotInstance.dataType = 'function';
  } else {
    hotInstance.dataType = 'object';
  }

  if (dataMap) {
    dataMap.destroy();
  }

  data = hotInstance.runHooks(`before${capitalizedInternalSource}`, data, firstRun, source) as unknown[];

  const newDataMap = new DataMap(hotInstance, data as (Record<string, unknown> | unknown[])[], metaManager);

  // We need to apply the new dataMap immediately, because of some asynchronous logic in the
  // `autoRowSize`/`autoColumnSize` plugins.
  setDataMapFunction(newDataMap);

  if (typeof data === 'object' && data !== null) {
    if (!((data as unknown[]).push && (data as unknown[]).splice)) { // check if data is array. Must use duck-type check so Backbone Collections also pass it
      // when data is not an array, attempt to make a single-row array of it
      // eslint-disable-next-line no-param-reassign
      data = [data];
    }

  } else if (data === null) {
    // eslint-disable-next-line no-param-reassign
    data = buildNullData(hotInstance, newDataMap, tableMeta);

  } else {
    throwWithCause(`${internalSource} only accepts array of objects or array of arrays (${typeof data} given)`);
  }

  if (Array.isArray((data as unknown[])[0])) {
    hotInstance.dataType = 'array';
  }

  tableMeta.data = data as unknown[][] | object[];

  newDataMap.dataSource = data as (Record<string, unknown> | unknown[])[];
  dataSource.data = data as (Record<string, unknown> | unknown[])[];
  dataSource.dataType = hotInstance.dataType;
  dataSource.colToProp = (column: unknown) => newDataMap.colToProp(column as number);
  dataSource.propToCol = (prop: unknown) => newDataMap.propToCol(prop as string | number);
  dataSource.countCachedColumns = newDataMap.countCachedColumns.bind(newDataMap);

  // Read before the callback: `adjustRowsAndCols()` in it pushes `minRows` and `minSpareRows` rows
  // into the same array.
  const loadedRowsCount = (data as unknown[]).length;

  // Run the logic for reassuring that the table structure fits the new dataset.
  callbackFunction(newDataMap);

  // After the callback, because `adjustRowsAndCols()` in it applies `minCols` and `minSpareCols`.
  warnAboutUndetectableColumns(hotInstance, data as unknown[], loadedRowsCount);

  if (!firstRun) {
    runSourceDataValidators(hotInstance, internalSource);
  }

  hotInstance.runHooks(`after${capitalizedInternalSource}`, data, firstRun, source);

  // TODO: rethink the way the `afterChange` hook is being run here in the core `init` method.
  if (!firstRun) {
    hotInstance.runHooks('afterChange', null, internalSource);
    hotInstance.render();
  }

  if (hotInstance.getSettings().ariaTags) {
    setAttribute(hotInstance.rootElement, [
      A11Y_ROWCOUNT(-1),
      // If run after initialization, add the number of row headers.
      A11Y_COLCOUNT(hotInstance.countCols() + (hotInstance.view ? hotInstance.countRowHeaders() : 0)),
    ]);
  }
}

export {
  replaceData
};
