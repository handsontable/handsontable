import { TRAVERSAL_DF_POST } from 'handsontable/utils/dataStructures/tree';
import HeadersTree from 'handsontable/plugins/nestedHeaders/stateManager/headersTree';
import SourceSettings from 'handsontable/plugins/nestedHeaders/stateManager/sourceSettings';
import NodeModifiers from 'handsontable/plugins/nestedHeaders/stateManager/nodeModifiers';
import './custom-matchers';

function createTree(nestedHeadersSettings) {
  const source = new SourceSettings();

  source.setData(nestedHeadersSettings);

  return new HeadersTree(source);
}

describe('NodeModifiers', () => {
  describe('triggerAction', () => {
    it('should throw an error when unsupported action is used', () => {
      const nodeModifier = new NodeModifiers();

      expect(() => {
        nodeModifier.triggerAction('trim');
      }).toThrowError('The node modifier action ("trim") does not exist.');
    });

    it('should call internal action and return modification results', () => {
      const nodeModifier = new NodeModifiers();
      const mockNode = {};

      spyOn(nodeModifier, 'collapseNode').and.returnValue('test');

      const result = nodeModifier.triggerAction('collapse', mockNode);

      expect(nodeModifier.collapseNode).toHaveBeenCalledTimes(1);
      expect(nodeModifier.collapseNode).toHaveBeenCalledWith(mockNode);
      expect(result).toBe('test');
    });
  });

  describe('collapseNode', () => {
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

      it('should ignore collapsing when the node has a colspan = 1', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const nodeModifier = new NodeModifiers();

        const expected = `
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | B1                | F1           | I1 | J1 |
          +----+----+----+----+----+----+----+----+----+----+
          | A2 | B2           | E2 | F2      | H2 | I2 | J2 |
          +----+----+----+----+----+----+----+----+----+----+
          `;

        // A1
        expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 0))).toEqual(expect.objectContaining({
          affectedColumns: [],
          colspanCompensation: 0,
        }));
        expect(tree).toBeMatchToHeadersStructure(expected);

        // A4
        expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 8))).toEqual(expect.objectContaining({
          affectedColumns: [],
          colspanCompensation: 0,
        }));
        expect(tree).toBeMatchToHeadersStructure(expected);

        // B1
        expect(nodeModifier.triggerAction('collapse', tree.getNode(1, 0))).toEqual(expect.objectContaining({
          affectedColumns: [],
          colspanCompensation: 0,
        }));
        expect(tree).toBeMatchToHeadersStructure(expected);

        // B3
        expect(nodeModifier.triggerAction('collapse', tree.getNode(1, 4))).toEqual(expect.objectContaining({
          affectedColumns: [],
          colspanCompensation: 0,
        }));
        expect(tree).toBeMatchToHeadersStructure(expected);

        // B5
        expect(nodeModifier.triggerAction('collapse', tree.getNode(1, 7))).toEqual(expect.objectContaining({
          affectedColumns: [],
          colspanCompensation: 0,
        }));
        expect(tree).toBeMatchToHeadersStructure(expected);
      });

      it('should collapse the node once', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const nodeModifier = new NodeModifiers();

        // B1
        expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 1))).toEqual(expect.objectContaining({
          affectedColumns: [4],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+
          | A1 | B1         * | F1           | I1 | J1 |
          +----+----+----+----+----+----+----+----+----+
          | A2 | B2           | F2      | H2 | I2 | J2 |
          +----+----+----+----+----+----+----+----+----+
          `);

        expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 1))).toEqual(expect.objectContaining({
          affectedColumns: [],
          colspanCompensation: 0,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+
          | A1 | B1         * | F1           | I1 | J1 |
          +----+----+----+----+----+----+----+----+----+
          | A2 | B2           | F2      | H2 | I2 | J2 |
          +----+----+----+----+----+----+----+----+----+
          `);
      });

      it('should collapse the node using column index which point to node in-between its colspan range', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const nodeModifier = new NodeModifiers();

        // B1
        expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 4))).toEqual(expect.objectContaining({
          affectedColumns: [4],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+
          | A1 | B1         * | F1           | I1 | J1 |
          +----+----+----+----+----+----+----+----+----+
          | A2 | B2           | F2      | H2 | I2 | J2 |
          +----+----+----+----+----+----+----+----+----+
          `);
      });

      it('should collapse the nodes and keep in sync other node colspan widths', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const nodeModifier = new NodeModifiers();

        // F2
        expect(nodeModifier.triggerAction('collapse', tree.getNode(1, 5))).toEqual(expect.objectContaining({
          affectedColumns: [6],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+
          | A1 | B1                | F1      | I1 | J1 |
          +----+----+----+----+----+----+----+----+----+
          | A2 | B2           | E2 | F2*| H2 | I2 | J2 |
          +----+----+----+----+----+----+----+----+----+
          `);

        // B1
        expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 1))).toEqual(expect.objectContaining({
          affectedColumns: [4],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+
          | A1 | B1         * | F1      | I1 | J1 |
          +----+----+----+----+----+----+----+----+
          | A2 | B2           | F2*| H2 | I2 | J2 |
          +----+----+----+----+----+----+----+----+
          `);

        // B2
        expect(nodeModifier.triggerAction('collapse', tree.getNode(1, 3))).toEqual(expect.objectContaining({
          affectedColumns: [2, 3],
          colspanCompensation: 2,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+
          | A1 | B1*| F1      | I1 | J1 |
          +----+----+----+----+----+----+
          | A2 | B2*| F2*| H2 | I2 | J2 |
          +----+----+----+----+----+----+
          `);

        // F1
        expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 5))).toEqual(expect.objectContaining({
          affectedColumns: [7],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+
          | A1 | B1*| F1*| I1 | J1 |
          +----+----+----+----+----+
          | A2 | B2*| F2*| I2 | J2 |
          +----+----+----+----+----+
          `);
      });

      it('should rollback the last performed action', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const nodeModifier = new NodeModifiers();

        {
          // F2
          const modResult = nodeModifier.triggerAction('collapse', tree.getNode(1, 5));

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+----+----+----+
            | A1 | B1                | F1      | I1 | J1 |
            +----+----+----+----+----+----+----+----+----+
            | A2 | B2           | E2 | F2*| H2 | I2 | J2 |
            +----+----+----+----+----+----+----+----+----+
            `);

          modResult.rollbackModification();

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+----+----+----+----+
            | A1 | B1                | F1           | I1 | J1 |
            +----+----+----+----+----+----+----+----+----+----+
            | A2 | B2           | E2 | F2      | H2 | I2 | J2 |
            +----+----+----+----+----+----+----+----+----+----+
            `);
        }
        {
          // F2 (again)
          const modResult = nodeModifier.triggerAction('collapse', tree.getNode(1, 5));

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+----+----+----+
            | A1 | B1                | F1      | I1 | J1 |
            +----+----+----+----+----+----+----+----+----+
            | A2 | B2           | E2 | F2*| H2 | I2 | J2 |
            +----+----+----+----+----+----+----+----+----+
            `);

          modResult.rollbackModification();

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+----+----+----+----+
            | A1 | B1                | F1           | I1 | J1 |
            +----+----+----+----+----+----+----+----+----+----+
            | A2 | B2           | E2 | F2      | H2 | I2 | J2 |
            +----+----+----+----+----+----+----+----+----+----+
            `);
        }
        {
          nodeModifier.triggerAction('collapse', tree.getNode(1, 5)); // F2
          nodeModifier.triggerAction('collapse', tree.getNode(0, 1)); // B1

          const modResult = nodeModifier.triggerAction('collapse', tree.getNode(1, 3)); // B2

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+
            | A1 | B1*| F1      | I1 | J1 |
            +----+----+----+----+----+----+
            | A2 | B2*| F2*| H2 | I2 | J2 |
            +----+----+----+----+----+----+
            `);

          modResult.rollbackModification();

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+----+----+
            | A1 | B1         * | F1      | I1 | J1 |
            +----+----+----+----+----+----+----+----+
            | A2 | B2           | F2*| H2 | I2 | J2 |
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

      it('should collapse the nodes and keep in sync other node colspan widths', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const nodeModifier = new NodeModifiers();

        // C3
        expect(nodeModifier.triggerAction('collapse', tree.getNode(2, 4))).toEqual(expect.objectContaining({
          affectedColumns: [3, 4],
          colspanCompensation: 2,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+
          | A1 | B1                          | J1 |
          +----+----+----+----+----+----+----+----+
          | A2 | B2      | F2                | J2 |
          +----+----+----+----+----+----+----+----+
          | A3 | B3 | C3*| F3      | H3      | J3 |
          +----+----+----+----+----+----+----+----+
          | A4 | B4 | C4 | F4 | G4 | H4 | I4 |    |
          +----+----+----+----+----+----+----+----+
          `);

        // F3
        expect(nodeModifier.triggerAction('collapse', tree.getNode(2, 5))).toEqual(expect.objectContaining({
          affectedColumns: [6],
          colspanCompensation: 1,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+
          | A1 | B1                     | J1 |
          +----+----+----+----+----+----+----+
          | A2 | B2      | F2           | J2 |
          +----+----+----+----+----+----+----+
          | A3 | B3 | C3*| F3*| H3      | J3 |
          +----+----+----+----+----+----+----+
          | A4 | B4 | C4 | F4 | H4 | I4 |    |
          +----+----+----+----+----+----+----+
          `);

        // F2
        expect(nodeModifier.triggerAction('collapse', tree.getNode(1, 5))).toEqual(expect.objectContaining({
          affectedColumns: [7, 8],
          colspanCompensation: 2,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+
          | A1 | B1           | J1 |
          +----+----+----+----+----+
          | A2 | B2      | F2*| J2 |
          +----+----+----+----+----+
          | A3 | B3 | C3*| F3*| J3 |
          +----+----+----+----+----+
          | A4 | B4 | C4 | F4 |    |
          +----+----+----+----+----+
          `);

        // B1 (it will be collapsed to the colspan of its first child)
        expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 1))).toEqual(expect.objectContaining({
          affectedColumns: [5],
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

      it('should collapse the nodes and keep in sync other node colspan widths', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const nodeModifier = new NodeModifiers();

        // B3
        expect(nodeModifier.triggerAction('collapse', tree.getNode(2, 4))).toEqual(expect.objectContaining({
          affectedColumns: [3, 4],
          colspanCompensation: 2,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+----+
          | A1 | B1                          | J1 | K1           |
          +----+----+----+----+----+----+----+----+----+----+----+
          | A2 | B2                          | J2 | K2           |
          +----+----+----+----+----+----+----+----+----+----+----+
          | A3 | B3    * | F3                | J3 | K3           |
          +----+----+----+----+----+----+----+----+----+----+----+
          | A4 | B4      | F4      | H4      | J4 | K4 | L4      |
          +----+----+----+----+----+----+----+----+----+----+----+
          | A5 | B5 | C5 | F5 | G5 | H5 | I5 | J5 | K5 | L5 | M5 |
          +----+----+----+----+----+----+----+----+----+----+----+
          `);

        // B2
        expect(nodeModifier.triggerAction('collapse', tree.getNode(1, 1))).toEqual(expect.objectContaining({
          affectedColumns: [5, 7, 6, 8],
          colspanCompensation: 4,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+
          | A1 | B1    * | J1 | K1           |
          +----+----+----+----+----+----+----+
          | A2 | B2    * | J2 | K2           |
          +----+----+----+----+----+----+----+
          | A3 | B3    * | J3 | K3           |
          +----+----+----+----+----+----+----+
          | A4 | B4      | J4 | K4 | L4      |
          +----+----+----+----+----+----+----+
          | A5 | B5 | C5 | J5 | K5 | L5 | M5 |
          +----+----+----+----+----+----+----+
          `);

        // K1 ("mirrored" header, has the same colspan as its children)
        expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 10))).toEqual(expect.objectContaining({
          affectedColumns: [11, 12],
          colspanCompensation: 2,
        }));
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+
          | A1 | B1    * | J1 | K1*|
          +----+----+----+----+----+
          | A2 | B2    * | J2 | K2*|
          +----+----+----+----+----+
          | A3 | B3    * | J3 | K3*|
          +----+----+----+----+----+
          | A4 | B4      | J4 | K4 |
          +----+----+----+----+----+
          | A5 | B5 | C5 | J5 | K5 |
          +----+----+----+----+----+
          `);

        // B4 (collapse last column)
        expect(nodeModifier.triggerAction('collapse', tree.getNode(3, 1))).toEqual(expect.objectContaining({
          affectedColumns: [2],
          colspanCompensation: 1,
        }));
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
      });
    });
  });

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

        const nodeModifier = new NodeModifiers();

        const expected = `
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | B1                | F1           | I1 | J1 |
          +----+----+----+----+----+----+----+----+----+----+
          | A2 | B2           | E2 | F2      | H2 | I2 | J2 |
          +----+----+----+----+----+----+----+----+----+----+
          `;

        // A1
        expect(nodeModifier.triggerAction('expand', tree.getNode(0, 0))).toEqual(expect.objectContaining({
          affectedColumns: [],
          colspanCompensation: 0,
        }));
        expect(tree).toBeMatchToHeadersStructure(expected);

        // I1
        expect(nodeModifier.triggerAction('expand', tree.getNode(0, 8))).toEqual(expect.objectContaining({
          affectedColumns: [],
          colspanCompensation: 0,
        }));
        expect(tree).toBeMatchToHeadersStructure(expected);

        // A2
        expect(nodeModifier.triggerAction('expand', tree.getNode(1, 0))).toEqual(expect.objectContaining({
          affectedColumns: [],
          colspanCompensation: 0,
        }));
        expect(tree).toBeMatchToHeadersStructure(expected);

        // E2
        expect(nodeModifier.triggerAction('expand', tree.getNode(1, 4))).toEqual(expect.objectContaining({
          affectedColumns: [],
          colspanCompensation: 0,
        }));
        expect(tree).toBeMatchToHeadersStructure(expected);

        // H2
        expect(nodeModifier.triggerAction('expand', tree.getNode(1, 7))).toEqual(expect.objectContaining({
          affectedColumns: [],
          colspanCompensation: 0,
        }));
        expect(tree).toBeMatchToHeadersStructure(expected);
      });

      it('should expand the node once', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const nodeModifier = new NodeModifiers();

        // B1
        nodeModifier.triggerAction('collapse', tree.getNode(0, 1));

        // B1
        expect(nodeModifier.triggerAction('expand', tree.getNode(0, 1))).toEqual(expect.objectContaining({
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(0, 1))).toEqual(expect.objectContaining({
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

        const nodeModifier = new NodeModifiers();

        // B1
        nodeModifier.triggerAction('collapse', tree.getNode(0, 4));

        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+
          | A1 | B1         * | F1           | I1 | J1 |
          +----+----+----+----+----+----+----+----+----+
          | A2 | B2           | F2      | H2 | I2 | J2 |
          +----+----+----+----+----+----+----+----+----+
          `);

        // B1
        expect(nodeModifier.triggerAction('expand', tree.getNode(0, 4))).toEqual(expect.objectContaining({
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

        const nodeModifier = new NodeModifiers();

        // Collapse all nodes.
        tree.getRoots().forEach((rootNode) => {
          rootNode.walkDown((node) => {
            if (node.data.origColspan > 1) {
              nodeModifier.collapseNode(node);
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(1, 1))).toEqual(expect.objectContaining({
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(0, 5))).toEqual(expect.objectContaining({
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(1, 5))).toEqual(expect.objectContaining({
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(0, 1))).toEqual(expect.objectContaining({
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

        const nodeModifier = new NodeModifiers();

        // Collapse all nodes.
        tree.getRoots().forEach((rootNode) => {
          rootNode.walkDown((node) => {
            if (node.data.origColspan > 1) {
              nodeModifier.collapseNode(node);
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
          nodeModifier.triggerAction('expand', tree.getNode(1, 1)); // B2

          const modResult = nodeModifier.triggerAction('expand', tree.getNode(0, 5)); // F1

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
          nodeModifier.triggerAction('expand', tree.getNode(1, 5)); // F2

          const modResult = nodeModifier.triggerAction('expand', tree.getNode(0, 1)); // B1

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

        const nodeModifier = new NodeModifiers();

        // Collapse all nodes.
        tree.getRoots().forEach((rootNode) => {
          rootNode.walkDown((node) => {
            if (node.data.colspan > 1) {
              nodeModifier.collapseNode(node);
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(1, 1))).toEqual(expect.objectContaining({
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(2, 2))).toEqual(expect.objectContaining({
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(0, 1))).toEqual(expect.objectContaining({
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(1, 5))).toEqual(expect.objectContaining({
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(2, 7))).toEqual(expect.objectContaining({
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(2, 5))).toEqual(expect.objectContaining({
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

        const nodeModifier = new NodeModifiers();

        // Collapse all nodes.
        tree.getRoots().forEach((rootNode) => {
          rootNode.walkDown((node) => {
            if (node.data.colspan > 1) {
              nodeModifier.collapseNode(node);
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(2, 1))).toEqual(expect.objectContaining({
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(1, 1))).toEqual(expect.objectContaining({
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(0, 10))).toEqual(expect.objectContaining({
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(3, 1))).toEqual(expect.objectContaining({
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(3, 5))).toEqual(expect.objectContaining({
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(3, 11))).toEqual(expect.objectContaining({
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(2, 5))).toEqual(expect.objectContaining({
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(3, 3))).toEqual(expect.objectContaining({
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
        expect(nodeModifier.triggerAction('expand', tree.getNode(3, 7))).toEqual(expect.objectContaining({
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

  describe('multiple tree modification', () => {
    it('should not lead to desynchronization of headers while collapsing and expanding a tree (variation #1)', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+----+----+----+----+
       *   | A1 | B1                                         | K1 |
       *   +----+----+----+----+----+----+----+----+----+----+----+
       *   | A2 | B2                     | G2                | K2 |
       *   +----+----+----+----+----+----+----+----+----+----+----+
       *   | A3 | B3      | D3           | G3      | I3      | K3 |
       *   +----+----+----+----+----+----+----+----+----+----+----+
       *   | A4 | B4 | C4 | D4 | E4 | F4 | G4 | H4 | I4 | J4 | K4 |
       *   +----+----+----+----+----+----+----+----+----+----+----+
       */
      const tree = createTree([
        ['A1', { label: 'B1', colspan: 9 }, 'K1'],
        ['A2', { label: 'B2', colspan: 5 }, { label: 'G2', colspan: 4 }, 'K2'],
        ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 3 }, { label: 'G3', colspan: 2 },
          { label: 'I3', colspan: 2 }, 'K3'],
        ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4'],
      ]);

      tree.buildTree();

      const nodeModifier = new NodeModifiers();

      nodeModifier.triggerAction('collapse', tree.getNode(2, 8)); // I3
      nodeModifier.triggerAction('collapse', tree.getNode(2, 1)); // B3

      // B1
      expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 1))).toEqual(expect.objectContaining({
        affectedColumns: [6, 8, 7],
        colspanCompensation: 3,
      }));

      expect(tree).toBeMatchToHeadersStructure(`
        +----+----+----+----+----+----+
        | A1 | B1              * | K1 |
        +----+----+----+----+----+----+
        | A2 | B2                | K2 |
        +----+----+----+----+----+----+
        | A3 | B3*| D3           | K3 |
        +----+----+----+----+----+----+
        | A4 | B4 | D4 | E4 | F4 | K4 |
        +----+----+----+----+----+----+
        `);

      // B1
      expect(nodeModifier.triggerAction('expand', tree.getNode(0, 1))).toEqual(expect.objectContaining({
        affectedColumns: [6, 8, 7],
        colspanCompensation: 3,
      }));

      expect(tree).toBeMatchToHeadersStructure(`
        +----+----+----+----+----+----+----+----+----+
        | A1 | B1                               | K1 |
        +----+----+----+----+----+----+----+----+----+
        | A2 | B2                | G2           | K2 |
        +----+----+----+----+----+----+----+----+----+
        | A3 | B3*| D3           | G3      | I3*| K3 |
        +----+----+----+----+----+----+----+----+----+
        | A4 | B4 | D4 | E4 | F4 | G4 | H4 | I4 | K4 |
        +----+----+----+----+----+----+----+----+----+
        `);
    });

    it('should not lead to desynchronization of headers while collapsing and expanding a tree (variation #2)', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+----+----+----+----+
       *   | A1 | B1                                         | K1 |
       *   +----+----+----+----+----+----+----+----+----+----+----+
       *   | A2 | B2                     | G2                | K2 |
       *   +----+----+----+----+----+----+----+----+----+----+----+
       *   | A3 | B3      | D3           | G3      | I3      | K3 |
       *   +----+----+----+----+----+----+----+----+----+----+----+
       *   | A4 | B4 | C4 | D4 | E4 | F4 | G4 | H4 | I4 | J4 | K4 |
       *   +----+----+----+----+----+----+----+----+----+----+----+
       */
      const tree = createTree([
        ['A1', { label: 'B1', colspan: 9 }, 'K1'],
        ['A2', { label: 'B2', colspan: 5 }, { label: 'G2', colspan: 4 }, 'K2'],
        ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 3 }, { label: 'G3', colspan: 2 },
          { label: 'I3', colspan: 2 }, 'K3'],
        ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4'],
      ]);

      tree.buildTree();

      const nodeModifier = new NodeModifiers();

      nodeModifier.triggerAction('collapse', tree.getNode(2, 1)); // B3
      nodeModifier.triggerAction('collapse', tree.getNode(2, 6)); // G3
      nodeModifier.triggerAction('collapse', tree.getNode(2, 8)); // I3

      // B1
      expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 1))).toEqual(expect.objectContaining({
        affectedColumns: [6, 8],
        colspanCompensation: 2,
      }));

      expect(tree).toBeMatchToHeadersStructure(`
        +----+----+----+----+----+----+
        | A1 | B1              * | K1 |
        +----+----+----+----+----+----+
        | A2 | B2                | K2 |
        +----+----+----+----+----+----+
        | A3 | B3*| D3           | K3 |
        +----+----+----+----+----+----+
        | A4 | B4 | D4 | E4 | F4 | K4 |
        +----+----+----+----+----+----+
        `);

      // B1
      expect(nodeModifier.triggerAction('expand', tree.getNode(0, 1))).toEqual(expect.objectContaining({
        affectedColumns: [6, 8],
        colspanCompensation: 2,
      }));

      expect(tree).toBeMatchToHeadersStructure(`
        +----+----+----+----+----+----+----+----+
        | A1 | B1                          | K1 |
        +----+----+----+----+----+----+----+----+
        | A2 | B2                | G2      | K2 |
        +----+----+----+----+----+----+----+----+
        | A3 | B3*| D3           | G3*| I3*| K3 |
        +----+----+----+----+----+----+----+----+
        | A4 | B4 | D4 | E4 | F4 | G4 | I4 | K4 |
        +----+----+----+----+----+----+----+----+
        `);
    });

    it('should not lead to desynchronization of headers while collapsing and expanding a tree (variation #3)', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+----+----+----+----+
       *   | A1 | B1                                         | K1 |
       *   +----+----+----+----+----+----+----+----+----+----+----+
       *   | A2 | B2                     | G2                | K2 |
       *   +----+----+----+----+----+----+----+----+----+----+----+
       *   | A3 | B3      | D3           | G3      | I3      | K3 |
       *   +----+----+----+----+----+----+----+----+----+----+----+
       *   | A4 | B4 | C4 | D4 | E4 | F4 | G4 | H4 | I4 | J4 | K4 |
       *   +----+----+----+----+----+----+----+----+----+----+----+
       */
      const tree = createTree([
        ['A1', { label: 'B1', colspan: 9 }, 'K1'],
        ['A2', { label: 'B2', colspan: 5 }, { label: 'G2', colspan: 4 }, 'K2'],
        ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 3 }, { label: 'G3', colspan: 2 },
          { label: 'I3', colspan: 2 }, 'K3'],
        ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4'],
      ]);

      tree.buildTree();

      const nodeModifier = new NodeModifiers();

      nodeModifier.triggerAction('collapse', tree.getNode(2, 1)); // B3
      nodeModifier.triggerAction('collapse', tree.getNode(2, 6)); // G3

      // G2
      expect(nodeModifier.triggerAction('collapse', tree.getNode(1, 6))).toEqual(expect.objectContaining({
        affectedColumns: [8, 9],
        colspanCompensation: 2,
      }));

      // B1
      expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 1))).toEqual(expect.objectContaining({
        affectedColumns: [6],
        colspanCompensation: 1,
      }));

      expect(tree).toBeMatchToHeadersStructure(`
        +----+----+----+----+----+----+
        | A1 | B1              * | K1 |
        +----+----+----+----+----+----+
        | A2 | B2                | K2 |
        +----+----+----+----+----+----+
        | A3 | B3*| D3           | K3 |
        +----+----+----+----+----+----+
        | A4 | B4 | D4 | E4 | F4 | K4 |
        +----+----+----+----+----+----+
        `);

      // B1
      expect(nodeModifier.triggerAction('expand', tree.getNode(0, 1))).toEqual(expect.objectContaining({
        affectedColumns: [6],
        colspanCompensation: 1,
      }));

      expect(tree).toBeMatchToHeadersStructure(`
        +----+----+----+----+----+----+----+
        | A1 | B1                     | K1 |
        +----+----+----+----+----+----+----+
        | A2 | B2                | G2*| K2 |
        +----+----+----+----+----+----+----+
        | A3 | B3*| D3           | G3*| K3 |
        +----+----+----+----+----+----+----+
        | A4 | B4 | D4 | E4 | F4 | G4 | K4 |
        +----+----+----+----+----+----+----+
        `);
    });

    it('should not lead to desynchronization of headers while collapsing and expanding a tree (variation #4, "mirrored" children)', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+----+----+----+----+
       *   | A1 | B1                     | G1                | K1 |
       *   +----+----+----+----+----+----+----+----+----+----+----+
       *   | A2 | B2      | D2           | G2      | I2      | K2 |
       *   +----+----+----+----+----+----+----+----+----+----+----+
       *   | A3 | B3      | D3           | G3 | H3 | I3      | K3 |
       *   +----+----+----+----+----+----+----+----+----+----+----+
       */
      const tree = createTree([
        ['A1', { label: 'B1', colspan: 5 }, { label: 'G1', colspan: 4 }, 'K1'],
        ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 3 }, { label: 'G2', colspan: 2 },
          { label: 'I2', colspan: 2 }, 'K2'],
        ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 3 }, { label: 'G3', colspan: 1 },
          { label: 'H3', colspan: 1 }, { label: 'I3', colspan: 2 }, 'K3'],
      ]);

      tree.buildTree();

      const nodeModifier = new NodeModifiers();

      nodeModifier.triggerAction('collapse', tree.getNode(2, 1)); // B3
      nodeModifier.triggerAction('collapse', tree.getNode(1, 3)); // D2
      nodeModifier.triggerAction('collapse', tree.getNode(1, 6)); // G2

      // B1
      expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 1))).toEqual(expect.objectContaining({
        affectedColumns: [3],
        colspanCompensation: 1,
      }));
      // G1
      expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 6))).toEqual(expect.objectContaining({
        affectedColumns: [8, 9],
        colspanCompensation: 2,
      }));

      expect(tree).toBeMatchToHeadersStructure(`
        +----+----+----+----+
        | A1 | B1*| G1*| K1 |
        +----+----+----+----+
        | A2 | B2*| G2*| K2 |
        +----+----+----+----+
        | A3 | B3*| G3 | K3 |
        +----+----+----+----+
        `);

      // G1
      expect(nodeModifier.triggerAction('expand', tree.getNode(0, 6))).toEqual(expect.objectContaining({
        affectedColumns: [8, 9],
        colspanCompensation: 2,
      }));
      // B1
      expect(nodeModifier.triggerAction('expand', tree.getNode(0, 1))).toEqual(expect.objectContaining({
        affectedColumns: [3],
        colspanCompensation: 1,
      }));

      expect(tree).toBeMatchToHeadersStructure(`
        +----+----+----+----+----+----+----+
        | A1 | B1      | G1           | K1 |
        +----+----+----+----+----+----+----+
        | A2 | B2*| D2*| G2*| I2      | K2 |
        +----+----+----+----+----+----+----+
        | A3 | B3*| D3*| G3 | I3      | K3 |
        +----+----+----+----+----+----+----+
        `);
    });
  });
});
