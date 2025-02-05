describe('CollapsibleColumns', () => {
  beforeEach(function() {
    // Matchers configuration.
    this.matchersConfig = {
      toMatchHTML: {
        keepAttributes: ['class', 'colspan']
      }
    };
  });

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

  function generateComplexSetup(rows, cols, generateNestedHeaders = false) {
    const data = [];

    for (let i = 0; i < rows; i++) {
      let labelCursor = 0;

      for (let j = 0; j < cols; j++) {
        if (!data[i]) {
          data[i] = [];
        }

        const columnLabel = Handsontable.helper.spreadsheetColumnLabel(labelCursor);

        if (!generateNestedHeaders) {
          data[i][j] = `${columnLabel}${i + 1}`;
          labelCursor += 1;
          /* eslint-disable no-continue */
          continue;
        }

        if (i === 0 && j % 2 !== 0) {
          data[i][j] = {
            label: `${columnLabel}${i + 1}`,
            colspan: 8
          };
        } else if (i === 1 && (j % 3 === 1 || j % 3 === 2)) {
          data[i][j] = {
            label: `${columnLabel}${i + 1}`,
            colspan: 4
          };
        } else if (i === 2 && (j % 5 === 1 || j % 5 === 2 || j % 5 === 3 || j % 5 === 4)) {
          data[i][j] = {
            label: `${columnLabel}${i + 1}`,
            colspan: 2
          };
        } else {
          data[i][j] = `${columnLabel}${i + 1}`;
        }

        labelCursor += data[i][j].colspan ?? 1;
      }
    }

    return data;
  }

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
    if (this.$wrapper) {
      this.$wrapper.remove();
    }
  });

  describe('initialization', () => {
    it('should be possible to disable the plugin using the disablePlugin method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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

    it('should be possible to re-enable the plugin using the enablePlugin method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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

    it('should be possible to enable the plugin using the updateSettings method (enable all nested headers)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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

    it('should be possible to enable the plugin using the updateSettings method (selective configuration)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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

    it('should be possible to disable the plugin using the updateSettings method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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

    it('should be possible to update the plugin settings using the updateSettings method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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

    it('should ignore creating collapsible headers when they are belongs to the start overlay', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', { label: 'I1', colspan: 2 }],
          ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true,
        fixedColumnsStart: 2,
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="hiddenHeaderText" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="collapsibleIndicator expanded" colspan="2">I1</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="hiddenHeaderText" colspan="2">B2</th>
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

    it('should make collapsible headers only when they have colspan greater than 0', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 6),
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }],
          ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }],
        ],
        collapsibleColumns: [
          { row: -2, col: 0, collapsible: true }, // A1
          { row: -2, col: 1, collapsible: true }, // B1
          { row: -1, col: 0, collapsible: true }, // A2
          { row: -1, col: 1, collapsible: true }, // B2
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
            <th class=""></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">D2</th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
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
        `);
    });
  });

  describe('collapsing headers functionality', () => {
    it('should keep headers and cells consistent after collapsing single header (basic example)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">F1</td>
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
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
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

    it('should keep headers and cells consistent after collapsing multiple headers (advanced example)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 13),
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
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
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
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
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
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">J1</td>
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
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">J1</td>
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
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">J1</td>
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
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">J1</td>
            <td class="">K1</td>
          </tr>
        </tbody>
        `);
    });

    it('should keep headers and cells consistent when dataset is shorter (has less columns) than header settings', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 6),
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
            <th class="collapsibleIndicator expanded" colspan="5">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
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
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator expanded" colspan="4">B3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator expanded" colspan="2">B4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">D4</th>
            <th class="hiddenHeader"></th>
            <th class="">F4</th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">C5</th>
            <th class="">D5</th>
            <th class="">E5</th>
            <th class="">F5</th>
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
        `);

      $(getCell(-2, 3).querySelector('.collapsibleIndicator')) // header "D4"
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
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="4">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator expanded" colspan="3">B3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator expanded" colspan="2">B4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator collapsed">D4</th>
            <th class="">F4</th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">C5</th>
            <th class="">D5</th>
            <th class="">F5</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">F1</td>
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
            <th class="collapsibleIndicator collapsed" colspan="3">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator collapsed" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator expanded" colspan="3">B3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator expanded" colspan="2">B4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator collapsed">D4</th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">C5</th>
            <th class="">D5</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
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
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator collapsed" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator expanded" colspan="2">B3</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator collapsed">B4</th>
            <th class="collapsibleIndicator collapsed">D4</th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">D5</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">D1</td>
          </tr>
        </tbody>
        `);
    });

    it('should maintain the collapse functionality, when the table has been scrolled', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 90),
        nestedHeaders: generateComplexSetup(4, 70, true),
        collapsibleColumns: true,
        width: 400,
        height: 300
      });

      // Scrolling to viewport does not work precisely without delay.
      await sleep(50);

      scrollViewportTo({
        col: 37,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });
      render();

      $(getCell(-2, 37).querySelector('.collapsibleIndicator')) // header "AL3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-3, 37).querySelector('.collapsibleIndicator')) // header "AL2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-3, 41).querySelector('.collapsibleIndicator')) // header "AP2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-4, 46).querySelector('.collapsibleIndicator')) // header "AU1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="8">AC1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AK1</th>
            <th class="collapsibleIndicator expanded" colspan="3">AL1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AT1</th>
            <th class="collapsibleIndicator collapsed" colspan="4">AU1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">BC1</th>
            <th class="collapsibleIndicator expanded" colspan="8">BD1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="4">AC2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="4">AG2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AK2</th>
            <th class="collapsibleIndicator collapsed">AL2</th>
            <th class="collapsibleIndicator collapsed" colspan="2">AP2</th>
            <th class="hiddenHeader"></th>
            <th class="">AT2</th>
            <th class="collapsibleIndicator expanded" colspan="4">AU2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">BC2</th>
            <th class="collapsibleIndicator expanded" colspan="4">BD2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="2">AC3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">AE3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">AG3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">AI3</th>
            <th class="hiddenHeader"></th>
            <th class="">AK3</th>
            <th class="collapsibleIndicator collapsed">AL3</th>
            <th class="collapsibleIndicator expanded" colspan="2">AP3</th>
            <th class="hiddenHeader"></th>
            <th class="">AT3</th>
            <th class="collapsibleIndicator expanded" colspan="2">AU3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">AW3</th>
            <th class="hiddenHeader"></th>
            <th class="">BC3</th>
            <th class="collapsibleIndicator expanded" colspan="2">BD3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">BF3</th>
          </tr>
          <tr>
            <th class="">AC4</th>
            <th class="">AD4</th>
            <th class="">AE4</th>
            <th class="">AF4</th>
            <th class="">AG4</th>
            <th class="">AH4</th>
            <th class="">AI4</th>
            <th class="">AJ4</th>
            <th class="">AK4</th>
            <th class="">AL4</th>
            <th class="">AP4</th>
            <th class="">AQ4</th>
            <th class="">AT4</th>
            <th class="">AU4</th>
            <th class="">AV4</th>
            <th class="">AW4</th>
            <th class="">AX4</th>
            <th class="">BC4</th>
            <th class="">BD4</th>
            <th class="">BE4</th>
            <th class="">BF4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
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
            <td class="">AP1</td>
            <td class="">AQ1</td>
            <td class="">AT1</td>
            <td class="">AU1</td>
            <td class="">AV1</td>
            <td class="">AW1</td>
            <td class="">AX1</td>
            <td class="">BC1</td>
            <td class="">BD1</td>
            <td class="">BE1</td>
            <td class="">BF1</td>
          </tr>
        </tbody>
        `);
    });

    it('should correctly render collapsed headers after the table has been scrolled', () => {
      const $wrapper = $('<div></div>').css({
        width: 400,
        height: 200,
        overflow: 'hidden',
      });

      spec().$wrapper = spec().$container.wrap($wrapper).parent();

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 40),
        colHeaders: true,
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

      scrollViewportTo({
        row: 0,
        col: 10,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });
      render();

      $(getCell(-2, 9).querySelector('.collapsibleIndicator')) // header "J"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-2, 11).querySelector('.collapsibleIndicator')) // header "L"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      scrollViewportTo({
        row: 0,
        col: 20,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });
      render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="4">N</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
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
          </tr>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="2">N</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">P</th>
            <th class="hiddenHeader"></th>
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
          </tr>
          <tr>
            <th class="">N</th>
            <th class="">O</th>
            <th class="">P</th>
            <th class="">Q</th>
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
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">N1</td>
            <td class="">O1</td>
            <td class="">P1</td>
            <td class="">Q1</td>
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
          </tr>
        </tbody>
        `);
    });
  });

  describe('expanding headers functionality', () => {
    it('should keep headers and cells consistent after expanding single header (basic example)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
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

    it('should keep headers and cells consistent after expanding multiple headers (basic example)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
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
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">F1</td>
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
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">J1</td>
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
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">J1</td>
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
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">J1</td>
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
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
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

    it('should maintain the expand functionality, when the table has been scrolled', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 90),
        nestedHeaders: generateComplexSetup(4, 70, true),
        collapsibleColumns: true,
        width: 400,
        height: 300
      });

      // Scrolling to viewport does not work precisely without delay.
      await sleep(50);

      scrollViewportTo({
        col: 37,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });
      render();

      // collapsing
      $(getCell(-2, 37).querySelector('.collapsibleIndicator')) // header "AL3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-3, 37).querySelector('.collapsibleIndicator')) // header "AL2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-3, 41).querySelector('.collapsibleIndicator')) // header "AP2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-4, 46).querySelector('.collapsibleIndicator')) // header "AU1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      // expanding
      $(getCell(-3, 37).querySelector('.collapsibleIndicator')) // header "AL2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-2, 37).querySelector('.collapsibleIndicator')) // header "AL3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="8">AC1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AK1</th>
            <th class="collapsibleIndicator expanded" colspan="6">AL1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AT1</th>
            <th class="collapsibleIndicator collapsed" colspan="4">AU1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">BC1</th>
          </tr>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="4">AC2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="4">AG2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AK2</th>
            <th class="collapsibleIndicator expanded" colspan="4">AL2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator collapsed" colspan="2">AP2</th>
            <th class="hiddenHeader"></th>
            <th class="">AT2</th>
            <th class="collapsibleIndicator expanded" colspan="4">AU2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">BC2</th>
          </tr>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="2">AC3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">AE3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">AG3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">AI3</th>
            <th class="hiddenHeader"></th>
            <th class="">AK3</th>
            <th class="collapsibleIndicator expanded" colspan="2">AL3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">AN3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">AP3</th>
            <th class="hiddenHeader"></th>
            <th class="">AT3</th>
            <th class="collapsibleIndicator expanded" colspan="2">AU3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">AW3</th>
            <th class="hiddenHeader"></th>
            <th class="">BC3</th>
          </tr>
          <tr>
            <th class="">AC4</th>
            <th class="">AD4</th>
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
            <th class="">AT4</th>
            <th class="">AU4</th>
            <th class="">AV4</th>
            <th class="">AW4</th>
            <th class="">AX4</th>
            <th class="">BC4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
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
            <td class="">AT1</td>
            <td class="">AU1</td>
            <td class="">AV1</td>
            <td class="">AW1</td>
            <td class="">AX1</td>
            <td class="">BC1</td>
          </tr>
        </tbody>
        `);
    });
  });

  describe('collapsible button', () => {
    using('configuration object', [
      { htmlDir: 'ltr', layoutDirection: 'inherit' },
      { htmlDir: 'rtl', layoutDirection: 'ltr' },
    ], ({ htmlDir, layoutDirection }) => {
      beforeEach(() => {
        $('html').attr('dir', htmlDir);
      });

      afterEach(() => {
        $('html').attr('dir', 'ltr');
      });

      it.forTheme('classic')('should be placed in correct place', () => {
        handsontable({
          layoutDirection,
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          nestedHeaders: [
            ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
            ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
          ],
          collapsibleColumns: true
        });

        expect(window.getComputedStyle(getCell(-1, 3).querySelector('.collapsibleIndicator'))
          .getPropertyValue('right')).toEqual('5px');
      });

      it.forTheme('main')('should be placed in correct place', () => {
        handsontable({
          layoutDirection,
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          nestedHeaders: [
            ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
            ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
          ],
          collapsibleColumns: true
        });

        const indicatorComputedStyle = window.getComputedStyle(getCell(-1, 3).querySelector('.collapsibleIndicator'));

        expect(indicatorComputedStyle.marginInlineStart).toEqual('4px');
        expect(indicatorComputedStyle.position).toEqual('relative');
        expect(indicatorComputedStyle.float).toEqual('right');
      });
    });

    it('should call "toggleCollapsibleSection" internally with correct toggle state ' +
       '(depends if the clicked header is already collapsed or not)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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

  describe('integration', () => {
    describe('columnSorting', () => {
      it('should collapse all columns', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(1, 4),
          colHeaders: true,
          nestedHeaders: [
            ['A', { label: 'B', colspan: 2 }, 'C'],
            ['N', 'O', 'P', 'Q']
          ],
          collapsibleColumns: true,
          columnSorting: true,
        });

        getPlugin('collapsibleColumns').collapseAll();

        expect(countVisibleCols()).toBe(3);
        expect(getCell(-1, 2)).toBeNull();
      });
    });
  });

  it('should not throw an error for configuration with columns beyond the table boundaries', () => {
    expect(() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'],
        ],
        collapsibleColumns: [
          { row: -2, col: 1, collapsible: true },
          { row: -1, col: 1, collapsible: true },
          { row: -3, col: 1, collapsible: true },
        ],
      });
    }).not.toThrow();
  });
});
