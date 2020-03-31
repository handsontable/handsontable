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

      nodeModifier.triggerAction('collapse', mockNode);

      expect(nodeModifier.collapseNode).toHaveBeenCalledTimes(1);
      expect(nodeModifier.collapseNode).toHaveBeenCalledWith(mockNode);
    });
  });

  describe('collapseNode', () => {
    describe('variant #1 (basic example)', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | A1 | A2                | A3           | A4 | A5 |
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | B1 | B2           | B3 | B4      | B5 | B6 | B7 |
       *   +----+----+----+----+----+----+----+----+----+----+
       */
      const headerSettings = [
        ['A1', { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 3 }, 'A4', 'A5'],
        ['B1', { label: 'B2', colspan: 3 }, 'B3', { label: 'B4', colspan: 2 }, 'B5', 'B6', 'B7'],
      ];

      it('should ignore collapsing when the node has a colspan = 1', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const nodeModifier = new NodeModifiers();

        const expected = `
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | A2                | A3           | A4 | A5 |
          +----+----+----+----+----+----+----+----+----+----+
          | B1 | B2           | B3 | B4      | B5 | B6 | B7 |
          +----+----+----+----+----+----+----+----+----+----+
          `;

        // A1
        expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 0))).toEqual({
          affectedColumns: [],
          colspanCompensation: 0,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(expected);

        // A4
        expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 8))).toEqual({
          affectedColumns: [],
          colspanCompensation: 0,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(expected);

        // B1
        expect(nodeModifier.triggerAction('collapse', tree.getNode(1, 0))).toEqual({
          affectedColumns: [],
          colspanCompensation: 0,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(expected);

        // B3
        expect(nodeModifier.triggerAction('collapse', tree.getNode(1, 4))).toEqual({
          affectedColumns: [],
          colspanCompensation: 0,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(expected);

        // B5
        expect(nodeModifier.triggerAction('collapse', tree.getNode(1, 7))).toEqual({
          affectedColumns: [],
          colspanCompensation: 0,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(expected);
      });

      it('should collapse the node once', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const nodeModifier = new NodeModifiers();

        // A2
        expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 1))).toEqual({
          affectedColumns: [4],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+
          | A1 | A2         * | A3           | A4 | A5 |
          +----+----+----+----+----+----+----+----+----+
          | B1 | B2           | B4      | B5 | B6 | B7 |
          +----+----+----+----+----+----+----+----+----+
          `);

        expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 1))).toEqual({
          affectedColumns: [],
          colspanCompensation: 0,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+
          | A1 | A2         * | A3           | A4 | A5 |
          +----+----+----+----+----+----+----+----+----+
          | B1 | B2           | B4      | B5 | B6 | B7 |
          +----+----+----+----+----+----+----+----+----+
          `);
      });

      it('should collapse the node using column index which point to node in-between its colspan range', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const nodeModifier = new NodeModifiers();

        // A2
        expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 4))).toEqual({
          affectedColumns: [4],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+
          | A1 | A2         * | A3           | A4 | A5 |
          +----+----+----+----+----+----+----+----+----+
          | B1 | B2           | B4      | B5 | B6 | B7 |
          +----+----+----+----+----+----+----+----+----+
          `);
      });

      it('should collapse the nodes and keep in sync other node colspan widths', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const nodeModifier = new NodeModifiers();

        // B4
        expect(nodeModifier.triggerAction('collapse', tree.getNode(1, 5))).toEqual({
          affectedColumns: [6],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+
          | A1 | A2                | A3      | A4 | A5 |
          +----+----+----+----+----+----+----+----+----+
          | B1 | B2           | B3 | B4*| B5 | B6 | B7 |
          +----+----+----+----+----+----+----+----+----+
          `);

        // A2
        expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 1))).toEqual({
          affectedColumns: [4],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+
          | A1 | A2         * | A3      | A4 | A5 |
          +----+----+----+----+----+----+----+----+
          | B1 | B2           | B4*| B5 | B6 | B7 |
          +----+----+----+----+----+----+----+----+
          `);

        // B2
        expect(nodeModifier.triggerAction('collapse', tree.getNode(1, 3))).toEqual({
          affectedColumns: [3, 2],
          colspanCompensation: 2,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+
          | A1 | A2*| A3      | A4 | A5 |
          +----+----+----+----+----+----+
          | B1 | B2*| B4*| B5 | B6 | B7 |
          +----+----+----+----+----+----+
          `);

        // A3
        expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 5))).toEqual({
          affectedColumns: [7, 6],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+
          | A1 | A2*| A3*| A4 | A5 |
          +----+----+----+----+----+
          | B1 | B2*| B4*| B6 | B7 |
          +----+----+----+----+----+
          `);
      });

      it('should rollback the last performed action', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const nodeModifier = new NodeModifiers();

        {
          // B4
          const modResult = nodeModifier.triggerAction('collapse', tree.getNode(1, 5));

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+----+----+----+
            | A1 | A2                | A3      | A4 | A5 |
            +----+----+----+----+----+----+----+----+----+
            | B1 | B2           | B3 | B4*| B5 | B6 | B7 |
            +----+----+----+----+----+----+----+----+----+
            `);

          modResult.rollbackModification();

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+----+----+----+----+
            | A1 | A2                | A3           | A4 | A5 |
            +----+----+----+----+----+----+----+----+----+----+
            | B1 | B2           | B3 | B4      | B5 | B6 | B7 |
            +----+----+----+----+----+----+----+----+----+----+
            `);
        }
        {
          // B4 (again)
          const modResult = nodeModifier.triggerAction('collapse', tree.getNode(1, 5));

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+----+----+----+
            | A1 | A2                | A3      | A4 | A5 |
            +----+----+----+----+----+----+----+----+----+
            | B1 | B2           | B3 | B4*| B5 | B6 | B7 |
            +----+----+----+----+----+----+----+----+----+
            `);

          modResult.rollbackModification();

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+----+----+----+----+
            | A1 | A2                | A3           | A4 | A5 |
            +----+----+----+----+----+----+----+----+----+----+
            | B1 | B2           | B3 | B4      | B5 | B6 | B7 |
            +----+----+----+----+----+----+----+----+----+----+
            `);
        }
        {
          nodeModifier.triggerAction('collapse', tree.getNode(1, 5)); // B4
          nodeModifier.triggerAction('collapse', tree.getNode(0, 1)); // A2

          const modResult = nodeModifier.triggerAction('collapse', tree.getNode(1, 3)); // B2

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+
            | A1 | A2*| A3      | A4 | A5 |
            +----+----+----+----+----+----+
            | B1 | B2*| B4*| B5 | B6 | B7 |
            +----+----+----+----+----+----+
            `);

          modResult.rollbackModification();

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+----+----+
            | A1 | A2         * | A3      | A4 | A5 |
            +----+----+----+----+----+----+----+----+
            | B1 | B2           | B4*| B5 | B6 | B7 |
            +----+----+----+----+----+----+----+----+
            `);
        }
      });
    });

    describe('variant #2 (advanced example)', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | A1 | A2                                    | A3 |
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | B1 | B2                | B3                | B4 |
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | C1 | C2 | C3           | C4      | C5      | C6 |
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
       *   +----+----+----+----+----+----+----+----+----+----+
       */
      const headerSettings = [
        ['A1', { label: 'A2', colspan: 8 }, 'A3'],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 4 }, 'B4'],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }, { label: 'C5', colspan: 2 }, 'C6'],
        ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'],
      ];

      it('should build a valid structure', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | A2                                    | A3 |
          +----+----+----+----+----+----+----+----+----+----+
          | B1 | B2                | B3                | B4 |
          +----+----+----+----+----+----+----+----+----+----+
          | C1 | C2 | C3           | C4      | C5      | C6 |
          +----+----+----+----+----+----+----+----+----+----+
          | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
          +----+----+----+----+----+----+----+----+----+----+
          `);
      });

      it('should collapse the nodes and keep in sync other node colspan widths', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const nodeModifier = new NodeModifiers();

        // C3
        expect(nodeModifier.triggerAction('collapse', tree.getNode(2, 4))).toEqual({
          affectedColumns: [4, 3],
          colspanCompensation: 2,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+
          | A1 | A2                          | A3 |
          +----+----+----+----+----+----+----+----+
          | B1 | B2      | B3                | B4 |
          +----+----+----+----+----+----+----+----+
          | C1 | C2 | C3*| C4      | C5      | C6 |
          +----+----+----+----+----+----+----+----+
          | D1 | D2 | D3 | D6 | D7 | D8 | D9 |    |
          +----+----+----+----+----+----+----+----+
          `);

        // C4
        expect(nodeModifier.triggerAction('collapse', tree.getNode(2, 5))).toEqual({
          affectedColumns: [6],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+
          | A1 | A2                     | A3 |
          +----+----+----+----+----+----+----+
          | B1 | B2      | B3           | B4 |
          +----+----+----+----+----+----+----+
          | C1 | C2 | C3*| C4*| C5      | C6 |
          +----+----+----+----+----+----+----+
          | D1 | D2 | D3 | D6 | D8 | D9 |    |
          +----+----+----+----+----+----+----+
          `);

        // B3
        expect(nodeModifier.triggerAction('collapse', tree.getNode(1, 5))).toEqual({
          affectedColumns: [8, 7, 6],
          colspanCompensation: 2,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+
          | A1 | A2           | A3 |
          +----+----+----+----+----+
          | B1 | B2      | B3*| B4 |
          +----+----+----+----+----+
          | C1 | C2 | C3*| C4*| C6 |
          +----+----+----+----+----+
          | D1 | D2 | D3 | D6 |    |
          +----+----+----+----+----+
          `);

        // A2 (it will be collapsed to the colspan of its first child)
        expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 1))).toEqual({
          affectedColumns: [8, 7, 6, 5, 4, 3],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+
          | A1 | A2    * | A3 |
          +----+----+----+----+
          | B1 | B2      | B4 |
          +----+----+----+----+
          | C1 | C2 | C3*| C6 |
          +----+----+----+----+
          | D1 | D2 | D3 |    |
          +----+----+----+----+
          `);
      });
    });

    describe('variant #3 (advanced example, with "mirrored" headers)', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | A1 | A2                                    | A3 | A4           |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | B1 | B2                                    | B3 | B4           |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | C1 | C2                | C3                | C4 | C5           |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | D1 | D2      | D3      | D4      | D5      | D6 | D7 | D8      |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | EA | EB | EC | ED | EE | EF | EG | EH | EI | EK | EL | EM | EN |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       */
      const headerSettings = [
        ['A1', { label: 'A2', colspan: 8 }, 'A3', { label: 'A4', colspan: 3 }],
        ['B1', { label: 'B2', colspan: 8 }, 'B3', { label: 'B4', colspan: 3 }],
        ['C1', { label: 'C2', colspan: 4 }, { label: 'C3', colspan: 4 }, 'C4', { label: 'C5', colspan: 3 }],
        ['D1', { label: 'D2', colspan: 2 }, { label: 'D3', colspan: 2 }, { label: 'D4', colspan: 2 },
          { label: 'D5', colspan: 2 }, 'D6', 'D7', { label: 'D8', colspan: 2 }],
        ['EA', 'EB', 'EC', 'ED', 'EE', 'EF', 'EG', 'EH', 'EI', 'EJ', 'EK', 'EL', 'EM'],
      ];

      it('should build a valid structure', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | A1 | A2                                    | A3 | A4           |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | B1 | B2                                    | B3 | B4           |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | C1 | C2                | C3                | C4 | C5           |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | D1 | D2      | D3      | D4      | D5      | D6 | D7 | D8      |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | EA | EB | EC | ED | EE | EF | EG | EH | EI | EJ | EK | EL | EM |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          `);
      });

      it('should collapse the nodes and keep in sync other node colspan widths', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const nodeModifier = new NodeModifiers();

        // C2
        expect(nodeModifier.triggerAction('collapse', tree.getNode(2, 4))).toEqual({
          affectedColumns: [4, 3],
          colspanCompensation: 2,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+----+
          | A1 | A2                          | A3 | A4           |
          +----+----+----+----+----+----+----+----+----+----+----+
          | B1 | B2                          | B3 | B4           |
          +----+----+----+----+----+----+----+----+----+----+----+
          | C1 | C2    * | C3                | C4 | C5           |
          +----+----+----+----+----+----+----+----+----+----+----+
          | D1 | D2      | D4      | D5      | D6 | D7 | D8      |
          +----+----+----+----+----+----+----+----+----+----+----+
          | EA | EB | EC | EF | EG | EH | EI | EJ | EK | EL | EM |
          +----+----+----+----+----+----+----+----+----+----+----+
          `);

        // B2
        expect(nodeModifier.triggerAction('collapse', tree.getNode(1, 1))).toEqual({
          affectedColumns: [8, 7, 6, 5, 4, 3],
          colspanCompensation: 4,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+
          | A1 | A2    * | A3 | A4           |
          +----+----+----+----+----+----+----+
          | B1 | B2    * | B3 | B4           |
          +----+----+----+----+----+----+----+
          | C1 | C2    * | C4 | C5           |
          +----+----+----+----+----+----+----+
          | D1 | D2      | D6 | D7 | D8      |
          +----+----+----+----+----+----+----+
          | EA | EB | EC | EJ | EK | EL | EM |
          +----+----+----+----+----+----+----+
          `);

        // A4 ("mirrored" header, has the same colspan as its children)
        expect(nodeModifier.triggerAction('collapse', tree.getNode(0, 10))).toEqual({
          affectedColumns: [12, 11],
          colspanCompensation: 2,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+
          | A1 | A2    * | A3 | A4*|
          +----+----+----+----+----+
          | B1 | B2    * | B3 | B4*|
          +----+----+----+----+----+
          | C1 | C2    * | C4 | C5*|
          +----+----+----+----+----+
          | D1 | D2      | D6 | D7 |
          +----+----+----+----+----+
          | EA | EB | EC | EJ | EK |
          +----+----+----+----+----+
          `);

        // D2 (collapse last column)
        expect(nodeModifier.triggerAction('collapse', tree.getNode(3, 1))).toEqual({
          affectedColumns: [2],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+
          | A1 | A2*| A3 | A4*|
          +----+----+----+----+
          | B1 | B2*| B3 | B4*|
          +----+----+----+----+
          | C1 | C2*| C4 | C5*|
          +----+----+----+----+
          | D1 | D2*| D6 | D7 |
          +----+----+----+----+
          | EA | EB | EJ | EK |
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
       *   | A1 | A2                | A3           | A4 | A5 |
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | B1 | B2           | B3 | B4      | B5 | B6 | B7 |
       *   +----+----+----+----+----+----+----+----+----+----+
       */
      const headerSettings = [
        ['A1', { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 3 }, 'A4', 'A5'],
        ['B1', { label: 'B2', colspan: 3 }, 'B3', { label: 'B4', colspan: 2 }, 'B5', 'B6', 'B7'],
      ];

      it('should ignore expanding when the node has a colspan = 1', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const nodeModifier = new NodeModifiers();

        const expected = `
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | A2                | A3           | A4 | A5 |
          +----+----+----+----+----+----+----+----+----+----+
          | B1 | B2           | B3 | B4      | B5 | B6 | B7 |
          +----+----+----+----+----+----+----+----+----+----+
          `;

        // A1
        expect(nodeModifier.triggerAction('expand', tree.getNode(0, 0))).toEqual({
          affectedColumns: [],
          colspanCompensation: 0,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(expected);

        // A4
        expect(nodeModifier.triggerAction('expand', tree.getNode(0, 8))).toEqual({
          affectedColumns: [],
          colspanCompensation: 0,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(expected);

        // B1
        expect(nodeModifier.triggerAction('expand', tree.getNode(1, 0))).toEqual({
          affectedColumns: [],
          colspanCompensation: 0,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(expected);

        // B3
        expect(nodeModifier.triggerAction('expand', tree.getNode(1, 4))).toEqual({
          affectedColumns: [],
          colspanCompensation: 0,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(expected);

        // B5
        expect(nodeModifier.triggerAction('expand', tree.getNode(1, 7))).toEqual({
          affectedColumns: [],
          colspanCompensation: 0,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(expected);
      });

      it('should expand the node once', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const nodeModifier = new NodeModifiers();

        // A2
        expect(nodeModifier.triggerAction('expand', tree.getNode(0, 1))).toEqual({
          affectedColumns: [],
          colspanCompensation: 0,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | A2                | A3           | A4 | A5 |
          +----+----+----+----+----+----+----+----+----+----+
          | B1 | B2           | B3 | B4      | B5 | B6 | B7 |
          +----+----+----+----+----+----+----+----+----+----+
          `);

        expect(nodeModifier.triggerAction('expand', tree.getNode(0, 1))).toEqual({
          affectedColumns: [],
          colspanCompensation: 0,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | A2                | A3           | A4 | A5 |
          +----+----+----+----+----+----+----+----+----+----+
          | B1 | B2           | B3 | B4      | B5 | B6 | B7 |
          +----+----+----+----+----+----+----+----+----+----+
          `);
      });

      it('should expand the node using column index which point to node in-between its colspan range', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        const nodeModifier = new NodeModifiers();

        // A2
        nodeModifier.triggerAction('collapse', tree.getNode(0, 4));

        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+
          | A1 | A2         * | A3           | A4 | A5 |
          +----+----+----+----+----+----+----+----+----+
          | B1 | B2           | B4      | B5 | B6 | B7 |
          +----+----+----+----+----+----+----+----+----+
          `);

        // A2
        expect(nodeModifier.triggerAction('expand', tree.getNode(0, 4))).toEqual({
          affectedColumns: [4],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | A2                | A3           | A4 | A5 |
          +----+----+----+----+----+----+----+----+----+----+
          | B1 | B2           | B3 | B4      | B5 | B6 | B7 |
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
          | A1 | A2*| A3*| A4 | A5 |
          +----+----+----+----+----+
          | B1 | B2*| B4*| B6 | B7 |
          +----+----+----+----+----+
          `);

        // B2
        expect(nodeModifier.triggerAction('expand', tree.getNode(1, 1))).toEqual({
          affectedColumns: [1, 2, 3],
          colspanCompensation: 2,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+
          | A1 | A2         * | A3*| A4 | A5 |
          +----+----+----+----+----+----+----+
          | B1 | B2           | B4*| B6 | B7 |
          +----+----+----+----+----+----+----+
          `);

        // A3
        expect(nodeModifier.triggerAction('expand', tree.getNode(0, 5))).toEqual({
          affectedColumns: [7],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+
          | A1 | A2         * | A3      | A4 | A5 |
          +----+----+----+----+----+----+----+----+
          | B1 | B2           | B4*| B5 | B6 | B7 |
          +----+----+----+----+----+----+----+----+
          `);

        // B4
        expect(nodeModifier.triggerAction('expand', tree.getNode(1, 5))).toEqual({
          affectedColumns: [5, 6],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+
          | A1 | A2         * | A3           | A4 | A5 |
          +----+----+----+----+----+----+----+----+----+
          | B1 | B2           | B4      | B5 | B6 | B7 |
          +----+----+----+----+----+----+----+----+----+
          `);

        // A2
        expect(nodeModifier.triggerAction('expand', tree.getNode(0, 1))).toEqual({
          affectedColumns: [4],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | A2                | A3           | A4 | A5 |
          +----+----+----+----+----+----+----+----+----+----+
          | B1 | B2           | B3 | B4      | B5 | B6 | B7 |
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
          | A1 | A2*| A3*| A4 | A5 |
          +----+----+----+----+----+
          | B1 | B2*| B4*| B6 | B7 |
          +----+----+----+----+----+
          `);

        {
          nodeModifier.triggerAction('expand', tree.getNode(1, 1)); // B2

          const modResult = nodeModifier.triggerAction('expand', tree.getNode(0, 5)); // A3

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+----+----+
            | A1 | A2         * | A3      | A4 | A5 |
            +----+----+----+----+----+----+----+----+
            | B1 | B2           | B4*| B5 | B6 | B7 |
            +----+----+----+----+----+----+----+----+
            `);

          modResult.rollbackModification();

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+----+
            | A1 | A2         * | A3*| A4 | A5 |
            +----+----+----+----+----+----+----+
            | B1 | B2           | B4*| B6 | B7 |
            +----+----+----+----+----+----+----+
            `);
        }
        {
          nodeModifier.triggerAction('expand', tree.getNode(1, 5)); // B4

          const modResult = nodeModifier.triggerAction('expand', tree.getNode(0, 1)); // A2

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+----+----+----+
            | A1 | A2                | A3    * | A4 | A5 |
            +----+----+----+----+----+----+----+----+----+
            | B1 | B2           | B3 | B4      | B6 | B7 |
            +----+----+----+----+----+----+----+----+----+
            `);

          modResult.rollbackModification();

          expect(tree).toBeMatchToHeadersStructure(`
            +----+----+----+----+----+----+----+----+
            | A1 | A2         * | A3    * | A4 | A5 |
            +----+----+----+----+----+----+----+----+
            | B1 | B2           | B4      | B6 | B7 |
            +----+----+----+----+----+----+----+----+
            `);
        }
      });
    });

    describe('variant #2 (advanced example)', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | A1 | A2                                    | A3 |
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | B1 | B2                | B3                | B4 |
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | C1 | C2 | C3           | C4      | C5      | C6 |
       *   +----+----+----+----+----+----+----+----+----+----+
       *   | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
       *   +----+----+----+----+----+----+----+----+----+----+
       */
      const headerSettings = [
        ['A1', { label: 'A2', colspan: 8 }, 'A3'],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 4 }, 'B4'],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }, { label: 'C5', colspan: 2 }, 'C6'],
        ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'],
      ];

      it('should build a valid structure', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | A2                                    | A3 |
          +----+----+----+----+----+----+----+----+----+----+
          | B1 | B2                | B3                | B4 |
          +----+----+----+----+----+----+----+----+----+----+
          | C1 | C2 | C3           | C4      | C5      | C6 |
          +----+----+----+----+----+----+----+----+----+----+
          | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
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
          | A1 | A2*| A3 |
          +----+----+----+
          | B1 | B2*| B4 |
          +----+----+----+
          | C1 | C2 | C6 |
          +----+----+----+
          | D1 | D2 |    |
          +----+----+----+
          `);

        // B2
        expect(nodeModifier.triggerAction('expand', tree.getNode(1, 1))).toEqual({
          affectedColumns: [2],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+
          | A1 | A2    * | A3 |
          +----+----+----+----+
          | B1 | B2      | B4 |
          +----+----+----+----+
          | C1 | C2 | C3*| C6 |
          +----+----+----+----+
          | D1 | D2 | D3 |    |
          +----+----+----+----+
          `);

        // C3
        expect(nodeModifier.triggerAction('expand', tree.getNode(2, 2))).toEqual({
          affectedColumns: [3, 4],
          colspanCompensation: 2,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+
          | A1 | A2              * | A3 |
          +----+----+----+----+----+----+
          | B1 | B2                | B4 |
          +----+----+----+----+----+----+
          | C1 | C2 | C3           | C6 |
          +----+----+----+----+----+----+
          | D1 | D2 | D3 | D4 | D5 |    |
          +----+----+----+----+----+----+
          `);

        // A2
        expect(nodeModifier.triggerAction('expand', tree.getNode(0, 1))).toEqual({
          affectedColumns: [5],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+
          | A1 | A2                     | A3 |
          +----+----+----+----+----+----+----+
          | B1 | B2                | B3*| B4 |
          +----+----+----+----+----+----+----+
          | C1 | C2 | C3           | C4*| C6 |
          +----+----+----+----+----+----+----+
          | D1 | D2 | D3 | D4 | D5 | D6 |    |
          +----+----+----+----+----+----+----+
          `);

        // B3
        expect(nodeModifier.triggerAction('expand', tree.getNode(1, 5))).toEqual({
          affectedColumns: [7],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+
          | A1 | A2                          | A3 |
          +----+----+----+----+----+----+----+----+
          | B1 | B2                | B3      | B4 |
          +----+----+----+----+----+----+----+----+
          | C1 | C2 | C3           | C4*| C5*| C6 |
          +----+----+----+----+----+----+----+----+
          | D1 | D2 | D3 | D4 | D5 | D6 | D8 |    |
          +----+----+----+----+----+----+----+----+
          `);

        // C5
        expect(nodeModifier.triggerAction('expand', tree.getNode(2, 7))).toEqual({
          affectedColumns: [8],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+
          | A1 | A2                               | A3 |
          +----+----+----+----+----+----+----+----+----+
          | B1 | B2                | B3           | B4 |
          +----+----+----+----+----+----+----+----+----+
          | C1 | C2 | C3           | C4*| C5      | C6 |
          +----+----+----+----+----+----+----+----+----+
          | D1 | D2 | D3 | D4 | D5 | D6 | D8 | D9 |    |
          +----+----+----+----+----+----+----+----+----+
          `);

        // C4
        expect(nodeModifier.triggerAction('expand', tree.getNode(2, 5))).toEqual({
          affectedColumns: [6],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | A2                                    | A3 |
          +----+----+----+----+----+----+----+----+----+----+
          | B1 | B2                | B3                | B4 |
          +----+----+----+----+----+----+----+----+----+----+
          | C1 | C2 | C3           | C4      | C5      | C6 |
          +----+----+----+----+----+----+----+----+----+----+
          | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |    |
          +----+----+----+----+----+----+----+----+----+----+
          `);
      });
    });

    describe('variant #3 (advanced example, with "mirrored" headers)', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | A1 | A2                                    | A3 | A4           |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | B1 | B2                                    | B3 | B4           |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | C1 | C2                | C3                | C4 | C5           |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | D1 | D2      | D3      | D4      | D5      | D6 | D7 | D8      |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       *   | EA | EB | EC | ED | EE | EF | EG | EH | EI | EK | EL | EM | EN |
       *   +----+----+----+----+----+----+----+----+----+----+----+----+----+
       */
      const headerSettings = [
        ['A1', { label: 'A2', colspan: 8 }, 'A3', { label: 'A4', colspan: 3 }],
        ['B1', { label: 'B2', colspan: 8 }, 'B3', { label: 'B4', colspan: 3 }],
        ['C1', { label: 'C2', colspan: 4 }, { label: 'C3', colspan: 4 }, 'C4', { label: 'C5', colspan: 3 }],
        ['D1', { label: 'D2', colspan: 2 }, { label: 'D3', colspan: 2 }, { label: 'D4', colspan: 2 },
          { label: 'D5', colspan: 2 }, 'D6', 'D7', { label: 'D8', colspan: 2 }],
        ['EA', 'EB', 'EC', 'ED', 'EE', 'EF', 'EG', 'EH', 'EI', 'EJ', 'EK', 'EL', 'EM'],
      ];

      it('should build a valid structure', () => {
        const tree = createTree(headerSettings);

        tree.buildTree();

        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | A1 | A2                                    | A3 | A4           |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | B1 | B2                                    | B3 | B4           |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | C1 | C2                | C3                | C4 | C5           |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | D1 | D2      | D3      | D4      | D5      | D6 | D7 | D8      |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | EA | EB | EC | ED | EE | EF | EG | EH | EI | EJ | EK | EL | EM |
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
          | A1 | A2*| A3 | A4*|
          +----+----+----+----+
          | B1 | B2*| B3 | B4*|
          +----+----+----+----+
          | C1 | C2*| C4 | C5*|
          +----+----+----+----+
          | D1 | D2*| D6 | D7 |
          +----+----+----+----+
          | EA | EB | EJ | EK |
          +----+----+----+----+
          `);

        // C2
        expect(nodeModifier.triggerAction('expand', tree.getNode(2, 1))).toEqual({
          affectedColumns: [3],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+
          | A1 | A2    * | A3 | A4*|
          +----+----+----+----+----+
          | B1 | B2    * | B3 | B4*|
          +----+----+----+----+----+
          | C1 | C2      | C4 | C5*|
          +----+----+----+----+----+
          | D1 | D2*| D3*| D6 | D7 |
          +----+----+----+----+----+
          | EA | EB | ED | EJ | EK |
          +----+----+----+----+----+
          `);

        // B2 (mirrored header A2 should be expanded either)
        expect(nodeModifier.triggerAction('expand', tree.getNode(1, 1))).toEqual({
          affectedColumns: [5],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+
          | A1 | A2           | A3 | A4*|
          +----+----+----+----+----+----+
          | B1 | B2           | B3 | B4*|
          +----+----+----+----+----+----+
          | C1 | C2      | C3*| C4 | C5*|
          +----+----+----+----+----+----+
          | D1 | D2*| D3*| D4*| D6 | D7 |
          +----+----+----+----+----+----+
          | EA | EB | ED | EF | EJ | EK |
          +----+----+----+----+----+----+
          `);

        // A4 (mirrored headers B4 and C5 should be expanded either)
        expect(nodeModifier.triggerAction('expand', tree.getNode(0, 10))).toEqual({
          affectedColumns: [11],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+
          | A1 | A2           | A3 | A4      |
          +----+----+----+----+----+----+----+
          | B1 | B2           | B3 | B4      |
          +----+----+----+----+----+----+----+
          | C1 | C2      | C3*| C4 | C5      |
          +----+----+----+----+----+----+----+
          | D1 | D2*| D3*| D4*| D6 | D7 | D8*|
          +----+----+----+----+----+----+----+
          | EA | EB | ED | EF | EJ | EK | EL |
          +----+----+----+----+----+----+----+
          `);

        // D2
        expect(nodeModifier.triggerAction('expand', tree.getNode(3, 1))).toEqual({
          affectedColumns: [2],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+
          | A1 | A2                | A3 | A4      |
          +----+----+----+----+----+----+----+----+
          | B1 | B2                | B3 | B4      |
          +----+----+----+----+----+----+----+----+
          | C1 | C2           | C3*| C4 | C5      |
          +----+----+----+----+----+----+----+----+
          | D1 | D2      | D3*| D4*| D6 | D7 | D8*|
          +----+----+----+----+----+----+----+----+
          | EA | EB | EC | ED | EF | EJ | EK | EL |
          +----+----+----+----+----+----+----+----+
          `);

        // D4
        expect(nodeModifier.triggerAction('expand', tree.getNode(3, 5))).toEqual({
          affectedColumns: [6],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+
          | A1 | A2                     | A3 | A4      |
          +----+----+----+----+----+----+----+----+----+
          | B1 | B2                     | B3 | B4      |
          +----+----+----+----+----+----+----+----+----+
          | C1 | C2           | C3    * | C4 | C5      |
          +----+----+----+----+----+----+----+----+----+
          | D1 | D2      | D3*| D4      | D6 | D7 | D8*|
          +----+----+----+----+----+----+----+----+----+
          | EA | EB | EC | ED | EF | EG | EJ | EK | EL |
          +----+----+----+----+----+----+----+----+----+
          `);

        // D8
        expect(nodeModifier.triggerAction('expand', tree.getNode(3, 11))).toEqual({
          affectedColumns: [12],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+
          | A1 | A2                     | A3 | A4           |
          +----+----+----+----+----+----+----+----+----+----+
          | B1 | B2                     | B3 | B4           |
          +----+----+----+----+----+----+----+----+----+----+
          | C1 | C2           | C3    * | C4 | C5           |
          +----+----+----+----+----+----+----+----+----+----+
          | D1 | D2      | D3*| D4      | D6 | D7 | D8      |
          +----+----+----+----+----+----+----+----+----+----+
          | EA | EB | EC | ED | EF | EG | EJ | EK | EL | EM |
          +----+----+----+----+----+----+----+----+----+----+
          `);

        // C3
        expect(nodeModifier.triggerAction('expand', tree.getNode(2, 5))).toEqual({
          affectedColumns: [7],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+----+
          | A1 | A2                          | A3 | A4           |
          +----+----+----+----+----+----+----+----+----+----+----+
          | B1 | B2                          | B3 | B4           |
          +----+----+----+----+----+----+----+----+----+----+----+
          | C1 | C2           | C3           | C4 | C5           |
          +----+----+----+----+----+----+----+----+----+----+----+
          | D1 | D2      | D3*| D4      | D5*| D6 | D7 | D8      |
          +----+----+----+----+----+----+----+----+----+----+----+
          | EA | EB | EC | ED | EF | EG | EH | EJ | EK | EL | EM |
          +----+----+----+----+----+----+----+----+----+----+----+
          `);

        // D3
        expect(nodeModifier.triggerAction('expand', tree.getNode(3, 3))).toEqual({
          affectedColumns: [4],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+----+----+
          | A1 | A2                               | A3 | A4           |
          +----+----+----+----+----+----+----+----+----+----+----+----+
          | B1 | B2                               | B3 | B4           |
          +----+----+----+----+----+----+----+----+----+----+----+----+
          | C1 | C2                | C3           | C4 | C5           |
          +----+----+----+----+----+----+----+----+----+----+----+----+
          | D1 | D2      | D3      | D4      | D5*| D6 | D7 | D8      |
          +----+----+----+----+----+----+----+----+----+----+----+----+
          | EA | EB | EC | ED | EE | EF | EG | EH | EJ | EK | EL | EM |
          +----+----+----+----+----+----+----+----+----+----+----+----+
          `);

        // D5
        expect(nodeModifier.triggerAction('expand', tree.getNode(3, 7))).toEqual({
          affectedColumns: [8],
          colspanCompensation: 1,
          rollbackModification: jasmine.any(Function),
        });
        expect(tree).toBeMatchToHeadersStructure(`
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | A1 | A2                                    | A3 | A4           |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | B1 | B2                                    | B3 | B4           |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | C1 | C2                | C3                | C4 | C5           |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | D1 | D2      | D3      | D4      | D5      | D6 | D7 | D8      |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          | EA | EB | EC | ED | EE | EF | EG | EH | EI | EJ | EK | EL | EM |
          +----+----+----+----+----+----+----+----+----+----+----+----+----+
          `);
      });
    });
  });
});
