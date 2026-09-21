import { isObject } from '../../../../../helpers/object';
import type { DroppedFeatures } from '../../../capabilities';
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
 * A rule object as the `conditionalFormatting` export option carries it.
 */
type RuleObject = Record<string, unknown>;

/**
 * The highest priority any rule of the sheet declares, or 0.
 */
export function maxRulePriority(blocks: Array<{ rules: unknown[] }>): number {
  let max = 0;

  blocks.forEach(({ rules }) => rules.forEach((rule) => {
    if (isObject(rule) && typeof (rule as RuleObject).priority === 'number') {
      max = Math.max(max, (rule as RuleObject).priority as number);
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
    if (!isObject(candidate) || typeof (candidate as RuleObject).type !== 'string') {
      dropped.record('conditionalFormatting:invalid');

      return;
    }

    const rule = candidate as RuleObject;
    const type = rule.type as string;
    const formulae = Array.isArray(rule.formulae) ? (rule.formulae as unknown[]).map(String) : [];
    const dxfId = isObject(rule.style) ? styles.dxfIndex(rule.style as DxfStyle) : undefined;
    let rulePriority: number;

    if (typeof rule.priority === 'number') {
      rulePriority = rule.priority;
    } else {
      rulePriority = priority.next;
      priority.next += 1;
    }

    const base = { type, dxfId, priority: rulePriority };

    switch (type) {
      case 'expression':
        if (formulae.length === 0) {
          dropped.record('conditionalFormatting:expression');

          return;
        }

        w.open('cfRule', base).leaf('formula', undefined, formulae[0]).close();
        break;
      case 'cellIs':
        w.open('cfRule', { ...base, operator: typeof rule.operator === 'string' ? rule.operator : 'equal' });
        formulae.forEach(formula => w.leaf('formula', undefined, formula));
        w.close();
        break;
      case 'containsText': {
        const operator = typeof rule.operator === 'string' && CONTAINS_TEXT_TYPES.has(rule.operator)
          ? rule.operator
          : 'containsText';
        const text = typeof rule.text === 'string' ? rule.text : '';
        const textAttr = operator === 'containsText' && text !== '' ? text : undefined;

        w.open('cfRule', { ...base, type: operator, operator, text: textAttr });
        w.leaf('formula', undefined, formulae[0] ?? containsTextFormula(operator, text, topLeftOf(ref)));
        w.close();
        break;
      }
      case 'top10':
        w.leaf('cfRule', {
          ...base,
          rank: typeof rule.rank === 'number' ? rule.rank : 10,
          percent: rule.percent === true ? '1' : undefined,
          bottom: rule.bottom === true ? '1' : undefined,
        });
        break;
      case 'aboveAverage':
        w.leaf('cfRule', { ...base, aboveAverage: rule.aboveAverage === false ? '0' : undefined });
        break;
      case 'timePeriod':
        if (formulae.length === 0 || typeof rule.timePeriod !== 'string') {
          dropped.record('conditionalFormatting:timePeriod');

          return;
        }

        w.open('cfRule', { ...base, timePeriod: rule.timePeriod }).leaf('formula', undefined, formulae[0]).close();
        break;
      default:
        dropped.record(`conditionalFormatting:${type}`);

        return;
    }

    written += 1;
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
    rule.rank = attrs.rank === undefined ? 10 : Number(attrs.rank);
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

    if (style !== undefined) {
      rule.style = style;
    }
  }

  return rule;
}
