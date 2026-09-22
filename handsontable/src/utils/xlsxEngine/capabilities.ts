import { warn } from '../../helpers/console';

/**
 * The engines the xlsx code paths know how to drive. ExcelJS is injected through `engines`; `native`
 * is the built-in engine used when nothing is injected.
 */
export type XlsxEngineKind = 'exceljs' | 'native';

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
  native: {
    styles: true,
    conditionalFormatting: true,
    dataValidation: true,
    perCellProtection: true,
    comments: true,
    freezePanes: true,
    rtl: true,
    // The Web CompressionStream has no level parameter: `false` stores, anything else deflates.
    compressionLevel: false,
    readFormats: ['xlsx'],
  },
};

/**
 * The feature names an adapter may report as dropped, declared once because both adapters raise
 * them and they are public output: they land on `ImportResult.dropped` and in the console warning,
 * and the guides' dropped-features tables document them one for one. A typo in one adapter would
 * otherwise produce a different result key for the same condition, with nothing to catch it.
 */
export const DROPPED_FEATURES = {
  // Raised by both adapters, on either direction.
  autoFilter: 'autoFilter',
  compressionLevel: 'compressionLevel',
  hyperlink: 'hyperlink',
  images: 'images',
  mergeOverlap: 'merge:overlap',
  richText: 'richText',
  sheetProtectionPassword: 'sheetProtection:password',
  tables: 'tables',
  conditionalFormattingInvalid: 'conditionalFormatting:invalid',
  conditionalFormattingExpression: 'conditionalFormatting:expression',
  conditionalFormattingTimePeriod: 'conditionalFormatting:timePeriod',
  // Raised by `importFile`, above whatever the engine already reported.
  cellStyles: 'cellStyles',
  cellStylesBorders: 'cellStyles:borders',
  comments: 'comments',
  conditionalFormattingUnparsedRef: 'conditionalFormatting:unparsedRef',
  dataValidationUnresolvedList: 'dataValidation:unresolvedList',
  formulaOutOfRange: 'formula:outOfRange',
  layoutDirection: 'layoutDirection',
} as const;

/**
 * A name `record()` accepts: one of the declared names, or one of the three families whose tail is
 * the file's own value — an unsupported validation type, an unsupported rule kind, and a number
 * format with no `Intl.NumberFormat` equivalent.
 */
export type DroppedFeatureName =
  | typeof DROPPED_FEATURES[keyof typeof DROPPED_FEATURES]
  | `dataValidation:${string}`
  | `conditionalFormatting:${string}`
  | `numFmt:${string}`;

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
  record(feature: DroppedFeatureName): void {
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
