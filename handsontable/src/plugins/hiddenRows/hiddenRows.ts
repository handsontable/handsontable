import { BasePlugin } from '../base';
import { addClass } from '../../helpers/dom/element';
import { rangeEach } from '../../helpers/number';
import { arrayEach, arrayMap, arrayReduce } from '../../helpers/array';
import { SEPARATOR } from '../contextMenu/predefinedItems';
import { Hooks } from '../../core/hooks';
import hideRowItem from './contextMenuItem/hideRow';
import showRowItem from './contextMenuItem/showRow';
import { HidingMap } from '../../translations';

Hooks.getSingleton().register('beforeHideRows');
Hooks.getSingleton().register('afterHideRows');
Hooks.getSingleton().register('beforeUnhideRows');
Hooks.getSingleton().register('afterUnhideRows');

export const PLUGIN_KEY = 'hiddenRows';
export const PLUGIN_PRIORITY = 320;

const SKIP_ROW_ON_PASTE_BY_PLUGIN = Symbol('skipRowOnPasteByHiddenRows');

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * @plugin HiddenRows
 * @class HiddenRows
 *
 * @description
 * The `HiddenRows` plugin lets you [hide specified rows](@/guides/rows/row-hiding/row-hiding.md).
 *
 * "Hiding a row" means that the hidden row doesn't get rendered as a DOM element.
 *
 * The `HiddenRows` plugin doesn't modify the source data,
 * and doesn't participate in data transformation
 * (the shape of the data returned by the [`getData*()` methods](@/api/core.md#getdata) stays intact).
 *
 * You can set the following configuration options:
 *
 * | Option | Required | Type | Default | Description |
 * |---|---|---|---|---|
 * | `rows` | No | Array | - | [Hides specified rows by default](@/guides/rows/row-hiding/row-hiding.md#step-1-specify-rows-hidden-by-default) |
 * | `indicators` | No | Boolean | `false` | [Shows UI indicators](@/guides/rows/row-hiding/row-hiding.md#step-2-show-ui-indicators) |
 * | `copyPasteEnabled` | No | Boolean | `true` | [Sets up copy/paste behavior](@/guides/rows/row-hiding/row-hiding.md#step-4-set-up-copy-and-paste-behavior) |
 *
 * @example
 *
 * ::: only-for javascript
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   data: getData(),
 *   hiddenRows: {
 *     copyPasteEnabled: true,
 *     indicators: true,
 *     rows: [1, 2, 5]
 *   }
 * });
 *
 * // access the `HiddenRows` plugin's instance
 * const hiddenRowsPlugin = hot.getPlugin('hiddenRows');
 *
 * // hide a single row
 * hiddenRowsPlugin.hideRow(1);
 *
 * // hide multiple rows
 * hiddenRowsPlugin.hideRow(1, 2, 9);
 *
 * // hide multiple rows as an array
 * hiddenRowsPlugin.hideRows([1, 2, 9]);
 *
 * // unhide a single row
 * hiddenRowsPlugin.showRow(1);
 *
 * // unhide multiple rows
 * hiddenRowsPlugin.showRow(1, 2, 9);
 *
 * // unhide multiple rows as an array
 * hiddenRowsPlugin.showRows([1, 2, 9]);
 *
 * // to see your changes, re-render your Handsontable instance
 * hot.render();
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * const hotRef = useRef(null);
 *
 * ...
 *
 * <HotTable
 *   ref={hotRef}
 *   data={getData()}
 *   hiddenRows={{
 *     copyPasteEnabled: true,
 *     indicators: true,
 *     rows: [1, 2, 5]
 *   }}
 * />
 *
 * // access the `HiddenRows` plugin's instance
 * const hot = hotRef.current.hotInstance;
 * const hiddenRowsPlugin = hot.getPlugin('hiddenRows');
 *
 * // hide a single row
 * hiddenRowsPlugin.hideRow(1);
 *
 * // hide multiple rows
 * hiddenRowsPlugin.hideRow(1, 2, 9);
 *
 * // hide multiple rows as an array
 * hiddenRowsPlugin.hideRows([1, 2, 9]);
 *
 * // unhide a single row
 * hiddenRowsPlugin.showRow(1);
 *
 * // unhide multiple rows
 * hiddenRowsPlugin.showRow(1, 2, 9);
 *
 * // unhide multiple rows as an array
 * hiddenRowsPlugin.showRows([1, 2, 9]);
 *
 * // to see your changes, re-render your Handsontable instance
 * hot.render();
 * ```
 * :::
 *
 * ::: only-for angular
 * ```ts
 * import { AfterViewInit, Component, ViewChild } from "@angular/core";
 * import {
 *   GridSettings,
 *   HotTableModule,
 *   HotTableComponent,
 * } from "@handsontable/angular-wrapper";
 *
 * `@Component`({
 *   selector: "app-example",
 *   standalone: true,
 *   imports: [HotTableModule],
 *   template: ` <div>
 *     <hot-table [settings]="gridSettings" />
 *   </div>`,
 * })
 * export class ExampleComponent implements AfterViewInit {
 *   `@ViewChild`(HotTableComponent, { static: false })
 *   readonly hotTable!: HotTableComponent;
 *
 *   readonly gridSettings = <GridSettings>{
 *     data: this.getData(),
 *     hiddenRows: {
 *       copyPasteEnabled: true,
 *       indicators: true,
 *       rows: [1, 2, 5],
 *     },
 *   };
 *
 *   ngAfterViewInit(): void {
 *     // Access the `HiddenRows` plugin's instance
 *     const hot = this.hotTable.hotInstance;
 *     const hiddenRowsPlugin = hot.getPlugin("hiddenRows");
 *
 *     // Hide a single row
 *     hiddenRowsPlugin.hideRow(1);
 *
 *     // Hide multiple rows
 *     hiddenRowsPlugin.hideRow(1, 2, 9);
 *
 *     // Hide multiple rows as an array
 *     hiddenRowsPlugin.hideRows([1, 2, 9]);
 *
 *     // Unhide a single row
 *     hiddenRowsPlugin.showRow(1);
 *
 *     // Unhide multiple rows
 *     hiddenRowsPlugin.showRow(1, 2, 9);
 *
 *     // Unhide multiple rows as an array
 *     hiddenRowsPlugin.showRows([1, 2, 9]);
 *
 *     // To see your changes, re-render your Handsontable instance
 *     hot.render();
 *   }
 *
 *   private getData(): Array<*> {
 *     // Get some data
 *   }
 * }
 * ```
 * :::
 */
export class HiddenRows extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get DEFAULT_SETTINGS() {
    return {
      copyPasteEnabled: true,
      indicators: false,
      rows: [] as number[],
    };
  }

  /**
   * Map of hidden rows by the plugin.
   *
   * @private
   * @type {HidingMap|null}
   */
  #hiddenRowsMap: HidingMap | null = null;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link HiddenRows#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.#hiddenRowsMap = new HidingMap();
    this.#hiddenRowsMap!.addLocalHook('init', () => this.#onMapInit());
    this.hot.rowIndexMapper.registerMap(this.pluginName!, this.#hiddenRowsMap);

    this.addHook('afterContextMenuDefaultOptions', this.#onAfterContextMenuDefaultOptions);
    this.addHook('afterGetCellMeta', this.#onAfterGetCellMeta);
    this.addHook('modifyRowHeight', this.#onModifyRowHeight);
    this.addHook('afterGetRowHeader', this.#onAfterGetRowHeader);
    this.addHook('modifyCopyableRange', this.#onModifyCopyableRange);

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`hiddenRows`](@/api/options.md#hiddenrows)
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();

    this.hot.rowIndexMapper.unregisterMap(this.pluginName!);
    this.resetCellsMeta();
  }

  /**
   * Shows the rows provided in the array.
   *
   * @param {number[]} rows Array of visual row indexes.
   */
  showRows(rows: number[]): void {
    const currentHideConfig = this.getHiddenRows();
    const isValidConfig = this.isValidConfig(rows);
    let destinationHideConfig = currentHideConfig;
    const hidingMapValues = this.#hiddenRowsMap!.getValues().slice();
    const isAnyRowShowed = rows.length > 0;

    if (isValidConfig && isAnyRowShowed) {
      const physicalRows = rows.map(visualRow => this.hot.toPhysicalRow(visualRow));

      // Preparing new values for hiding map.
      arrayEach(physicalRows, (physicalRow) => {
        hidingMapValues[physicalRow as number] = false;
      });

      // Preparing new hiding config.
      destinationHideConfig = arrayReduce(hidingMapValues, (hiddenIndexes, isHidden, physicalIndex) => {
        if (isHidden) {
          (hiddenIndexes as number[]).push(this.hot.toVisualRow(physicalIndex as number));
        }

        return hiddenIndexes;
      }, []) as number[];
    }

    const continueHiding = this.hot
      .runHooks('beforeUnhideRows', currentHideConfig, destinationHideConfig, isValidConfig && isAnyRowShowed);

    if (continueHiding === false) {
      return;
    }

    if (isValidConfig && isAnyRowShowed) {
      this.#hiddenRowsMap!.setValues(hidingMapValues);
    }

    this.hot.runHooks('afterUnhideRows', currentHideConfig, destinationHideConfig, isValidConfig && isAnyRowShowed,
      isValidConfig && destinationHideConfig.length < currentHideConfig.length);
  }

  /**
   * Shows the row provided as row index (counting from 0).
   *
   * @param {...number} row Visual row index.
   */
  showRow(...row: number[]): void {
    this.showRows(row);
  }

  /**
   * Hides the rows provided in the array.
   *
   * @param {number[]} rows Array of visual row indexes.
   */
  hideRows(rows: number[]): void {
    const currentHideConfig = this.getHiddenRows();
    const isConfigValid = this.isValidConfig(rows);
    let destinationHideConfig = currentHideConfig;

    if (isConfigValid) {
      destinationHideConfig = Array.from(new Set(currentHideConfig.concat(rows)));
    }

    const continueHiding = this.hot.runHooks('beforeHideRows', currentHideConfig, destinationHideConfig, isConfigValid);

    if (continueHiding === false) {
      return;
    }

    if (isConfigValid) {
      this.hot.batchExecution(() => {
        arrayEach(rows, (visualRow) => {
          this.#hiddenRowsMap!.setValueAtIndex(this.hot.toPhysicalRow(visualRow), true);
        });
      }, true);
    }

    this.hot.runHooks('afterHideRows', currentHideConfig, destinationHideConfig, isConfigValid,
      isConfigValid && destinationHideConfig.length > currentHideConfig.length);
  }

  /**
   * Hides the row provided as row index (counting from 0).
   *
   * @param {...number} row Visual row index.
   */
  hideRow(...row: number[]): void {
    this.hideRows(row);
  }

  /**
   * Returns an array of visual indexes of hidden rows.
   *
   * @returns {number[]}
   */
  getHiddenRows(): number[] {
    return arrayMap(this.#hiddenRowsMap!.getHiddenIndexes(), (physicalRowIndex) => {
      return this.hot.toVisualRow(physicalRowIndex)!;
    });
  }

  /**
   * Checks if the provided row is hidden.
   *
   * @param {number} row Visual row index.
   * @returns {boolean}
   */
  isHidden(row: number): boolean {
    return this.#hiddenRowsMap!.getValueAtIndex<boolean>(this.hot.toPhysicalRow(row)) || false;
  }

  /**
   * Checks whether all of the provided row indexes are within the bounds of the table.
   *
   * @param {Array} hiddenRows List of hidden visual row indexes.
   * @returns {boolean}
   */
  isValidConfig(hiddenRows: number[]): boolean {
    const nrOfRows = this.hot.countRows();

    if (Array.isArray(hiddenRows) && hiddenRows.length > 0) {
      return hiddenRows.every(visualRow => Number.isInteger(visualRow) && visualRow >= 0 && visualRow < nrOfRows);
    }

    return false;
  }

  /**
   * Resets all rendered cells meta.
   *
   * @private
   */
  resetCellsMeta() {
    arrayEach(this.hot.getCellsMeta(), (meta) => {
      const cellMeta = meta as Record<string | symbol, unknown>;

      if (cellMeta[SKIP_ROW_ON_PASTE_BY_PLUGIN]) {
        delete cellMeta.skipRowOnPaste;
        delete cellMeta[SKIP_ROW_ON_PASTE_BY_PLUGIN];
      }
    });
  }

  /**
   * Adds the additional row height for the hidden row indicators.
   *
   * @param {number|undefined} height Row height.
   * @param {number} row Visual row index.
   * @returns {number}
   */
  #onModifyRowHeight = (height: number, row: number) => {
    // Hook is triggered internally only for the visible rows. Conditional will be handled for the API
    // calls of the `getRowHeight` function on not visible indexes.
    if (this.isHidden(row)) {
      return 0;
    }

    return height;
  };

  /**
   * Sets the copy-related cell meta.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {object} cellProperties Object containing the cell properties.
   */
  #onAfterGetCellMeta = (row: number, column: number, cellProperties: Record<string, unknown>) => {
    if (this.getSetting('copyPasteEnabled') === false) {
      // Cell property handled by the `Autofill` and the `CopyPaste` plugins. The plugin only sets
      // and marks cells whose `skipRowOnPaste` it actually flips to `true`. Cells that already
      // had `true` from user configuration (`cells`, or `cell`) are left untouched, so that
      // unhiding the row does not erase the user-defined value.
      const cellPropsWithMarker = cellProperties as Record<string | symbol, unknown>;

      if (this.isHidden(row)) {
        if (cellProperties.skipRowOnPaste !== true) {
          cellProperties.skipRowOnPaste = true;
          cellPropsWithMarker[SKIP_ROW_ON_PASTE_BY_PLUGIN] = true;
        }
      } else if (cellPropsWithMarker[SKIP_ROW_ON_PASTE_BY_PLUGIN]) {
        delete cellProperties.skipRowOnPaste;
        delete cellPropsWithMarker[SKIP_ROW_ON_PASTE_BY_PLUGIN];
      }
    }

    if (this.isHidden(row - 1)) {
      cellProperties.className = cellProperties.className || '';

      if ((cellProperties.className as string).indexOf('afterHiddenRow') === -1) {
        cellProperties.className += ' afterHiddenRow';
      }
    } else if (cellProperties.className) {
      const classArr = (cellProperties.className as string).split(' ');

      if (classArr.length > 0) {
        const containAfterHiddenRow = classArr.indexOf('afterHiddenRow');

        if (containAfterHiddenRow > -1) {
          classArr.splice(containAfterHiddenRow, 1);
        }

        cellProperties.className = classArr.join(' ');
      }
    }
  };

  /**
   * Modifies the copyable range, accordingly to the provided config.
   *
   * @param {Array} ranges An array of objects defining copyable cells.
   * @returns {Array}
   */
  #onModifyCopyableRange = (ranges: Record<string, number>[]) => {
    // Ranges shouldn't be modified when `copyPasteEnabled` option is set to `true` (by default).
    if (this.getSetting('copyPasteEnabled')) {
      return ranges;
    }

    const newRanges: Record<string, number>[] = [];

    const pushRange = (startRow: number, endRow: number, startCol: number, endCol: number) => {
      newRanges.push({ startRow, endRow, startCol, endCol });
    };

    arrayEach(ranges, (range) => {
      const r = range as Record<string, number>;
      let isHidden = true;
      let rangeStart = 0;

      rangeEach(r.startRow, r.endRow, (visualRow) => {
        if (this.isHidden(visualRow)) {
          if (!isHidden) {
            pushRange(rangeStart, visualRow - 1, r.startCol, r.endCol);
          }

          isHidden = true;

        } else {
          if (isHidden) {
            rangeStart = visualRow;
          }

          if (visualRow === r.endRow) {
            pushRange(rangeStart, visualRow, r.startCol, r.endCol);
          }

          isHidden = false;
        }
      });
    });

    return newRanges;
  };

  /**
   * Adds the needed classes to the headers.
   *
   * @param {number} row Visual row index.
   * @param {HTMLElement} TH Header's TH element.
   */
  #onAfterGetRowHeader = (row: number, TH: HTMLTableCellElement) => {
    if (!this.getSetting('indicators') || row < 0) {
      return;
    }

    const classList = [];

    if (row >= 1 && this.isHidden(row - 1)) {
      classList.push('afterHiddenRow');
    }

    if (row < this.hot.countRows() - 1 && this.isHidden(row + 1)) {
      classList.push('beforeHiddenRow');
    }

    addClass(TH, classList);
  };

  /**
   * Add Show-hide rows to context menu.
   *
   * @param {object} options An array of objects containing information about the pre-defined Context Menu items.
   */
  #onAfterContextMenuDefaultOptions = (options: Record<string, unknown>) => {
    (options.items as unknown[]).push(
      {
        name: SEPARATOR
      },
      hideRowItem(this as unknown as Record<string, Function>),
      showRowItem(this as unknown as Record<string, Function>)
    );
  };

  /**
   * On map initialized hook callback.
   */
  #onMapInit() {
    const rows = this.getSetting('rows');

    if (Array.isArray(rows)) {
      this.hideRows(rows);
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#hiddenRowsMap = null;

    super.destroy();
  }
}
