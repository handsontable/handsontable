import jscodeshift from 'jscodeshift';

/**
 * The three jscodeshift parsers the js adapter uses, with the file name that selects each.
 */
export const PARSERS = ['babylon', 'ts', 'tsx'];

/**
 * Parse source text the way the js adapter does.
 *
 * @param {string} source Source text.
 * @param {'babylon'|'ts'|'tsx'} [parser] Parser name.
 * @returns {{j: object, root: object}} The jscodeshift API and the parsed Collection.
 */
export function parse(source, parser = 'tsx') {
  const j = jscodeshift.withParser(parser);

  return { j, root: j(source) };
}

/**
 * Print a Collection with the quote style the tests use.
 *
 * @param {object} root The parsed Collection.
 * @returns {string} Source text.
 */
export function print(root) {
  return root.toSource({ quote: 'single' });
}
