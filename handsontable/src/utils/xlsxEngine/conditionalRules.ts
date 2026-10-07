import { DROPPED_FEATURES, type DroppedFeatures } from './capabilities';

/**
 * The rule kinds whose look lives in child elements (`<colorScale>`, `<dataBar>`, `<iconSet>`)
 * rather than in a formula and a differential style. ExcelJS renders each from the rule's `cfvo`
 * list (and a color scale from its `color` list too), and throws when the list is missing.
 */
const CFVO_RULE_KINDS = new Set(['colorScale', 'dataBar', 'iconSet']);

/**
 * Builds a `timePeriod` formula from the top-left cell of the rule's range.
 */
type FormulaOf = (tl: string) => string;

/**
 * The formula Excel stores for each `timePeriod` period, by the period. The same text ExcelJS
 * builds (`getTimePeriodFormula` in `cf-rule-xform.js`), so a rule that carries no formula of its
 * own is written identically by both engines. The keys are the whole of `ST_TimePeriod`.
 */
const TIME_PERIOD_FORMULAS: ReadonlyMap<string, FormulaOf> = new Map([
  ['thisWeek', (tl: string) => `AND(TODAY()-ROUNDDOWN(${tl},0)<=WEEKDAY(TODAY())-1,`
    + `ROUNDDOWN(${tl},0)-TODAY()<=7-WEEKDAY(TODAY()))`],
  ['lastWeek', (tl: string) => `AND(TODAY()-ROUNDDOWN(${tl},0)>=(WEEKDAY(TODAY())),`
    + `TODAY()-ROUNDDOWN(${tl},0)<(WEEKDAY(TODAY())+7))`],
  ['nextWeek', (tl: string) => `AND(ROUNDDOWN(${tl},0)-TODAY()>(7-WEEKDAY(TODAY())),`
    + `ROUNDDOWN(${tl},0)-TODAY()<(15-WEEKDAY(TODAY())))`],
  ['yesterday', (tl: string) => `FLOOR(${tl},1)=TODAY()-1`],
  ['today', (tl: string) => `FLOOR(${tl},1)=TODAY()`],
  ['tomorrow', (tl: string) => `FLOOR(${tl},1)=TODAY()+1`],
  ['last7Days', (tl: string) => `AND(TODAY()-FLOOR(${tl},1)<=6,FLOOR(${tl},1)<=TODAY())`],
  ['lastMonth', (tl: string) => `AND(MONTH(${tl})=MONTH(EDATE(TODAY(),0-1)),YEAR(${tl})=YEAR(EDATE(TODAY(),0-1)))`],
  ['thisMonth', (tl: string) => `AND(MONTH(${tl})=MONTH(TODAY()),YEAR(${tl})=YEAR(TODAY()))`],
  ['nextMonth', (tl: string) => `AND(MONTH(${tl})=MONTH(EDATE(TODAY(),0+1)),YEAR(${tl})=YEAR(EDATE(TODAY(),0+1)))`],
]);

/**
 * The formula a `timePeriod` rule means for a period, relative to the top-left cell of the range
 * it formats, or `undefined` for a period `ST_TimePeriod` does not list.
 *
 * @param {string} period The rule's `timePeriod`.
 * @param {string} topLeft The top-left cell of the rule's range, without `$` (for example `A1`).
 * @returns {string|undefined}
 */
export function timePeriodFormula(period: string, topLeft: string): string | undefined {
  return TIME_PERIOD_FORMULAS.get(period)?.(topLeft);
}

/**
 * Whether a conditional formatting rule is one a writer can express, recording why when it is not.
 *
 * The rules are the export option's own, untrusted objects. The native writer judges every rule
 * while it writes it (`parts/conditionalFormatting.ts`); the ExcelJS adapter screens the rules with
 * this before ExcelJS sees them, so both engines drop the same malformed rules under the same
 * names. Unscreened, ExcelJS threw on them - `Cannot create property 'priority' on string` for a
 * rule that is not an object, `Cannot read properties of undefined (reading '0')` for an
 * `expression` with no formula, `Cannot read properties of undefined (reading 'forEach')` for a
 * color scale, data bar or icon set with no `cfvo`.
 *
 * - A rule that is not an object, or carries no string `type`: `conditionalFormatting:invalid`.
 * - An `expression` rule with no formula: `conditionalFormatting:expression`.
 * - A `timePeriod` rule with no string period, or with no formula and a period `ST_TimePeriod`
 * does not list: `conditionalFormatting:timePeriod`. A known period needs no formula: both
 * writers build the one ExcelJS documents (`timePeriodFormula`).
 * - A `colorScale`, `dataBar` or `iconSet` rule with no `cfvo` list (a color scale also with no
 * `color` list): `conditionalFormatting:<type>`.
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

  const {
    type, formulae, timePeriod, cfvo, color,
  } = candidate as { type?: unknown; formulae?: unknown; timePeriod?: unknown; cfvo?: unknown; color?: unknown };
  const hasFormula = Array.isArray(formulae) && formulae.length > 0;

  if (typeof type !== 'string') {
    dropped.record(DROPPED_FEATURES.conditionalFormattingInvalid);

    return false;
  }

  if (type === 'expression' && !hasFormula) {
    dropped.record(DROPPED_FEATURES.conditionalFormattingExpression);

    return false;
  }

  const isUnknownPeriod = typeof timePeriod !== 'string' || !TIME_PERIOD_FORMULAS.has(timePeriod);

  if (type === 'timePeriod' && (typeof timePeriod !== 'string' || (!hasFormula && isUnknownPeriod))) {
    dropped.record(DROPPED_FEATURES.conditionalFormattingTimePeriod);

    return false;
  }

  if (CFVO_RULE_KINDS.has(type) && (!Array.isArray(cfvo) || (type === 'colorScale' && !Array.isArray(color)))) {
    dropped.recordUnsupported('conditionalFormatting', type);

    return false;
  }

  return true;
}

/**
 * Whether a `<cfRule type>` is a kind the native reader does not rebuild: its look lives in child
 * elements (`<colorScale>`, `<dataBar>`, `<iconSet>`) the reader does not read, and the bare
 * `{ type, priority }` it would rebuild is a rule no writer can write.
 *
 * @param {string} type The `<cfRule type>` attribute.
 * @returns {boolean}
 */
export function isUnreadConditionalRuleKind(type: string): boolean {
  return CFVO_RULE_KINDS.has(type);
}
