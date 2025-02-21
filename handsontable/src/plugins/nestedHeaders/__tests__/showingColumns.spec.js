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
    it('should work with default setup', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: true,
      });

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

      hidingMap.setValueAtIndex(1, false); // Show column that contains cells B{n}
      hidingMap.setValueAtIndex(4, false); // Show column that contains cells E{n}
      hidingMap.setValueAtIndex(8, false); // Show column that contains cells I{n}
      hot.render();

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

    it('should work with minimal setup', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
      });

      hot.updateSettings({
        nestedHeaders: [[]],
      });

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

      hidingMap.setValueAtIndex(1, false); // Show column that contains cells B{n}
      hidingMap.setValueAtIndex(4, false); // Show column that contains cells E{n}
      hidingMap.setValueAtIndex(8, false); // Show column that contains cells I{n}
      hot.render();

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

    it('should work with single level of nested headers configuration', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 3 }, 'E', 'F', { label: 'G', colspan: 2 }, 'I', 'J'],
        ],
      });

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

      hidingMap.setValueAtIndex(2, false); // Show column that contains cells C{n}
      hidingMap.setValueAtIndex(6, false); // Show column that contains cells G{n}
      hot.render();

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
      hot.render();

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
      hot.render();

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
      hot.render();

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

    it('should keep the headers in sync with a dataset after updateSettings call', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 3 }, 'E', 'F', { label: 'G', colspan: 2 }, 'I', 'J'],
        ],
      });

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

      hidingMap.setValueAtIndex(2, false); // Show column that contains cells C{n}
      hidingMap.setValueAtIndex(3, false); // Show column that contains cells D{n}
      hidingMap.setValueAtIndex(6, false); // Show column that contains cells G{n}
      hot.render();

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

      updateSettings({ });

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

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

      hidingMap.setValueAtIndex(3, false); // Show column that contains cells D{n}
      hidingMap.setValueAtIndex(7, false); // Show column that contains cells H{n}
      hot.render();

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
      hot.render();

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
      hot.render();

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

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

      hidingMap.setValueAtIndex(0, false); // Show column that contains cells A{n}
      hidingMap.setValueAtIndex(10, false); // Show column that contains cells K{n}
      hidingMap.setValueAtIndex(9, false); // Show column that contains cells J{n}
      hot.render();

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
      hot.render();

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
      hot.render();

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

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

      hidingMap.setValueAtIndex(4, false); // Show column that contains cells E{n}
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
      hot.render();

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
      hot.render();

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

    it('should render the setup properly after the table being scrolled', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 90),
        colHeaders: true,
        nestedHeaders: generateComplexSetup(4, 70, true),
        width: 400,
        height: 300,
        viewportColumnRenderingOffset: 0,
      });

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

      // Show every second column for range A to AT
      for (let i = 0; i <= 45; i++) {
        hidingMap.setValueAtIndex(i, i % 2 !== 0);
      }

      scrollViewportTo({ // Scroll to column AA4
        col: 25,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });
      render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="4">K1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">S1</th>
            <th class="" colspan="4">T1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">AC1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AK1</th>
            <th class="" colspan="4">AL1</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="" colspan="2">K2</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">O2</th>
            <th class="hiddenHeader"></th>
            <th class="">S2</th>
            <th class="" colspan="2">T2</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">X2</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AC2</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AG2</th>
            <th class="hiddenHeader"></th>
            <th class="">AK2</th>
            <th class="" colspan="2">AL2</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">K3</th>
            <th class="">M3</th>
            <th class="">O3</th>
            <th class="">Q3</th>
            <th class="">S3</th>
            <th class="">T3</th>
            <th class="">V3</th>
            <th class="">X3</th>
            <th class="">Z3</th>
            <th class="">AC3</th>
            <th class="">AE3</th>
            <th class="">AG3</th>
            <th class="">AI3</th>
            <th class="">AK3</th>
            <th class="">AL3</th>
            <th class="">AN3</th>
          </tr>
          <tr>
            <th class="">K4</th>
            <th class="">M4</th>
            <th class="">O4</th>
            <th class="">Q4</th>
            <th class="">S4</th>
            <th class="">U4</th>
            <th class="">W4</th>
            <th class="">Y4</th>
            <th class="">AA4</th>
            <th class="">AC4</th>
            <th class="">AE4</th>
            <th class="">AG4</th>
            <th class="">AI4</th>
            <th class="">AK4</th>
            <th class="">AM4</th>
            <th class="">AO4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">K1</td>
            <td class="">M1</td>
            <td class="">O1</td>
            <td class="">Q1</td>
            <td class="">S1</td>
            <td class="">U1</td>
            <td class="">W1</td>
            <td class="">Y1</td>
            <td class="">AA1</td>
            <td class="">AC1</td>
            <td class="">AE1</td>
            <td class="">AG1</td>
            <td class="">AI1</td>
            <td class="">AK1</td>
            <td class="">AM1</td>
            <td class="">AO1</td>
          </tr>
        </tbody>
        `);

      hidingMap.setValueAtIndex(31, false); // Show column that contains cells AF{n}
      hidingMap.setValueAtIndex(33, false); // Show column that contains cells AH{n}
      hidingMap.setValueAtIndex(35, false); // Show column that contains cells AJ{n}
      hidingMap.setValueAtIndex(37, false); // Show column that contains cells AL{n}
      hidingMap.setValueAtIndex(39, false); // Show column that contains cells AN{n}
      hidingMap.setValueAtIndex(41, false); // Show column that contains cells AP{n}
      hidingMap.setValueAtIndex(43, false); // Show column that contains cells AR{n}
      hidingMap.setValueAtIndex(45, false); // Show column that contains cells AT{n}
      hot.render();

      scrollViewportTo({ // Scroll to column AM4
        col: 38,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });
      render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="4">T1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="7">AC1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AK1</th>
            <th class="" colspan="8">AL1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AT1</th>
          </tr>
          <tr>
            <th class="" colspan="2">T2</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">X2</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="3">AC2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">AG2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AK2</th>
            <th class="" colspan="4">AL2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">AP2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AT2</th>
          </tr>
          <tr>
            <th class="">T3</th>
            <th class="">V3</th>
            <th class="">X3</th>
            <th class="">Z3</th>
            <th class="">AC3</th>
            <th class="" colspan="2">AE3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AG3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AI3</th>
            <th class="hiddenHeader"></th>
            <th class="">AK3</th>
            <th class="" colspan="2">AL3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AN3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AP3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AR3</th>
            <th class="hiddenHeader"></th>
            <th class="">AT3</th>
          </tr>
          <tr>
            <th class="">U4</th>
            <th class="">W4</th>
            <th class="">Y4</th>
            <th class="">AA4</th>
            <th class="">AC4</th>
            <th class="">AE4</th>
            <th class="">AF4</th>
            <th class="">AG4</th>
            <th class="">AH4</th>
            <th class="">AI4</th>
            <th class="">AJ4</th>
            <th class="">AK4</th>
            <th class="">AL4</th>
            <th class="">AM4</th>
            <th class="">AN4</th>
            <th class="">AO4</th>
            <th class="">AP4</th>
            <th class="">AQ4</th>
            <th class="">AR4</th>
            <th class="">AS4</th>
            <th class="">AT4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">U1</td>
            <td class="">W1</td>
            <td class="">Y1</td>
            <td class="">AA1</td>
            <td class="">AC1</td>
            <td class="">AE1</td>
            <td class="">AF1</td>
            <td class="">AG1</td>
            <td class="">AH1</td>
            <td class="">AI1</td>
            <td class="">AJ1</td>
            <td class="">AK1</td>
            <td class="">AL1</td>
            <td class="">AM1</td>
            <td class="">AN1</td>
            <td class="">AO1</td>
            <td class="">AP1</td>
            <td class="">AQ1</td>
            <td class="">AR1</td>
            <td class="">AS1</td>
            <td class="">AT1</td>
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

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

      hidingMap.setValueAtIndex(3, false); // Show column that contains cells D{n}
      hot.render();

      await sleep(200);

      const hidingMap2 = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map2', 'hiding', true);

      hidingMap.setValueAtIndex(6, false); // Show column that contains cells G{n}
      hidingMap.setValueAtIndex(9, false); // Show column that contains cells J{n}
      hidingMap2.setValueAtIndex(3, false); // Show column that contains cells D{n}
      hidingMap2.setValueAtIndex(6, false); // Show column that contains cells G{n}
      hidingMap2.setValueAtIndex(9, false); // Show column that contains cells J{n}
      hot.render();

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

      await sleep(200);

      const hidingMap3 = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map3', 'hiding', true);

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
      hot.render();

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
      it('should keep the headers in sync with a dataset after updateSettings call', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
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

        updateSettings({
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

        updateSettings({
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

        updateSettings({ });

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
