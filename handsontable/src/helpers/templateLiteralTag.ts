import { arrayReduce } from '../helpers/array';

/**
 * Tags a multiline string and return new one without line break characters and following spaces.
 *
 * @param {Array} strings Parts of the entire string without expressions.
 * @param {...string} expressions Expressions converted to strings, which are added to the entire string.
 * @returns {string}
 */
export function toSingleLine(strings: TemplateStringsArray | string[], ...expressions: any[]): string {
  const result = arrayReduce(strings, (previousValue: string, currentValue: string, index: number) => {

    const valueWithoutWhiteSpaces = currentValue.replace(/\r?\n\s*/g, '');
    const expressionForIndex = expressions[index] ? expressions[index] : '';

    return previousValue + valueWithoutWhiteSpaces + expressionForIndex;
  }, '');

  return result.trim();
}
