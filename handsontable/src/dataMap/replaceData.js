import { toUpperCaseFirst } from '../helpers/string';
import { isFunction } from '../helpers/function';
import DataMap from './dataMap';
import { deepClone } from '../helpers/object';
import { setAttribute } from '../helpers/dom/element';
import { A11Y_COLCOUNT, A11Y_ROWCOUNT } from '../helpers/a11y';

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
function replaceData(data, setDataMapFunction, callbackFunction, config) {
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

  data = hotInstance.runHooks(`before${capitalizedInternalSource}`, data, firstRun, source);

  const newDataMap = new DataMap(hotInstance, data, metaManager);

  // We need to apply the new dataMap immediately, because of some asynchronous logic in the
  // `autoRowSize`/`autoColumnSize` plugins.
  setDataMapFunction(newDataMap);

  if (typeof data === 'object' && data !== null) {
    if (!(data.push && data.splice)) { // check if data is array. Must use duck-type check so Backbone Collections also pass it
      // when data is not an array, attempt to make a single-row array of it
      // eslint-disable-next-line no-param-reassign
      data = [data];
    }

  } else if (data === null) {
    const dataSchema = newDataMap.getSchema();

    // eslint-disable-next-line no-param-reassign
    data = [];
    let row;
    let r = 0;
    let rlen = 0;

    for (r = 0, rlen = tableMeta.startRows; r < rlen; r++) {
      if ((hotInstance.dataType === 'object' || hotInstance.dataType === 'function') && tableMeta.dataSchema) {
        row = deepClone(dataSchema);
        data.push(row);

      } else if (hotInstance.dataType === 'array') {
        row = deepClone(dataSchema[0]);
        data.push(row);

      } else {
        row = [];

        for (let c = 0, clen = tableMeta.startCols; c < clen; c++) {
          row.push(null);
        }

        data.push(row);
      }
    }

  } else {
    throw new Error(`${internalSource} only accepts array of objects or array of arrays (${typeof data} given)`);
  }

  if (Array.isArray(data[0])) {
    hotInstance.dataType = 'array';
  }

  tableMeta.data = data;

  newDataMap.dataSource = data;
  dataSource.data = data;
  dataSource.dataType = hotInstance.dataType;
  dataSource.colToProp = newDataMap.colToProp.bind(newDataMap);
  dataSource.propToCol = newDataMap.propToCol.bind(newDataMap);
  dataSource.countCachedColumns = newDataMap.countCachedColumns.bind(newDataMap);

  // Run the logic for reassuring that the table structure fits the new dataset.
  callbackFunction(newDataMap);

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
