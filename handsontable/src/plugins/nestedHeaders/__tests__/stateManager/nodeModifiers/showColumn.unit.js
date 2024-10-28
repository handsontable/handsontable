import { TRAVERSAL_DF_POST } from 'handsontable/utils/dataStructures/tree';
import HeadersTree from 'handsontable/plugins/nestedHeaders/stateManager/headersTree';
import SourceSettings from 'handsontable/plugins/nestedHeaders/stateManager/sourceSettings';
import { triggerNodeModification } from 'handsontable/plugins/nestedHeaders/stateManager/nodeModifiers';
import './../custom-matchers';

function createTree(nestedHeadersSettings) {
  const source = new SourceSettings();

  source.setData(nestedHeadersSettings);

  return new HeadersTree(source);
}

describe('NodeModifiers', () => {
  describe('showColumn', () => {
    it('should throw an error when the passed node is not the last node in the tree', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | A1 | B1                | F1           | I1 | J1 |
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | A2 | B2           | E2 | F2      | H2 | I2 | J2 |
       *   +----+----+----+----+----+----+----+----+----+----+
       */
      const headerSettings = [
        ['A1', { label: 'B1', colspan: 4 }, { label: 'F1', colspan: 3 }, 'I1', 'J1'],
        ['A2', { label: 'B2', colspan: 3 }, 'E2', { label: 'F2', colspan: 2 }, 'H2', 'I2', 'J2'],
      ];
      const tree = createTree(headerSettings);
      const expectedErrorMsg = 'The passed node is not the last node on the tree. Only for ' +
      'the last node, the show column modification can be applied.';

      tree.buildTree();

      expect(() => {
        // A1
        triggerNodeModification('show-column', tree.getNode(0, 0), 0);
      }).toThrowError(expectedErrorMsg);
      expect(() => {
        // F1
        triggerNodeModification('show-column', tree.getNode(0, 5), 0);
      }).toThrowError(expectedErrorMsg);
      expect(() => {
        // B2
        triggerNodeModification('show-column', tree.getNode(1, 1), 0);
      }).not.toThrowError(expectedErrorMsg);
    });

    it('should throw an error when the grid column index is not a number', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | A1 | B1                | F1           | I1 | J1 |
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | A2 | B2           | E2 | F2      | H2 | I2 | J2 |
       *   +----+----+----+----+----+----+----+----+----+----+
       */
      const headerSettings = [
        ['A1', { label: 'B1', colspan: 4 }, { label: 'F1', colspan: 3 }, 'I1', 'J1'],
        ['A2', { label: 'B2', colspan: 3 }, 'E2', { label: 'F2', colspan: 2 }, 'H2', 'I2', 'J2'],
      ];
      const tree = createTree(headerSettings);
      const expectedErrorMsg = 'The passed gridColumnIndex argument has invalid type.';

      tree.buildTree();

      expect(() => {
        triggerNodeModification('show-column', tree.getNode(1, 0));
      }).toThrowError(expectedErrorMsg);
      expect(() => {
        triggerNodeModification('show-column', tree.getNode(1, 0), null);
      }).toThrowError(expectedErrorMsg);
      expect(() => {
        triggerNodeModification('show-column', tree.getNode(1, 0), '1');
      }).toThrowError(expectedErrorMsg);
      expect(() => {
        triggerNodeModification('show-column', tree.getNode(1, 0), 1.5);
      }).toThrowError(expectedErrorMsg);
      expect(() => {
        triggerNodeModification('show-column', tree.getNode(1, 0), 1);
      }).not.toThrowError(expectedErrorMsg);
    });

    describe('variant #1 (basic example)', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | A1 | B1                | F1           | I1 | J1 |
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | A2 | B2           | E2 | F2      | H2 | I2 | J2 |
       *   +----+----+----+----+----+----+----+----+----+----+
       */
      const headerSettings = [
        ['A1', { label: 'B1', colspan: 4 }, { label: 'F1', colspan: 3 }, 'I1', 'J1'],
        ['A2', { label: 'B2', colspan: 3 }, 'E2', { label: 'F2', colspan: 2 }, 'H2', 'I2', 'J2'],
      ];

      it('should show the column once', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        /**
         * The column headers visualisation:
         *   +----+----+----+----+----+----+----+
         *   | A1 | B1      | F1      | I1 | J1 |
         *   +----+----+----+----+----+----+----+
         *   | A2 | B2 | E2 | F2 | H2 | I2 | J2 |
         *   +----+----+----+----+----+----+----+
         */
        triggerNodeModification('hide-column', tree.getNode(1, 1), 2);
        triggerNodeModification('hide-column', tree.getNode(1, 1), 3);
        triggerNodeModification('hide-column', tree.getNode(1, 5), 5);

        {
          const expected = `
            +----+----+----+----+----+----+----+----+
            | A1 | B1           | F1      | I1 | J1 |
            +----+----+----+----+----+----+----+----+
            | A2 | B2      | E2 | F2 | H2 | I2 | J2 |
            +----+----+----+----+----+----+----+----+
            `;

          // show node B2 at visual index 2
          expect(triggerNodeModification('show-column', tree.getNode(1, 1), 2));
          expect(tree).toBeMatchToHeadersStructure(expected);

          // show node B2 at visual index 2
          expect(triggerNodeModification('show-column', tree.getNode(1, 1), 2));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+----+----+----+
            | A1 | B1           | F1           | I1 | J1 |
            +----+----+----+----+----+----+----+----+----+
            | A2 | B2      | E2 | F2      | H2 | I2 | J2 |
            +----+----+----+----+----+----+----+----+----+
            `;

          // show node F2 at visual index 5
          expect(triggerNodeModification('show-column', tree.getNode(1, 5), 5));
          expect(tree).toBeMatchToHeadersStructure(expected);

          // show node F2 at visual index 5
          expect(triggerNodeModification('show-column', tree.getNode(1, 5), 5));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
      });

      it('should show the columns', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        // Hide all columns.
        tree.getRoots().forEach((rootNode) => {
          rootNode.walkDown((node) => {
            if (node.childs.length === 0) {
              const { columnIndex, origColspan } = node.data;

              for (let i = columnIndex; i < columnIndex + origColspan; i++) {
                triggerNodeModification('hide-column', node, i);
              }
            }
          }, TRAVERSAL_DF_POST);
        });

        {
          const expected = `
            +----+
            | B1 |
            +----+
            | B2 |
            +----+
            `;

          // Show node B2 at visual index 2
          expect(triggerNodeModification('show-column', tree.getNode(1, 1), 2));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+
            | A1 | B1 |
            +----+----+
            | A2 | B2 |
            +----+----+
            `;

          // Show node A2 at visual index 0
          expect(triggerNodeModification('show-column', tree.getNode(1, 0), 0));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+
            | A1 | B1 | F1      |
            +----+----+----+----+
            | A2 | B2 | F2 | H2 |
            +----+----+----+----+
            `;

          // Show node F2 at visual index 6
          expect(triggerNodeModification('show-column', tree.getNode(1, 5), 6));
          // Show node H2 at visual index 7
          expect(triggerNodeModification('show-column', tree.getNode(1, 7), 7));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+
            | A1 | B1 | F1           |
            +----+----+----+----+----+
            | A2 | B2 | F2      | H2 |
            +----+----+----+----+----+
            `;

          // Show node F2 at visual index 5
          expect(triggerNodeModification('show-column', tree.getNode(1, 5), 5));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+----+
            | A1 | B1           | F1           |
            +----+----+----+----+----+----+----+
            | A2 | B2           | F2      | H2 |
            +----+----+----+----+----+----+----+
            `;

          // Show node B2 at visual index 1
          expect(triggerNodeModification('show-column', tree.getNode(1, 1), 1));
          // Show node B2 at visual index 3
          expect(triggerNodeModification('show-column', tree.getNode(1, 1), 3));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+----+----+----+
            | A1 | B1           | F1           | I1 | J1 |
            +----+----+----+----+----+----+----+----+----+
            | A2 | B2           | F2      | H2 | I2 | J2 |
            +----+----+----+----+----+----+----+----+----+
            `;

          // Show node I2 at visual index 8
          expect(triggerNodeModification('show-column', tree.getNode(1, 8), 8));
          // Show node J2 at visual index 9
          expect(triggerNodeModification('show-column', tree.getNode(1, 9), 9));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+----+----+----+----+
            | A1 | B1                | F1           | I1 | J1 |
            +----+----+----+----+----+----+----+----+----+----+
            | A2 | B2           | E2 | F2      | H2 | I2 | J2 |
            +----+----+----+----+----+----+----+----+----+----+
            `;

          // Show node E2 at visual index 4
          expect(triggerNodeModification('show-column', tree.getNode(1, 4), 4));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
      });
    });

    describe('variant #2 (advanced example)', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | A1 | B1                                    | J1 |
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | A2 | B2                | F2                | J2 |
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | A3 | B3 | C3           | F3      | H3      | J3 |
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | A4 | B4 | C4 | D4 | E4 | F4 | G4 | H4 | I4 |    |
       *   +----+----+----+----+----+----+----+----+----+----+
       */
      const headerSettings = [
        ['A1', { label: 'B1', colspan: 8 }, 'J1'],
        ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
        ['A3', 'B3', { label: 'C3', colspan: 3 }, { label: 'F3', colspan: 2 }, { label: 'H3', colspan: 2 }, 'J3'],
        ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4'],
      ];

      it('should build a valid structure', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | B1                                    | J1 |
          +----+----+----+----+----+----+----+----+----+----+
          | A2 | B2                | F2                | J2 |
          +----+----+----+----+----+----+----+----+----+----+
          | A3 | B3 | C3           | F3      | H3      | J3 |
          +----+----+----+----+----+----+----+----+----+----+
          | A4 | B4 | C4 | D4 | E4 | F4 | G4 | H4 | I4 |    |
          +----+----+----+----+----+----+----+----+----+----+
          `);
      });

      it('should show the columns', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        // Hide all columns.
        tree.getRoots().forEach((rootNode) => {
          rootNode.walkDown((node) => {
            if (node.childs.length === 0) {
              const { columnIndex, origColspan } = node.data;

              for (let i = columnIndex; i < columnIndex + origColspan; i++) {
                triggerNodeModification('hide-column', node, i);
              }
            }
          }, TRAVERSAL_DF_POST);
        });

        {
          const expected = `
            +----+
            | B1 |
            +----+
            | B2 |
            +----+
            | C3 |
            +----+
            | D4 |
            +----+
            `;

          // Show node D4 at visual index 3
          expect(triggerNodeModification('show-column', tree.getNode(3, 3), 3));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+
            | B1                |
            +----+----+----+----+
            | B2 | F2           |
            +----+----+----+----+
            | C3 | F3 | H3      |
            +----+----+----+----+
            | D4 | G4 | H4 | I4 |
            +----+----+----+----+
            `;

          // Show node G4 at visual index 6
          expect(triggerNodeModification('show-column', tree.getNode(3, 6), 6));
          // Show node I4 at visual index 8
          expect(triggerNodeModification('show-column', tree.getNode(3, 8), 8));
          // Show node H4 at visual index 7
          expect(triggerNodeModification('show-column', tree.getNode(3, 7), 7));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+
            | B1                     |
            +----+----+----+----+----+
            | B2      | F2           |
            +----+----+----+----+----+
            | B3 | C3 | F3 | H3      |
            +----+----+----+----+----+
            | B4 | D4 | G4 | H4 | I4 |
            +----+----+----+----+----+
            `;

          // Show node B4 at visual index 1
          expect(triggerNodeModification('show-column', tree.getNode(3, 1), 1));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+----+
            | A1 | B1                          |
            +----+----+----+----+----+----+----+
            | A2 | B2           | F2           |
            +----+----+----+----+----+----+----+
            | A3 | B3 | C3      | F3 | H3      |
            +----+----+----+----+----+----+----+
            | A4 | B4 | C4 | D4 | G4 | H4 | I4 |
            +----+----+----+----+----+----+----+
            `;

          // Show node A4 at visual index 0
          expect(triggerNodeModification('show-column', tree.getNode(3, 0), 0));
          // Show node C4 at visual index 2
          expect(triggerNodeModification('show-column', tree.getNode(3, 2), 2));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+----+----+----+
            | A1 | B1                                    |
            +----+----+----+----+----+----+----+----+----+
            | A2 | B2                | F2                |
            +----+----+----+----+----+----+----+----+----+
            | A3 | B3 | C3           | F3      | H3      |
            +----+----+----+----+----+----+----+----+----+
            | A4 | B4 | C4 | D4 | E4 | F4 | G4 | H4 | I4 |
            +----+----+----+----+----+----+----+----+----+
            `;

          // Show node F4 at visual index 5
          expect(triggerNodeModification('show-column', tree.getNode(3, 5), 5));
          // Show node E4 at visual index 4
          expect(triggerNodeModification('show-column', tree.getNode(3, 4), 4));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+----+----+----+----+
            | A1 | B1                                    | J1 |
            +----+----+----+----+----+----+----+----+----+----+
            | A2 | B2                | F2                | J2 |
            +----+----+----+----+----+----+----+----+----+----+
            | A3 | B3 | C3           | F3      | H3      | J3 |
            +----+----+----+----+----+----+----+----+----+----+
            | A4 | B4 | C4 | D4 | E4 | F4 | G4 | H4 | I4 |    |
            +----+----+----+----+----+----+----+----+----+----+
            `;

          // Show the last column at visual index 9
          expect(triggerNodeModification('show-column', tree.getNode(3, 9), 9));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
      });
    });

    describe('variant #3 (advanced example, with "mirrored" headers)', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | A1 | B1                                    | J1 | K1           |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | A2 | B2                                    | J2 | K2           |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | A3 | B3                | F3                | J3 | K3           |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | A4 | B4      | D4      | F4      | H4      | J4 | K4 | L4      |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | A5 | B5 | C5 | D5 | E5 | F5 | G5 | H5 | I5 | J5 | K5 | L5 | M5 |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       */
      const headerSettings = [
        ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
        ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
        ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
        ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
          { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
        ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5'],
      ];

      it('should build a valid structure', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | A1 | B1                                    | J1 | K1           |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | A2 | B2                                    | J2 | K2           |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | A3 | B3                | F3                | J3 | K3           |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | A4 | B4      | D4      | F4      | H4      | J4 | K4 | L4      |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | A5 | B5 | C5 | D5 | E5 | F5 | G5 | H5 | I5 | J5 | K5 | L5 | M5 |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          `);
      });

      it('should hide the columns', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        // Hide all columns.
        tree.getRoots().forEach((rootNode) => {
          rootNode.walkDown((node) => {
            if (node.childs.length === 0) {
              const { columnIndex, origColspan } = node.data;

              for (let i = columnIndex; i < columnIndex + origColspan; i++) {
                triggerNodeModification('hide-column', node, i);
              }
            }
          }, TRAVERSAL_DF_POST);
        });

        {
          const expected = `
            +----+
            | B1 |
            +----+
            | B2 |
            +----+
            | B3 |
            +----+
            | B4 |
            +----+
            | C5 |
            +----+
            `;

          // Show node C5 at visual index 2
          expect(triggerNodeModification('show-column', tree.getNode(4, 2), 2));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+
            | B1                |
            +----+----+----+----+
            | B2                |
            +----+----+----+----+
            | B3      | F3      |
            +----+----+----+----+
            | B4 | D4 | F4      |
            +----+----+----+----+
            | C5 | E5 | F5 | G5 |
            +----+----+----+----+
            `;

          // Show node G5 at visual index 6
          expect(triggerNodeModification('show-column', tree.getNode(4, 6), 6));
          // Show node F5 at visual index 5
          expect(triggerNodeModification('show-column', tree.getNode(4, 5), 5));
          // Show node E5 at visual index 4
          expect(triggerNodeModification('show-column', tree.getNode(4, 4), 4));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+
            | B1                | J1 |
            +----+----+----+----+----+
            | B2                | J2 |
            +----+----+----+----+----+
            | B3      | F3      | J3 |
            +----+----+----+----+----+
            | B4 | D4 | F4      | J4 |
            +----+----+----+----+----+
            | C5 | E5 | F5 | G5 | J5 |
            +----+----+----+----+----+
            `;

          // Show node J5 at visual index 9
          expect(triggerNodeModification('show-column', tree.getNode(4, 9), 9));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+----+----+
            | A1 | B1                     | J1 | K1 |
            +----+----+----+----+----+----+----+----+
            | A2 | B2                     | J2 | K2 |
            +----+----+----+----+----+----+----+----+
            | A3 | B3      | F3           | J3 | K3 |
            +----+----+----+----+----+----+----+----+
            | A4 | B4 | D4 | F4      | H4 | J4 | K4 |
            +----+----+----+----+----+----+----+----+
            | A5 | C5 | E5 | F5 | G5 | I5 | J5 | K5 |
            +----+----+----+----+----+----+----+----+
            `;

          // Show node I5 at visual index 8
          expect(triggerNodeModification('show-column', tree.getNode(4, 8), 8));
          // Show node A5 at visual index 0
          expect(triggerNodeModification('show-column', tree.getNode(4, 0), 0));
          // Show node K5 at visual index 10
          expect(triggerNodeModification('show-column', tree.getNode(4, 10), 10));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+----+----+----+
            | A1 | B1                          | J1 | K1 |
            +----+----+----+----+----+----+----+----+----+
            | A2 | B2                          | J2 | K2 |
            +----+----+----+----+----+----+----+----+----+
            | A3 | B3           | F3           | J3 | K3 |
            +----+----+----+----+----+----+----+----+----+
            | A4 | B4      | D4 | F4      | H4 | J4 | K4 |
            +----+----+----+----+----+----+----+----+----+
            | A5 | B5 | C5 | E5 | F5 | G5 | I5 | J5 | K5 |
            +----+----+----+----+----+----+----+----+----+
            `;

          // Show node B5 at visual index 1
          expect(triggerNodeModification('show-column', tree.getNode(4, 1), 1));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+----+----+----+----+----+
            | A1 | B1                               | J1 | K1      |
            +----+----+----+----+----+----+----+----+----+----+----+
            | A2 | B2                               | J2 | K2      |
            +----+----+----+----+----+----+----+----+----+----+----+
            | A3 | B3                | F3           | J3 | K3      |
            +----+----+----+----+----+----+----+----+----+----+----+
            | A4 | B4      | D4      | F4      | H4 | J4 | K4 | L4 |
            +----+----+----+----+----+----+----+----+----+----+----+
            | A5 | B5 | C5 | D5 | E5 | F5 | G5 | I5 | J5 | K5 | M5 |
            +----+----+----+----+----+----+----+----+----+----+----+
            `;

          // Show node D5 at visual index 3
          expect(triggerNodeModification('show-column', tree.getNode(4, 3), 3));
          // Show node M5 at visual index 12
          expect(triggerNodeModification('show-column', tree.getNode(4, 12), 12));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+----+----+----+----+----+----+
            | A1 | B1                               | J1 | K1           |
            +----+----+----+----+----+----+----+----+----+----+----+----+
            | A2 | B2                               | J2 | K2           |
            +----+----+----+----+----+----+----+----+----+----+----+----+
            | A3 | B3                | F3           | J3 | K3           |
            +----+----+----+----+----+----+----+----+----+----+----+----+
            | A4 | B4      | D4      | F4      | H4 | J4 | K4 | L4      |
            +----+----+----+----+----+----+----+----+----+----+----+----+
            | A5 | B5 | C5 | D5 | E5 | F5 | G5 | I5 | J5 | K5 | L5 | M5 |
            +----+----+----+----+----+----+----+----+----+----+----+----+
            `;

          // Show node L5 at visual index 11
          expect(triggerNodeModification('show-column', tree.getNode(4, 11), 11));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+----+----+----+----+----+----+----+
            | A1 | B1                                    | J1 | K1           |
            +----+----+----+----+----+----+----+----+----+----+----+----+----+
            | A2 | B2                                    | J2 | K2           |
            +----+----+----+----+----+----+----+----+----+----+----+----+----+
            | A3 | B3                | F3                | J3 | K3           |
            +----+----+----+----+----+----+----+----+----+----+----+----+----+
            | A4 | B4      | D4      | F4      | H4      | J4 | K4 | L4      |
            +----+----+----+----+----+----+----+----+----+----+----+----+----+
            | A5 | B5 | C5 | D5 | E5 | F5 | G5 | H5 | I5 | J5 | K5 | L5 | M5 |
            +----+----+----+----+----+----+----+----+----+----+----+----+----+
            `;

          // Show node H5 at visual index 7
          expect(triggerNodeModification('show-column', tree.getNode(4, 7), 7));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
      });
    });
  });
});
