import { isPlainObject } from '../../../../../helpers/object';
import { DROPPED_FEATURES, type DroppedFeatures } from '../../../capabilities';
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
 * untyped, so every member is read through the three accessors below rather than asserted: they
 * state the contract once instead of casting at each of the dozen places a member is read.
 */
type RuleObject = Record<string, unknown>;

/**
 * A rule member that has to be a number, or `undefined` when the rule carries something else.
 */
function readNumber(rule: RuleObject, key: string): number | undefined {
  const value = rule[key];

  return typeof value === 'number' ? value : undefined;
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
      max = Math.max(max, readNumber(rule, 'priority') ?? 0);
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

  w.open('cfRule', base).leaf('formula', undefined, formulae[0]).close();

  return true;
};

/**
 * A `cellIs` rule, whose operator decides how many formulae it takes.
 */
const writeCellIsRule: CfRuleWriter = (w, { rule, base, formulae }) => {
  w.open('cfRule', { ...base, operator: readString(rule, 'operator') ?? 'equal' });
  formulae.forEach(formula => w.leaf('formula', undefined, formula));
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

  w.open('cfRule', { ...base, type: operator, operator, text: textAttr });
  w.leaf('formula', undefined, formulae[0] ?? containsTextFormula(operator, text, topLeftOf(ref)));
  w.close();

  return true;
};

/**
 * A `top10` rule, which needs no formula child and is therefore written self-closing.
 */
const writeTop10Rule: CfRuleWriter = (w, { rule, base }) => {
  w.leaf('cfRule', {
    ...base,
    rank: readNumber(rule, 'rank') ?? DEFAULT_TOP10_RANK,
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
 * A `timePeriod` rule, which is dropped without both its period and its formula.
 */
const writeTimePeriodRule: CfRuleWriter = (w, { rule, base, formulae, dropped }) => {
  const timePeriod = readString(rule, 'timePeriod');

  if (formulae.length === 0 || timePeriod === undefined) {
    dropped.record(DROPPED_FEATURES.conditionalFormattingTimePeriod);

    return false;
  }

  w.open('cfRule', { ...base, timePeriod }).leaf('formula', undefined, formulae[0]).close();

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
  const declared = readNumber(rule, 'priority');

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
 * Rebuilds the ExcelJS rule object for one `<cfRule>`, so a re-export can hand it back to the
 * `conditionalFormatting` option unchanged.
 */
export function cfRuleFromXml(attrs: XmlAttributes, formulae: string[], dxfs: DxfStyle[]): RuleObject {
  const type = attrs.type ?? 'expression';
  const rule: RuleObject = {};

  if (CONTAINS_TEXT_TYPES.has(type)) {
    rule.type = 'containsText';
    rule.operator = type;

    if (attrs.text !== undefined) {
      rule.text = attrs.text;
    }
  } else {
    rule.type = type;

    if (attrs.operator !== undefined) {
      rule.operator = attrs.operator;
    }
  }

  if (attrs.priority !== undefined) {
    rule.priority = Number(attrs.priority);
  }

  if (formulae.length > 0) {
    rule.formulae = formulae;
  }

  if (type === 'top10') {
    rule.rank = attrs.rank === undefined ? DEFAULT_TOP10_RANK : Number(attrs.rank);
    rule.percent = attrs.percent === '1' || attrs.percent === 'true';
    rule.bottom = attrs.bottom === '1' || attrs.bottom === 'true';
  }

  if (type === 'aboveAverage') {
    rule.aboveAverage = !(attrs.aboveAverage === '0' || attrs.aboveAverage === 'false');
  }

  if (type === 'timePeriod' && attrs.timePeriod !== undefined) {
    rule.timePeriod = attrs.timePeriod;
  }

  if (attrs.dxfId !== undefined) {
    const style = dxfs[Number(attrs.dxfId)];

    // Shallow-copied: `dxfs[…]` is the one object `ParsedStyles` holds for this id, and every rule
    // that shares a `dxfId` would otherwise get the SAME instance — a caller mutating one rule's
    // style would mutate every other rule referencing that dxf, and the parsed styles table too.
    if (style !== undefined) {
      rule.style = { ...style };
    }
  }

  return rule;
}
