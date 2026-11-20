import { replaceStringLiteral } from './string-literal.mjs';

/**
 * Rename the key of an object property, keeping the quote style of a quoted key and the value. A shorthand
 * property (`{ columnHeaders }`) becomes `colHeaders: columnHeaders`.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} path NodePath of the property.
 * @param {string} from Old key.
 * @param {string} to New key.
 * @returns {void}
 */
export function renameKey(j, path, from, to) {
  const { node } = path;

  if (node.shorthand) {
    node.shorthand = false;
    node.value = j.identifier(from);
    node.key = j.identifier(to);
  } else if (node.key.type === 'Identifier') {
    node.key = j.identifier(to);
  } else {
    replaceStringLiteral(j, path.get('key'), text => text.replace(from, to));
  }
}

/**
 * The advice of a removal rule, as the text of a report entry or a TODO comment: the rule's `advice`, else its
 * `message`, else a generic sentence.
 *
 * @param {{advice?: string, message?: string}} rule A removal rule.
 * @param {string} name What the rule removes, for the generic sentence.
 * @returns {string} The advice.
 */
export function removalAdvice(rule, name) {
  return rule.advice ?? rule.message ?? `${name} was removed.`;
}
