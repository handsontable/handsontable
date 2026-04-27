describe('NestedHeaders', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    // Matchers configuration.
    this.matchersConfig = {
      toMatchHTML: {
        keepAttributes: ['class', 'colspan']
      }
    };
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('showing columns', () => {
    it('should work with default setup', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: true,
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

      hidingMap.setValueAtIndex(1, false); // Show column that contains cells B{n}
      hidingMap.setValueAtIndex(4, false); // Show column that contains cells E{n}
      hidingMap.setValueAtIndex(8, false); // Show column that contains cells I{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
          <th class=""></th>
          <th class=""></th>
          <th class=""></th>
        </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">B1</td>
            <td class="">E1</td>
            <td class="">I1</td>
          </tr>
        </tbody>
        `);
    });

    it('should work with minimal setup', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
      });

      await updateSettings({
        nestedHeaders: [[]],
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

      hidingMap.setValueAtIndex(1, false); // Show column that contains cells B{n}
      hidingMap.setValueAtIndex(4, false); // Show column that contains cells E{n}
      hidingMap.setValueAtIndex(8, false); // Show column that contains cells I{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">B1</td>
            <td class="">E1</td>
            <td class="">I1</td>
          </tr>
        </tbody>
        `);
    });

    it('should work with single level of nested headers configuration', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 3 }, 'E', 'F', { label: 'G', colspan: 2 }, 'I', 'J'],
        ],
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

      hidingMap.setValueAtIndex(2, false); // Show column that contains cells C{n}
      hidingMap.setValueAtIndex(6, false); // Show column that contains cells G{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">B</th>
            <th class="">G</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">C1</td>
            <td class="">G1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(4, false); // Show column that contains cells E{n}
      hidingMap.setValueAtIndex(5, false); // Show column that contains cells F{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">B</th>
            <th class="">E</th>
            <th class="">F</th>
            <th class="">G</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">C1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(8, false); // Show column that contains cells I{n}
      hidingMap.setValueAtIndex(0, false); // Show column that contains cells A{n}
      hidingMap.setValueAtIndex(3, false); // Show column that contains cells D{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="" colspan="2">B</th>
            <th class="hiddenHeader"></th>
            <th class="">E</th>
            <th class="">F</th>
            <th class="">G</th>
            <th class="">I</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">I1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(1, false); // Show column that contains cells B{n}
      hidingMap.setValueAtIndex(7, false); // Show column that contains cells H{n}
      hidingMap.setValueAtIndex(9, false); // Show column that contains cells J{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="" colspan="3">B</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E</th>
            <th class="">F</th>
            <th class="" colspan="2">G</th>
            <th class="hiddenHeader"></th>
            <th class="">I</th>
            <th class="">J</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });

    it('should keep the headers in sync with a dataset after updateSettings call', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 3 }, 'E', 'F', { label: 'G', colspan: 2 }, 'I', 'J'],
        ],
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

      hidingMap.setValueAtIndex(2, false); // Show column that contains cells C{n}
      hidingMap.setValueAtIndex(3, false); // Show column that contains cells D{n}
      hidingMap.setValueAtIndex(6, false); // Show column that contains cells G{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="2">B</th>
            <th class="hiddenHeader"></th>
            <th class="">G</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">G1</td>
          </tr>
        </tbody>
        `);

      await updateSettings({ });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="2">B</th>
            <th class="hiddenHeader"></th>
            <th class="">G</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">G1</td>
          </tr>
        </tbody>
        `);
    });

    it('should work with multiple levels of nested headers configuration (variation #1)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1'],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 3 }, { label: 'F3', colspan: 2 }, { label: 'H3', colspan: 2 }, 'J3'],
          ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
        ],
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

      hidingMap.setValueAtIndex(3, false); // Show column that contains cells D{n}
      hidingMap.setValueAtIndex(7, false); // Show column that contains cells H{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="2">B1</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">B2</th>
            <th class="">F2</th>
          </tr>
          <tr>
            <th class="">C3</th>
            <th class="">H3</th>
          </tr>
          <tr>
            <th class="">D4</th>
            <th class="">H4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">D1</td>
            <td class="">H1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(8, false); // Show column that contains cells I{n}
      hidingMap.setValueAtIndex(9, false); // Show column that contains cells J{n}
      hidingMap.setValueAtIndex(2, false); // Show column that contains cells C{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">F2</th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">H3</th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">C4</th>
            <th class="">D4</th>
            <th class="">H4</th>
            <th class="">I4</th>
            <th class="">J4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(0, false); // Show column that contains cells A{n}
      hidingMap.setValueAtIndex(4, false); // Show column that contains cells E{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="5">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">F2</th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="" colspan="3">C3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">H3</th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">C4</th>
            <th class="">D4</th>
            <th class="">E4</th>
            <th class="">H4</th>
            <th class="">I4</th>
            <th class="">J4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(5, false); // Show column that contains cells F{n}
      hidingMap.setValueAtIndex(6, false); // Show column that contains cells G{n}
      hidingMap.setValueAtIndex(1, false); // Show column that contains cells B{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="8">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="4">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">F2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">B3</th>
            <th class="" colspan="3">C3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">H3</th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
            <th class="">C4</th>
            <th class="">D4</th>
            <th class="">E4</th>
            <th class="">F4</th>
            <th class="">G4</th>
            <th class="">H4</th>
            <th class="">I4</th>
            <th class="">J4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });

    it('should work with multiple levels of nested headers configuration (variation #2, advanced example, with "mirrored" headers)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 13),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
          ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
          ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
          ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
            { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
        ],
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

      hidingMap.setValueAtIndex(0, false); // Show column that contains cells A{n}
      hidingMap.setValueAtIndex(10, false); // Show column that contains cells K{n}
      hidingMap.setValueAtIndex(9, false); // Show column that contains cells J{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="">J1</th>
            <th class="">K1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">J2</th>
            <th class="">K2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">J3</th>
            <th class="">K3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">J4</th>
            <th class="">K4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">J1</td>
            <td class="">K1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(4, false); // Show column that contains cells E{n}
      hidingMap.setValueAtIndex(6, false); // Show column that contains cells G{n}
      hidingMap.setValueAtIndex(12, false); // Show column that contains cells M{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="2">B1</th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
            <th class="" colspan="2">K1</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
            <th class="" colspan="2">K2</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">B3</th>
            <th class="">F3</th>
            <th class="">J3</th>
            <th class="" colspan="2">K3</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">D4</th>
            <th class="">F4</th>
            <th class="">J4</th>
            <th class="">K4</th>
            <th class="">L4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">E1</td>
            <td class="">G1</td>
            <td class="">J1</td>
            <td class="">K1</td>
            <td class="">M1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(5, false); // Show column that contains cells F{n}
      hidingMap.setValueAtIndex(2, false); // Show column that contains cells C{n}
      hidingMap.setValueAtIndex(11, false); // Show column that contains cells L{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
            <th class="" colspan="3">K1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="4">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
            <th class="" colspan="3">K2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="" colspan="2">B3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
            <th class="" colspan="3">K3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
            <th class="">D4</th>
            <th class="" colspan="2">F4</th>
            <th class="hiddenHeader"></th>
            <th class="">J4</th>
            <th class="">K4</th>
            <th class="" colspan="2">L4</th>
            <th class="hiddenHeader"></th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">C1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">J1</td>
            <td class="">K1</td>
            <td class="">L1</td>
            <td class="">M1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(1, false); // Show column that contains cells B{n}
      hidingMap.setValueAtIndex(3, false); // Show column that contains cells D{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="6">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
            <th class="" colspan="3">K1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="6">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
            <th class="" colspan="3">K2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="" colspan="4">B3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
            <th class="" colspan="3">K3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="" colspan="2">B4</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">D4</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">F4</th>
            <th class="hiddenHeader"></th>
            <th class="">J4</th>
            <th class="">K4</th>
            <th class="" colspan="2">L4</th>
            <th class="hiddenHeader"></th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">J1</td>
            <td class="">K1</td>
            <td class="">L1</td>
            <td class="">M1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(8, false); // Show column that contains cells I{n}
      hidingMap.setValueAtIndex(7, false); // Show column that contains cells H{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="8">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
            <th class="" colspan="3">K1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="8">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
            <th class="" colspan="3">K2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="" colspan="4">B3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">F3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
            <th class="" colspan="3">K3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="" colspan="2">B4</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">D4</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">F4</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">H4</th>
            <th class="hiddenHeader"></th>
            <th class="">J4</th>
            <th class="">K4</th>
            <th class="" colspan="2">L4</th>
            <th class="hiddenHeader"></th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
            <td class="">K1</td>
            <td class="">L1</td>
            <td class="">M1</td>
          </tr>
        </tbody>
        `);
    });

    it('should work with multiple levels of nested headers configuration with cooperation with the fixedColumnsStart option', async() => {
      handsontable({
        data: createSpreadsheetData(10, 13),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
          ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
          ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
          ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
            { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
        ],
        fixedColumnsStart: 6,
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

      hidingMap.setValueAtIndex(4, false); // Show column that contains cells E{n}
      await render();

      {
        const htmlPattern = `
          <thead>
            <tr>
              <th class="">B1</th>
            </tr>
            <tr>
              <th class="">B2</th>
            </tr>
            <tr>
              <th class="">B3</th>
            </tr>
            <tr>
              <th class="">D4</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">E1</td>
            </tr>
          </tbody>
          `;

        expect(extractDOMStructure(getTopInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
        expect(extractDOMStructure(getInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
      }

      hidingMap.setValueAtIndex(2, false); // Show column that contains cells C{n}
      hidingMap.setValueAtIndex(3, false); // Show column that contains cells D{n}
      await render();

      {
        const htmlPattern = `
          <thead>
            <tr>
              <th class="" colspan="3">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="" colspan="3">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="" colspan="3">B3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">B4</th>
              <th class="" colspan="2">D4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">C1</td>
              <td class="">D1</td>
              <td class="">E1</td>
            </tr>
          </tbody>
          `;

        expect(extractDOMStructure(getTopInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
        expect(extractDOMStructure(getInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
      }

      hidingMap.setValueAtIndex(0, false); // Show column that contains cells A{n}
      await render();

      {
        const htmlPattern = `
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="3">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="3">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="3">B3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="">B4</th>
              <th class="" colspan="2">D4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">A1</td>
              <td class="">C1</td>
              <td class="">D1</td>
              <td class="">E1</td>
            </tr>
          </tbody>
          `;

        expect(extractDOMStructure(getTopInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
        expect(extractDOMStructure(getInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
      }

      hidingMap.setValueAtIndex(1, false); // Show column that contains cells B{n}
      hidingMap.setValueAtIndex(5, false); // Show column that contains cells F{n}
      await render();

      {
        const htmlPattern = `
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="4">B3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">F3</th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="" colspan="2">B4</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="2">D4</th>
              <th class="hiddenHeader"></th>
              <th class="">F4</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="">C1</td>
              <td class="">D1</td>
              <td class="">E1</td>
              <td class="">F1</td>
            </tr>
          </tbody>
          `;

        expect(extractDOMStructure(getTopInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
        expect(extractDOMStructure(getInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
      }
    });

    it('should render the setup properly after the table being scrolled', async() => {
      handsontable({
        data: createSpreadsheetData(10, 90),
        colHeaders: true,
        nestedHeaders: generateComplexSetup(4, 70, true),
        width: 400,
        height: 300,
        viewportColumnRenderingOffset: 0,
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

      // Show every second column for range A to AT
      for (let i = 0; i <= 45; i++) {
        hidingMap.setValueAtIndex(i, i % 2 !== 0);
      }

      await scrollViewportTo({ // Scroll to column AA4
        col: 25,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      // Read the actual DOM -- number of rendered columns varies with font metrics
      const htmlAfterFirstScroll = extractDOMStructure(getTopClone(), getMaster());

      // The target column AA must be visible (only even-indexed columns are shown)
      expect(htmlAfterFirstScroll).toContain('AA4');

      // Odd-indexed columns (hidden) should not appear in the bottom header row
      // B=1, D=3, F=5 etc. -- columns at odd physical indexes are hidden
      expect(htmlAfterFirstScroll).not.toContain('>B4<');
      expect(htmlAfterFirstScroll).not.toContain('>D4<');

      // Bottom row headers must each span exactly 1 column
      const bottomHeaders1 = getTopClone().find('thead tr:last th').not('.hiddenHeader');

      bottomHeaders1.each(function() {
        expect($(this).attr('colspan') || '1').toBe('1');
      });

      // Structure check: each visible bottom-row header must carry the label
      // returned by `getColHeader(visualCol, lastHeaderLevel)`. Iterate the
      // renderable range mapped back to visual indexes so hidden columns that
      // shift the mapping are handled correctly.
      const lastHeaderLevel = hot().view._wt.wtTable.THEAD.querySelectorAll('tr').length - 1;
      const renderedCols1 = countRenderedCols();
      const startRenderable1 = hot().view._wt.wtTable.getFirstRenderedColumn();
      const hiddenSet1 = new Set();

      for (let i = 1; i <= 45; i += 2) {
        hiddenSet1.add(i); // odd indexes 1..45 are hidden
      }
      const expectedLabels1 = [];

      for (let i = 0; i < renderedCols1; i++) {
        const visualCol = columnIndexMapper().getVisualFromRenderableIndex(startRenderable1 + i);

        if (visualCol !== null && !hiddenSet1.has(visualCol)) {
          expectedLabels1.push(getColHeader(visualCol, lastHeaderLevel));
        }
      }
      expect(bottomHeaders1.length).toBe(expectedLabels1.length);
      const actualLabels1 = bottomHeaders1.toArray().map((th) => {
        const colHeader = th.querySelector('.colHeader');

        return colHeader ? colHeader.innerText : $(th).text();
      });

      expect(actualLabels1).toEqual(expectedLabels1);
      expect(getTopClone().find('thead tr:last th.hiddenHeader').length).toBeGreaterThanOrEqual(0);

      hidingMap.setValueAtIndex(31, false); // Show column that contains cells AF{n}
      hidingMap.setValueAtIndex(33, false); // Show column that contains cells AH{n}
      hidingMap.setValueAtIndex(35, false); // Show column that contains cells AJ{n}
      hidingMap.setValueAtIndex(37, false); // Show column that contains cells AL{n}
      hidingMap.setValueAtIndex(39, false); // Show column that contains cells AN{n}
      hidingMap.setValueAtIndex(41, false); // Show column that contains cells AP{n}
      hidingMap.setValueAtIndex(43, false); // Show column that contains cells AR{n}
      hidingMap.setValueAtIndex(45, false); // Show column that contains cells AT{n}
      await render();

      await scrollViewportTo({ // Scroll to column AM4
        col: 38,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      const htmlAfterSecondScroll = extractDOMStructure(getTopClone(), getMaster());

      // After showing more columns, verify the rendered area contains valid headers.
      // The exact columns in view depend on theme column widths.
      const bottomHeaders2AfterScroll = getTopClone().find('thead tr:last th').not('.hiddenHeader');

      expect(bottomHeaders2AfterScroll.length).toBeGreaterThan(0);

      // The previously hidden odd columns AF, AH, AJ should now be visible
      expect(htmlAfterSecondScroll).toContain('AF');
      expect(htmlAfterSecondScroll).toContain('AH');
      expect(htmlAfterSecondScroll).toContain('AJ');

      // Bottom row headers must each span exactly 1 column
      const bottomHeaders2 = getTopClone().find('thead tr:last th').not('.hiddenHeader');

      bottomHeaders2.each(function() {
        expect($(this).attr('colspan') || '1').toBe('1');
      });

      // Structure check: the updated hidden set is odd numbers 1..45 minus the
      // indexes we just re-enabled (31, 33, 35, 37, 39, 41, 43, 45).
      const reShown = new Set([31, 33, 35, 37, 39, 41, 43, 45]);
      const hiddenSet2 = new Set();

      for (let i = 1; i <= 45; i += 2) {
        if (!reShown.has(i)) {
          hiddenSet2.add(i);
        }
      }
      const renderedCols2 = countRenderedCols();
      const startRenderable2 = hot().view._wt.wtTable.getFirstRenderedColumn();
      const expectedLabels2 = [];

      for (let i = 0; i < renderedCols2; i++) {
        const visualCol = columnIndexMapper().getVisualFromRenderableIndex(startRenderable2 + i);

        if (visualCol !== null && !hiddenSet2.has(visualCol)) {
          expectedLabels2.push(getColHeader(visualCol, lastHeaderLevel));
        }
      }
      expect(bottomHeaders2.length).toBe(expectedLabels2.length);
      const actualLabels2 = bottomHeaders2.toArray().map((th) => {
        const colHeader = th.querySelector('.colHeader');

        return colHeader ? colHeader.innerText : $(th).text();
      });

      expect(actualLabels2).toEqual(expectedLabels2);
      expect(getTopClone().find('thead tr:last th.hiddenHeader').length).toBeGreaterThanOrEqual(0);

      // Verify header rows are well-formed
      const headerRows = getTopClone().find('thead tr');

      headerRows.each(function() {
        const visibleHeaders = $(this).find('th').not('.hiddenHeader');

        expect(visibleHeaders.length).toBeGreaterThan(0);
      });
    });

    it('should adjust headers correctly when the new maps are created and registered after Hot is running', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1'],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 3 }, { label: 'F3', colspan: 2 }, { label: 'H3', colspan: 2 }, 'J3'],
          ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
        ],
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

      hidingMap.setValueAtIndex(3, false); // Show column that contains cells D{n}
      await render();

      await waitForNextAnimationFrames(2);

      const hidingMap2 = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map2', 'hiding', true);

      hidingMap.setValueAtIndex(6, false); // Show column that contains cells G{n}
      hidingMap.setValueAtIndex(9, false); // Show column that contains cells J{n}
      hidingMap2.setValueAtIndex(3, false); // Show column that contains cells D{n}
      hidingMap2.setValueAtIndex(6, false); // Show column that contains cells G{n}
      hidingMap2.setValueAtIndex(9, false); // Show column that contains cells J{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="2">B1</th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">B2</th>
            <th class="">F2</th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">C3</th>
            <th class="">F3</th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">D4</th>
            <th class="">G4</th>
            <th class="">J4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">D1</td>
            <td class="">G1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);

      await waitForNextAnimationFrames(2);

      const hidingMap3 = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map3', 'hiding', true);

      // The OR operator determines the final result of the multiple maps. That is why we
      // need to set a `false` value for the previous index maps.
      hidingMap.setValueAtIndex(7, false);
      hidingMap.setValueAtIndex(2, false);
      hidingMap.setValueAtIndex(5, false);
      hidingMap2.setValueAtIndex(7, false);
      hidingMap2.setValueAtIndex(2, false);
      hidingMap2.setValueAtIndex(5, false);
      // ---

      hidingMap3.setValueAtIndex(3, false); // Show column that contains cells C{n}
      hidingMap3.setValueAtIndex(6, false); // Show column that contains cells B{n}
      hidingMap3.setValueAtIndex(9, false); // Show column that contains cells B{n}

      hidingMap3.setValueAtIndex(7, false); // Show column that contains cells H{n}
      hidingMap3.setValueAtIndex(2, false); // Show column that contains cells C{n}
      hidingMap3.setValueAtIndex(5, false); // Show column that contains cells F{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="5">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="3">F2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
            <th class="">H3</th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">C4</th>
            <th class="">D4</th>
            <th class="">F4</th>
            <th class="">G4</th>
            <th class="">H4</th>
            <th class="">J4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });

    describe('with cooperation with the HidingColumns plugin', () => {
      it('should keep the headers in sync with a dataset after updateSettings call', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          nestedHeaders: [
            ['A', { label: 'B', colspan: 3 }, 'E', 'F', { label: 'G', colspan: 2 }, 'I', 'J'],
          ],
          hiddenColumns: {
            columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
          },
        });

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr></tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
            </tr>
          </tbody>
          `);

        await updateSettings({
          hiddenColumns: {
            columns: [2, 3, 5, 6, 7, 9],
          },
        });

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A</th>
              <th class="">B</th>
              <th class="">E</th>
              <th class="">I</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="afterHiddenColumn">E1</td>
              <td class="afterHiddenColumn">I1</td>
            </tr>
          </tbody>
          `);

        await updateSettings({
          hiddenColumns: {
            columns: [2, 7],
          },
        });

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A</th>
              <th class="" colspan="2">B</th>
              <th class="hiddenHeader"></th>
              <th class="">E</th>
              <th class="">F</th>
              <th class="">G</th>
              <th class="">I</th>
              <th class="">J</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="afterHiddenColumn">D1</td>
              <td class="">E1</td>
              <td class="">F1</td>
              <td class="">G1</td>
              <td class="afterHiddenColumn">I1</td>
              <td class="">J1</td>
            </tr>
          </tbody>
          `);

        await updateSettings({ });

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A</th>
              <th class="" colspan="2">B</th>
              <th class="hiddenHeader"></th>
              <th class="">E</th>
              <th class="">F</th>
              <th class="">G</th>
              <th class="">I</th>
              <th class="">J</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="afterHiddenColumn">D1</td>
              <td class="">E1</td>
              <td class="">F1</td>
              <td class="">G1</td>
              <td class="afterHiddenColumn">I1</td>
              <td class="">J1</td>
            </tr>
          </tbody>
          `);
      });
    });
  });
});
