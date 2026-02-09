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
  describe('hideColumn', () => {
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
      'the last node, the hide column modification can be applied.';

      tree.buildTree();

      expect(() => {
        // A1
        triggerNodeModification('hide-column', tree.getNode(0, 0), 0);
      }).toThrowError(expectedErrorMsg);
      expect(() => {
        // F1
        triggerNodeModification('hide-column', tree.getNode(0, 5), 0);
      }).toThrowError(expectedErrorMsg);
      expect(() => {
        // B2
        triggerNodeModification('hide-column', tree.getNode(1, 1), 0);
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
        triggerNodeModification('hide-column', tree.getNode(1, 0));
      }).toThrowError(expectedErrorMsg);
      expect(() => {
        triggerNodeModification('hide-column', tree.getNode(1, 0), null);
      }).toThrowError(expectedErrorMsg);
      expect(() => {
        triggerNodeModification('hide-column', tree.getNode(1, 0), '1');
      }).toThrowError(expectedErrorMsg);
      expect(() => {
        triggerNodeModification('hide-column', tree.getNode(1, 0), 1.5);
      }).toThrowError(expectedErrorMsg);
      expect(() => {
        triggerNodeModification('hide-column', tree.getNode(1, 0), 1);
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

      it('should hide the column once', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        {
          const expected = `
            +----+----+----+----+----+----+----+----+----+
            | B1                | F1           | I1 | J1 |
            +----+----+----+----+----+----+----+----+----+
            | B2           | E2 | F2      | H2 | I2 | J2 |
            +----+----+----+----+----+----+----+----+----+
            `;

          // A2
          expect(triggerNodeModification('hide-column', tree.getNode(1, 0), 0));
          expect(tree).toBeMatchToHeadersStructure(expected);

          // A2
          expect(triggerNodeModification('hide-column', tree.getNode(1, 0), 0));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+----+----+
            | B1                | F1      | I1 | J1 |
            +----+----+----+----+----+----+----+----+
            | B2           | E2 | F2 | H2 | I2 | J2 |
            +----+----+----+----+----+----+----+----+
            `;

          // F2
          expect(triggerNodeModification('hide-column', tree.getNode(1, 5), 6));
          expect(tree).toBeMatchToHeadersStructure(expected);

          // F2
          expect(triggerNodeModification('hide-column', tree.getNode(1, 5), 6));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
      });

      it('should hide the columns', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        {
          const expected = `
            +----+----+----+----+----+----+----+----+----+
            | B1                | F1           | I1 | J1 |
            +----+----+----+----+----+----+----+----+----+
            | B2           | E2 | F2      | H2 | I2 | J2 |
            +----+----+----+----+----+----+----+----+----+
            `;

          // A2
          expect(triggerNodeModification('hide-column', tree.getNode(1, 0), 0));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+----+----+
            | B1           | F1           | I1 | J1 |
            +----+----+----+----+----+----+----+----+
            | B2      | E2 | F2      | H2 | I2 | J2 |
            +----+----+----+----+----+----+----+----+
            `;

          // Hide node B2 and visual column index at 1
          expect(triggerNodeModification('hide-column', tree.getNode(1, 1), 1));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+----+
            | B1           | F1           | J1 |
            +----+----+----+----+----+----+----+
            | B2      | E2 | F2      | H2 | J2 |
            +----+----+----+----+----+----+----+
            `;

          // Hide node I2 and visual column index at 8
          expect(triggerNodeModification('hide-column', tree.getNode(1, 8), 8));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+
            | B1           | F1      | J1 |
            +----+----+----+----+----+----+
            | B2      | E2 | F2 | H2 | J2 |
            +----+----+----+----+----+----+
            `;

          // Hide node F2 and visual column index at 8
          expect(triggerNodeModification('hide-column', tree.getNode(1, 5), 6));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+
            | B1      | F1      | J1 |
            +----+----+----+----+----+
            | B2 | E2 | F2 | H2 | J2 |
            +----+----+----+----+----+
            `;

          // Hide node B2 and visual column index at 2
          expect(triggerNodeModification('hide-column', tree.getNode(1, 1), 2));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+
            | B1      | F1 | J1 |
            +----+----+----+----+
            | B2 | E2 | H2 | J2 |
            +----+----+----+----+
            `;

          // Hide node F2 and visual column index at 5
          expect(triggerNodeModification('hide-column', tree.getNode(1, 5), 5));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+
            | B1 | F1 | J1 |
            +----+----+----+
            | E2 | H2 | J2 |
            +----+----+----+
            `;

          // Hide node B2 and visual column index at 3
          expect(triggerNodeModification('hide-column', tree.getNode(1, 1), 3));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+
            | B1 | J1 |
            +----+----+
            | E2 | J2 |
            +----+----+
            `;

          // Hide node H2 and visual column index at 7
          expect(triggerNodeModification('hide-column', tree.getNode(1, 7), 7));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+
            | J1 |
            +----+
            | J2 |
            +----+
            `;

          // Hide node E2 and visual column index at 4
          expect(triggerNodeModification('hide-column', tree.getNode(1, 4), 4));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +
            `;

          // Hide node J2 and visual column index at 9
          expect(triggerNodeModification('hide-column', tree.getNode(1, 9), 9));
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

      it('should hide the columns', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        {
          const expected = `
            +----+----+----+----+----+----+----+----+----+
            | A1 | B1                               | J1 |
            +----+----+----+----+----+----+----+----+----+
            | A2 | B2           | F2                | J2 |
            +----+----+----+----+----+----+----+----+----+
            | A3 | B3 | C3      | F3      | H3      | J3 |
            +----+----+----+----+----+----+----+----+----+
            | A4 | B4 | C4 | E4 | F4 | G4 | H4 | I4 |    |
            +----+----+----+----+----+----+----+----+----+
            `;

          // D4
          expect(triggerNodeModification('hide-column', tree.getNode(3, 3), 3));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+----+----+
            | A1 | B1                          | J1 |
            +----+----+----+----+----+----+----+----+
            | A2 | B2      | F2                | J2 |
            +----+----+----+----+----+----+----+----+
            | A3 | C3      | F3      | H3      | J3 |
            +----+----+----+----+----+----+----+----+
            | A4 | C4 | E4 | F4 | G4 | H4 | I4 |    |
            +----+----+----+----+----+----+----+----+
            `;

          // B4
          expect(triggerNodeModification('hide-column', tree.getNode(3, 1), 1));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+----+
            | B1                          | J1 |
            +----+----+----+----+----+----+----+
            | B2      | F2                | J2 |
            +----+----+----+----+----+----+----+
            | C3      | F3      | H3      | J3 |
            +----+----+----+----+----+----+----+
            | C4 | E4 | F4 | G4 | H4 | I4 |    |
            +----+----+----+----+----+----+----+
            `;

          // A4
          expect(triggerNodeModification('hide-column', tree.getNode(3, 0), 0));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+
            | B1                     | J1 |
            +----+----+----+----+----+----+
            | B2      | F2           | J2 |
            +----+----+----+----+----+----+
            | C3      | F3 | H3      | J3 |
            +----+----+----+----+----+----+
            | C4 | E4 | F4 | H4 | I4 |    |
            +----+----+----+----+----+----+
            `;

          // G4
          expect(triggerNodeModification('hide-column', tree.getNode(3, 6), 6));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+
            | B1                | J1 |
            +----+----+----+----+----+
            | B2      | F2      | J2 |
            +----+----+----+----+----+
            | C3      | F3 | H3 | J3 |
            +----+----+----+----+----+
            | C4 | E4 | F4 | I4 |    |
            +----+----+----+----+----+
            `;

          // H4
          expect(triggerNodeModification('hide-column', tree.getNode(3, 7), 7));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+
            | B1           | J1 |
            +----+----+----+----+
            | B2 | F2      | J2 |
            +----+----+----+----+
            | C3 | F3 | H3 | J3 |
            +----+----+----+----+
            | E4 | F4 | I4 |    |
            +----+----+----+----+
            `;

          // C4
          expect(triggerNodeModification('hide-column', tree.getNode(3, 2), 2));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+
            | B1      | J1 |
            +----+----+----+
            | F2      | J2 |
            +----+----+----+
            | F3 | H3 | J3 |
            +----+----+----+
            | F4 | I4 |    |
            +----+----+----+
            `;

          // E4
          expect(triggerNodeModification('hide-column', tree.getNode(3, 4), 4));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+
            | J1 |
            +----+
            | J2 |
            +----+
            | J3 |
            +----+
            |    |
            +----+
            `;

          // F4
          expect(triggerNodeModification('hide-column', tree.getNode(3, 5), 5));
          // I4
          expect(triggerNodeModification('hide-column', tree.getNode(3, 8), 8));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +
            `;

          // hide the last column
          expect(triggerNodeModification('hide-column', tree.getNode(3, 9), 9));
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

        {
          const expected = `
            +----+----+----+----+----+----+----+----+----+----+----+
            | A1 | B1                          | J1 | K1           |
            +----+----+----+----+----+----+----+----+----+----+----+
            | A2 | B2                          | J2 | K2           |
            +----+----+----+----+----+----+----+----+----+----+----+
            | A3 | B3           | F3           | J3 | K3           |
            +----+----+----+----+----+----+----+----+----+----+----+
            | A4 | B4      | D4 | F4 | H4      | J4 | K4 | L4      |
            +----+----+----+----+----+----+----+----+----+----+----+
            | A5 | B5 | C5 | D5 | G5 | H5 | I5 | J5 | K5 | L5 | M5 |
            +----+----+----+----+----+----+----+----+----+----+----+
            `;

          // E5
          expect(triggerNodeModification('hide-column', tree.getNode(4, 4), 4));
          // F5
          expect(triggerNodeModification('hide-column', tree.getNode(4, 5), 5));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+----+
            | A1 | B1                | K1      |
            +----+----+----+----+----+----+----+
            | A2 | B2                | K2      |
            +----+----+----+----+----+----+----+
            | A3 | B3           | F3 | K3      |
            +----+----+----+----+----+----+----+
            | A4 | B4      | D4 | F4 | L4      |
            +----+----+----+----+----+----+----+
            | A5 | B5 | C5 | D5 | G5 | L5 | M5 |
            +----+----+----+----+----+----+----+
            `;

          // H5
          expect(triggerNodeModification('hide-column', tree.getNode(4, 7), 7));
          // I5
          expect(triggerNodeModification('hide-column', tree.getNode(4, 8), 8));
          // J5
          expect(triggerNodeModification('hide-column', tree.getNode(4, 9), 9));
          // K5
          expect(triggerNodeModification('hide-column', tree.getNode(4, 10), 10));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+----+----+
            | A1 | B1           | K1      |
            +----+----+----+----+----+----+
            | A2 | B2           | K2      |
            +----+----+----+----+----+----+
            | A3 | B3      | F3 | K3      |
            +----+----+----+----+----+----+
            | A4 | B4 | D4 | F4 | L4      |
            +----+----+----+----+----+----+
            | A5 | C5 | D5 | G5 | L5 | M5 |
            +----+----+----+----+----+----+
            `;

          // B5
          expect(triggerNodeModification('hide-column', tree.getNode(4, 1), 1));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+----+----+
            | B1           | K1 |
            +----+----+----+----+
            | B2           | K2 |
            +----+----+----+----+
            | B3      | F3 | K3 |
            +----+----+----+----+
            | B4 | D4 | F4 | L4 |
            +----+----+----+----+
            | C5 | D5 | G5 | M5 |
            +----+----+----+----+
            `;

          // A5
          expect(triggerNodeModification('hide-column', tree.getNode(4, 0), 0));
          // L5
          expect(triggerNodeModification('hide-column', tree.getNode(4, 11), 11));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+----+
            | B1 | K1 |
            +----+----+
            | B2 | K2 |
            +----+----+
            | B3 | K3 |
            +----+----+
            | B4 | L4 |
            +----+----+
            | C5 | M5 |
            +----+----+
            `;

          // D5
          expect(triggerNodeModification('hide-column', tree.getNode(4, 3), 3));
          // G5
          expect(triggerNodeModification('hide-column', tree.getNode(4, 6), 6));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +----+
            | K1 |
            +----+
            | K2 |
            +----+
            | K3 |
            +----+
            | L4 |
            +----+
            | M5 |
            +----+
            `;

          // C5
          expect(triggerNodeModification('hide-column', tree.getNode(4, 2), 2));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
        {
          const expected = `
            +
            `;

          // M5
          expect(triggerNodeModification('hide-column', tree.getNode(4, 12), 12));
          expect(tree).toBeMatchToHeadersStructure(expected);
        }
      });
    });
  });
});
