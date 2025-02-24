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
    it('should work with default setup', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: true,
      });

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
      hidingMap.setValueAtIndex(8, true); // Hide column that contains cells I{n}
      hot.render();

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

    it('should work with minimal setup', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
      });

      hot.updateSettings({
        nestedHeaders: [[]],
      });

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
      hidingMap.setValueAtIndex(8, true); // Hide column that contains cells I{n}
      hot.render();

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

    it('should work with single level of nested headers configuration', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 3 }, 'E', 'F', { label: 'G', colspan: 2 }, 'I', 'J'],
        ],
      });

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
      hidingMap.setValueAtIndex(8, true); // Hide column that contains cells I{n}
      hidingMap.setValueAtIndex(7, true); // Hide column that contains cells H{n}
      hot.render();

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
      hot.render();

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
      hot.render();

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
      hot.render();

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
      hot.render();

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

    it('should keep the headers in sync with a dataset after updateSettings call', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 3 }, 'E', 'F', { label: 'G', colspan: 2 }, 'I', 'J'],
        ],
      });

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
      hidingMap.setValueAtIndex(8, true); // Hide column that contains cells I{n}
      hidingMap.setValueAtIndex(6, true); // Hide column that contains cells G{n}
      hot.render();

      updateSettings({ });

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
      hot.render();

      updateSettings({ });

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

    it('should work with multiple levels of nested headers configuration (variation #1)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1'],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 3 }, { label: 'F3', colspan: 2 }, { label: 'H3', colspan: 2 }, 'J3'],
          ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
        ],
      });

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      hidingMap.setValueAtIndex(3, true); // Hide column that contains cells D{n}
      hot.render();

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
      hot.render();

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
      hot.render();

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
      hot.render();

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
      hot.render();

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
      hot.render();

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
      hot.render();

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

    it('should work with multiple levels of nested headers configuration (variation #2, advanced example, with "mirrored" headers)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 13),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
          ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
          ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
          ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
            { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
        ],
      });

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(3, true); // Hide column that contains cells D{n}
      hidingMap.setValueAtIndex(0, true); // Hide column that contains cells A{n}
      hot.render();

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
      hot.render();

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
      hot.render();

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
      hot.render();

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
      hot.render();

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
      hot.render();

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
      hot.render();

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

    it('should work with multiple levels of nested headers configuration with cooperation with the fixedColumnsStart option', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 13),
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

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(3, true); // Hide column that contains cells D{n}
      hidingMap.setValueAtIndex(0, true); // Hide column that contains cells A{n}
      hot.render();

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
      hot.render();

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
      hot.render();

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
      hot.render();

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
      hot.render();

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

    it('should render the setup properly after the table being scrolled', () => {
      const hot = handsontable({
        data: createSpreadsheetData(10, 90),
        colHeaders: true,
        nestedHeaders: generateComplexSetup(4, 70, true),
        width: 400,
        height: 300,
        viewportColumnRenderingOffset: 0,
      });

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(40, true); // Hide column that contains cells AO{n}
      hidingMap.setValueAtIndex(42, true); // Hide column that contains cells AQ{n}
      hidingMap.setValueAtIndex(45, true); // Hide column that contains cells AT{n}
      hot.render();

      scrollViewportTo({ // Scroll to column AP4
        col: 40,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });
      render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="6">AL1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="8">AU1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="" colspan="3">AL2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="3">AP2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">AU2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">AY2</th>
          </tr>
          <tr>
            <th class="" colspan="2">AL3</th>
            <th class="hiddenHeader"></th>
            <th class="">AN3</th>
            <th class="">AP3</th>
            <th class="" colspan="2">AR3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AU3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AW3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AY3</th>
          </tr>
          <tr>
            <th class="">AL4</th>
            <th class="">AM4</th>
            <th class="">AN4</th>
            <th class="">AP4</th>
            <th class="">AR4</th>
            <th class="">AS4</th>
            <th class="">AU4</th>
            <th class="">AV4</th>
            <th class="">AW4</th>
            <th class="">AX4</th>
            <th class="">AY4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">AL1</td>
            <td class="">AM1</td>
            <td class="">AN1</td>
            <td class="">AP1</td>
            <td class="">AR1</td>
            <td class="">AS1</td>
            <td class="">AU1</td>
            <td class="">AV1</td>
            <td class="">AW1</td>
            <td class="">AX1</td>
            <td class="">AY1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(59, true); // Hide column that contains cells BH{n}
      hidingMap.setValueAtIndex(60, true); // Hide column that contains cells BI{n}
      hidingMap.setValueAtIndex(62, true); // Hide column that contains cells BK{n}
      hidingMap.setValueAtIndex(57, true); // Hide column that contains cells BF{n}
      hot.render();

      scrollViewportTo({ // Scroll to column BD4
        col: 55,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });
      render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="8">AU1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">BC1</th>
            <th class="" colspan="4">BD1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">BL1</th>
            <th class="" colspan="8">BM1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="" colspan="4">AU2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">AY2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">BC2</th>
            <th class="" colspan="3">BD2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">BH2</th>
            <th class="">BL2</th>
            <th class="" colspan="4">BM2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="" colspan="2">AU3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AW3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AY3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">BA3</th>
            <th class="hiddenHeader"></th>
            <th class="">BC3</th>
            <th class="" colspan="2">BD3</th>
            <th class="hiddenHeader"></th>
            <th class="">BF3</th>
            <th class="">BJ3</th>
            <th class="">BL3</th>
            <th class="" colspan="2">BM3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">BO3</th>
          </tr>
          <tr>
            <th class="">AU4</th>
            <th class="">AV4</th>
            <th class="">AW4</th>
            <th class="">AX4</th>
            <th class="">AY4</th>
            <th class="">AZ4</th>
            <th class="">BA4</th>
            <th class="">BB4</th>
            <th class="">BC4</th>
            <th class="">BD4</th>
            <th class="">BE4</th>
            <th class="">BG4</th>
            <th class="">BJ4</th>
            <th class="">BL4</th>
            <th class="">BM4</th>
            <th class="">BN4</th>
            <th class="">BO4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">AU1</td>
            <td class="">AV1</td>
            <td class="">AW1</td>
            <td class="">AX1</td>
            <td class="">AY1</td>
            <td class="">AZ1</td>
            <td class="">BA1</td>
            <td class="">BB1</td>
            <td class="">BC1</td>
            <td class="">BD1</td>
            <td class="">BE1</td>
            <td class="">BG1</td>
            <td class="">BJ1</td>
            <td class="">BL1</td>
            <td class="">BM1</td>
            <td class="">BN1</td>
            <td class="">BO1</td>
          </tr>
        </tbody>
        `);
    });

    it('should adjust headers correctly when the new maps are created and registered after Hot is running', async() => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1'],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 3 }, { label: 'F3', colspan: 2 }, { label: 'H3', colspan: 2 }, 'J3'],
          ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
        ],
      });

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(3, true); // Hide column that contains cells D{n}
      hot.render();

      await sleep(200);

      const hidingMap2 = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map2', 'hiding');

      hidingMap2.setValueAtIndex(6, true); // Hide column that contains cells G{n}
      hidingMap2.setValueAtIndex(9, true); // Hide column that contains cells J{n}
      hot.render();

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

      await sleep(200);

      const hidingMap3 = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map3', 'hiding');

      hidingMap3.setValueAtIndex(2, true); // Hide column that contains cells C{n}
      hidingMap3.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      hot.render();

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

      await sleep(200);

      const hidingMap4 = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map4', 'hiding');

      hidingMap4.setValueAtIndex(0, true); // Hide column that contains cells A{n}
      hidingMap4.setValueAtIndex(5, true); // Hide column that contains cells F{n}
      hot.render();

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
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1'],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 3 }, { label: 'F3', colspan: 2 }, { label: 'H3', colspan: 2 }, 'J3'],
          ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
        ],
      });

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(3, true); // Hide column that contains cells D{n}
      hot.render();

      await sleep(200);

      const hidingMap2 = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map2', 'hiding');

      hidingMap2.setValueAtIndex(6, true); // Hide column that contains cells G{n}
      hidingMap2.setValueAtIndex(9, true); // Hide column that contains cells J{n}

      await sleep(200);

      const hidingMap3 = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map3', 'hiding');

      hidingMap3.setValueAtIndex(2, true); // Hide column that contains cells C{n}
      hidingMap3.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      hidingMap3.setValueAtIndex(3, true); // Hide column that contains cells D{n}
      hidingMap3.setValueAtIndex(9, true); // Hide column that contains cells J{n}
      hot.render();

      await sleep(200);

      const hidingMap4 = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map4', 'hiding');

      hidingMap4.setValueAtIndex(0, true); // Hide column that contains cells A{n}
      hidingMap4.setValueAtIndex(5, true); // Hide column that contains cells F{n}
      hidingMap4.setValueAtIndex(9, true); // Hide column that contains cells J{n}
      hot.render();

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

      hot.columnIndexMapper.unregisterMap('my-hiding-map4');
      hot.render();

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

      hot.columnIndexMapper.unregisterMap('my-hiding-map');
      hot.columnIndexMapper.unregisterMap('my-hiding-map3');
      hot.render();

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

      hot.columnIndexMapper.unregisterMap('my-hiding-map2');
      hot.render();

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
        data: Handsontable.helper.createSpreadsheetData(10, 60),
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

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValues([true, true, true]);
      hot.render();

      await sleep(200);

      scrollViewportTo({
        row: 0,
        col: 7,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await sleep(200);

      // Gets the topmost header around the middle of the table - checks if the widest parent headers are rendered
      // correctly.
      const topHeaderInTheMiddle =
        document.elementFromPoint(
          hot.rootElement.offsetLeft + (hot.rootElement.offsetWidth / 2),
          hot.rootElement.offsetTop + 5
        );

      expect(
        topHeaderInTheMiddle.nodeName === 'TH' ||
        topHeaderInTheMiddle.parentNode.nodeName === 'TH'
      ).toEqual(true);

      hidingMap.setValues([true, true, true, true, true, true]);
      hot.render();

      await sleep(200);

      scrollViewportTo({
        row: 0,
        col: 15,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await sleep(300);

      window.onerror = onErrorFn;

      expect(errorSpy).not.toHaveBeenCalled();
    });

    describe('with cooperation with the HidingColumns plugin', () => {
      it('should keep the headers in sync with a dataset using initial settings', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
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

      it('should keep the headers in sync with a dataset after updateSettings call', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          colHeaders: true,
          nestedHeaders: [
            ['A', { label: 'B', colspan: 3 }, 'E', 'F', { label: 'G', colspan: 2 }, 'I', 'J'],
          ],
          hiddenColumns: {
            columns: [1],
          },
        });

        updateSettings({
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

        updateSettings({
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

        updateSettings({ });

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
  });
});
