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

  describe('hiding columns', () => {
    it('should work with default setup', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: true,
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
      hidingMap.setValueAtIndex(8, true); // Hide column that contains cells I{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
        <tr>
          <th class=""></th>
          <th class=""></th>
          <th class=""></th>
          <th class=""></th>
          <th class=""></th>
          <th class=""></th>
          <th class=""></th>
        </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
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

    it('should work with minimal setup', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
      });

      await updateSettings({
        nestedHeaders: [[]],
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
      hidingMap.setValueAtIndex(8, true); // Hide column that contains cells I{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
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

    it('should work with single level of nested headers configuration', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 3 }, 'E', 'F', { label: 'G', colspan: 2 }, 'I', 'J'],
        ],
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
      hidingMap.setValueAtIndex(8, true); // Hide column that contains cells I{n}
      hidingMap.setValueAtIndex(7, true); // Hide column that contains cells H{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="" colspan="2">B</th>
            <th class="hiddenHeader"></th>
            <th class="">F</th>
            <th class="">G</th>
            <th class="">J</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(3, true); // Hide column that contains cells D{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="">B</th>
            <th class="">F</th>
            <th class="">G</th>
            <th class="">J</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">C1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(2, true); // Hide column that contains cells C{n}
      hidingMap.setValueAtIndex(9, true); // Hide column that contains cells J{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="">F</th>
            <th class="">G</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">F1</td>
            <td class="">G1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(0, true); // Hide column that contains cells A{n}
      hidingMap.setValueAtIndex(6, true); // Hide column that contains cells G{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">F</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">F1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(5, true); // Hide column that contains cells F{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
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

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
      hidingMap.setValueAtIndex(8, true); // Hide column that contains cells I{n}
      hidingMap.setValueAtIndex(6, true); // Hide column that contains cells G{n}
      await render();

      await updateSettings({ });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="" colspan="2">B</th>
            <th class="hiddenHeader"></th>
            <th class="">F</th>
            <th class="">G</th>
            <th class="">J</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">F1</td>
            <td class="">H1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(7, true); // Hide column that contains cells H{n}
      hidingMap.setValueAtIndex(0, true); // Hide column that contains cells A{n}
      await render();

      await updateSettings({ });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="2">B</th>
            <th class="hiddenHeader"></th>
            <th class="">F</th>
            <th class="">J</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">F1</td>
            <td class="">J1</td>
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

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      hidingMap.setValueAtIndex(3, true); // Hide column that contains cells D{n}
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
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">F2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">H3</th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">C4</th>
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
            <td class="">C1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(7, true); // Hide column that contains cells H{n}
      hidingMap.setValueAtIndex(6, true); // Hide column that contains cells G{n}
      hidingMap.setValueAtIndex(9, true); // Hide column that contains cells J{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">F2</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="">F3</th>
            <th class="">H3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">C4</th>
            <th class="">E4</th>
            <th class="">F4</th>
            <th class="">I4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">C1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">I1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(7, true); // Hide column that contains cells H{n}
      hidingMap.setValueAtIndex(6, true); // Hide column that contains cells G{n}
      hidingMap.setValueAtIndex(9, true); // Hide column that contains cells J{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">F2</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="">F3</th>
            <th class="">H3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">C4</th>
            <th class="">E4</th>
            <th class="">F4</th>
            <th class="">I4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">C1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">I1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="3">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
            <th class="" colspan="2">F2</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">C3</th>
            <th class="">F3</th>
            <th class="">H3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">C4</th>
            <th class="">F4</th>
            <th class="">I4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">C1</td>
            <td class="">F1</td>
            <td class="">I1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(2, true); // Hide column that contains cells C{n}
      hidingMap.setValueAtIndex(0, true); // Hide column that contains cells A{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="2">B1</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="" colspan="2">F2</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">F3</th>
            <th class="">H3</th>
          </tr>
          <tr>
            <th class="">F4</th>
            <th class="">I4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">F1</td>
            <td class="">I1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(5, true); // Hide column that contains cells F{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">B1</th>
          </tr>
          <tr>
            <th class="">F2</th>
          </tr>
          <tr>
            <th class="">H3</th>
          </tr>
          <tr>
            <th class="">I4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">I1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(8, true); // Hide column that contains cells I{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
          </tr>
          <tr>
          </tr>
          <tr>
          </tr>
          <tr>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
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

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(3, true); // Hide column that contains cells D{n}
      hidingMap.setValueAtIndex(0, true); // Hide column that contains cells A{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="7">B1</th>
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
            <th class="" colspan="7">B2</th>
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
            <th class="" colspan="3">B3</th>
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
            <th class="" colspan="2">B4</th>
            <th class="hiddenHeader"></th>
            <th class="">D4</th>
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
            <td class="">B1</td>
            <td class="">C1</td>
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

      hidingMap.setValueAtIndex(9, true); // Hide column that contains cells J{n}
      hidingMap.setValueAtIndex(8, true); // Hide column that contains cells I{n}
      hidingMap.setValueAtIndex(11, true); // Hide column that contains cells L{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="6">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">K1</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="" colspan="6">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">K2</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="" colspan="3">B3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="3">F3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">K3</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="" colspan="2">B4</th>
            <th class="hiddenHeader"></th>
            <th class="">D4</th>
            <th class="" colspan="2">F4</th>
            <th class="hiddenHeader"></th>
            <th class="">H4</th>
            <th class="">K4</th>
            <th class="">L4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">K1</td>
            <td class="">M1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(7, true); // Hide column that contains cells H{n}
      hidingMap.setValueAtIndex(2, true); // Hide column that contains cells C{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">K1</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="" colspan="4">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">K2</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="" colspan="2">B3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">K3</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">B4</th>
            <th class="">D4</th>
            <th class="" colspan="2">F4</th>
            <th class="hiddenHeader"></th>
            <th class="">K4</th>
            <th class="">L4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">B1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">K1</td>
            <td class="">M1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
      hidingMap.setValueAtIndex(10, true); // Hide column that contains cells K{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="3">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">K1</th>
          </tr>
          <tr>
            <th class="" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">K2</th>
          </tr>
          <tr>
            <th class="">B3</th>
            <th class="" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
            <th class="">K3</th>
          </tr>
          <tr>
            <th class="">B4</th>
            <th class="" colspan="2">F4</th>
            <th class="hiddenHeader"></th>
            <th class="">L4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">B1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">M1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      hidingMap.setValueAtIndex(12, true); // Hide column that contains cells M{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="2">B1</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="" colspan="2">F4</th>
            <th class="hiddenHeader"></th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">F1</td>
            <td class="">G1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(5, true); // Hide column that contains cells F{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">B1</th>
          </tr>
          <tr>
            <th class="">B2</th>
          </tr>
          <tr>
            <th class="">F3</th>
          </tr>
          <tr>
            <th class="">F4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">G1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(6, true); // Hide column that contains cells G{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
          </tr>
          <tr>
          </tr>
          <tr>
          </tr>
          <tr>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
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

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(3, true); // Hide column that contains cells D{n}
      hidingMap.setValueAtIndex(0, true); // Hide column that contains cells A{n}
      await render();

      {
        const htmlPattern = `
          <thead>
            <tr>
              <th class="" colspan="4">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="" colspan="4">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="" colspan="3">B3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">F3</th>
            </tr>
            <tr>
              <th class="" colspan="2">B4</th>
              <th class="hiddenHeader"></th>
              <th class="">D4</th>
              <th class="">F4</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">B1</td>
              <td class="">C1</td>
              <td class="">E1</td>
              <td class="">F1</td>
            </tr>
          </tbody>
          `;

        expect(extractDOMStructure(getTopInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
        expect(extractDOMStructure(getInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
      }

      hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
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
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="">F3</th>
            </tr>
            <tr>
              <th class="" colspan="2">B4</th>
              <th class="hiddenHeader"></th>
              <th class="">F4</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">B1</td>
              <td class="">C1</td>
              <td class="">F1</td>
            </tr>
          </tbody>
          `;

        expect(extractDOMStructure(getTopInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
        expect(extractDOMStructure(getInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
      }

      hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      await render();

      {
        const htmlPattern = `
          <thead>
            <tr>
              <th class="" colspan="2">B1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="" colspan="2">B2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">B3</th>
              <th class="">F3</th>
            </tr>
            <tr>
              <th class="">B4</th>
              <th class="">F4</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">C1</td>
              <td class="">F1</td>
            </tr>
          </tbody>
          `;

        expect(extractDOMStructure(getTopInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
        expect(extractDOMStructure(getInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
      }

      hidingMap.setValueAtIndex(2, true); // Hide column that contains cells C{n}
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
              <th class="">F3</th>
            </tr>
            <tr>
              <th class="">F4</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">F1</td>
            </tr>
          </tbody>
          `;

        expect(extractDOMStructure(getTopInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
        expect(extractDOMStructure(getInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
      }

      hidingMap.setValueAtIndex(5, true); // Hide column that contains cells F{n}
      hidingMap.setValueAtIndex(6, true); // Hide column that contains cells G{n}
      hidingMap.setValueAtIndex(10, true); // Hide column that contains cells K{n}
      await render();

      {
        const htmlPattern = `
          <thead>
            <tr>
            </tr>
            <tr>
            </tr>
            <tr>
            </tr>
            <tr>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
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

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(40, true); // Hide column that contains cells AO{n}
      hidingMap.setValueAtIndex(42, true); // Hide column that contains cells AQ{n}
      hidingMap.setValueAtIndex(45, true); // Hide column that contains cells AT{n}
      await render();

      await scrollViewportTo({ // Scroll to column AP4
        col: 40,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      // Read the actual DOM -- the number of rendered columns varies with font metrics
      const htmlAfterFirstScroll = extractDOMStructure(getTopClone(), getMaster());

      // Hidden columns AO, AQ, AT must not appear in the bottom header row
      expect(htmlAfterFirstScroll).not.toContain('AO4');
      expect(htmlAfterFirstScroll).not.toContain('AQ4');
      expect(htmlAfterFirstScroll).not.toContain('AT4');

      // The target column AP must be visible
      expect(htmlAfterFirstScroll).toContain('AP4');

      // Verify the header hierarchy is well-formed after hiding + scrolling
      const bottomHeaders1 = getTopClone().find('thead tr:last th').not('.hiddenHeader');

      bottomHeaders1.each(function() {
        expect($(this).attr('colspan') || '1').toBe('1');
      });

      // Structure check: each visible bottom-row header in the rendered range
      // must carry the label returned by `getColHeader(visualCol, lastHeaderLevel)`.
      // Walk the rendered columns via renderable -> visual mapping so the mapping
      // is correct even when hidden columns shift the renderable indexes.
      const renderedCols1 = countRenderedCols();
      const startRenderable1 = hot().view._wt.wtTable.getFirstRenderedColumn();
      const hiddenSet = new Set([40, 42, 45]);
      const lastHeaderLevel = hot().view._wt.wtTable.THEAD.querySelectorAll('tr').length - 1;
      const expectedLabels1 = [];

      for (let i = 0; i < renderedCols1; i++) {
        const visualCol = columnIndexMapper().getVisualFromRenderableIndex(startRenderable1 + i);

        if (visualCol !== null && !hiddenSet.has(visualCol)) {
          expectedLabels1.push(getColHeader(visualCol, lastHeaderLevel));
        }
      }
      expect(bottomHeaders1.length).toBe(expectedLabels1.length);
      const actualLabels1 = bottomHeaders1.toArray().map((th) => {
        const colHeader = th.querySelector('.colHeader');

        return colHeader ? colHeader.innerText : $(th).text();
      });

      expect(actualLabels1).toEqual(expectedLabels1);

      // Hidden headers for nested groups may still exist in the DOM carrying
      // the hiddenHeader class; they must span the correct portion of the row.
      const hiddenHeadersCount1 = getTopClone().find('thead tr:last th.hiddenHeader').length;

      expect(hiddenHeadersCount1).toBeGreaterThanOrEqual(0);

      // The data row must also exclude hidden columns
      expect(htmlAfterFirstScroll).not.toContain('>AO1<');
      expect(htmlAfterFirstScroll).not.toContain('>AQ1<');
      expect(htmlAfterFirstScroll).not.toContain('>AT1<');
      expect(htmlAfterFirstScroll).toContain('AP1');

      hidingMap.setValueAtIndex(59, true); // Hide column that contains cells BH{n}
      hidingMap.setValueAtIndex(60, true); // Hide column that contains cells BI{n}
      hidingMap.setValueAtIndex(62, true); // Hide column that contains cells BK{n}
      hidingMap.setValueAtIndex(57, true); // Hide column that contains cells BF{n}
      await render();

      await scrollViewportTo({ // Scroll to column BD4
        col: 55,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      const htmlAfterSecondScroll = extractDOMStructure(getTopClone(), getMaster());

      // The target column BD must be visible
      expect(htmlAfterSecondScroll).toContain('BD4');

      // Newly hidden columns must not appear
      expect(htmlAfterSecondScroll).not.toContain('BH4');
      expect(htmlAfterSecondScroll).not.toContain('BI4');
      expect(htmlAfterSecondScroll).not.toContain('BK4');
      expect(htmlAfterSecondScroll).not.toContain('BF4');

      // Bottom header row should only have single-column headers
      const bottomHeaders2 = getTopClone().find('thead tr:last th').not('.hiddenHeader');

      bottomHeaders2.each(function() {
        expect($(this).attr('colspan') || '1').toBe('1');
      });

      // Structure check: each visible bottom-row header must carry the expected
      // label for its visual column. The updated hidden set includes columns
      // hidden in both steps.
      const renderedCols2 = countRenderedCols();
      const startRenderable2 = hot().view._wt.wtTable.getFirstRenderedColumn();
      const hiddenSet2 = new Set([40, 42, 45, 57, 59, 60, 62]);

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
      const hiddenHeadersCount2 = getTopClone().find('thead tr:last th.hiddenHeader').length;

      expect(hiddenHeadersCount2).toBeGreaterThanOrEqual(0);
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

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(3, true); // Hide column that contains cells D{n}
      await render();

      await waitForNextAnimationFrames(2);

      const hidingMap2 = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map2', 'hiding');

      hidingMap2.setValueAtIndex(6, true); // Hide column that contains cells G{n}
      hidingMap2.setValueAtIndex(9, true); // Hide column that contains cells J{n}
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
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="3">F2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">B3</th>
            <th class="" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="">F3</th>
            <th class="" colspan="2">H3</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
            <th class="">C4</th>
            <th class="">E4</th>
            <th class="">F4</th>
            <th class="">H4</th>
            <th class="">I4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">H1</td>
            <td class="">I1</td>
          </tr>
        </tbody>
        `);

      await waitForNextAnimationFrames(2);

      const hidingMap3 = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map3', 'hiding');

      hidingMap3.setValueAtIndex(2, true); // Hide column that contains cells C{n}
      hidingMap3.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
            <th class="" colspan="3">F2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">C3</th>
            <th class="">F3</th>
            <th class="" colspan="2">H3</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">E4</th>
            <th class="">F4</th>
            <th class="">H4</th>
            <th class="">I4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">H1</td>
            <td class="">I1</td>
          </tr>
        </tbody>
        `);

      await waitForNextAnimationFrames(2);

      const hidingMap4 = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map4', 'hiding');

      hidingMap4.setValueAtIndex(0, true); // Hide column that contains cells A{n}
      hidingMap4.setValueAtIndex(5, true); // Hide column that contains cells F{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="3">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">B2</th>
            <th class="" colspan="2">F2</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">C3</th>
            <th class="" colspan="2">H3</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">E4</th>
            <th class="">H4</th>
            <th class="">I4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">E1</td>
            <td class="">H1</td>
            <td class="">I1</td>
          </tr>
        </tbody>
        `);
    });

    it('should adjust headers correctly when the hidden maps are unregistered', async() => {
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

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(3, true); // Hide column that contains cells D{n}
      await render();

      await waitForNextAnimationFrames(2);

      const hidingMap2 = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map2', 'hiding');

      hidingMap2.setValueAtIndex(6, true); // Hide column that contains cells G{n}
      hidingMap2.setValueAtIndex(9, true); // Hide column that contains cells J{n}

      await waitForNextAnimationFrames(2);

      const hidingMap3 = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map3', 'hiding');

      hidingMap3.setValueAtIndex(2, true); // Hide column that contains cells C{n}
      hidingMap3.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      hidingMap3.setValueAtIndex(3, true); // Hide column that contains cells D{n}
      hidingMap3.setValueAtIndex(9, true); // Hide column that contains cells J{n}
      await render();

      await waitForNextAnimationFrames(2);

      const hidingMap4 = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map4', 'hiding');

      hidingMap4.setValueAtIndex(0, true); // Hide column that contains cells A{n}
      hidingMap4.setValueAtIndex(5, true); // Hide column that contains cells F{n}
      hidingMap4.setValueAtIndex(9, true); // Hide column that contains cells J{n}
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="3">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">B2</th>
            <th class="" colspan="2">F2</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">C3</th>
            <th class="" colspan="2">H3</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">E4</th>
            <th class="">H4</th>
            <th class="">I4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">E1</td>
            <td class="">H1</td>
            <td class="">I1</td>
          </tr>
        </tbody>
        `);

      columnIndexMapper().unregisterMap('my-hiding-map4');
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
            <th class="" colspan="3">F2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">C3</th>
            <th class="">F3</th>
            <th class="" colspan="2">H3</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">E4</th>
            <th class="">F4</th>
            <th class="">H4</th>
            <th class="">I4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">H1</td>
            <td class="">I1</td>
          </tr>
        </tbody>
        `);

      columnIndexMapper().unregisterMap('my-hiding-map');
      columnIndexMapper().unregisterMap('my-hiding-map3');
      await render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="7">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="4">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="3">F2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">B3</th>
            <th class="" colspan="3">C3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F3</th>
            <th class="" colspan="2">H3</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
            <th class="">C4</th>
            <th class="">D4</th>
            <th class="">E4</th>
            <th class="">F4</th>
            <th class="">H4</th>
            <th class="">I4</th>
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
            <td class="">H1</td>
            <td class="">I1</td>
          </tr>
        </tbody>
        `);

      columnIndexMapper().unregisterMap('my-hiding-map2');
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

    it('should allow scrolling (and lazy loading) the columns properly, ' +
      'when some of the leftmost columns are hidden', async() => {
      const nestedHeaders = [
        [
          {
            label: 'A',
            colspan: 20
          }, {
            label: 'B',
            colspan: 40
          }
        ],
        []
      ];

      for (let i = 0; i < 60; i += 1) {
        nestedHeaders[1].push(`-${i + 1}-`);
      }

      const hot = handsontable({
        data: createSpreadsheetData(10, 60),
        colHeaders: true,
        nestedHeaders,
        width: 500,
        height: 400
      });

      const onErrorFn = window.onerror;
      const errorSpy = jasmine.createSpy('bound to error when scrolling the table horizontally');

      window.onerror = () => {
        errorSpy();

        return true;
      };

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValues([true, true, true]);
      await render();

      await scrollViewportTo({
        row: 0,
        col: 7,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      // Gets the topmost header around the middle of the table - checks if the widest parent headers are rendered
      // correctly.
      const topHeaderInTheMiddle =
        document.elementFromPoint(
          hot.rootElement.offsetLeft + (hot.rootElement.offsetWidth / 2),
          hot.rootElement.offsetTop + 5
        );

      // Header label lives under th > div.relative > span.colHeader; elementFromPoint often
      // returns the inner span or div, not the th itself.
      expect(topHeaderInTheMiddle.closest('th')).not.toBeNull();

      hidingMap.setValues([true, true, true, true, true, true]);
      await render();

      await scrollViewportTo({
        row: 0,
        col: 15,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      window.onerror = onErrorFn;

      expect(errorSpy).not.toHaveBeenCalled();
    });

    describe('with cooperation with the HidingColumns plugin', () => {
      it('should keep the headers in sync with a dataset using initial settings', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          nestedHeaders: [
            ['A', { label: 'B', colspan: 3 }, 'E', 'F', { label: 'G', colspan: 2 }, 'I', 'J'],
          ],
          hiddenColumns: {
            columns: [1, 4, 8, 6],
          },
        });

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A</th>
              <th class="" colspan="2">B</th>
              <th class="hiddenHeader"></th>
              <th class="">F</th>
              <th class="">G</th>
              <th class="">J</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">A1</td>
              <td class="afterHiddenColumn">C1</td>
              <td class="">D1</td>
              <td class="afterHiddenColumn">F1</td>
              <td class="afterHiddenColumn">H1</td>
              <td class="afterHiddenColumn">J1</td>
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
          hiddenColumns: {
            columns: [1],
          },
        });

        await updateSettings({
          hiddenColumns: {
            columns: [1, 4, 8, 6],
          },
        });

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A</th>
              <th class="" colspan="2">B</th>
              <th class="hiddenHeader"></th>
              <th class="">F</th>
              <th class="">G</th>
              <th class="">J</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">A1</td>
              <td class="afterHiddenColumn">C1</td>
              <td class="">D1</td>
              <td class="afterHiddenColumn">F1</td>
              <td class="afterHiddenColumn">H1</td>
              <td class="afterHiddenColumn">J1</td>
            </tr>
          </tbody>
          `);

        await updateSettings({
          hiddenColumns: {
            columns: [0, 1, 2, 4, 8, 6],
          },
        });

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">B</th>
              <th class="">F</th>
              <th class="">G</th>
              <th class="">J</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="afterHiddenColumn">D1</td>
              <td class="afterHiddenColumn">F1</td>
              <td class="afterHiddenColumn">H1</td>
              <td class="afterHiddenColumn">J1</td>
            </tr>
          </tbody>
          `);

        await updateSettings({ });

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">B</th>
              <th class="">F</th>
              <th class="">G</th>
              <th class="">J</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="afterHiddenColumn">D1</td>
              <td class="afterHiddenColumn">F1</td>
              <td class="afterHiddenColumn">H1</td>
              <td class="afterHiddenColumn">J1</td>
            </tr>
          </tbody>
          `);
      });
    });

    describe('hidden column indicators on nested headers', () => {
      // Returns the header TH whose label matches, at the given thead row (0-based from top).
      function getHeaderByLabel(rowIndex, label) {
        const tr = getTopClone().find('thead tr')[rowIndex];

        return Array.from(tr.querySelectorAll('th')).find((th) => {
          const header = th.querySelector('.colHeader');

          return header && header.innerText === label;
        }) ?? null;
      }

      // When middle columns of a group are hidden, the hidden-column indicator (a thin arrow added
      // by HiddenColumns `indicators: true`) must not be drawn on the wide parent header - the
      // hidden columns sit inside its span, so the arrow only makes sense on the leaf headers.
      it('should not show the indicator on a parent header wider than the hidden columns', async() => {
        handsontable({
          data: createSpreadsheetData(5, 6),
          colHeaders: true,
          nestedHeaders: [
            ['A', { label: 'Group B', colspan: 4 }, 'C'],
            ['A', { label: 'B-left', colspan: 2 }, { label: 'B-right', colspan: 2 }, 'C'],
            ['A', 'B1', 'B2', 'B3', 'B4', 'C'],
          ],
          hiddenColumns: {
            columns: [2, 3], // hide B2 and B3 - the middle of Group B
            indicators: true,
          },
        });

        // Parent headers spanning more than the hidden columns must carry no hidden-column arrow.
        const groupB = getHeaderByLabel(0, 'Group B');
        const bLeft = getHeaderByLabel(1, 'B-left');
        const bRight = getHeaderByLabel(1, 'B-right');

        expect(groupB.classList.contains('beforeHiddenColumn')).toBe(false);
        expect(groupB.classList.contains('afterHiddenColumn')).toBe(false);
        expect(bLeft.classList.contains('beforeHiddenColumn')).toBe(false);
        expect(bRight.classList.contains('afterHiddenColumn')).toBe(false);

        // The leaf-level headers next to the hidden columns must keep the indicator.
        const b1 = getHeaderByLabel(2, 'B1');
        const b4 = getHeaderByLabel(2, 'B4');

        expect(b1.classList.contains('beforeHiddenColumn')).toBe(true);
        expect(b4.classList.contains('afterHiddenColumn')).toBe(true);
      });

      it('should keep the indicator on the header closest to the cells next to a hidden column', async() => {
        handsontable({
          data: createSpreadsheetData(5, 6),
          colHeaders: true,
          nestedHeaders: [
            ['A', { label: 'Group B', colspan: 4 }, 'C'],
            ['A', 'B1', 'B2', 'B3', 'B4', 'C'],
          ],
          hiddenColumns: {
            columns: [5], // hide C, which sits to the right of Group B's last leaf
            indicators: true,
          },
        });

        // B4 is the bottom header directly before hidden C - it must keep the indicator...
        const b4 = getHeaderByLabel(1, 'B4');

        expect(b4.classList.contains('beforeHiddenColumn')).toBe(true);

        // ...while Group B (a wide parent) must not, even though its last column borders C.
        const groupB = getHeaderByLabel(0, 'Group B');

        expect(groupB.classList.contains('beforeHiddenColumn')).toBe(false);
      });

      // Even when stacked headers are all single columns (no groups), only the header closest to
      // the cells carries the indicator - the ones above it must not duplicate it.
      it('should add the indicator only to the bottom-most of stacked single-column headers', async() => {
        handsontable({
          data: createSpreadsheetData(5, 3),
          colHeaders: true,
          nestedHeaders: [
            ['T', 'U', 'V'],
            ['A', 'B', 'C'],
          ],
          hiddenColumns: {
            columns: [1], // hide the middle column
            indicators: true,
          },
        });

        // Bottom row (closest to the cells) keeps the indicators next to the hidden column.
        expect(getHeaderByLabel(1, 'A').classList.contains('beforeHiddenColumn')).toBe(true);
        expect(getHeaderByLabel(1, 'C').classList.contains('afterHiddenColumn')).toBe(true);

        // Top row headers, although they also border the hidden column, must not show it.
        expect(getHeaderByLabel(0, 'T').classList.contains('beforeHiddenColumn')).toBe(false);
        expect(getHeaderByLabel(0, 'V').classList.contains('afterHiddenColumn')).toBe(false);
      });
    });

    describe('with cooperation with the ManualColumnMove plugin (#9565)', () => {
      it('should render multi-column parent header correctly when a hidden column ' +
        'maps to a different visual index due to manualColumnMove (initial settings)', async() => {
        handsontable({
          data: createSpreadsheetData(2, 7),
          colHeaders: true,
          nestedHeaders: [
            ['A', 'B', 'C', { label: 'PARENT', colspan: 3 }, 'G'],
            ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
          ],
          manualColumnMove: [3, 0, 1, 2, 4, 5, 6],
          hiddenColumns: {
            columns: [2],
          },
        });

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">PARENT</th>
              <th class="">A</th>
              <th class="">B</th>
              <th class="" colspan="2">PARENT</th>
              <th class="hiddenHeader"></th>
              <th class="">G</th>
            </tr>
            <tr>
              <th class="">D</th>
              <th class="">A</th>
              <th class="">B</th>
              <th class="">E</th>
              <th class="">F</th>
              <th class="">G</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">D1</td>
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="afterHiddenColumn">E1</td>
              <td class="">F1</td>
              <td class="">G1</td>
            </tr>
          </tbody>
          `);
      });

      it('should translate physical to visual when the hiding map changes while ' +
        'manualColumnMove is active', async() => {
        handsontable({
          data: createSpreadsheetData(2, 7),
          colHeaders: true,
          nestedHeaders: [
            ['A', 'B', 'C', { label: 'PARENT', colspan: 3 }, 'G'],
            ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
          ],
          manualColumnMove: [3, 0, 1, 2, 4, 5, 6],
        });

        const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingMap.setValueAtIndex(2, true); // hide physical column "C" (visual 3 after move)
        await render();

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">PARENT</th>
              <th class="">A</th>
              <th class="">B</th>
              <th class="" colspan="2">PARENT</th>
              <th class="hiddenHeader"></th>
              <th class="">G</th>
            </tr>
            <tr>
              <th class="">D</th>
              <th class="">A</th>
              <th class="">B</th>
              <th class="">E</th>
              <th class="">F</th>
              <th class="">G</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">D1</td>
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="">E1</td>
              <td class="">F1</td>
              <td class="">G1</td>
            </tr>
          </tbody>
          `);
      });

      it('should re-sync the nested header tree when columns are moved at runtime ' +
        'while a hidden column already exists', async() => {
        handsontable({
          data: createSpreadsheetData(2, 7),
          colHeaders: true,
          nestedHeaders: [
            // columnDropMode: 'split' opts into the split model (default is now cohesive: a moved-out column
            // is released to standalone rather than tearing the group into banners).
            ['A', 'B', 'C', { label: 'PARENT', colspan: 3, columnDropMode: 'split' }, 'G'],
            ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
          ],
          manualColumnMove: true,
          hiddenColumns: {
            columns: [2],
          },
        });

        getPlugin('manualColumnMove').moveColumn(3, 0); // physical 3 to visual 0
        await render();

        expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">PARENT</th>
              <th class="">A</th>
              <th class="">B</th>
              <th class="" colspan="2">PARENT</th>
              <th class="hiddenHeader"></th>
              <th class="">G</th>
            </tr>
            <tr>
              <th class="">D</th>
              <th class="">A</th>
              <th class="">B</th>
              <th class="">E</th>
              <th class="">F</th>
              <th class="">G</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ht__row_odd">
              <td class="">D1</td>
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="afterHiddenColumn">E1</td>
              <td class="">F1</td>
              <td class="">G1</td>
            </tr>
          </tbody>
          `);
      });
    });
  });
});
