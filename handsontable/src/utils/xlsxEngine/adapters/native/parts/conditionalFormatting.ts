import { isPlainObject } from '../../../../../helpers/object';
import { DROPPED_FEATURES, type DroppedFeatures } from '../../../capabilities';
import { isUnreadConditionalRuleKind, timePeriodFormula } from '../../../conditionalRules';
import { parseFiniteDoubleAttr, parseUnsignedIntAttr } from '../xml/numbers';
import type { XmlAttributes } from '../xml/tokenizer';
import { XmlWriter } from '../xml/writer';
import type { DxfStyle, StyleTable } from './styles';

/**
 * A running priority the writer hands to rules that declare none.
 */
export interface PriorityCounter {
  next: number;
}

/**
 * The `type` values the OOXML schema spells out for the ExcelJS `containsText` rule family. The
 * ExcelJS object carries `type: 'containsText'` and the real kind in `operator`.
 */
const CONTAINS_TEXT_TYPES = new Set([
  'containsText', 'containsBlanks', 'notContainsBlanks', 'containsErrors', 'notContainsErrors',
]);

/**
 * The rank a `top10` rule means when it declares none: Excel's own default.
 */
const DEFAULT_TOP10_RANK = 10;

/**
 * A rule object as the `conditionalFormatting` export option carries it. The option is public and
 * untyped, so every member is read through the accessors below rather than asserted: they
 * state the contract once instead of casting at each of the dozen places a member is read.
 */
type RuleObject = Record<string, unknown>;

/**
 * A rule member that has to be a positive whole number, or `undefined` when the rule carries
 * anything else. A `priority` and a `rank` are both `xsd:int` counts starting at 1: one `NaN`
 * priority made `maxRulePriority` answer `NaN` and every rule without its own priority was then
 * written as `priority="NaN"`, which Excel opens with the repair dialog. The reader drops the same
 * values (`cfRuleFromXml`).
 */
function readPositiveInteger(rule: RuleObject, key: string): number | undefined {
  const value = rule[key];

  return typeof value === 'number' && Number.isInteger(value) && value >= 1 ? value : undefined;
}

/**
 * A rule member that has to be a string, or `undefined` when the rule carries something else.
 */
function readString(rule: RuleObject, key: string): string | undefined {
  const value = rule[key];

  return typeof value === 'string' ? value : undefined;
}

/**
 * A rule member that has to be a differential style, or `undefined` when the rule carries something
 * else. The members themselves are read by `StyleTable#dxfIndex`, which tolerates any shape.
 */
function readStyle(rule: RuleObject, key: string): DxfStyle | undefined {
  const value = rule[key];

  return isPlainObject(value) ? (value as DxfStyle) : undefined;
}

/**
 * The highest priority any rule of the sheet declares, or 0.
 */
export function maxRulePriority(blocks: Array<{ rules: unknown[] }>): number {
  let max = 0;

  blocks.forEach(({ rules }) => rules.forEach((rule) => {
    if (isPlainObject(rule)) {
      max = Math.max(max, readPositiveInteger(rule, 'priority') ?? 0);
    }
  }));

  return max;
}

/**
 * The top-left cell of a range reference, with `$` stripped, for a synthesized formula.
 */
function topLeftOf(ref: string): string {
  return ref.split(/[\s:]/)[0].replace(/\$/g, '');
}

/**
 * The formula the containsText family means when the rule gives none.
 */
function containsTextFormula(operator: string, text: string, topLeft: string): string {
  switch (operator) {
    case 'containsBlanks': return `LEN(TRIM(${topLeft}))=0`;
    case 'notContainsBlanks': return `LEN(TRIM(${topLeft}))>0`;
    case 'containsErrors': return `ISERROR(${topLeft})`;
    case 'notContainsErrors': return `NOT(ISERROR(${topLeft}))`;
    default: return `NOT(ISERROR(SEARCH("${text.replace(/"/g, '""')}",${topLeft})))`;
  }
}

/**
 * The attributes every `<cfRule>` carries, whatever its kind. `containsText` overwrites `type`
 * with the schema name its operator spells out.
 */
type CfRuleBase = {
  type: string;
  dxfId: number | undefined;
  priority: number;
};

/**
 * What one rule writer needs besides the `XmlWriter` itself.
 */
interface CfRuleContext {
  rule: RuleObject;
  base: CfRuleBase;
  formulae: string[];
  ref: string;
  dropped: DroppedFeatures;
}

/**
 * Writes one `<cfRule>` of a known kind. `false` means nothing was written — the rule was recorded
 * in `dropped` instead.
 */
type CfRuleWriter = (w: XmlWriter, context: CfRuleContext) => boolean;

/**
 * An `expression` rule, which is nothing but its formula and so is dropped without one.
 */
const writeExpressionRule: CfRuleWriter = (w, { base, formulae, dropped }) => {
  if (formulae.length === 0) {
    dropped.record(DROPPED_FEATURES.conditionalFormattingExpression);

    return false;
  }

  w.open('cfRule', base).formulaLeaf('formula', formulae[0]).close();

  return true;
};

/**
 * A `cellIs` rule, whose operator decides how many formulae it takes.
 */
const writeCellIsRule: CfRuleWriter = (w, { rule, base, formulae }) => {
  w.open('cfRule', { ...base, operator: readString(rule, 'operator') ?? 'equal' });
  formulae.forEach(formula => w.formulaLeaf('formula', formula));
  w.close();

  return true;
};

/**
 * A `containsText` rule, written under the schema name its operator spells out, with the formula
 * that name means when the rule carries none.
 */
const writeContainsTextRule: CfRuleWriter = (w, { rule, base, formulae, ref }) => {
  const declaredOperator = readString(rule, 'operator');
  const operator = declaredOperator !== undefined && CONTAINS_TEXT_TYPES.has(declaredOperator)
    ? declaredOperator
    : 'containsText';
  const text = readString(rule, 'text') ?? '';
  const textAttr = operator === 'containsText' && text !== '' ? text : undefined;
  // `operator` is `ST_ConditionalFormattingOperator`, and of this family only `containsText` is one
  // of its values: `operator="containsBlanks"` fails schema validation. The kind is the `type`, which
  // is what both readers take it from.
  const operatorAttr = operator === 'containsText' ? operator : undefined;

  w.open('cfRule', { ...base, type: operator, operator: operatorAttr, text: textAttr });
  w.formulaLeaf('formula', formulae[0] ?? containsTextFormula(operator, text, topLeftOf(ref)));
  w.close();

  return true;
};

/**
 * A `top10` rule, which needs no formula child and is therefore written self-closing.
 */
const writeTop10Rule: CfRuleWriter = (w, { rule, base }) => {
  w.leaf('cfRule', {
    ...base,
    rank: readPositiveInteger(rule, 'rank') ?? DEFAULT_TOP10_RANK,
    percent: rule.percent === true ? '1' : undefined,
    bottom: rule.bottom === true ? '1' : undefined,
  });

  return true;
};

/**
 * An `aboveAverage` rule, which needs no formula child either.
 */
const writeAboveAverageRule: CfRuleWriter = (w, { rule, base }) => {
  w.leaf('cfRule', { ...base, aboveAverage: rule.aboveAverage === false ? '0' : undefined });

  return true;
};

/**
 * A `timePeriod` rule. With no formula of its own it gets the one its period means - the formula
 * ExcelJS builds for the documented `{ type, timePeriod, style }` shape - so it is dropped only
 * without a period, or with no formula and a period `ST_TimePeriod` does not list.
 */
const writeTimePeriodRule: CfRuleWriter = (w, { rule, base, formulae, ref, dropped }) => {
  const timePeriod = readString(rule, 'timePeriod');
  const formula = timePeriod === undefined
    ? undefined
    : formulae[0] ?? timePeriodFormula(timePeriod, topLeftOf(ref));

  if (timePeriod === undefined || formula === undefined) {
    dropped.record(DROPPED_FEATURES.conditionalFormattingTimePeriod);

    return false;
  }

  w.open('cfRule', { ...base, timePeriod }).formulaLeaf('formula', formula).close();

  return true;
};

/**
 * The rule kinds this writer supports, by the `type` the export option carries. A `Map` rather
 * than an object literal: `type` is the caller's own untrusted string, and a plain object would
 * answer `constructor` or `toString` with something inherited from `Object.prototype`.
 */
const RULE_WRITERS = new Map<string, CfRuleWriter>([
  ['expression', writeExpressionRule],
  ['cellIs', writeCellIsRule],
  ['containsText', writeContainsTextRule],
  ['top10', writeTop10Rule],
  ['aboveAverage', writeAboveAverageRule],
  ['timePeriod', writeTimePeriodRule],
]);

/**
 * The priority one rule is written with: the one it declares, or the next number of the sheet's
 * running counter, which the rule then consumes.
 */
function nextRulePriority(rule: RuleObject, priority: PriorityCounter): number {
  const declared = readPositiveInteger(rule, 'priority');

  if (declared !== undefined) {
    return declared;
  }

  const assigned = priority.next;

  priority.next += 1;

  return assigned;
}

/**
 * Writes one rule of a block, or records why it was skipped. Returns whether anything was written.
 *
 * The differential style and the running priority are resolved BEFORE the kind is looked up, so an
 * unsupported kind still registers its style and still consumes a priority number — exactly what
 * the single `switch` this dispatch replaced did.
 */
function writeRule(
  w: XmlWriter,
  candidate: unknown,
  ref: string,
  styles: StyleTable,
  priority: PriorityCounter,
  dropped: DroppedFeatures,
): boolean {
  const rule = isPlainObject(candidate) ? candidate : null;
  const type = rule === null ? undefined : readString(rule, 'type');

  if (rule === null || type === undefined) {
    dropped.record(DROPPED_FEATURES.conditionalFormattingInvalid);

    return false;
  }

  const formulae = Array.isArray(rule.formulae) ? rule.formulae.map(String) : [];
  const style = readStyle(rule, 'style');
  const dxfId = style === undefined ? undefined : styles.dxfIndex(style);
  const base: CfRuleBase = { type, dxfId, priority: nextRulePriority(rule, priority) };
  const writeKind = RULE_WRITERS.get(type);

  if (writeKind === undefined) {
    dropped.recordUnsupported('conditionalFormatting', type);

    return false;
  }

  return writeKind(w, { rule, base, formulae, ref, dropped });
}

/**
 * Serializes one `<conditionalFormatting>` block. Rule kinds outside the PoC set are recorded as
 * `conditionalFormatting:<type>` and skipped; an empty block is not written at all.
 */
export function conditionalFormattingXml(
  ref: string,
  rules: unknown[],
  styles: StyleTable,
  priority: PriorityCounter,
  dropped: DroppedFeatures,
): string {
  const w = new XmlWriter(false);
  let written = 0;

  w.open('conditionalFormatting', { sqref: ref });

  rules.forEach((candidate) => {
    if (writeRule(w, candidate, ref, styles, priority, dropped)) {
      written += 1;
    }
  });

  w.close();

  return written === 0 ? '' : w.toString();
}

/**
 * Sets a rule's `type` and `operator`: a text rule (`containsText`, `beginsWith`, ...) is carried as
 * ExcelJS carries it, `type: 'containsText'` with the XML type as its operator, plus its `text`.
 *
 * @param {object} rule The rule being rebuilt.
 * @param {string} type The `<cfRule type>` attribute.
 * @param {object} attrs The `<cfRule>` attributes.
 */
function applyRuleKind(rule: RuleObject, type: string, attrs: XmlAttributes): void {
  if (CONTAINS_TEXT_TYPES.has(type)) {
    rule.type = 'containsText';
    rule.operator = type;

    if (attrs.text !== undefined) {
      rule.text = attrs.text;
    }

    return;
  }

  rule.type = type;

  if (attrs.operator !== undefined) {
    rule.operator = attrs.operator;
  }
}

/**
 * Sets the attributes only one rule kind carries: `top10`'s rank and flags, `aboveAverage`'s
 * direction, and `timePeriod`'s period.
 *
 * @param {object} rule The rule being rebuilt.
 * @param {string} type The `<cfRule type>` attribute.
 * @param {object} attrs The `<cfRule>` attributes.
 */
function applyKindSpecificAttributes(rule: RuleObject, type: string, attrs: XmlAttributes): void {
  if (type === 'top10') {
    // A rank that is not a positive whole number (`NaN`, `2.5`, `0`) reads as the default one.
    const rank = parseUnsignedIntAttr(attrs.rank);

    rule.rank = rank !== null && rank >= 1 ? rank : DEFAULT_TOP10_RANK;
    rule.percent = attrs.percent === '1' || attrs.percent === 'true';
    rule.bottom = attrs.bottom === '1' || attrs.bottom === 'true';
  }

  if (type === 'aboveAverage') {
    rule.aboveAverage = !(attrs.aboveAverage === '0' || attrs.aboveAverage === 'false');
  }

  if (type === 'timePeriod' && attrs.timePeriod !== undefined) {
    rule.timePeriod = attrs.timePeriod;
  }
}

/**
 * Rebuilds the ExcelJS rule object for one `<cfRule>`, so a re-export can hand it back to the
 * `conditionalFormatting` option unchanged.
 */
export function cfRuleFromXml(attrs: XmlAttributes, formulae: string[], dxfs: DxfStyle[]): RuleObject {
  const type = attrs.type ?? 'expression';
  const rule: RuleObject = {};

  applyRuleKind(rule, type, attrs);

  // A priority that is not a whole number is dropped: `Number()` let `NaN` and `Infinity` through,
  // and a re-export then wrote `priority="NaN"`.
  const priority = parseFiniteDoubleAttr(attrs.priority);

  if (priority !== null && Number.isInteger(priority)) {
    rule.priority = priority;
  }

  if (formulae.length > 0) {
    rule.formulae = formulae;
  }

  applyKindSpecificAttributes(rule, type, attrs);

  // `xsd:unsignedInt`, never `Number()`: `''` read as 0 and `'1e0'` as 1, so a malformed id borrowed
  // another rule's differential style.
  const dxfId = parseUnsignedIntAttr(attrs.dxfId);

  if (dxfId !== null) {
    const style = dxfs[dxfId];

    // Shallow-copied: `dxfs[…]` is the one object `ParsedStyles` holds for this id, and every rule
    // that shares a `dxfId` would otherwise get the SAME instance — a caller mutating one rule's
    // style would mutate every other rule referencing that dxf, and the parsed styles table too.
    if (style !== undefined) {
      rule.style = { ...style };
    }
  }

  return rule;
}

/**
 * Rebuilds the rule for one `<cfRule>` as `cfRuleFromXml` does, or answers `null` - recording
 * `conditionalFormatting:<type>` - for a color scale, a data bar or an icon set. Their look lives
 * in child elements this reader does not read, and the bare `{ type, priority }` left without them
 * is a rule no writer can write: handed back to the ExcelJS export, it threw.
 */
export function readCfRule(
  attrs: XmlAttributes, formulae: string[], dxfs: DxfStyle[], dropped: DroppedFeatures,
): RuleObject | null {
  const type = attrs.type ?? 'expression';

  if (isUnreadConditionalRuleKind(type)) {
    dropped.recordUnsupported('conditionalFormatting', type);

    return null;
  }

  return cfRuleFromXml(attrs, formulae, dxfs);
}
