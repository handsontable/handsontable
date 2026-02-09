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
  describe('triggerNodeModification', () => {
    it('should throw an error when unsupported action is used', () => {
      expect(() => {
        triggerNodeModification('trim');
      }).toThrowError('The node modifier action ("trim") does not exist.');
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

      triggerNodeModification('collapse', tree.getNode(2, 8)); // I3
      triggerNodeModification('collapse', tree.getNode(2, 1)); // B3

      // B1
      expect(triggerNodeModification('collapse', tree.getNode(0, 1))).toEqual(expect.objectContaining({
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
      expect(triggerNodeModification('expand', tree.getNode(0, 1))).toEqual(expect.objectContaining({
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

      triggerNodeModification('collapse', tree.getNode(2, 1)); // B3
      triggerNodeModification('collapse', tree.getNode(2, 6)); // G3
      triggerNodeModification('collapse', tree.getNode(2, 8)); // I3

      // B1
      expect(triggerNodeModification('collapse', tree.getNode(0, 1))).toEqual(expect.objectContaining({
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
      expect(triggerNodeModification('expand', tree.getNode(0, 1))).toEqual(expect.objectContaining({
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

      triggerNodeModification('collapse', tree.getNode(2, 1)); // B3
      triggerNodeModification('collapse', tree.getNode(2, 6)); // G3

      // G2
      expect(triggerNodeModification('collapse', tree.getNode(1, 6))).toEqual(expect.objectContaining({
        affectedColumns: [8, 9],
        colspanCompensation: 2,
      }));

      // B1
      expect(triggerNodeModification('collapse', tree.getNode(0, 1))).toEqual(expect.objectContaining({
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
      expect(triggerNodeModification('expand', tree.getNode(0, 1))).toEqual(expect.objectContaining({
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

      triggerNodeModification('collapse', tree.getNode(2, 1)); // B3
      triggerNodeModification('collapse', tree.getNode(1, 3)); // D2
      triggerNodeModification('collapse', tree.getNode(1, 6)); // G2

      // B1
      expect(triggerNodeModification('collapse', tree.getNode(0, 1))).toEqual(expect.objectContaining({
        affectedColumns: [3],
        colspanCompensation: 1,
      }));
      // G1
      expect(triggerNodeModification('collapse', tree.getNode(0, 6))).toEqual(expect.objectContaining({
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
      expect(triggerNodeModification('expand', tree.getNode(0, 6))).toEqual(expect.objectContaining({
        affectedColumns: [8, 9],
        colspanCompensation: 2,
      }));
      // B1
      expect(triggerNodeModification('expand', tree.getNode(0, 1))).toEqual(expect.objectContaining({
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
