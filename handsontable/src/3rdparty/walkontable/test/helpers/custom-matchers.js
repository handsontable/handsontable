import { generateASCIITable } from '../../../../../test/helpers/asciiTable';
import { normalize, pretty } from './htmlNormalize';

beforeEach(function() {
  const currentSpec = this;

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * Extend the matcher factories with the `matchersUtil` argument extended with a configuration provided in the
   * spec as:
   * ```.
   * spec().matchersConfig['matcherName'] = {
   *   configItem: true,
   *   // ...
   * }
   * ```.
   *
   * @param {object} matchers The object containing custom matcher factories.
   * @returns {object}
   */
  function extendMatchersWithConfig(matchers) {
    Object.keys(matchers).forEach((matcherName) => {
      const matcherFactory = matchers[matcherName];

      matchers[matcherName] = function(matchersUtil) {
        if (matchersUtil && currentSpec.matchersConfig?.[matcherName]) {
          matchersUtil.matcherConfig = currentSpec.matchersConfig[matcherName];
        }

        return matcherFactory(matchersUtil);
      };
    });

    return matchers;
  }
  /* eslint-enable jsdoc/require-description-complete-sentence */

  const matchers = {
    toBeInArray() {
      return {
        compare(actual, expected) {
          return {
            pass: Array.isArray(expected) && expected.indexOf(actual) > -1
          };
        }
      };
    },
    toBeFunction() {
      return {
        compare(actual) {
          return {
            pass: typeof actual === 'function'
          };
        }
      };
    },
    toMatchHTML(matchersUtil) {
      return {
        compare(actual, expected, attributesToKeep = []) {
          const expectedHTML = pretty(normalize(expected));
          const actualHTML = pretty(normalize(actual));
          const actualHTMLStripped = actualHTML.replaceAll(/<\/{0,1}\w+([^>/]*)\/{0,1}>/ig, (match, attributes) => {
            let keptAttributes = null;

            if (attributesToKeep.length === 0 && matchersUtil?.matcherConfig) {
              attributesToKeep = matchersUtil.matcherConfig.keepAttributes;
            }

            if (attributesToKeep.length) {
              attributesToKeep = attributesToKeep.map((attribute) => {
                // Replace * in, for example, `aria-*`.
                return attribute.includes('*') ? attribute.replace(/\*/g, '([a-zA-Z-]+)') : attribute;
              });

              keptAttributes = attributes.match(
                new RegExp(`(${attributesToKeep.join('|')})="([a-zA-Z0-9-_:; ]*)"`, 'ig')
              );
            }

            return match.replace(attributes, keptAttributes ? ` ${keptAttributes.join(' ')}` : '');
          });

          const result = {
            pass: actualHTMLStripped === expectedHTML,
          };

          result.message = `Expected: ${actualHTMLStripped} \nto equal\n ${expectedHTML}`;

          return result;
        }
      };
    },
    toBeAroundValue() {
      return {
        compare(actual, expected, diff = 1) {
          const pass = actual >= expected - diff && actual <= expected + diff;
          let message = `Expected ${actual} to be around ${expected}
 (between ${expected - diff} and ${expected + diff})`;

          if (!pass) {
            message = `Expected ${actual} to be around ${expected}
 (between ${expected - diff} and ${expected + diff})`;
          }

          return {
            pass,
            message
          };
        }
      };
    },
    /* eslint-disable jsdoc/require-description-complete-sentence */
    /**
     * The matcher checks if the provided selection pattern matches to the rendered cells by checking if
     * the appropriate CSS class name was added.
     *
     * The provided structure should be passed as an array of arrays, for instance:
     * ```
     * // Non-contiguous selection (with enabled top and left headers)
     * expect(`
     *   |   ║   :   : * : * |
     *   |===:===:===:===:===|
     *   | - ║   :   : A : 0 |
     *   | - ║   : 1 : 0 : 0 |
     *   | - ║   : 2 : 1 : 0 |
     *   | - ║   : 2 : 1 : 0 |
     *   | - ║   : 1 : 1 : 0 |
     *   | - ║   :   : 0 : 0 |
     *   `).toBeMatchToSelectionPattern();
     * // Single cell selection (with fixedRowsTop: 1 and fixedColumnsLeft: 2)
     * expect(`
     *   |   :   |   :   :   |
     *   |---:---:---:---:---|
     *   |   :   |   :   :   |
     *   |   :   |   :   :   |
     *   |   :   | # :   :   |
     *   |   :   |   :   :   |
     *   |   :   |   :   :   |
     *   |   :   |   :   :   |
     *   `).toBeMatchToSelectionPattern();
     * ```
     *
     * The meaning of the symbol used to describe the cells:
     * ' ' - An empty space indicates cell which doesn't have added any selection classes.
     * '0' - The number (from 0 to 7) indicates selected layer level.
     * 'A' - The letters (from A to H) indicates the position of the cell which contains the hidden editor
     *       (which `current` class name). The letter `A` indicates the currently selected cell with
     *       a background of the first layer and `H` as the latest layer (most dark).
     * '#' - The hash symbol indicates the currently selected cell without changed background color.
     *
     * The meaning of the symbol used to describe headers:
     * '*' - The asterisk symbol indicates selected header.
     * '-' - The single hyphen symbol indicates highlighted header.
     *
     * The meaning of the symbol used to describe the table:
     * ':'   - Column separator (only for better visual looks).
     * '║'   - This symbol separates the row headers from the table content.
     * '===' - This symbol separates the column headers from the table content.
     * '|'   - The symbol which indicates the left overlay edge.
     * '---' - The symbol which indicates the top overlay edge.
     *
     * @returns {object}
     */
    /* eslint-enable jsdoc/require-description-complete-sentence */
    toBeMatchToSelectionPattern() {
      return {
        compare(actualPattern) {
          const asciiTable = generateASCIITable(currentSpec.$wrapper[0]);

          const patternParts = (actualPattern || '').split(/\n/);
          const redundantPadding = patternParts.reduce((padding, line) => {
            const trimmedLine = line.trim();
            let nextPadding = padding;

            if (trimmedLine) {
              const currentPadding = line.search(/\S|$/);

              if (currentPadding < nextPadding) {
                nextPadding = currentPadding;
              }
            }

            return nextPadding;
          }, Infinity);

          const normalizedPattern = patternParts.reduce((acc, line) => {
            const trimmedLine = line.trim();

            if (trimmedLine) {
              acc.push(line.substr(redundantPadding));
            }

            return acc;
          }, []);

          const actualAsciiTable = normalizedPattern.join('\n');
          const message = `Expected the pattern selection \n${actualAsciiTable}\nto
match to the visual state of the rendered selection \n${asciiTable}\n`;

          return {
            pass: asciiTable === actualAsciiTable,
            message,
          };
        }
      };
    },
  };

  jasmine.addMatchers(extendMatchersWithConfig(matchers));
});
