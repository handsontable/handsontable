import { isKeyValueObject, isPlainObject } from '../helpers/object';
import { stringify } from '../helpers/mixed';
import { stripTags } from '../helpers/string';

/**
 * A plain object that carries both a `key` and a `value`, the shape a cell's `source` uses to keep
 * a stored key apart from the label shown for it.
 */
export type KeyValueObject = {
  key: unknown;
  value: unknown;
};

/**
 * How a cell derives the label of a key/value entry whose `value` is an object: a property path
 * (`'name'`, `'address.city'`) or a function that receives the object and returns the label.
 */
// The function's parameter is deliberately `any`. Users type it with their own shape -
// `(airport: Airport) => airport.name` - and under `strictFunctionTypes` any narrower declared type
// rejects that: `Record<string, unknown>` is not assignable to an interface with required fields,
// and `object` leaves an untyped `value => value.name` without a `name` to read. Handsontable only
// ever calls it with the plain object found in `source`, which the user declared themselves.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SourceLabel = string | ((value: any) => unknown);

/**
 * Type-guard form of `isKeyValueObject()`, so a caller can read `key` and `value` without a cast.
 *
 * It lives here rather than beside `isKeyValueObject()` in `helpers/object.ts` for the same reason
 * this whole module does: `index.ts` spreads that module onto `Handsontable.helper` and `base.ts`
 * types the namespace as `typeof import('./helpers/object')`, so anything exported there is public
 * API forever. `isKeyValueObject()` keeps its `boolean` return for exactly that reason - narrowing
 * it would reject a consumer reading any other property after the check - and this wrapper adds the
 * narrowing for internal callers without adding a second public helper. It delegates rather than
 * repeating the shape test, so the two can never disagree.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
export function isKeyValueEntry(value: unknown): value is KeyValueObject {
  return isKeyValueObject(value);
}

/**
 * Derives the label of a key/value entry's `value` half, following the cell's `sourceLabel` option.
 *
 * Only an object `value` is relabeled. A primitive one is already a label and comes back as it is,
 * so a source mixing string labels with object ones keeps its string labels. Without `sourceLabel`
 * an object comes back unchanged too - the behavior from before the option existed.
 *
 * @param {*} value The `value` half of a key/value entry.
 * @param {string|Function} [sourceLabel] A property path, or a function returning the label.
 * @returns {*} The label to display for `value`.
 */
export function getChoiceLabel(value: unknown, sourceLabel?: SourceLabel): unknown {
  if (!isPlainObject(value) || !sourceLabel) {
    return value;
  }

  if (typeof sourceLabel === 'function') {
    return sourceLabel(value);
  }

  // The settings are not type-checked at runtime, so a plain JS `sourceLabel: true` or
  // `['address', 'city']` reaches here too. This runs on every render, sort, filter, and export of
  // the cell, so an unusable option leaves the value as it is rather than throwing on `.split()`.
  if (typeof sourceLabel !== 'string') {
    return value;
  }

  // Not `getProperty()` from `helpers/object`: it indexes into whatever the previous segment held,
  // so a `null` midway (`address.city` on `{ address: null }`) throws - and this runs on every render
  // of the cell. A segment that is not an object or an array ends the walk with `undefined` instead.
  // Arrays are walked by index, so `'aliases.0'` and `'addresses.0.city'` work as dot notation reads.
  return sourceLabel.split('.').reduce<unknown>(
    (current, segment) => (isPlainObject(current) || Array.isArray(current)
      ? (current as Record<string, unknown>)[segment]
      : undefined),
    value,
  );
}

/**
 * Reports whether a list of choices offers the choice at all. Under `sourceLabel`, a key/value entry
 * whose object `value` labels as nothing - a missing property, or a function returning `null` - is
 * left out: it would list as a blank option that a pick could never store. Every other choice is
 * listed. The editor's option list and the exported XLSX validation list both use it, so the two
 * offer the same options.
 *
 * @param {*} choice A single entry of a cell's resolved choices.
 * @param {string|Function} [sourceLabel] The cell's `sourceLabel` option.
 * @returns {boolean}
 */
export function isListableChoice(choice: unknown, sourceLabel?: SourceLabel): boolean {
  if (!sourceLabel || !isKeyValueEntry(choice) || !isPlainObject(choice.value)) {
    return true;
  }

  return isListableLabel(choice, sourceLabel, getChoiceLabel(choice.value, sourceLabel));
}

/**
 * {@link isListableChoice} for a caller that already resolved the choice's label, so a `sourceLabel`
 * function runs once per entry rather than twice.
 *
 * @param {*} choice A single entry of a cell's resolved choices.
 * @param {string|Function|undefined} sourceLabel The cell's `sourceLabel` option.
 * @param {*} label What `getChoiceLabel()` returned for the choice's `value`.
 * @returns {boolean}
 */
export function isListableLabel(choice: unknown, sourceLabel: SourceLabel | undefined, label: unknown): boolean {
  if (!sourceLabel || !isKeyValueEntry(choice) || !isPlainObject(choice.value)) {
    return true;
  }

  return stringify(label) !== '';
}

/**
 * Reduces one choice to the text a cell displays for it: a key/value entry contributes its `value`
 * half (relabeled by `sourceLabel` when it is an object), and tags are stripped unless the cell
 * allows HTML.
 *
 * @param {*} choice A single entry of a cell's resolved choices.
 * @param {boolean} allowHtml Whether the cell renders its choices as HTML.
 * @param {string|Function} [sourceLabel] The cell's `sourceLabel` option.
 * @returns {string} The displayed text of the choice.
 */
function toDisplayedText(choice: unknown, allowHtml: boolean, sourceLabel?: SourceLabel): string {
  const value = isKeyValueEntry(choice) ? getChoiceLabel(choice.value, sourceLabel) : choice;
  // `stringify()` first, then strip - never `String()`. `String(null)` is `'null'`, so a choice
  // carrying `value: null` would claim the displayed text `'null'`, matching a paste of that
  // literal word and never matching the empty text the cell actually shows for it. `stringify()`
  // turns `null` and `undefined` into `''`, which is what the renderer and the lookup label below
  // both use, so the two halves of this branch agree.
  const text = stringify(value);

  return allowHtml ? text : stripTags(text);
}

/**
 * Reports whether a cell's resolved choices hold key/value entries at all.
 *
 * Cheap on purpose: it reads the entries' own shape and does no string work, so a caller that only
 * cares about key/value sources can skip {@link findChoiceByDisplayedValue} entirely rather than
 * paying a `stripTags` pass per choice per cell on a bulk write.
 *
 * @param {*} choices The cell's resolved choices.
 * @returns {boolean}
 */
export function hasKeyValueChoices(choices: unknown): boolean {
  return Array.isArray(choices) && choices.some(isKeyValueEntry);
}

/**
 * Finds the entry of a cell's resolved choices whose displayed text equals `value`, and returns it
 * unchanged - so a key/value entry comes back whole, with its `key`.
 *
 * This is the single rule that maps a bare label back to the choice it came from. The autocomplete
 * editor uses it to turn typed text into a cell value, and the autocomplete/dropdown `valueSetter`
 * uses it for text that arrives any other way - a `text/plain` paste, or `setDataAtCell()`. Keeping
 * one implementation is the point: the editor resolved a label while every other write path did
 * not, which is what let a pasted label store a bare string among key/value objects (DEV-57).
 *
 * Comparison is textual, matching what the user sees, so a numeric choice matches its string label.
 * When several entries display the same text, the first one in `source` order wins: the label is
 * all a pick or a paste carries, so the entries behind it cannot be told apart.
 *
 * The result is deliberately not memoized. A `source` array can be mutated in place by the host
 * application, and a cached displayed-text map would then resolve a label to an option that is no
 * longer offered - a silent wrong value, which is worse than the scan it saves. Callers that only
 * need key/value sources gate on {@link hasKeyValueChoices} instead.
 *
 * @param {*} choices The cell's resolved choices. Anything but an array yields `undefined`, which
 *                    is what skips a function-based `source` - it cannot be resolved without
 *                    calling it.
 * @param {*} value The label to look up.
 * @param {boolean} [allowHtml] Whether the cell renders its choices as HTML.
 * @param {string|Function} [sourceLabel] The cell's `sourceLabel` option, which labels an object
 *                                         `value`.
 * @returns {*} The matching choice, or `undefined` when nothing matches.
 */
export function findChoiceByDisplayedValue(
  choices: unknown,
  value: unknown,
  allowHtml: boolean = false,
  sourceLabel?: SourceLabel,
): unknown {
  if (!Array.isArray(choices)) {
    return undefined;
  }

  const label = stringify(value);

  return choices.find(choice => toDisplayedText(choice, allowHtml, sourceLabel) === label);
}
