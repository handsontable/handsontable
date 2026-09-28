import { warn } from '../../helpers/console';

/**
 * The engines the xlsx code paths know how to drive. ExcelJS is the only one today; a second engine
 * adds its kind here and its row to `CAPABILITIES`.
 */
export type XlsxEngineKind = 'exceljs';

/**
 * What an engine can honor when writing or recover when reading.
 */
export interface XlsxEngineCapabilities {
  styles: boolean;
  conditionalFormatting: boolean;
  dataValidation: boolean;
  perCellProtection: boolean;
  comments: boolean;
  freezePanes: boolean;
  rtl: boolean;
  compressionLevel: boolean;
  readFormats: string[];
}

/**
 * Static capability table, one row per engine kind.
 */
export const CAPABILITIES: Record<XlsxEngineKind, XlsxEngineCapabilities> = {
  exceljs: {
    styles: true,
    conditionalFormatting: true,
    dataValidation: true,
    perCellProtection: true,
    comments: true,
    freezePanes: true,
    rtl: true,
    compressionLevel: true,
    readFormats: ['xlsx'],
  },
};

/**
 * Collects the features an adapter was asked for but could not honor, and reports them once.
 */
export class DroppedFeatures {
  /**
   * Feature name → how many times it was requested.
   */
  #counts = new Map<string, number>();

  /**
   * Records one dropped occurrence of a feature.
   */
  record(feature: string): void {
    this.#counts.set(feature, (this.#counts.get(feature) ?? 0) + 1);
  }

  /**
   * How many times a feature was dropped.
   */
  count(feature: string): number {
    return this.#counts.get(feature) ?? 0;
  }

  /**
   * The distinct dropped features, in first-seen order.
   */
  list(): string[] {
    return Array.from(this.#counts.keys());
  }

  /**
   * Emits one warning naming the engine and every dropped feature. Silent when nothing was dropped.
   */
  warn(kind: XlsxEngineKind): void {
    const features = this.list();

    if (features.length === 0) {
      return;
    }

    warn(`The "${kind}" xlsx engine dropped features it cannot write or read: ${features.join(', ')}.`);
  }
}
