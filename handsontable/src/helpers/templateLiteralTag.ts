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
    const expressionForIndex = expressions[index] ? expressions[index] : '';

    return previousValue + valueWithoutWhiteSpaces + expressionForIndex;
  }, '');

  return result.trim();
}

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * Creates DOM element from the string. For example:
 * ```
 * const element = html`
 *  <div data-ref="example" class="example">
 *    <p>Example:</p>
 *    <span data-ref="counter">1</span>
 *  </div>
 * `
 * ```
 * Will create a `div` element with class `example` and a `span` and `p` element inside.
 * When `data-ref` attribute is used, the element will be added to the `refs` object.
 * ```
 * {
 *   fragment: ...,
 *   refs: {
 *    example: ..., // reference to the div element
 *    counter: ..., // reference to the span element
 *   }
 * }
 * ```
 * Tip: If necessary it can be extended to support other attributes or events.
 *
 * @param {string} strings Parts of the entire string without expressions.
 * @param  {*} values Expressions converted to strings, which are added to the entire string.
 * @returns {{ fragment: DocumentFragment, refs: {[key: string]: HTMLElement} }}
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]) {
  // eslint-disable-next-line no-restricted-globals
  const template = document.createElement('template');

  template.innerHTML = Array.from(strings).reduce((acc: string, string: string, i: number) => {
    return acc + string + (values[i] ?? '');
  }, '');

  const fragment = template.content.cloneNode(true) as DocumentFragment;
  const refs: Record<string, HTMLElement> = {};

  fragment.querySelectorAll('[data-ref]').forEach((element: Element) => {
    const name = element.getAttribute('data-ref');

    element.removeAttribute('data-ref');

    if (name !== null) {
      refs[name] = element as HTMLElement;
    }
  });

  return { fragment, refs };
}
/* eslint-enable jsdoc/require-description-complete-sentence */
