import { DROPPED_FEATURES, type DroppedFeatures } from './capabilities';

/**
 * Whether a conditional formatting rule is one a writer can express, recording why when it is not.
 *
 * The rules are the export option's own, untrusted objects. The native writer judges every rule
 * while it writes it (`parts/conditionalFormatting.ts`); the ExcelJS adapter screens the rules with
 * this before ExcelJS sees them, so both engines drop the same malformed rules under the same
 * names. Unscreened, ExcelJS threw on two of them - `Cannot create property 'priority' on string`
 * for a rule that is not an object, `Cannot read properties of undefined (reading '0')` for an
 * `expression` with no formula - and wrote a formula of its own for a `timePeriod` with none.
 *
 * - A rule that is not an object, or carries no string `type`: `conditionalFormatting:invalid`.
 * - An `expression` rule with no formula: `conditionalFormatting:expression`.
 * - A `timePeriod` rule with no formula or no period: `conditionalFormatting:timePeriod`.
 *
 * Every other rule passes, including the kinds only ExcelJS writes (data bars, color scales).
 *
 * @param {*} candidate The rule.
 * @param {DroppedFeatures} dropped Where a refusal is recorded.
 * @returns {boolean}
 */
export function isWritableConditionalRule(candidate: unknown, dropped: DroppedFeatures): boolean {
  if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
    dropped.record(DROPPED_FEATURES.conditionalFormattingInvalid);

    return false;
  }

  const { type, formulae, timePeriod } = candidate as { type?: unknown; formulae?: unknown; timePeriod?: unknown };
  const hasFormula = Array.isArray(formulae) && formulae.length > 0;

  if (typeof type !== 'string') {
    dropped.record(DROPPED_FEATURES.conditionalFormattingInvalid);

    return false;
  }

  if (type === 'expression' && !hasFormula) {
    dropped.record(DROPPED_FEATURES.conditionalFormattingExpression);

    return false;
  }

  if (type === 'timePeriod' && (!hasFormula || typeof timePeriod !== 'string')) {
    dropped.record(DROPPED_FEATURES.conditionalFormattingTimePeriod);

    return false;
  }

  return true;
}
