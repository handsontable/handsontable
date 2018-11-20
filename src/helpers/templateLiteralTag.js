/* eslint-disable import/prefer-default-export */
import { arrayReduce } from '../helpers/array';

/**
 * Tags a multiline string and return new one without line break characters and following spaces.
 *
 * @param {Array} strings Parts of the entire string without expressions.
 * @param {...String} expressions Expressions converted to strings, which are added to the entire string.
 * @returns {String}
 */
export function toSingleLine(strings, ...expressions) {
  const result = arrayReduce(strings, (previousValue, currentValue, index) => {

    const valueWithoutWhiteSpaces = currentValue.replace(/(?:\r?\n\s+)/g, '');
    const expressionForIndex = expressions[index] ? expressions[index] : '';

    return previousValue + valueWithoutWhiteSpaces + expressionForIndex;
  }, '');

  return result.trim();
}
