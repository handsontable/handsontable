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
 * The feature names a dropped-feature report may carry, declared once because both adapters and
 * `importFile` raise them and they are public output: they land on `ImportResult.dropped` and in
 * the console warning, and the guides' dropped-features tables document them one for one. A typo
 * at one of those sites would otherwise produce a different result key for the same condition,
 * with nothing to catch it — so every site names a member of this object rather than a literal.
 */
export const DROPPED_FEATURES = {
  // Raised by both adapters, on either direction: the four read names come from the native
  // reader's `DROPPED_ON_OPEN` and from the ExcelJS adapter's own scan of the same parts.
  autoFilter: 'autoFilter',
  hyperlink: 'hyperlink',
  images: 'images',
  mergeOverlap: 'merge:overlap',
  richText: 'richText',
  sheetProtectionPassword: 'sheetProtection:password',
  tables: 'tables',
  // Raised by the native writer only: ExcelJS honors a compression level, and it hands its own
  // conditional-formatting descriptors straight to its writer without judging them.
  compressionLevel: 'compressionLevel',
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
 * A name `record()` accepts: one of the declared names and nothing else. The three families whose
 * tail is the file's own value are NOT part of it — they go through `recordUnsupported()`, which
 * builds the name from a declared group, so a hand-written `conditionalFormatting:unparsedRefs`
 * cannot type-check its way into the result the way a `` `conditionalFormatting:${string}` ``
 * member of this union let it.
 */
export type DroppedFeatureName = typeof DROPPED_FEATURES[keyof typeof DROPPED_FEATURES];

/**
 * The feature groups whose dropped name ends in a value read from the file rather than in a name
 * this module declares: an unsupported validation type, an unsupported conditional-formatting rule
 * kind, and a number format with no `Intl.NumberFormat` equivalent. The tail is genuinely
 * data-driven — it is whatever the workbook wrote — so it cannot be enumerated here, and the group
 * in front of it is what stays checked.
 */
export type DroppedFeatureGroup = 'conditionalFormatting' | 'dataValidation' | 'numFmt';

/**
 * How many characters of a file-controlled value a dropped-feature name may carry. The value is a
 * raw attribute the workbook wrote, so one `<cfRule type="…10 MB of text…"/>` otherwise put ten
 * megabytes into the map key, into `ImportResult.dropped` and into a console warning.
 */
const MAX_UNSUPPORTED_VALUE_LENGTH = 64;

/**
 * How many DISTINCT file-driven names one read may record. N rules carrying N different types
 * otherwise produced N map entries and N segments of one warning string; everything past the cap
 * lands in the group's `other` bucket, which still counts every occurrence.
 */
const MAX_UNSUPPORTED_NAMES = 32;

/**
 * The value a file-driven name carries once the cap on distinct names is reached.
 */
const OTHER_UNSUPPORTED_VALUE = 'other';

/**
 * Trims a file-controlled value to what a dropped-feature name may carry: at most
 * `MAX_UNSUPPORTED_VALUE_LENGTH` characters, with every control character replaced, so neither the
 * public result nor the console warning can be steered by the workbook's own text.
 *
 * The cut is made on a CODE POINT boundary, not on a code unit. Slicing code units puts a lone
 * surrogate into `ImportResult.dropped` and into the console warning whenever an astral character
 * straddles the cut \u2014 the same unpaired code unit the tokenizer refuses to produce from a numeric
 * character reference, arriving through the one door the file's own text still comes in by. The
 * control-character sweep below cannot catch it either, because a surrogate is neither C0 nor C1.
 */
function boundUnsupportedValue(value: string): string {
  const codePoints = Array.from(value);
  const clipped = codePoints.length > MAX_UNSUPPORTED_VALUE_LENGTH
    ? `${codePoints.slice(0, MAX_UNSUPPORTED_VALUE_LENGTH - 1).join('')}\u2026`
    : value;
  let safe = '';

  for (let index = 0; index < clipped.length; index++) {
    const code = clipped.charCodeAt(index);

    safe += (code < 0x20 || (code >= 0x7F && code <= 0x9F)) ? '\uFFFD' : clipped.charAt(index);
  }

  return safe;
}

/**
 * Collects the features an adapter was asked for but could not honor, and reports them once.
 */
export class DroppedFeatures {
  /**
   * Feature name → how many times it was requested.
   */
  #counts = new Map<string, number>();

  /**
   * How many DISTINCT file-driven names were recorded. Counted apart from `#counts.size` so the
   * names this module declares never eat into the budget the file's own values are given.
   */
  #unsupportedNames = 0;

  /**
   * Records one dropped occurrence of a feature.
   */
  record(feature: DroppedFeatureName): void {
    this.#counts.set(feature, (this.#counts.get(feature) ?? 0) + 1);
  }

  /**
   * Records one dropped occurrence of a feature named `<group>:<value>`, where the value is read
   * from the file. The group is checked, the value is not — which is the whole reason this is a
   * separate entry point rather than a wider `record()` parameter.
   *
   * Both halves of "not checked" are bounded here, because this is the one door the file's own text
   * comes through and everything else this engine reads from a file already has a cap. The value is
   * trimmed and its control characters replaced, and once `MAX_UNSUPPORTED_NAMES` distinct names
   * have been recorded the rest of them count into `<group>:other` instead of adding a key. Nothing
   * is lost that a caller can act on: the count still rises, and the guides document the bucket.
   */
  recordUnsupported(group: DroppedFeatureGroup, value: string): void {
    const bounded = `${group}:${boundUnsupportedValue(value)}`;
    const isNew = !this.#counts.has(bounded);

    if (isNew && this.#unsupportedNames >= MAX_UNSUPPORTED_NAMES) {
      const bucket = `${group}:${OTHER_UNSUPPORTED_VALUE}`;

      this.#counts.set(bucket, (this.#counts.get(bucket) ?? 0) + 1);

      return;
    }

    if (isNew) {
      this.#unsupportedNames += 1;
    }

    this.#counts.set(bounded, (this.#counts.get(bounded) ?? 0) + 1);
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
