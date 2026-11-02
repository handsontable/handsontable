import { arrayReduce } from '../helpers/array';

/**
 * Tags a multiline string and return new one without line break characters and following spaces.
 *
 * @param {Array} strings Parts of the entire string without expressions.
 * @param {...string} expressions Expressions converted to strings, which are added to the entire string.
 * @returns {string}
 */
export function toSingleLine(strings: TemplateStringsArray | string[], ...expressions: unknown[]): string {
  const result = arrayReduce(Array.from(strings), (previousValue, currentValue, index) => {

    const valueWithoutWhiteSpaces = currentValue.replace(/\r?\n\s*/g, '');
    const expression = expressions[index];
    // A row or column index of 0 is a value to print; `null`, `undefined` and `false` print nothing.
    const expressionForIndex = expression || expression === 0 ? expression : '';

    return previousValue + valueWithoutWhiteSpaces + expressionForIndex;
  }, '');

  return result.trim();
}
