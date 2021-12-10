beforeEach(() => {
  /**
   * @param {TreeNode[]} rootTrees An array of root nodes from NestedHeaders class.
   * @returns {Array[]}
   */
  function treeToAscii(rootTrees) {
    const NEW_LINE = '\n';
    const grid = [];
    const pushAtRow = (row, value) => {
      if (!Array.isArray(grid[row])) {
        grid[row] = [];
      }

      grid[row].push(value);
    };
    const generateHorizontalLine = () => {
      const row = [];

      rootTrees.forEach((node) => {
        const { colspan, isHidden } = node.data;

        if (isHidden === true) {
          return;
        }

        for (let i = 0; i < colspan; i++) {
          row.push('+----');
        }
      });

      row.push('+');

      return row;
    };

    // Fill the grid with appropriate symbols and phrases.
    rootTrees.forEach((rootNode) => {
      rootNode.walkDown((node) => {
        const { label, colspan, isCollapsed, isHidden, headerLevel } = node.data;

        if (isHidden === true) {
          return;
        }

        for (let i = 0; i < colspan; i++) {
          let text = '     ';

          if (i === 0) {
            text = `| ${label.length === 0 ? '  ' : label}${isCollapsed && colspan === 1 ? '*' : ' '}`;
          } else if (i === colspan - 1 && isCollapsed) {
            text = '   * ';
          }
          pushAtRow(headerLevel, text);
        }
      });
    });

    // Put '|' symbol at the end of each row.
    for (let i = 0; i < grid.length; i++) {
      grid[i].push('|');
    }

    // Inject horizontal line between each row.
    for (let i = grid.length + 1; i > 0; i--) {
      grid.splice(i - 1, 0, generateHorizontalLine());
    }

    // Serialize the table.
    return grid.reduce((acc, columns) => {
      return acc + columns.join('') + NEW_LINE;
    }, '').trim();
  }

  const matchers = {
    /* eslint-disable jsdoc/require-description-complete-sentence */
    /**
     * The matcher checks if the provided column headers structure pattern matches
     * to the current tree passed to the matcher.
     *
     * ```
     * expect(tree).toBeMatchToHeadersStructure(`
     *   +----+----+----+----+----+----+
     *   | A1 | A2              * | A3 |
     *   +----+----+----+----+----+----+
     *   | B1 | B2                | B4 |
     *   +----+----+----+----+----+----+
     *   | C1 | C2*| C3           | C6 |
     *   +----+----+----+----+----+----+
     *   | D1 | D2 | D3 | D4 | D5 |    |
     *   +----+----+----+----+----+----+
     *   `);
     * ```
     *
     * The meaning of the symbol used to describe the cells:
     *  * - The header is marked as collapsed.
     *
     * @returns {object}
     */
    /* eslint-enable jsdoc/require-description-complete-sentence */
    toBeMatchToHeadersStructure() {
      return {
        compare(tree, actualPattern) {
          const asciiTable = treeToAscii(tree.getRoots());

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
          const jestMatcherUtils = require('jest-matcher-utils'); // eslint-disable-line global-require

          return {
            pass: asciiTable === actualAsciiTable,
            message: () => jestMatcherUtils.diff(asciiTable, actualAsciiTable),
          };
        }
      };
    },
  };

  jasmine.addMatchers(matchers);
});
