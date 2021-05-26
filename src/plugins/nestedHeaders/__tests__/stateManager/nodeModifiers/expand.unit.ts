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
  describe('expandNode', () => {
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

      it('should ignore expanding when the node has a colspan = 1', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const expected = `
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | B1                | F1           | I1 | J1 |
          +----+----+----+----+----+----+----+----+----+----+
          | A2 | B2           | E2 | F2      | H2 | I2 | J2 |
          +----+----+----+----+----+----+----+----+----+----+
          `;

        // A1
        expect(triggerNodeModification('expand', tree.getNode(0, 0))).toEqual(expect.objectContaining({
          affectedColumns: [],
          colspanCompensation: 0,
        }));
        expect(tree).toBeMatchToHeadersStructure(expected);

        // I1
        expect(triggerNodeModification('expand', tree.getNode(0, 8))).toEqual(expect.objectContaining({
          affectedColumns: [],
          colspanCompensation: 0,
        }));
        expect(tree).toBeMatchToHeadersStructure(expected);

        // A2
        expect(triggerNodeModification('expand', tree.getNode(1, 0))).toEqual(expect.objectContaining({
          affectedColumns: [],
          colspanCompensation: 0,
        }));
        expect(tree).toBeMatchToHeadersStructure(expected);

        // E2
        expect(triggerNodeModification('expand', tree.getNode(1, 4))).toEqual(expect.objectContaining({
          affectedColumns: [],
          colspanCompensation: 0,
        }));
        expect(tree).toBeMatchToHeadersStructure(expected);

        // H2
        expect(triggerNodeModification('expand', tree.getNode(1, 7))).toEqual(expect.objectContaining({
          affectedColumns: [],
          colspanCompensation: 0,
        }));
        expect(tree).toBeMatchToHeadersStructure(expected);
      });

      it('should expand the node once', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        // B1
        triggerNodeModification('collapse', tree.getNode(0, 1));

        // B1
        expect(triggerNodeModification('expand', tree.getNode(0, 1))).toEqual(expect.objectContaining({
          affectedColumns: [4],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | B1                | F1           | I1 | J1 |
          +----+----+----+----+----+----+----+----+----+----+
          | A2 | B2           | E2 | F2      | H2 | I2 | J2 |
          +----+----+----+----+----+----+----+----+----+----+
          `);

        // B1
        expect(triggerNodeModification('expand', tree.getNode(0, 1))).toEqual(expect.objectContaining({
          affectedColumns: [],
          colspanCompensation: 0,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | B1                | F1           | I1 | J1 |
          +----+----+----+----+----+----+----+----+----+----+
          | A2 | B2           | E2 | F2      | H2 | I2 | J2 |
          +----+----+----+----+----+----+----+----+----+----+
          `);
      });

      it('should expand the node using column index which point to node in-between its colspan range', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        // B1
        triggerNodeModification('collapse', tree.getNode(0, 4));

        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+
          | A1 | B1         * | F1           | I1 | J1 |
          +----+----+----+----+----+----+----+----+----+
          | A2 | B2           | F2      | H2 | I2 | J2 |
          +----+----+----+----+----+----+----+----+----+
          `);

        // B1
        expect(triggerNodeModification('expand', tree.getNode(0, 4))).toEqual(expect.objectContaining({
          affectedColumns: [4],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | B1                | F1           | I1 | J1 |
          +----+----+----+----+----+----+----+----+----+----+
          | A2 | B2           | E2 | F2      | H2 | I2 | J2 |
          +----+----+----+----+----+----+----+----+----+----+
          `);
      });

      it('should expand the nodes and keep in sync other node colspan widths', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        // Collapse all nodes.
        tree.getRoots().forEach((rootNode) => {
          rootNode.walkDown((node) => {
            if (node.data.origColspan > 1) {
              triggerNodeModification('collapse', node);
            }
          }, TRAVERSAL_DF_POST);
        });

        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+
          | A1 | B1*| F1*| I1 | J1 |
          +----+----+----+----+----+
          | A2 | B2*| F2*| I2 | J2 |
          +----+----+----+----+----+
          `);

        // B2
        expect(triggerNodeModification('expand', tree.getNode(1, 1))).toEqual(expect.objectContaining({
          affectedColumns: [2, 3],
          colspanCompensation: 2,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+
          | A1 | B1         * | F1*| I1 | J1 |
          +----+----+----+----+----+----+----+
          | A2 | B2           | F2*| I2 | J2 |
          +----+----+----+----+----+----+----+
          `);

        // F1
        expect(triggerNodeModification('expand', tree.getNode(0, 5))).toEqual(expect.objectContaining({
          affectedColumns: [7],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+
          | A1 | B1         * | F1      | I1 | J1 |
          +----+----+----+----+----+----+----+----+
          | A2 | B2           | F2*| H2 | I2 | J2 |
          +----+----+----+----+----+----+----+----+
          `);

        // F2
        expect(triggerNodeModification('expand', tree.getNode(1, 5))).toEqual(expect.objectContaining({
          affectedColumns: [6],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+
          | A1 | B1         * | F1           | I1 | J1 |
          +----+----+----+----+----+----+----+----+----+
          | A2 | B2           | F2      | H2 | I2 | J2 |
          +----+----+----+----+----+----+----+----+----+
          `);

        // B1
        expect(triggerNodeModification('expand', tree.getNode(0, 1))).toEqual(expect.objectContaining({
          affectedColumns: [4],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | B1                | F1           | I1 | J1 |
          +----+----+----+----+----+----+----+----+----+----+
          | A2 | B2           | E2 | F2      | H2 | I2 | J2 |
          +----+----+----+----+----+----+----+----+----+----+
          `);
      });

      it('should rollback the last performed action', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        // Collapse all nodes.
        tree.getRoots().forEach((rootNode) => {
          rootNode.walkDown((node) => {
            if (node.data.origColspan > 1) {
              triggerNodeModification('collapse', node);
            }
          }, TRAVERSAL_DF_POST);
        });

        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+
          | A1 | B1*| F1*| I1 | J1 |
          +----+----+----+----+----+
          | A2 | B2*| F2*| I2 | J2 |
          +----+----+----+----+----+
          `);

        {
          triggerNodeModification('expand', tree.getNode(1, 1)); // B2

          const modResult = triggerNodeModification('expand', tree.getNode(0, 5)); // F1

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+----+----+
            | A1 | B1         * | F1      | I1 | J1 |
            +----+----+----+----+----+----+----+----+
            | A2 | B2           | F2*| H2 | I2 | J2 |
            +----+----+----+----+----+----+----+----+
            `);

          modResult.rollbackModification();

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+----+
            | A1 | B1         * | F1*| I1 | J1 |
            +----+----+----+----+----+----+----+
            | A2 | B2           | F2*| I2 | J2 |
            +----+----+----+----+----+----+----+
            `);
        }
        {
          triggerNodeModification('expand', tree.getNode(1, 5)); // F2

          const modResult = triggerNodeModification('expand', tree.getNode(0, 1)); // B1

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+----+----+----+
            | A1 | B1                | F1    * | I1 | J1 |
            +----+----+----+----+----+----+----+----+----+
            | A2 | B2           | E2 | F2      | I2 | J2 |
            +----+----+----+----+----+----+----+----+----+
            `);

          modResult.rollbackModification();

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+----+----+
            | A1 | B1         * | F1    * | I1 | J1 |
            +----+----+----+----+----+----+----+----+
            | A2 | B2           | F2      | I2 | J2 |
            +----+----+----+----+----+----+----+----+
            `);
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

      it('should expand the nodes and keep in sync other node colspan widths', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        // Collapse all nodes.
        tree.getRoots().forEach((rootNode) => {
          rootNode.walkDown((node) => {
            if (node.data.colspan > 1) {
              triggerNodeModification('collapse', node);
            }
          }, TRAVERSAL_DF_POST);
        });

        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+
          | A1 | B1*| J1 |
          +----+----+----+
          | A2 | B2*| J2 |
          +----+----+----+
          | A3 | B3 | J3 |
          +----+----+----+
          | A4 | B4 |    |
          +----+----+----+
          `);

        // B2
        expect(triggerNodeModification('expand', tree.getNode(1, 1))).toEqual(expect.objectContaining({
          affectedColumns: [2],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+
          | A1 | B1    * | J1 |
          +----+----+----+----+
          | A2 | B2      | J2 |
          +----+----+----+----+
          | A3 | B3 | C3*| J3 |
          +----+----+----+----+
          | A4 | B4 | C4 |    |
          +----+----+----+----+
          `);

        // C3
        expect(triggerNodeModification('expand', tree.getNode(2, 2))).toEqual(expect.objectContaining({
          affectedColumns: [3, 4],
          colspanCompensation: 2,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+
          | A1 | B1              * | J1 |
          +----+----+----+----+----+----+
          | A2 | B2                | J2 |
          +----+----+----+----+----+----+
          | A3 | B3 | C3           | J3 |
          +----+----+----+----+----+----+
          | A4 | B4 | C4 | D4 | E4 |    |
          +----+----+----+----+----+----+
          `);

        // B1
        expect(triggerNodeModification('expand', tree.getNode(0, 1))).toEqual(expect.objectContaining({
          affectedColumns: [5],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+
          | A1 | B1                     | J1 |
          +----+----+----+----+----+----+----+
          | A2 | B2                | F2*| J2 |
          +----+----+----+----+----+----+----+
          | A3 | B3 | C3           | F3*| J3 |
          +----+----+----+----+----+----+----+
          | A4 | B4 | C4 | D4 | E4 | F4 |    |
          +----+----+----+----+----+----+----+
          `);

        // F2
        expect(triggerNodeModification('expand', tree.getNode(1, 5))).toEqual(expect.objectContaining({
          affectedColumns: [7],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+
          | A1 | B1                          | J1 |
          +----+----+----+----+----+----+----+----+
          | A2 | B2                | F2      | J2 |
          +----+----+----+----+----+----+----+----+
          | A3 | B3 | C3           | F3*| H3*| J3 |
          +----+----+----+----+----+----+----+----+
          | A4 | B4 | C4 | D4 | E4 | F4 | H4 |    |
          +----+----+----+----+----+----+----+----+
          `);

        // H3
        expect(triggerNodeModification('expand', tree.getNode(2, 7))).toEqual(expect.objectContaining({
          affectedColumns: [8],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+
          | A1 | B1                               | J1 |
          +----+----+----+----+----+----+----+----+----+
          | A2 | B2                | F2           | J2 |
          +----+----+----+----+----+----+----+----+----+
          | A3 | B3 | C3           | F3*| H3      | J3 |
          +----+----+----+----+----+----+----+----+----+
          | A4 | B4 | C4 | D4 | E4 | F4 | H4 | I4 |    |
          +----+----+----+----+----+----+----+----+----+
          `);

        // F3
        expect(triggerNodeModification('expand', tree.getNode(2, 5))).toEqual(expect.objectContaining({
          affectedColumns: [6],
          colspanCompensation: 1,
        }));
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

      it('should expand the nodes and keep in sync other node colspan widths', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        // Collapse all nodes.
        tree.getRoots().forEach((rootNode) => {
          rootNode.walkDown((node) => {
            if (node.data.colspan > 1) {
              triggerNodeModification('collapse', node);
            }
          }, TRAVERSAL_DF_POST);
        });

        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+
          | A1 | B1*| J1 | K1*|
          +----+----+----+----+
          | A2 | B2*| J2 | K2*|
          +----+----+----+----+
          | A3 | B3*| J3 | K3*|
          +----+----+----+----+
          | A4 | B4*| J4 | K4 |
          +----+----+----+----+
          | A5 | B5 | J5 | K5 |
          +----+----+----+----+
          `);

        // C2
        expect(triggerNodeModification('expand', tree.getNode(2, 1))).toEqual(expect.objectContaining({
          affectedColumns: [3],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+
          | A1 | B1    * | J1 | K1*|
          +----+----+----+----+----+
          | A2 | B2    * | J2 | K2*|
          +----+----+----+----+----+
          | A3 | B3      | J3 | K3*|
          +----+----+----+----+----+
          | A4 | B4*| D4*| J4 | K4 |
          +----+----+----+----+----+
          | A5 | B5 | D5 | J5 | K5 |
          +----+----+----+----+----+
          `);

        // B2 (mirrored header B1 should be expanded also)
        expect(triggerNodeModification('expand', tree.getNode(1, 1))).toEqual(expect.objectContaining({
          affectedColumns: [5],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+
          | A1 | B1           | J1 | K1*|
          +----+----+----+----+----+----+
          | A2 | B2           | J2 | K2*|
          +----+----+----+----+----+----+
          | A3 | B3      | F3*| J3 | K3*|
          +----+----+----+----+----+----+
          | A4 | B4*| D4*| F4*| J4 | K4 |
          +----+----+----+----+----+----+
          | A5 | B5 | D5 | F5 | J5 | K5 |
          +----+----+----+----+----+----+
          `);

        // K2 (mirrored headers K2 and K3 should be expanded also)
        expect(triggerNodeModification('expand', tree.getNode(0, 10))).toEqual(expect.objectContaining({
          affectedColumns: [11],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+
          | A1 | B1           | J1 | K1      |
          +----+----+----+----+----+----+----+
          | A2 | B2           | J2 | K2      |
          +----+----+----+----+----+----+----+
          | A3 | B3      | F3*| J3 | K3      |
          +----+----+----+----+----+----+----+
          | A4 | B4*| D4*| F4*| J4 | K4 | L4*|
          +----+----+----+----+----+----+----+
          | A5 | B5 | D5 | F5 | J5 | K5 | L5 |
          +----+----+----+----+----+----+----+
          `);

        // B4
        expect(triggerNodeModification('expand', tree.getNode(3, 1))).toEqual(expect.objectContaining({
          affectedColumns: [2],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+
          | A1 | B1                | J1 | K1      |
          +----+----+----+----+----+----+----+----+
          | A2 | B2                | J2 | K2      |
          +----+----+----+----+----+----+----+----+
          | A3 | B3           | F3*| J3 | K3      |
          +----+----+----+----+----+----+----+----+
          | A4 | B4      | D4*| F4*| J4 | K4 | L4*|
          +----+----+----+----+----+----+----+----+
          | A5 | B5 | C5 | D5 | F5 | J5 | K5 | L5 |
          +----+----+----+----+----+----+----+----+
          `);

        // F4
        expect(triggerNodeModification('expand', tree.getNode(3, 5))).toEqual(expect.objectContaining({
          affectedColumns: [6],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+
          | A1 | B1                     | J1 | K1      |
          +----+----+----+----+----+----+----+----+----+
          | A2 | B2                     | J2 | K2      |
          +----+----+----+----+----+----+----+----+----+
          | A3 | B3           | F3    * | J3 | K3      |
          +----+----+----+----+----+----+----+----+----+
          | A4 | B4      | D4*| F4      | J4 | K4 | L4*|
          +----+----+----+----+----+----+----+----+----+
          | A5 | B5 | C5 | D5 | F5 | G5 | J5 | K5 | L5 |
          +----+----+----+----+----+----+----+----+----+
          `);

        // L4
        expect(triggerNodeModification('expand', tree.getNode(3, 11))).toEqual(expect.objectContaining({
          affectedColumns: [12],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | B1                     | J1 | K1           |
          +----+----+----+----+----+----+----+----+----+----+
          | A2 | B2                     | J2 | K2           |
          +----+----+----+----+----+----+----+----+----+----+
          | A3 | B3           | F3    * | J3 | K3           |
          +----+----+----+----+----+----+----+----+----+----+
          | A4 | B4      | D4*| F4      | J4 | K4 | L4      |
          +----+----+----+----+----+----+----+----+----+----+
          | A5 | B5 | C5 | D5 | F5 | G5 | J5 | K5 | L5 | M5 |
          +----+----+----+----+----+----+----+----+----+----+
          `);

        // F3
        expect(triggerNodeModification('expand', tree.getNode(2, 5))).toEqual(expect.objectContaining({
          affectedColumns: [7],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+----+
          | A1 | B1                          | J1 | K1           |
          +----+----+----+----+----+----+----+----+----+----+----+
          | A2 | B2                          | J2 | K2           |
          +----+----+----+----+----+----+----+----+----+----+----+
          | A3 | B3           | F3           | J3 | K3           |
          +----+----+----+----+----+----+----+----+----+----+----+
          | A4 | B4      | D4*| F4      | H4*| J4 | K4 | L4      |
          +----+----+----+----+----+----+----+----+----+----+----+
          | A5 | B5 | C5 | D5 | F5 | G5 | H5 | J5 | K5 | L5 | M5 |
          +----+----+----+----+----+----+----+----+----+----+----+
          `);

        // D3
        expect(triggerNodeModification('expand', tree.getNode(3, 3))).toEqual(expect.objectContaining({
          affectedColumns: [4],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+----+----+
          | A1 | B1                               | J1 | K1           |
          +----+----+----+----+----+----+----+----+----+----+----+----+
          | A2 | B2                               | J2 | K2           |
          +----+----+----+----+----+----+----+----+----+----+----+----+
          | A3 | B3                | F3           | J3 | K3           |
          +----+----+----+----+----+----+----+----+----+----+----+----+
          | A4 | B4      | D4      | F4      | H4*| J4 | K4 | L4      |
          +----+----+----+----+----+----+----+----+----+----+----+----+
          | A5 | B5 | C5 | D5 | E5 | F5 | G5 | H5 | J5 | K5 | L5 | M5 |
          +----+----+----+----+----+----+----+----+----+----+----+----+
          `);

        // H4
        expect(triggerNodeModification('expand', tree.getNode(3, 7))).toEqual(expect.objectContaining({
          affectedColumns: [8],
          colspanCompensation: 1,
        }));
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
    });
  });
});
