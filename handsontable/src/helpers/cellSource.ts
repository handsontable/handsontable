import { isKeyValueObject } from './object';
import { stringify } from './mixed';
import { stripTags } from './string';

/**
 * Reduces one choice to the text a cell displays for it: a key/value entry contributes its `value`
 * half, and tags are stripped unless the cell allows HTML.
 *
 * @param {*} choice A single entry of a cell's resolved choices.
 * @param {boolean} allowHtml Whether the cell renders its choices as HTML.
 * @returns {string} The displayed text of the choice.
 */
function toDisplayedText(choice: unknown, allowHtml: boolean): string {
  const value = isKeyValueObject(choice) ? choice.value : choice;

  return stringify(allowHtml ? value : stripTags(String(value)));
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
 *
 * @param {*} choices The cell's resolved choices. Anything but an array yields `undefined`, which
 *                    is what skips a function-based `source` - it cannot be resolved without
 *                    calling it.
 * @param {*} value The label to look up.
 * @param {boolean} [allowHtml] Whether the cell renders its choices as HTML.
 * @returns {*} The matching choice, or `undefined` when nothing matches.
 */
export function findChoiceByDisplayedValue(choices: unknown, value: unknown, allowHtml: boolean = false): unknown {
  if (!Array.isArray(choices)) {
    return undefined;
  }

  const label = stringify(value);

  return choices.find(choice => toDisplayedText(choice, allowHtml) === label);
}
