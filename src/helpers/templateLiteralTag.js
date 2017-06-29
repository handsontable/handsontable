/**
 * Tags a multiline string and return new one without line break characters and following spaces.
 *
 * @param {Array} strings Parts of the entire string without expressions.
 * @param {...String} expressions Expressions converted to strings, which are added to the entire string.
 * @returns {String}
 */
export function toSingleLine(strings, ...expressions) {
  let result = '';

  for (let i = 0; i < strings.length; i += 1) {
    result += strings[i].replace(/(?:\r?\n\s+)/g, '');
    result += expressions[i] ? expressions[i] : '';
  }

  return result.trim();
}
