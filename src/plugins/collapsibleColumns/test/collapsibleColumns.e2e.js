describe('CollapsibleColumns', () => {
  const id = 'testContainer';

  function extractDOMStructure(overlayTHead, overlayTBody) {
    const cloneTHeadOverlay = overlayTHead.find('thead')[0].cloneNode(true);
    const cellsRow = overlayTBody ? overlayTBody.find('tbody tr')[0].cloneNode(true).outerHTML : '';

    Array.from(cloneTHeadOverlay.querySelectorAll('th')).forEach((TH) => {
      if (TH.querySelector('.collapsibleIndicator')) {
        TH.classList.add('collapsibleIndicator');
      }
      if (TH.querySelector('.collapsed')) {
        TH.classList.add('collapsed');
      }
      if (TH.querySelector('.expanded')) {
        TH.classList.add('expanded');
      }

      // Simplify header content
      TH.innerText = TH.querySelector('.colHeader').innerText;
      TH.removeAttribute('style');
    });

    return `${cloneTHeadOverlay.outerHTML}${cellsRow ? `<tbody>${cellsRow}</tbody>` : ''}`;
  }

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    this.generateComplexSetup = function(rows, cols, obj) {
      const data = [];

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (!data[i]) {
            data[i] = [];
          }

          if (!obj) {
            data[i][j] = `${i}_${j}`;
            /* eslint-disable no-continue */
            continue;
          }

          if (i === 0 && j % 2 !== 0) {
            data[i][j] = {
              label: `${i}_${j}`,
              colspan: 8
            };
          } else if (i === 1 && (j % 3 === 1 || j % 3 === 2)) {
            data[i][j] = {
              label: `${i}_${j}`,
              colspan: 4
            };
          } else if (i === 2 && (j % 5 === 1 || j % 5 === 2 || j % 5 === 3 || j % 5 === 4)) {
            data[i][j] = {
              label: `${i}_${j}`,
              colspan: 2
            };
          } else {
            data[i][j] = `${i}_${j}`;
          }

        }
      }

      return data;
    };

  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
    if (this.$wrapper) {
      this.$wrapper.remove();
    }
  });

  describe('initialization', () => {
    it('should be possible to disable the plugin using the disablePlugin method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true
      });

      const plugin = hot.getPlugin('collapsibleColumns');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
            <th class="">C2</th>
            <th class="">D2</th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
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

      plugin.disablePlugin();
      hot.render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
            <th class="">C2</th>
            <th class="">D2</th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
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

    it('should be possible to re-enable the plugin using the enablePlugin method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true
      });

      const plugin = hot.getPlugin('collapsibleColumns');

      plugin.disablePlugin();
      hot.render();
      plugin.enablePlugin();
      hot.render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
            <th class="">C2</th>
            <th class="">D2</th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
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

    it('should be possible to enable the plugin using the updateSettings method (enable all nested headers)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
        ]
      });

      hot.updateSettings({
        collapsibleColumns: true
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
            <th class="">C2</th>
            <th class="">D2</th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
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

    it('should be possible to enable the plugin using the updateSettings method (selective configuration)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B1', colspan: 2 }, { label: 'D1', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
        ]
      });

      hot.updateSettings({
        collapsibleColumns: [
          { row: -1, col: 3, collapsible: true },
          { row: -2, col: 1, collapsible: true },
        ]
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="2">B1</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">D1</th>
            <th class="hiddenHeader"></th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
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

    it('should be possible to disable the plugin using the updateSettings method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B1', colspan: 2 }, { label: 'D1', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true,
      });

      hot.updateSettings({
        collapsibleColumns: false,
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="2">B1</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">D1</th>
            <th class="hiddenHeader"></th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
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

    it('should be possible to update the plugin settings using the updateSettings method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B1', colspan: 2 }, { label: 'D1', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: [
          { row: -1, col: 1, collapsible: true }
        ],
      });

      hot.updateSettings({
        collapsibleColumns: [
          { row: -2, col: 1, collapsible: true }
        ],
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="2">B1</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">D1</th>
            <th class="hiddenHeader"></th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
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

      hot.updateSettings({
        collapsibleColumns: [
          { row: -1, col: 3, collapsible: true }
        ],
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="2">B1</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">D1</th>
            <th class="hiddenHeader"></th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
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

      hot.updateSettings({
        collapsibleColumns: true
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="2">B1</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">D1</th>
            <th class="hiddenHeader"></th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
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
  });

  describe('collapsing headers functionality', () => {
    it('should keep headers and cells consistent after collapsing single header (basic example)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
            <th class="">C2</th>
            <th class="">D2</th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
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

      $(getCell(-2, 1).querySelector('.collapsibleIndicator')) // header "B1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator collapsed">B1</th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="afterHiddenColumn">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });

    it('should keep headers and cells consistent after collapsing multiple headers (basic example)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">D2</th>
            <th class="hiddenHeader"></th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
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

      $(getCell(-1, 1).querySelector('.collapsibleIndicator')) // header "B2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="3">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator collapsed">B2</th>
            <th class="collapsibleIndicator expanded" colspan="2">D2</th>
            <th class="hiddenHeader"></th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="afterHiddenColumn">D1</td>
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

    it('should keep headers and cells consistent after collapsing multiple headers (advanced example)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 13),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
          ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
          ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
          ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
            { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5'],
        ],
        collapsibleColumns: true
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="8">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
            <th class="collapsibleIndicator expanded" colspan="3">K1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="8">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
            <th class="collapsibleIndicator expanded" colspan="3">K2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator expanded" colspan="4">B3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="4">F3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
            <th class="collapsibleIndicator expanded" colspan="3">K3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator expanded" colspan="2">B4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">D4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">F4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">H4</th>
            <th class="hiddenHeader"></th>
            <th class="">J4</th>
            <th class="">K4</th>
            <th class="collapsibleIndicator expanded" colspan="2">L4</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">C5</th>
            <th class="">D5</th>
            <th class="">E5</th>
            <th class="">F5</th>
            <th class="">G5</th>
            <th class="">H5</th>
            <th class="">I5</th>
            <th class="">J5</th>
            <th class="">K5</th>
            <th class="">L5</th>
            <th class="">M5</th>
          </tr>
        </thead>
        <tbody>
          <tr>
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

      $(getCell(-2, 1).querySelector('.collapsibleIndicator')) // header "B4"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="7">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
            <th class="collapsibleIndicator expanded" colspan="3">K1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="7">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
            <th class="collapsibleIndicator expanded" colspan="3">K2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator expanded" colspan="3">B3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="4">F3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
            <th class="collapsibleIndicator expanded" colspan="3">K3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator collapsed">B4</th>
            <th class="collapsibleIndicator expanded" colspan="2">D4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">F4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">H4</th>
            <th class="hiddenHeader"></th>
            <th class="">J4</th>
            <th class="">K4</th>
            <th class="collapsibleIndicator expanded" colspan="2">L4</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">D5</th>
            <th class="">E5</th>
            <th class="">F5</th>
            <th class="">G5</th>
            <th class="">H5</th>
            <th class="">I5</th>
            <th class="">J5</th>
            <th class="">K5</th>
            <th class="">L5</th>
            <th class="">M5</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="afterHiddenColumn">D1</td>
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

      $(getCell(-3, 1).querySelector('.collapsibleIndicator')) // header "B3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="5">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
            <th class="collapsibleIndicator expanded" colspan="3">K1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="5">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
            <th class="collapsibleIndicator expanded" colspan="3">K2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator collapsed">B3</th>
            <th class="collapsibleIndicator expanded" colspan="4">F3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
            <th class="collapsibleIndicator expanded" colspan="3">K3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator collapsed">B4</th>
            <th class="collapsibleIndicator expanded" colspan="2">F4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">H4</th>
            <th class="hiddenHeader"></th>
            <th class="">J4</th>
            <th class="">K4</th>
            <th class="collapsibleIndicator expanded" colspan="2">L4</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">F5</th>
            <th class="">G5</th>
            <th class="">H5</th>
            <th class="">I5</th>
            <th class="">J5</th>
            <th class="">K5</th>
            <th class="">L5</th>
            <th class="">M5</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="afterHiddenColumn">F1</td>
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

      $(getCell(-3, 5).querySelector('.collapsibleIndicator')) // header "F3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="3">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
            <th class="collapsibleIndicator expanded" colspan="3">K1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
            <th class="collapsibleIndicator expanded" colspan="3">K2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator collapsed">B3</th>
            <th class="collapsibleIndicator collapsed" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
            <th class="collapsibleIndicator expanded" colspan="3">K3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator collapsed">B4</th>
            <th class="collapsibleIndicator expanded" colspan="2">F4</th>
            <th class="hiddenHeader"></th>
            <th class="">J4</th>
            <th class="">K4</th>
            <th class="collapsibleIndicator expanded" colspan="2">L4</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">F5</th>
            <th class="">G5</th>
            <th class="">J5</th>
            <th class="">K5</th>
            <th class="">L5</th>
            <th class="">M5</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="afterHiddenColumn">F1</td>
            <td class="">G1</td>
            <td class="afterHiddenColumn">J1</td>
            <td class="">K1</td>
            <td class="">L1</td>
            <td class="">M1</td>
          </tr>
        </tbody>
        `);

      $(getCell(-4, 1).querySelector('.collapsibleIndicator')) // header "B2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator collapsed">B1</th>
            <th class="">J1</th>
            <th class="collapsibleIndicator expanded" colspan="3">K1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator collapsed">B2</th>
            <th class="">J2</th>
            <th class="collapsibleIndicator expanded" colspan="3">K2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator collapsed">B3</th>
            <th class="">J3</th>
            <th class="collapsibleIndicator expanded" colspan="3">K3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator collapsed">B4</th>
            <th class="">J4</th>
            <th class="">K4</th>
            <th class="collapsibleIndicator expanded" colspan="2">L4</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">J5</th>
            <th class="">K5</th>
            <th class="">L5</th>
            <th class="">M5</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="afterHiddenColumn">J1</td>
            <td class="">K1</td>
            <td class="">L1</td>
            <td class="">M1</td>
          </tr>
        </tbody>
        `);

      $(getCell(-2, 11).querySelector('.collapsibleIndicator')) // header "L4"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator collapsed">B1</th>
            <th class="">J1</th>
            <th class="collapsibleIndicator expanded" colspan="2">K1</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator collapsed">B2</th>
            <th class="">J2</th>
            <th class="collapsibleIndicator expanded" colspan="2">K2</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator collapsed">B3</th>
            <th class="">J3</th>
            <th class="collapsibleIndicator expanded" colspan="2">K3</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator collapsed">B4</th>
            <th class="">J4</th>
            <th class="">K4</th>
            <th class="collapsibleIndicator collapsed">L4</th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">J5</th>
            <th class="">K5</th>
            <th class="">L5</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="afterHiddenColumn">J1</td>
            <td class="">K1</td>
            <td class="">L1</td>
          </tr>
        </tbody>
        `);

      $(getCell(-5, 10).querySelector('.collapsibleIndicator')) // header "K1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator collapsed">B1</th>
            <th class="">J1</th>
            <th class="collapsibleIndicator collapsed">K1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator collapsed">B2</th>
            <th class="">J2</th>
            <th class="collapsibleIndicator collapsed">K2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator collapsed">B3</th>
            <th class="">J3</th>
            <th class="collapsibleIndicator collapsed">K3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator collapsed">B4</th>
            <th class="">J4</th>
            <th class="">K4</th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">J5</th>
            <th class="">K5</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="afterHiddenColumn">J1</td>
            <td class="">K1</td>
          </tr>
        </tbody>
        `);
    });

    it('should maintain the collapse functionality, when the table has been scrolled', function() {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 90),
        hiddenColumns: true,
        nestedHeaders: this.generateComplexSetup(4, 70, true),
        collapsibleColumns: true,
        width: 400,
        height: 300
      });

      hot.scrollViewportTo(void 0, 37);
      hot.render();

      $(getCell(-2, 37).querySelector('.collapsibleIndicator')) // header "2_21"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-3, 37).querySelector('.collapsibleIndicator')) // header "1_13"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-3, 41).querySelector('.collapsibleIndicator')) // header "1_14"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-4, 46).querySelector('.collapsibleIndicator')) // header "0_11"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="8">0_7</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">0_8</th>
            <th class="collapsibleIndicator expanded" colspan="3">0_9</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">0_10</th>
            <th class="collapsibleIndicator collapsed" colspan="4">0_11</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">0_12</th>
            <th class="collapsibleIndicator expanded" colspan="8">0_13</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="4">1_10</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="4">1_11</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">1_12</th>
            <th class="collapsibleIndicator collapsed">1_13</th>
            <th class="collapsibleIndicator collapsed" colspan="2">1_14</th>
            <th class="hiddenHeader"></th>
            <th class="">1_15</th>
            <th class="collapsibleIndicator expanded" colspan="4">1_16</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">1_18</th>
            <th class="collapsibleIndicator expanded" colspan="4">1_19</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="2">2_16</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">2_17</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">2_18</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">2_19</th>
            <th class="hiddenHeader"></th>
            <th class="">2_20</th>
            <th class="collapsibleIndicator collapsed">2_21</th>
            <th class="collapsibleIndicator expanded" colspan="2">2_23</th>
            <th class="hiddenHeader"></th>
            <th class="">2_25</th>
            <th class="collapsibleIndicator expanded" colspan="2">2_26</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">2_27</th>
            <th class="hiddenHeader"></th>
            <th class="">2_30</th>
            <th class="collapsibleIndicator expanded" colspan="2">2_31</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">2_32</th>
          </tr>
          <tr>
            <th class="">3_28</th>
            <th class="">3_29</th>
            <th class="">3_30</th>
            <th class="">3_31</th>
            <th class="">3_32</th>
            <th class="">3_33</th>
            <th class="">3_34</th>
            <th class="">3_35</th>
            <th class="">3_36</th>
            <th class="">3_37</th>
            <th class="">3_41</th>
            <th class="">3_42</th>
            <th class="">3_45</th>
            <th class="">3_46</th>
            <th class="">3_47</th>
            <th class="">3_48</th>
            <th class="">3_49</th>
            <th class="">3_54</th>
            <th class="">3_55</th>
            <th class="">3_56</th>
            <th class="">3_57</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">AC1</td>
            <td class="">AD1</td>
            <td class="">AE1</td>
            <td class="">AF1</td>
            <td class="">AG1</td>
            <td class="">AH1</td>
            <td class="">AI1</td>
            <td class="">AJ1</td>
            <td class="">AK1</td>
            <td class="">AL1</td>
            <td class="afterHiddenColumn">AP1</td>
            <td class="">AQ1</td>
            <td class="afterHiddenColumn">AT1</td>
            <td class="">AU1</td>
            <td class="">AV1</td>
            <td class="">AW1</td>
            <td class="">AX1</td>
            <td class="afterHiddenColumn">BC1</td>
            <td class="">BD1</td>
            <td class="">BE1</td>
            <td class="">BF1</td>
          </tr>
        </tbody>
        `);
    });

    it('should correclty render headers after column collapsing', () => {
      const $wrapper = $('<div></div>').css({
        width: 400,
        height: 200,
        overflow: 'hidden',
      });

      spec().$wrapper = spec().$container.wrap($wrapper).parent();

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 40),
        colHeaders: true,
        hiddenColumns: true,
        nestedHeaders: [
          ['-', '-', '-', '-', '-', '-', '-', '-', '-', { label: 'J', colspan: 4 },
            { label: 'N', colspan: 4 }, 'R', { label: 'S', colspan: 3 }],
          ['-', '-', '-', '-', '-', '-', '-', '-', '-', { label: 'J', colspan: 2 },
            { label: 'L', colspan: 2 }, { label: 'N', colspan: 2 }, { label: 'P', colspan: 2 },
            'R', 'S', { label: 'T', colspan: 2 }],
          ['-', '-', '-', '-', '-', '-', '-', '-', '-', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
            'Q', 'R', 'S', 'T', 'U', 'V', 'W'],
        ],
        collapsibleColumns: true,
      });

      hot.scrollViewportTo(0, 15);
      hot.render();

      $(getCell(-2, 9).querySelector('.collapsibleIndicator')) // header "B"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-2, 11).querySelector('.collapsibleIndicator')) // header "D"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      hot.scrollViewportTo(0, 17);
      hot.render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">R</th>
            <th class="collapsibleIndicator expanded" colspan="3">S</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class="">R</th>
            <th class="">S</th>
            <th class="collapsibleIndicator expanded" colspan="2">T</th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class="">R</th>
            <th class="">S</th>
            <th class="">T</th>
            <th class="">U</th>
            <th class="">V</th>
            <th class="">W</th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
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
          <tr>
            <td class="">R1</td>
            <td class="">S1</td>
            <td class="">T1</td>
            <td class="">U1</td>
            <td class="">V1</td>
            <td class="">W1</td>
            <td class="">X1</td>
            <td class="">Y1</td>
            <td class="">Z1</td>
            <td class="">AA1</td>
            <td class="">AB1</td>
            <td class="">AC1</td>
            <td class="">AD1</td>
            <td class="">AE1</td>
            <td class="">AF1</td>
            <td class="">AG1</td>
            <td class="">AH1</td>
            <td class="">AI1</td>
          </tr>
        </tbody>
        `);
    });
  });

  describe('expanding headers functionality', () => {
    it('should keep headers and cells consistent after expanding single header (basic example)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true
      });

      const plugin = getPlugin('collapsibleColumns');

      plugin.collapseAll();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator collapsed">B1</th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="afterHiddenColumn">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);

      $(getCell(-2, 1).querySelector('.collapsibleIndicator')) // header "B1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
            <th class="">C2</th>
            <th class="">D2</th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
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

    it('should keep headers and cells consistent after expanding multiple headers (basic example)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true
      });

      const plugin = getPlugin('collapsibleColumns');

      plugin.collapseAll();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator collapsed">B1</th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator collapsed">B2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="afterHiddenColumn">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);

      $(getCell(-1, 1).querySelector('.collapsibleIndicator')) // header "B2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator collapsed" colspan="2">B1</th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="afterHiddenColumn">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });

    it('should keep headers and cells consistent after expanding multiple headers (advanced example)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 13),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
          ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
          ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
          ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
            { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5'],
        ],
        collapsibleColumns: true
      });

      const plugin = getPlugin('collapsibleColumns');

      plugin.collapseAll();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator collapsed">B1</th>
            <th class="">J1</th>
            <th class="collapsibleIndicator collapsed">K1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator collapsed">B2</th>
            <th class="">J2</th>
            <th class="collapsibleIndicator collapsed">K2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator collapsed">B3</th>
            <th class="">J3</th>
            <th class="collapsibleIndicator collapsed">K3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator collapsed">B4</th>
            <th class="">J4</th>
            <th class="">K4</th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">J5</th>
            <th class="">K5</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="afterHiddenColumn">J1</td>
            <td class="">K1</td>
          </tr>
        </tbody>
        `);

      $(getCell(-2, 1).querySelector('.collapsibleIndicator')) // header "B4"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator collapsed" colspan="2">B1</th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
            <th class="collapsibleIndicator collapsed">K1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator collapsed" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
            <th class="collapsibleIndicator collapsed">K2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator collapsed" colspan="2">B3</th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
            <th class="collapsibleIndicator collapsed">K3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator expanded" colspan="2">B4</th>
            <th class="hiddenHeader"></th>
            <th class="">J4</th>
            <th class="">K4</th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">C5</th>
            <th class="">J5</th>
            <th class="">K5</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="afterHiddenColumn">J1</td>
            <td class="">K1</td>
          </tr>
        </tbody>
        `);

      $(getCell(-4, 10).querySelector('.collapsibleIndicator')) // header "K2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator collapsed" colspan="2">B1</th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
            <th class="collapsibleIndicator expanded" colspan="3">K1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator collapsed" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
            <th class="collapsibleIndicator expanded" colspan="3">K2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator collapsed" colspan="2">B3</th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
            <th class="collapsibleIndicator expanded" colspan="3">K3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator expanded" colspan="2">B4</th>
            <th class="hiddenHeader"></th>
            <th class="">J4</th>
            <th class="">K4</th>
            <th class="collapsibleIndicator expanded" colspan="2">L4</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">C5</th>
            <th class="">J5</th>
            <th class="">K5</th>
            <th class="">L5</th>
            <th class="">M5</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="afterHiddenColumn">J1</td>
            <td class="">K1</td>
            <td class="">L1</td>
            <td class="">M1</td>
          </tr>
        </tbody>
        `);

      $(getCell(-5, 1).querySelector('.collapsibleIndicator')) // header "B1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="6">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
            <th class="collapsibleIndicator expanded" colspan="3">K1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="6">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
            <th class="collapsibleIndicator expanded" colspan="3">K2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator collapsed" colspan="2">B3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="4">F3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
            <th class="collapsibleIndicator expanded" colspan="3">K3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator expanded" colspan="2">B4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">F4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">H4</th>
            <th class="hiddenHeader"></th>
            <th class="">J4</th>
            <th class="">K4</th>
            <th class="collapsibleIndicator expanded" colspan="2">L4</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">C5</th>
            <th class="">F5</th>
            <th class="">G5</th>
            <th class="">H5</th>
            <th class="">I5</th>
            <th class="">J5</th>
            <th class="">K5</th>
            <th class="">L5</th>
            <th class="">M5</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="afterHiddenColumn">F1</td>
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

      $(getCell(-3, 1).querySelector('.collapsibleIndicator')) // header "B3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="8">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
            <th class="collapsibleIndicator expanded" colspan="3">K1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="8">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
            <th class="collapsibleIndicator expanded" colspan="3">K2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator expanded" colspan="4">B3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="4">F3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
            <th class="collapsibleIndicator expanded" colspan="3">K3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator expanded" colspan="2">B4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">D4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">F4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">H4</th>
            <th class="hiddenHeader"></th>
            <th class="">J4</th>
            <th class="">K4</th>
            <th class="collapsibleIndicator expanded" colspan="2">L4</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">C5</th>
            <th class="">D5</th>
            <th class="">E5</th>
            <th class="">F5</th>
            <th class="">G5</th>
            <th class="">H5</th>
            <th class="">I5</th>
            <th class="">J5</th>
            <th class="">K5</th>
            <th class="">L5</th>
            <th class="">M5</th>
          </tr>
        </thead>
        <tbody>
          <tr>
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

    it('should maintain the expand functionality, when the table has been scrolled', function() {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 90),
        hiddenColumns: true,
        nestedHeaders: this.generateComplexSetup(4, 70, true),
        collapsibleColumns: true,
        width: 400,
        height: 300
      });

      // const plugin = getPlugin('collapsibleColumns');
      //
      // plugin.collapseAll();
      //
      // return;

      hot.scrollViewportTo(void 0, 37);
      hot.render();

      // collapsing
      $(getCell(-2, 37).querySelector('.collapsibleIndicator')) // header "2_21"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-3, 37).querySelector('.collapsibleIndicator')) // header "1_13"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-3, 41).querySelector('.collapsibleIndicator')) // header "1_14"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-4, 46).querySelector('.collapsibleIndicator')) // header "0_11"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      // expanding
      $(getCell(-3, 37).querySelector('.collapsibleIndicator')) // header "1_13"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-2, 37).querySelector('.collapsibleIndicator')) // header "2_21"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="8">0_7</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">0_8</th>
            <th class="collapsibleIndicator expanded" colspan="6">0_9</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">0_10</th>
            <th class="collapsibleIndicator collapsed" colspan="4">0_11</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="4">1_10</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="4">1_11</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">1_12</th>
            <th class="collapsibleIndicator expanded" colspan="4">1_13</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator collapsed" colspan="2">1_14</th>
            <th class="hiddenHeader"></th>
            <th class="">1_15</th>
            <th class="collapsibleIndicator expanded" colspan="4">1_16</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="2">2_16</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">2_17</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">2_18</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">2_19</th>
            <th class="hiddenHeader"></th>
            <th class="">2_20</th>
            <th class="collapsibleIndicator expanded" colspan="2">2_21</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">2_22</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">2_23</th>
            <th class="hiddenHeader"></th>
            <th class="">2_25</th>
            <th class="collapsibleIndicator expanded" colspan="2">2_26</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">2_27</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">3_28</th>
            <th class="">3_29</th>
            <th class="">3_30</th>
            <th class="">3_31</th>
            <th class="">3_32</th>
            <th class="">3_33</th>
            <th class="">3_34</th>
            <th class="">3_35</th>
            <th class="">3_36</th>
            <th class="">3_37</th>
            <th class="">3_38</th>
            <th class="">3_39</th>
            <th class="">3_40</th>
            <th class="">3_41</th>
            <th class="">3_42</th>
            <th class="">3_45</th>
            <th class="">3_46</th>
            <th class="">3_47</th>
            <th class="">3_48</th>
            <th class="">3_49</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">AC1</td>
            <td class="">AD1</td>
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
            <td class="afterHiddenColumn">AT1</td>
            <td class="">AU1</td>
            <td class="">AV1</td>
            <td class="">AW1</td>
            <td class="">AX1</td>
          </tr>
        </tbody>
        `);
    });
  });

  describe('collapsible button', () => {
    it('should call "toggleCollapsibleSection" internally with correct toggle state ' +
       '(depends if the clicked header is already collapsed or not)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true
      });

      const plugin = getPlugin('collapsibleColumns');

      spyOn(plugin, 'toggleCollapsibleSection').and.callThrough();

      $(getCell(-1, 3).querySelector('.collapsibleIndicator')) // header "D2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(plugin.toggleCollapsibleSection).toHaveBeenCalledWith([
        jasmine.objectContaining({ row: -1, col: 3 })
      ], 'collapse');

      $(getCell(-2, 1).querySelector('.collapsibleIndicator')) // header "B1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(plugin.toggleCollapsibleSection).toHaveBeenCalledWith([
        jasmine.objectContaining({ row: -2, col: 1 })
      ], 'collapse');

      $(getCell(-2, 1).querySelector('.collapsibleIndicator')) // header "B1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(plugin.toggleCollapsibleSection).toHaveBeenCalledWith([
        jasmine.objectContaining({ row: -2, col: 1 })
      ], 'expand');

      $(getCell(-2, 1).querySelector('.collapsibleIndicator')) // header "B1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(plugin.toggleCollapsibleSection).toHaveBeenCalledWith([
        jasmine.objectContaining({ row: -2, col: 1 })
      ], 'collapse');

      $(getCell(-2, 1).querySelector('.collapsibleIndicator')) // header "B1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(plugin.toggleCollapsibleSection).toHaveBeenCalledWith([
        jasmine.objectContaining({ row: -2, col: 1 })
      ], 'expand');

      $(getCell(-1, 3).querySelector('.collapsibleIndicator')) // header "D2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(plugin.toggleCollapsibleSection).toHaveBeenCalledWith([
        jasmine.objectContaining({ row: -1, col: 3 })
      ], 'expand');
    });
  });

  describe('collapseSection()', () => {
    it('should call "toggleCollapsibleSection" internally', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true
      });

      const plugin = getPlugin('collapsibleColumns');

      spyOn(plugin, 'toggleCollapsibleSection');

      plugin.collapseSection({ row: -2, col: 4 });

      expect(plugin.toggleCollapsibleSection).toHaveBeenCalledWith([{ row: -2, col: 4 }], 'collapse');
    });
  });

  describe('collapseAll()', () => {
    it('should call "toggleCollapsibleSection" internally', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
          ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
          ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
          ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
            { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5'],
        ],
        collapsibleColumns: true
      });

      const plugin = getPlugin('collapsibleColumns');

      spyOn(plugin, 'toggleCollapsibleSection');

      plugin.collapseAll();

      expect(plugin.toggleCollapsibleSection).toHaveBeenCalledWith([
        { row: -5, col: 1 },
        { row: -4, col: 1 },
        { row: -3, col: 1 },
        { row: -3, col: 5 },
        { row: -2, col: 1 },
        { row: -2, col: 3 },
        { row: -2, col: 5 },
        { row: -2, col: 7 },
        { row: -5, col: 10 },
        { row: -4, col: 10 },
        { row: -3, col: 10 },
        { row: -2, col: 11 },
      ], 'collapse');
    });

    it('should collapse only "collapsible" headers', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 13),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
          ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
          ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
          ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
            { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5'],
        ],
        collapsibleColumns: [
          { row: -3, col: 1, collapsible: true },
          { row: -4, col: 11, collapsible: true }, // <-- invalid coords
          { row: -4, col: 10, collapsible: true },
        ],
      });

      const plugin = getPlugin('collapsibleColumns');

      spyOn(plugin, 'toggleCollapsibleSection').and.callThrough();

      plugin.collapseAll();

      expect(plugin.toggleCollapsibleSection).toHaveBeenCalledWith([
        { row: -3, col: 1 },
        { row: -4, col: 10 },
      ], 'collapse');

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
            <th class="">K1</th>
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
            <th class="collapsibleIndicator collapsed">K2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator collapsed" colspan="2">B3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">F3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
            <th class="">K3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="" colspan="2">B4</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">F4</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">H4</th>
            <th class="hiddenHeader"></th>
            <th class="">J4</th>
            <th class="">K4</th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">C5</th>
            <th class="">F5</th>
            <th class="">G5</th>
            <th class="">H5</th>
            <th class="">I5</th>
            <th class="">J5</th>
            <th class="">K5</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="afterHiddenColumn">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
            <td class="">K1</td>
          </tr>
        </tbody>
        `);
    });
  });

  describe('expandSection()', () => {
    it('should call "toggleCollapsibleSection" internally', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true
      });

      const plugin = getPlugin('collapsibleColumns');

      spyOn(plugin, 'toggleCollapsibleSection');

      plugin.expandSection({ row: -2, col: 4 });

      expect(plugin.toggleCollapsibleSection).toHaveBeenCalledWith([{ row: -2, col: 4 }], 'expand');
    });
  });

  describe('expandAll()', () => {
    it('should call "toggleCollapsibleSection" internally', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
          ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
          ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
          ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
            { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5'],
        ],
        collapsibleColumns: true
      });

      const plugin = getPlugin('collapsibleColumns');

      spyOn(plugin, 'toggleCollapsibleSection');

      plugin.expandAll();

      expect(plugin.toggleCollapsibleSection).toHaveBeenCalledWith([
        { row: -5, col: 1 },
        { row: -4, col: 1 },
        { row: -3, col: 1 },
        { row: -3, col: 5 },
        { row: -2, col: 1 },
        { row: -2, col: 3 },
        { row: -2, col: 5 },
        { row: -2, col: 7 },
        { row: -5, col: 10 },
        { row: -4, col: 10 },
        { row: -3, col: 10 },
        { row: -2, col: 11 },
      ], 'expand');
    });
  });

  describe('toggleAllCollapsibleSections()', () => {
    it('should call "toggleCollapsibleSection" internally while collapsing', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
          ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
          ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
          ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
            { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5'],
        ],
        collapsibleColumns: true
      });

      const plugin = getPlugin('collapsibleColumns');

      spyOn(plugin, 'toggleCollapsibleSection');

      plugin.toggleAllCollapsibleSections('collapse');

      expect(plugin.toggleCollapsibleSection).toHaveBeenCalledWith([
        { row: -5, col: 1 },
        { row: -4, col: 1 },
        { row: -3, col: 1 },
        { row: -3, col: 5 },
        { row: -2, col: 1 },
        { row: -2, col: 3 },
        { row: -2, col: 5 },
        { row: -2, col: 7 },
        { row: -5, col: 10 },
        { row: -4, col: 10 },
        { row: -3, col: 10 },
        { row: -2, col: 11 },
      ], 'collapse');
    });

    it('should call "toggleCollapsibleSection" internally while expanding', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
          ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
          ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
          ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
            { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5'],
        ],
        collapsibleColumns: true
      });

      const plugin = getPlugin('collapsibleColumns');

      spyOn(plugin, 'toggleCollapsibleSection');

      plugin.toggleAllCollapsibleSections('expand');

      expect(plugin.toggleCollapsibleSection).toHaveBeenCalledWith([
        { row: -5, col: 1 },
        { row: -4, col: 1 },
        { row: -3, col: 1 },
        { row: -3, col: 5 },
        { row: -2, col: 1 },
        { row: -2, col: 3 },
        { row: -2, col: 5 },
        { row: -2, col: 7 },
        { row: -5, col: 10 },
        { row: -4, col: 10 },
        { row: -3, col: 10 },
        { row: -2, col: 11 },
      ], 'expand');
    });
  });

  describe('toggleCollapsibleSection()', () => {
    it('should collapse collapsible headers', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
          ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
          ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
          ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
            { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5'],
        ],
        collapsibleColumns: true
      });

      const plugin = getPlugin('collapsibleColumns');

      plugin.toggleCollapsibleSection([
        { row: -2, col: 1 },
        { row: -3, col: 5 }
      ], 'collapse'); // header "B3" and "F3"

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="5">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="5">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator expanded" colspan="3">B3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator collapsed" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator collapsed">B4</th>
            <th class="collapsibleIndicator expanded" colspan="2">D4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">F4</th>
            <th class="hiddenHeader"></th>
            <th class="">J4</th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">D5</th>
            <th class="">E5</th>
            <th class="">F5</th>
            <th class="">G5</th>
            <th class="">J5</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="afterHiddenColumn">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="afterHiddenColumn">J1</td>
          </tr>
        </tbody>
        `);
    });

    it('should expand collapsible headers', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
          ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
          ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
          ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
            { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5'],
        ],
        collapsibleColumns: true
      });

      const plugin = getPlugin('collapsibleColumns');

      plugin.toggleCollapsibleSection([
        { row: -2, col: 1 },
        { row: -3, col: 5 }
      ], 'collapse'); // header "B3" and "F3"

      plugin.toggleCollapsibleSection([
        { row: -2, col: 1 },
        { row: -3, col: 5 }
      ], 'expand'); // header "B3" and "F3"

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="8">B1</th>
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
            <th class="collapsibleIndicator expanded" colspan="8">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator expanded" colspan="4">B3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="4">F3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator expanded" colspan="2">B4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">D4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">F4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">H4</th>
            <th class="hiddenHeader"></th>
            <th class="">J4</th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">C5</th>
            <th class="">D5</th>
            <th class="">E5</th>
            <th class="">F5</th>
            <th class="">G5</th>
            <th class="">H5</th>
            <th class="">I5</th>
            <th class="">J5</th>
          </tr>
        </thead>
        <tbody>
          <tr>
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

    it('should not throw an error when trying collapsing header which does not have the ability to collapse', () => {
      const beforeColumnCollapse = jasmine.createSpy('beforeColumnCollapse');
      const afterColumnCollapse = jasmine.createSpy('afterColumnCollapse');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ],
        collapsibleColumns: [
          { row: -4, col: 1, collapsible: true },
          { row: -3, col: 1, collapsible: true },
          { row: -2, col: 1, collapsible: true },
          { row: -2, col: 3, collapsible: true }
        ],
        beforeColumnCollapse,
        afterColumnCollapse,
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      expect(() => {
        // not collapsible header
        collapsibleColumnsPlugin.toggleCollapsibleSection([{ row: -1, col: 1 }], 'collapse');
      }).not.toThrow();
      expect(beforeColumnCollapse).toHaveBeenCalledWith([], [], false, void 0, void 0, void 0);
      expect(afterColumnCollapse).toHaveBeenCalledWith([], [], false, false, void 0, void 0);

      expect(() => {
        // row out of range
        collapsibleColumnsPlugin.toggleCollapsibleSection([{ row: 0, col: 1 }], 'collapse');
      }).not.toThrow();
      expect(beforeColumnCollapse).toHaveBeenCalledWith([], [], false, void 0, void 0, void 0);
      expect(afterColumnCollapse).toHaveBeenCalledWith([], [], false, false, void 0, void 0);

      expect(() => {
        // column out of range
        collapsibleColumnsPlugin.toggleCollapsibleSection([{ row: -1, col: 200 }], 'collapse');
      }).not.toThrow();
      expect(beforeColumnCollapse).toHaveBeenCalledWith([], [], false, void 0, void 0, void 0);
      expect(afterColumnCollapse).toHaveBeenCalledWith([], [], false, false, void 0, void 0);
    });

    it('should trigger "beforeColumnCollapse" and "afterColumnCollapse" hooks', () => {
      const beforeColumnCollapse = jasmine.createSpy('beforeColumnCollapse');
      const afterColumnCollapse = jasmine.createSpy('afterColumnCollapse');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true,
        beforeColumnCollapse,
        afterColumnCollapse,
      });

      const plugin = getPlugin('collapsibleColumns');

      plugin.toggleCollapsibleSection([{ row: -2, col: 1 }], 'collapse'); // header "B1"

      expect(beforeColumnCollapse).toHaveBeenCalledWith([], [4, 3], true, void 0, void 0, void 0);
      expect(afterColumnCollapse).toHaveBeenCalledWith([], [4, 3], true, true, void 0, void 0);

      plugin.toggleCollapsibleSection([{ row: -1, col: 1 }], 'collapse'); // header "B2"

      expect(beforeColumnCollapse).toHaveBeenCalledWith([3, 4], [3, 4, 2], true, void 0, void 0, void 0);
      expect(afterColumnCollapse).toHaveBeenCalledWith([3, 4], [3, 4, 2], true, true, void 0, void 0);

      plugin.toggleCollapsibleSection([{ row: -1, col: 1 }], 'collapse'); // header "B2"

      expect(beforeColumnCollapse).toHaveBeenCalledWith([2, 3, 4], [2, 3, 4], true, void 0, void 0, void 0);
      expect(afterColumnCollapse).toHaveBeenCalledWith([2, 3, 4], [2, 3, 4], true, false, void 0, void 0);
    });

    it('should trigger "beforeColumnExpand" and "afterColumnExpand" hooks', () => {
      const beforeColumnExpand = jasmine.createSpy('beforeColumnExpand');
      const afterColumnExpand = jasmine.createSpy('afterColumnExpand');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true,
        beforeColumnExpand,
        afterColumnExpand,
      });

      const plugin = getPlugin('collapsibleColumns');

      plugin.collapseAll();

      plugin.toggleCollapsibleSection([{ row: -1, col: 1 }], 'expand'); // header "B2"

      expect(beforeColumnExpand).toHaveBeenCalledWith([2, 3, 4], [3, 4], true, void 0, void 0, void 0);
      expect(afterColumnExpand).toHaveBeenCalledWith([2, 3, 4], [3, 4], true, true, void 0, void 0);

      plugin.toggleCollapsibleSection([{ row: -2, col: 1 }], 'expand'); // header "B1"

      expect(beforeColumnExpand).toHaveBeenCalledWith([3, 4], [], true, void 0, void 0, void 0);
      expect(afterColumnExpand).toHaveBeenCalledWith([3, 4], [], true, true, void 0, void 0);

      plugin.toggleCollapsibleSection([{ row: -2, col: 1 }], 'expand'); // header "B1"

      expect(beforeColumnExpand).toHaveBeenCalledWith([], [], true, void 0, void 0, void 0);
      expect(afterColumnExpand).toHaveBeenCalledWith([], [], true, false, void 0, void 0);
    });
  });

  describe('hooks', () => {
    it('should set "successfullyCollapsed" argument of "afterColumnCollapse" hook as `false` after trying collapsing already collapsed column', () => {
      const afterColumnCollapse = jasmine.createSpy('afterColumnCollapse');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true,
        afterColumnCollapse,
      });

      const plugin = getPlugin('collapsibleColumns');

      plugin.collapseSection({ row: -2, col: 1 });

      expect(afterColumnCollapse).toHaveBeenCalledWith([], [4, 3], true, true, void 0, void 0);

      plugin.collapseSection({ row: -2, col: 1 });

      expect(afterColumnCollapse).toHaveBeenCalledWith([3, 4], [3, 4], true, false, void 0, void 0);
    });

    it('should set "successfullyExpanded" argument of "afterColumnExpand" hook as `false` after trying expanding already expanded column', () => {
      const afterColumnExpand = jasmine.createSpy('afterColumnExpand');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true,
        afterColumnExpand,
      });

      const plugin = getPlugin('collapsibleColumns');

      plugin.collapseAll();

      plugin.expandSection({ row: -2, col: 1 }); // header "B1"

      expect(afterColumnExpand).toHaveBeenCalledWith([2, 3, 4], [2], true, true, void 0, void 0);

      plugin.expandSection({ row: -2, col: 1 }); // header "B1"

      expect(afterColumnExpand).toHaveBeenCalledWith([2], [2], true, false, void 0, void 0);
    });

    it('should set "successfullyCollapsed" and "collapsePossible" arguments in hooks as `false` when trying colapse headers ' +
       'without "collapsible" attribute', () => {
      const beforeColumnCollapse = jasmine.createSpy('beforeColumnCollapse');
      const afterColumnCollapse = jasmine.createSpy('afterColumnCollapse');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ],
        collapsibleColumns: [
          { row: -4, col: 1, collapsible: true },
          { row: -3, col: 1, collapsible: true },
          { row: -2, col: 1, collapsible: true },
          { row: -2, col: 3, collapsible: true }
        ],
        beforeColumnCollapse,
        afterColumnCollapse,
      });

      const plugin = getPlugin('collapsibleColumns');

      plugin.collapseSection({ row: -1, col: 1 });

      expect(beforeColumnCollapse).toHaveBeenCalledWith([], [], false, void 0, void 0, void 0);
      expect(afterColumnCollapse).toHaveBeenCalledWith([], [], false, false, void 0, void 0);
    });

    it('should set "successfullyExpanded" and "expandPossible" arguments in hooks as `false` when trying expand headers ' +
       'without "collapsible" attribute', () => {
      const beforeColumnExpand = jasmine.createSpy('beforeColumnExpand');
      const afterColumnExpand = jasmine.createSpy('afterColumnExpand');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ],
        collapsibleColumns: [
          { row: -3, col: 1, collapsible: true },
          { row: -2, col: 1, collapsible: true },
          { row: -2, col: 3, collapsible: true }
        ],
        beforeColumnExpand,
        afterColumnExpand,
      });

      const plugin = getPlugin('collapsibleColumns');

      plugin.collapseAll();

      plugin.expandSection({ row: -4, col: 1 }); // header "B"

      expect(beforeColumnExpand).toHaveBeenCalledWith([2, 3, 4], [2, 3, 4], false, void 0, void 0, void 0);
      expect(afterColumnExpand).toHaveBeenCalledWith([2, 3, 4], [2, 3, 4], false, false, void 0, void 0);
    });

    it('should not trigger "afterColumnCollapse" hook when "beforeColumnCollapse" returns `false`', () => {
      const afterColumnCollapse = jasmine.createSpy('afterColumnCollapse');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true,
        beforeColumnCollapse: () => false,
        afterColumnCollapse,
      });

      const plugin = getPlugin('collapsibleColumns');

      plugin.collapseSection({ row: -1, col: 1 }); // header "B2"
      plugin.collapseSection({ row: -1, col: 3 }); // header "D2"
      plugin.collapseSection({ row: -2, col: 1 }); // header "B1"

      expect(afterColumnCollapse).not.toHaveBeenCalled();
      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">D2</th>
            <th class="hiddenHeader"></th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
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

    it('should not trigger "afterColumnExpand" hook when "beforeColumnExpand" returns `false`', () => {
      const afterColumnExpand = jasmine.createSpy('afterColumnExpand');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true,
        beforeColumnExpand: () => false,
        afterColumnExpand,
      });

      const plugin = getPlugin('collapsibleColumns');

      plugin.collapseAll();

      plugin.expandSection({ row: -2, col: 1 }); // header "B1"

      expect(afterColumnExpand).not.toHaveBeenCalled();
      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator collapsed">B1</th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator collapsed">B2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="afterHiddenColumn">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });

    it('should block specified column from collapsing using custom logic from the "beforeColumnCollapse" hook', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true,
        beforeColumnCollapse: (currentCollapsedColumns, destinationCollapsedColumns) => {
          if (destinationCollapsedColumns.includes(2)) {
            return false;
          }
        },
      });

      const plugin = getPlugin('collapsibleColumns');

      plugin.collapseSection({ row: -2, col: 1 });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator collapsed" colspan="2">B1</th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="afterHiddenColumn">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);

      // This call will be blocked by hook.
      plugin.collapseSection({ row: -1, col: 1 });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator collapsed" colspan="2">B1</th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="afterHiddenColumn">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });

    it('should block specified column from expanding using custom logic from the "beforeColumnExpand" hook', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 2 }, { label: 'D1', colspan: 2 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true,
        beforeColumnExpand: (currentExpandedColumns, destinationExpandedColumns) => {
          if (currentExpandedColumns.includes(4) && destinationExpandedColumns.length === 0) {
            return false;
          }
        },
      });

      const plugin = getPlugin('collapsibleColumns');

      plugin.collapseAll();
      plugin.expandSection({ row: -2, col: 1 }); // header "B1"

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="2">B1</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator collapsed">D1</th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator collapsed">D2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="afterHiddenColumn">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);

      // This call will be blocked by hook.
      plugin.expandSection({ row: -2, col: 3 }); // header "D1"

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="2">B1</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator collapsed">D1</th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator collapsed">D2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="afterHiddenColumn">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });
  });
});
