import type { default as Settings } from '../settings';
import type { RowSizeSource, ColumnSizeSource } from './axisSizeSource';

/**
 * The engine's own row-size source. Reads the row-height settings/defaults straight from `Settings`,
 * exactly as `RowUtils` did before the port existed. In Handsontable those settings are the size
 * funnel callbacks (`rowHeight`, `rowHeightByOverlayName`), so this one source serves both the
 * embedded and the pure-Walkontable cases.
 */
export class DefaultRowSizeSource implements RowSizeSource {
  /**
   * The Walkontable settings.
   *
   * @type {Settings}
   */
  #wtSettings: Settings;

  /**
   * @param {Settings} wtSettings The Walkontable settings.
   */
  constructor(wtSettings: Settings) {
    this.#wtSettings = wtSettings;
  }

  /**
   * @param {number} sourceIndex The source index of the row.
   * @returns {number | undefined}
   */
  getSize(sourceIndex: number): number | undefined {
    return this.#wtSettings.getSetting<number | undefined>('rowHeight', sourceIndex);
  }

  /**
   * @param {number} sourceIndex The source index of the row.
   * @param {string} overlayName The overlay name.
   * @returns {number | undefined}
   */
  getSizeForOverlay(sourceIndex: number, overlayName: string): number | undefined {
    return this.#wtSettings.getSetting<number | undefined>('rowHeightByOverlayName', sourceIndex, overlayName);
  }

  /**
   * @returns {number}
   */
  getDefaultSize(): number {
    return this.#wtSettings.getSetting('stylesHandler').getDefaultRowHeight();
  }

  /**
   * @returns {boolean}
   */
  isUniform(): boolean {
    return this.#wtSettings.getSetting<boolean>('rowHeightsUniform');
  }
}

/**
 * The engine's own column-size source. Reads the column-width settings/defaults straight from
 * `Settings`, exactly as `ColumnUtils` did before the port existed.
 */
export class DefaultColumnSizeSource implements ColumnSizeSource {
  /**
   * The Walkontable settings.
   *
   * @type {Settings}
   */
  #wtSettings: Settings;

  /**
   * @param {Settings} wtSettings The Walkontable settings.
   */
  constructor(wtSettings: Settings) {
    this.#wtSettings = wtSettings;
  }

  /**
   * @param {number} sourceIndex The source index of the column.
   * @returns {number | undefined}
   */
  getSize(sourceIndex: number): number | undefined {
    return this.#wtSettings.getSetting<number | undefined>('columnWidth', sourceIndex);
  }

  /**
   * @returns {number}
   */
  getDefaultSize(): number {
    return this.#wtSettings.getSetting<number>('defaultColumnWidth');
  }

  /**
   * @returns {boolean}
   */
  isUniform(): boolean {
    return this.#wtSettings.getSetting<boolean>('columnWidthsUniform');
  }
}
