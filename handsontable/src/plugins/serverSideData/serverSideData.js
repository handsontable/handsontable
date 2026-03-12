import { BasePlugin } from '../base';
import { warn, info, error } from '../../helpers/console';
import { isFunction } from '../../helpers/function';
import { isObject } from '../../helpers/object';
import { throwWithCause } from '../../helpers/errors';

export const PLUGIN_KEY = 'serverSideData';
export const PLUGIN_PRIORITY = 45;
const REQUEST_DEBOUNCE_MS = 100;

/**
 * Clone query parameters object.
 *
 * @param {object} queryParameters Query parameters to clone.
 * @returns {{page: number, pageSize: number, sort: object | null, filters: object | null}}
 */
export function cloneQueryParameters(queryParameters) {
  return {
    page: queryParameters.page,
    pageSize: queryParameters.pageSize,
    sort: queryParameters.sort ? { ...queryParameters.sort } : null,
    filters: queryParameters.filters ? { ...queryParameters.filters } : null,
  };
}

/**
 * Normalize page number.
 *
 * @param {number|string} value Candidate page number.
 * @param {number} [fallbackValue=1] Fallback page number.
 * @returns {number}
 */
export function normalizePage(value, fallbackValue = 1) {
  const normalizedValue = Number.parseInt(value, 10);

  return Number.isInteger(normalizedValue) && normalizedValue > 0 ? normalizedValue : fallbackValue;
}

/**
 * Normalize page size.
 *
 * @param {number|string} value Candidate page size.
 * @param {number} [fallbackValue=20] Fallback page size.
 * @returns {number}
 */
export function normalizePageSize(value, fallbackValue = 20) {
  const normalizedValue = Number.parseInt(value, 10);

  return Number.isInteger(normalizedValue) && normalizedValue > 0 ? normalizedValue : fallbackValue;
}

/**
 * @plugin ServerSideData
 * @class ServerSideData
 */
export class ServerSideData extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get SETTING_KEYS() {
    return [
      'dataProvider',
      'dataProviderParams',
      'rowId',
      'onRowCreate',
      'onRowUpdate',
      'onRowRemove',
      'pagination',
    ];
  }

  #queryParameters = {
    page: 1,
    pageSize: 20,
    sort: null,
    filters: null,
  };
  #totalRows = 0;
  #requestController = null;
  #requestId = 0;
  #activeRequestId = 0;
  #requestDebounceTimer = null;
  #isDestroyed = false;
  #mutationQueue = Promise.resolve();

  isEnabled() {
    return isFunction(this.hot.getSettings().dataProvider);
  }

  enablePlugin() {
    if (this.enabled) {
      return;
    }

    if (this.hot.getSettings().data !== undefined) {
      warn('Both `data` and `dataProvider` are set. Handsontable will prioritize `dataProvider` in server-side mode.');
    }

    this.#initializeQueryParameters();

    this.addHook('afterInit', () => this.refreshData('serverSideData.init'));
    this.addHook('beforePageChange', (...args) => this.#onBeforePageChange(...args), -100);
    this.addHook('beforePageSizeChange', (...args) => this.#onBeforePageSizeChange(...args), -100);
    this.addHook('beforeColumnSort', (...args) => this.#onBeforeColumnSort(...args), -100);
    this.addHook('afterFilter', (...args) => this.#onAfterFilter(...args), 100);
    this.addHook('afterChange', (...args) => this.#onAfterChange(...args), 100);
    this.addHook('beforeCreateRow', (...args) => this.#onBeforeCreateRow(...args), -100);
    this.addHook('beforeRemoveRow', (...args) => this.#onBeforeRemoveRow(...args), -100);
    this.addHook('beforeContextMenuSetItems', (...args) => this.#onBeforeContextMenuSetItems(...args), -100);

    if (this.hot.getSettings().manualRowMove) {
      info('`manualRowMove` is disabled in server-side mode because row order is controlled by the server.');
    }
    if (this.hot.getSettings().trimRows) {
      info('`trimRows` is disabled in server-side mode because row visibility is controlled by the server.');
    }
    if (this.hot.getSettings().multiColumnSorting) {
      info('`multiColumnSorting` is disabled in server-side mode. Use single-column sorting with `dataProvider`.');
    }

    super.enablePlugin();
  }

  updatePlugin(newSettings) {
    if (!this.isEnabled()) {
      this.disablePlugin();

      return;
    }

    if (newSettings?.pagination || newSettings?.dataProviderParams) {
      this.#initializeQueryParameters();
      this.refreshData('serverSideData.updateSettings');
    }

    super.updatePlugin();
  }

  disablePlugin() {
    if (this.#requestController) {
      this.#requestController.abort();
      this.#requestController = null;
    }

    if (this.#requestDebounceTimer !== null) {
      this.hot.rootWindow.clearTimeout(this.#requestDebounceTimer);
      this.#requestDebounceTimer = null;
    }

    super.disablePlugin();
  }

  getQueryParameters() {
    return cloneQueryParameters(this.#queryParameters);
  }

  refreshData(source = 'serverSideData.refreshData') {
    if (!this.enabled || this.#isDestroyed) {
      return Promise.resolve();
    }

    return this.#fetchData(source);
  }

  createRow(row = {}) {
    const onRowCreate = this.hot.getSettings().onRowCreate;

    if (!isFunction(onRowCreate)) {
      throwWithCause('The `createRow()` method requires the `onRowCreate` callback to be defined.');
    }

    return this.#enqueueMutation(
      'create',
      row,
      async() => {
        await onRowCreate(row);
        await this.#refreshAfterMutation('create');
      }
    );
  }

  updateRow(id, changes = {}) {
    const onRowUpdate = this.hot.getSettings().onRowUpdate;

    if (!isFunction(onRowUpdate)) {
      throwWithCause('The `updateRow()` method requires the `onRowUpdate` callback to be defined.');
    }

    const rowIdKey = this.hot.getSettings().rowId;
    const visualRow = this.#findVisualRowById(id);
    const currentRowData = visualRow >= 0 ? this.hot.getSourceDataAtRow(visualRow) : {};
    const rowData = isObject(currentRowData) ? { ...currentRowData, ...changes } : { ...changes, [rowIdKey]: id };

    return this.#enqueueMutation(
      'update',
      { id, changes, rowData },
      async() => {
        await onRowUpdate(id, changes, rowData);
        await this.#refreshAfterMutation('update');
      }
    );
  }

  removeRow(id) {
    const onRowRemove = this.hot.getSettings().onRowRemove;

    if (!isFunction(onRowRemove)) {
      throwWithCause('The `removeRow()` method requires the `onRowRemove` callback to be defined.');
    }

    return this.#enqueueMutation(
      'remove',
      { id },
      async() => {
        await onRowRemove(id);
        await this.#refreshAfterMutation('remove');
      }
    );
  }

  #initializeQueryParameters() {
    const {
      dataProviderParams,
      pagination,
    } = this.hot.getSettings();
    const defaultPageSize = typeof pagination === 'object' && pagination?.pageSize !== 'auto' ?
      normalizePageSize(pagination?.pageSize, 20) : 20;
    const nextQueryParameters = {
      page: 1,
      pageSize: defaultPageSize,
      sort: null,
      filters: null,
    };

    if (isObject(dataProviderParams)) {
      if (dataProviderParams.page !== undefined) {
        nextQueryParameters.page = normalizePage(dataProviderParams.page, nextQueryParameters.page);
      }
      if (dataProviderParams.pageSize !== undefined) {
        nextQueryParameters.pageSize = normalizePageSize(dataProviderParams.pageSize, nextQueryParameters.pageSize);
      }
      if (dataProviderParams.sort !== undefined) {
        nextQueryParameters.sort = dataProviderParams.sort ?? null;
      }
      if (dataProviderParams.filters !== undefined) {
        nextQueryParameters.filters = dataProviderParams.filters ?? null;
      }
    }

    this.#queryParameters = nextQueryParameters;
  }

  #fetchData(source) {
    const dataProvider = this.hot.getSettings().dataProvider;

    if (!isFunction(dataProvider)) {
      return Promise.resolve();
    }

    if (this.#requestController) {
      this.#requestController.abort();
    }

    const requestController = new AbortController();

    this.#requestController = requestController;

    this.#requestId += 1;

    const requestId = this.#requestId;

    this.#activeRequestId = requestId;
    this.#showLoadingState();

    let queryParameters = cloneQueryParameters(this.#queryParameters);

    try {
      const modifiedQueryParameters = this.hot.runHooks('beforeDataProviderRequest', queryParameters, source);

      if (modifiedQueryParameters === false) {
        return Promise.resolve();
      }
      if (isObject(modifiedQueryParameters)) {
        queryParameters = {
          ...queryParameters,
          ...modifiedQueryParameters,
        };
      }

      const fetchPromise = Promise.resolve(
        dataProvider(queryParameters, { signal: this.#requestController.signal })
      );

      return fetchPromise.then((response) => {
        if (requestController.signal.aborted || requestId !== this.#activeRequestId) {
          return;
        }

        if (!isObject(response) || !Array.isArray(response.rows)) {
          throwWithCause('`dataProvider` must resolve to an object containing a `rows` array.');
        }

        const totalRows = Number.parseInt(response.totalRows, 10);

        if (!Number.isInteger(totalRows) || totalRows < 0) {
          throwWithCause('`dataProvider` must resolve with a non-negative integer `totalRows`.');
        }

        this.#totalRows = totalRows;

        this.hot.loadData(response.rows, 'serverSideData.dataProvider');
        this.#syncPaginationState();
        this.hot.runHooks('afterDataProviderResponse', response, cloneQueryParameters(queryParameters));
      }).catch((fetchError) => {
        if (requestController.signal.aborted) {
          return;
        }

        this.hot.runHooks('afterDataProviderError', fetchError, cloneQueryParameters(queryParameters));
        error(fetchError);
      }).finally(() => {
        if (requestId === this.#activeRequestId) {
          this.#hideLoadingState();
        }
      });
    } catch (hookError) {
      this.#hideLoadingState();
      this.hot.runHooks('afterDataProviderError', hookError, cloneQueryParameters(queryParameters));
      error(hookError);

      return Promise.reject(hookError);
    }
  }

  #syncPaginationState() {
    const paginationPlugin = this.hot.getPlugin('pagination');

    if (paginationPlugin?.enabled && isFunction(paginationPlugin.setServerPaginationData)) {
      paginationPlugin.setServerPaginationData({
        currentPage: this.#queryParameters.page,
        pageSize: this.#queryParameters.pageSize,
        totalRows: this.#totalRows,
      });
    }
  }

  #showLoadingState() {
    const loadingPlugin = this.hot.getPlugin('loading');

    if (loadingPlugin?.enabled) {
      loadingPlugin.show();
    }
  }

  #hideLoadingState() {
    const loadingPlugin = this.hot.getPlugin('loading');

    if (loadingPlugin?.enabled) {
      loadingPlugin.hide();
    }
  }

  #scheduleFetch(source) {
    if (this.#requestDebounceTimer !== null) {
      this.hot.rootWindow.clearTimeout(this.#requestDebounceTimer);
    }

    this.#requestDebounceTimer = this.hot.rootWindow.setTimeout(() => {
      this.#requestDebounceTimer = null;
      this.#fetchData(source);
    }, REQUEST_DEBOUNCE_MS);
  }

  #onBeforePageChange(_oldPage, newPage) {
    this.#queryParameters.page = normalizePage(newPage, this.#queryParameters.page);
    this.#scheduleFetch('serverSideData.pageChange');

    return false;
  }

  #onBeforePageSizeChange(_oldPageSize, newPageSize) {
    if (newPageSize === 'auto') {
      warn('The `auto` pagination page size is not supported in server-side mode.');

      return false;
    }

    this.#queryParameters.pageSize = normalizePageSize(newPageSize, this.#queryParameters.pageSize);
    this.#queryParameters.page = 1;
    this.#scheduleFetch('serverSideData.pageSizeChange');

    return false;
  }

  #onBeforeColumnSort(_currentSortConfig, destinationSortConfigs) {
    const sortingConfig = Array.isArray(destinationSortConfigs) ? destinationSortConfigs[0] : destinationSortConfigs;
    const columnSortingPlugin = this.hot.getPlugin('columnSorting');

    if (isFunction(columnSortingPlugin?.setSortConfig)) {
      columnSortingPlugin.setSortConfig(sortingConfig ? [sortingConfig] : []);
    }

    if (sortingConfig && Number.isInteger(sortingConfig.column) && sortingConfig.sortOrder) {
      const columnProp = this.hot.colToProp(sortingConfig.column);

      this.#queryParameters.sort = {
        column: `${columnProp}`,
        direction: sortingConfig.sortOrder,
      };
    } else {
      this.#queryParameters.sort = null;
    }

    this.#queryParameters.page = 1;
    this.hot.render();
    this.#scheduleFetch('serverSideData.sortChange');

    return false;
  }

  #onAfterFilter(conditionsStack) {
    const filterModel = {};

    conditionsStack.forEach((columnConditions) => {
      const firstCondition = columnConditions.conditions?.[0];
      const operator = firstCondition?.name ?? firstCondition?.command?.key;

      if (!operator) {
        return;
      }

      const columnProp = this.hot.colToProp(columnConditions.column);

      filterModel[columnProp] = {
        operator,
        value: firstCondition?.args?.[0] ?? null,
      };
    });

    this.#queryParameters.filters = Object.keys(filterModel).length > 0 ? filterModel : null;
    this.#queryParameters.page = 1;
    this.#scheduleFetch('serverSideData.filterChange');
  }

  #onAfterChange(changes, source) {
    const onRowUpdate = this.hot.getSettings().onRowUpdate;

    if (!Array.isArray(changes) || !isFunction(onRowUpdate) || this.#isInternalSource(source)) {
      return;
    }

    const groupedChanges = new Map();

    changes.forEach(([visualRow, prop, oldValue, newValue]) => {
      if (oldValue === newValue || visualRow < 0) {
        return;
      }

      const visualColumn = this.hot.propToCol(prop);
      const rowData = this.hot.getSourceDataAtRow(visualRow);
      const rowId = this.#extractRowId(rowData);

      if (rowId === undefined) {
        warn('Skipping `onRowUpdate` call because row identifier is missing.');

        return;
      }

      if (!groupedChanges.has(visualRow)) {
        groupedChanges.set(visualRow, {
          id: rowId,
          rowData,
          changes: {},
          revertStack: [],
        });
      }

      const groupedChange = groupedChanges.get(visualRow);

      groupedChange.changes[prop] = newValue;
      groupedChange.revertStack.push([visualRow, visualColumn, oldValue]);
    });

    groupedChanges.forEach((payload) => {
      this.#enqueueMutation(
        'update',
        {
          id: payload.id,
          changes: payload.changes,
          rowData: payload.rowData,
        },
        async() => {
          await onRowUpdate(payload.id, payload.changes, payload.rowData);
          await this.#refreshAfterMutation('update');
        },
        (mutationError) => {
          payload.revertStack.forEach(([row, column, oldValue]) => {
            this.hot.setDataAtCell(row, column, oldValue, 'serverSideData.revert');
          });
          this.hot.runHooks('afterDataProviderError', mutationError, this.getQueryParameters());
          this.hot.render();
        }
      );
    });
  }

  #onBeforeCreateRow(_index, amount = 1, source = 'edit') {
    const onRowCreate = this.hot.getSettings().onRowCreate;

    if (source.startsWith('serverSideData.')) {
      return;
    }

    if (!isFunction(onRowCreate)) {
      return false;
    }

    for (let rowOffset = 0; rowOffset < amount; rowOffset += 1) {
      const rowPayload = {};

      this.#enqueueMutation(
        'create',
        rowPayload,
        async() => {
          await onRowCreate(rowPayload);
          await this.#refreshAfterMutation('create');
        }
      );
    }

    return false;
  }

  #onBeforeRemoveRow(index, amount = 1, _physicalRows, source = 'edit') {
    const onRowRemove = this.hot.getSettings().onRowRemove;

    if (source.startsWith('serverSideData.')) {
      return;
    }

    if (!isFunction(onRowRemove)) {
      return false;
    }

    const rowIds = [];

    for (let visualRow = index; visualRow < index + amount; visualRow += 1) {
      const rowData = this.hot.getSourceDataAtRow(visualRow);
      const rowId = this.#extractRowId(rowData);

      if (rowId !== undefined) {
        rowIds.push(rowId);
      }
    }

    if (rowIds.length === 0) {
      warn('Skipping `onRowRemove` call because selected rows do not have identifiers.');

      return false;
    }

    this.#enqueueMutation(
      'remove',
      { ids: rowIds },
      async() => {
        await Promise.all(rowIds.map(rowId => onRowRemove(rowId)));
        await this.#refreshAfterMutation('remove');
      }
    );

    return false;
  }

  #onBeforeContextMenuSetItems(menuItems) {
    const hasCreate = isFunction(this.hot.getSettings().onRowCreate);
    const hasRemove = isFunction(this.hot.getSettings().onRowRemove);

    menuItems.forEach((menuItem) => {
      if (!isObject(menuItem)) {
        return;
      }

      if (menuItem.key === 'row_above' || menuItem.key === 'row_below') {
        if (!hasCreate) {
          menuItem.hidden = true;
        }
      }

      if (menuItem.key === 'remove_row' && !hasRemove) {
        menuItem.hidden = true;
      }
    });
  }

  #isInternalSource(source) {
    return source === 'loadData' ||
      source === 'updateData' ||
      (typeof source === 'string' && source.startsWith('serverSideData.'));
  }

  #extractRowId(rowData) {
    const rowIdKey = this.hot.getSettings().rowId;

    if (isObject(rowData)) {
      return rowData[rowIdKey];
    }
    if (Array.isArray(rowData)) {
      return rowData[rowIdKey];
    }

    return undefined;
  }

  #findVisualRowById(id) {
    const rowIdKey = this.hot.getSettings().rowId;

    for (let visualRow = 0; visualRow < this.hot.countRows(); visualRow += 1) {
      const rowData = this.hot.getSourceDataAtRow(visualRow);

      if ((isObject(rowData) || Array.isArray(rowData)) && rowData[rowIdKey] === id) {
        return visualRow;
      }
    }

    return -1;
  }

  #refreshAfterMutation(type) {
    if (type === 'remove' && this.hot.countRows() <= 1 && this.#queryParameters.page > 1) {
      this.#queryParameters.page -= 1;
    }

    return this.refreshData(`serverSideData.mutation.${type}`);
  }

  #enqueueMutation(type, payload, callback, onError) {
    const queuedMutation = this.#mutationQueue.then(async() => {
      const shouldProceed = this.hot.runHooks('beforeRowMutation', type, payload);

      if (shouldProceed === false) {
        return;
      }

      try {
        await callback();
        this.hot.runHooks('afterRowMutation', type, payload);
      } catch (mutationError) {
        this.hot.runHooks('afterRowMutationError', type, mutationError, payload);

        if (isFunction(onError)) {
          onError(mutationError);
        }

        throw mutationError;
      }
    });

    this.#mutationQueue = queuedMutation.catch(() => undefined);

    return queuedMutation;
  }

  destroy() {
    this.#isDestroyed = true;
    this.disablePlugin();
    super.destroy();
  }
}
