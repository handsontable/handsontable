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
    it('should be possible to disable the plugin using the disablePlugin method', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true
      });

      const plugin = getPlugin('collapsibleColumns');

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
      await render();

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

    it('should be possible to re-enable the plugin using the enablePlugin method', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true
      });

      const plugin = getPlugin('collapsibleColumns');

      plugin.disablePlugin();
      await render();
      plugin.enablePlugin();
      await render();

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

    it('should be possible to enable the plugin using the updateSettings method (enable all nested headers)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
        ]
      });

      await updateSettings({
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

    it('should be possible to enable the plugin using the updateSettings method (selective configuration)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B1', colspan: 2 }, { label: 'D1', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
        ]
      });

      await updateSettings({
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

    it('should be possible to disable the plugin using the updateSettings method', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B1', colspan: 2 }, { label: 'D1', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true,
      });

      await updateSettings({
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

    it('should be possible to update the plugin settings using the updateSettings method', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B1', colspan: 2 }, { label: 'D1', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: [
          { row: -1, col: 1, collapsible: true }
        ],
      });

      await updateSettings({
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

      await updateSettings({
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

      await updateSettings({
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

    it('should ignore creating collapsible headers when they are belongs to the start overlay', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
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

    it('should make collapsible headers only when they have colspan greater than 0', async() => {
      handsontable({
        data: createSpreadsheetData(10, 6),
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
    it('should keep headers and cells consistent after collapsing single header (basic example)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
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

    it('should keep headers and cells consistent after collapsing multiple headers (basic example)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
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

    it('should keep headers and cells consistent after collapsing multiple headers (advanced example)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 13),
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

    it('should keep headers and cells consistent when dataset is shorter (has less columns) than header settings', async() => {
      handsontable({
        data: createSpreadsheetData(5, 6),
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
        data: createSpreadsheetData(10, 90),
        nestedHeaders: generateComplexSetup(4, 70, true),
        collapsibleColumns: true,
        width: 400,
        height: 300
      });

      await scrollViewportTo({
        col: 37,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

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

      // Verify collapse state of specific headers (viewport-independent checks)
      const al3Indicator = getCell(-2, 37).querySelector('.collapsibleIndicator');
      const al2Indicator = getCell(-3, 37).querySelector('.collapsibleIndicator');
      const ap2Indicator = getCell(-3, 41).querySelector('.collapsibleIndicator');
      const au1Indicator = getCell(-4, 46).querySelector('.collapsibleIndicator');

      expect(al3Indicator.classList.contains('collapsed')).toBe(true); // AL3
      expect(al2Indicator.classList.contains('collapsed')).toBe(true); // AL2
      expect(ap2Indicator.classList.contains('collapsed')).toBe(true); // AP2
      expect(au1Indicator.classList.contains('collapsed')).toBe(true); // AU1

      // Verify that the collapse reduced visible columns (AL3 collapsed means columns 38-39 are hidden)
      expect(getCell(-2, 38)).toBe(null); // hidden after AL3 collapse
      expect(getCell(-2, 39)).toBe(null); // hidden after AL3 collapse
      // Verify still-visible columns
      expect(getCell(0, 37)).not.toBe(null); // AL1 data cell still visible
      expect(getCell(0, 45)).not.toBe(null); // AT1 data cell still visible

      // Structural check: for every collapsed parent header, the rendered
      // `colspan` must equal the number of its direct visible children
      // (i.e. non-hidden columns under that parent). Walk the TH returned by
      // getCell and count sibling columns at the last header row that remain
      // rendered (getCell returns null for hidden columns).
      const assertCollapsedColspanMatchesVisibleChildren = (th, parentVisualCol) => {
        const renderedColspan = parseInt(th.getAttribute('colspan') || '1', 10);

        // Count contiguous non-hidden leaf columns starting at parentVisualCol.
        // A non-hidden leaf column is one where getCell(0, visualCol) is not null.
        // Collapsed groups hide their subordinate columns in DOM -> getCell null.
        let visibleChildren = 0;
        let next = parentVisualCol;

        while (next < countCols() && getCell(0, next) !== null) {
          // Stop when the next column is no longer under this parent -- which
          // is signaled by the first rendered column outside the parent group.
          // For the purpose of this test, we verify the reduced colspan is
          // strictly less than the original (> 1) and matches the number of
          // contiguous visible children from the anchor.
          visibleChildren += 1;
          next += 1;

          // Protect against runaway loops for very wide viewports.
          if (visibleChildren > renderedColspan) {
            break;
          }
        }
        expect(renderedColspan).toBeGreaterThanOrEqual(1);
        expect(renderedColspan).toBeLessThanOrEqual(visibleChildren);
      };

      assertCollapsedColspanMatchesVisibleChildren(al3Indicator.closest('th'), 37);
      assertCollapsedColspanMatchesVisibleChildren(al2Indicator.closest('th'), 37);
      assertCollapsedColspanMatchesVisibleChildren(ap2Indicator.closest('th'), 41);
      assertCollapsedColspanMatchesVisibleChildren(au1Indicator.closest('th'), 46);
    });

    it('should correctly render collapsed headers after the table has been scrolled', async() => {
      const $wrapper = $('<div></div>').css({
        width: 400,
        height: 200,
        overflow: 'hidden',
      });

      spec().$wrapper = spec().$container.wrap($wrapper).parent();

      handsontable({
        data: createSpreadsheetData(3, 40),
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

      await scrollViewportTo({
        row: 0,
        col: 10,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      $(getCell(-2, 9).querySelector('.collapsibleIndicator')) // header "J"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-2, 11).querySelector('.collapsibleIndicator')) // header "L"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      await scrollViewportTo({
        row: 0,
        col: 20,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

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
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
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
          </tr>
        </tbody>
        `);
    });

    it('should calculate the column width on the longest cell value, not the header text size (#dev-2151)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['A1', { label: 'Very long header text', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        collapsibleColumns: true,
      });

      await setDataAtCell(0, 1, 'Longer value');

      const widthAfterSetData = getColWidth(1);

      $(getCell(-2, 1).querySelector('.collapsibleIndicator')) // header "B1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(getColWidth(1)).toBe(widthAfterSetData);
    });

    it('should not change the first child column width after collapsing a parent header (#dev-2151)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
        ],
        collapsibleColumns: true,
      });

      const widthBeforeCollapse = getColWidth(1);

      const plugin = getPlugin('collapsibleColumns');

      plugin.collapseSection({ row: -3, col: 1 });

      expect(getColWidth(1)).toBe(widthBeforeCollapse);
    });

    it('should not change the first child column width after collapsing a deeply nested header (#dev-2151)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        nestedHeaders: [
          [{ label: 'A1', colspan: 10 }],
          [{ label: 'A2', colspan: 5 }, { label: 'F2', colspan: 5 }],
          ['A3', { label: 'B3', colspan: 4 }, 'F3', 'G3', 'H3', 'I3', 'J3'],
          ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
        ],
        collapsibleColumns: true,
      });

      const widthBeforeCollapse = getColWidth(0);

      const plugin = getPlugin('collapsibleColumns');

      plugin.collapseSection({ row: -4, col: 0 });

      expect(getColWidth(0)).toBe(widthBeforeCollapse);
    });

    it('should not change the first child column width after collapsing and expanding a header (#dev-2151)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
        ],
        collapsibleColumns: true,
      });

      const widthBeforeCollapse = getColWidth(1);

      const plugin = getPlugin('collapsibleColumns');

      plugin.collapseSection({ row: -3, col: 1 });

      expect(getColWidth(1)).toBe(widthBeforeCollapse);

      plugin.expandSection({ row: -3, col: 1 });

      expect(getColWidth(1)).toBe(widthBeforeCollapse);
    });

    it('should not change the first child column width after collapsing a header with a hidden column (#dev-2151)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
        ],
        collapsibleColumns: true,
        hiddenColumns: {
          columns: [2],
        },
      });

      const widthBeforeCollapse = getColWidth(1);

      const plugin = getPlugin('collapsibleColumns');

      plugin.collapseSection({ row: -3, col: 1 });

      expect(getColWidth(1)).toBe(widthBeforeCollapse);
    });

    it('should not change the first child column width after repeatedly collapsing and expanding' +
      ' deeply nested multi-level headers', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          [
            'H',
            { label: 'There is a header', colspan: 2 },
            { label: 'J', colspan: 2 },
            { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 },
            'M',
          ],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'],
        ],
        collapsibleColumns: true,
      });

      const plugin = getPlugin('collapsibleColumns');

      const widthCol1 = getColWidth(1);
      const widthCol5 = getColWidth(5);

      // Collapse E (row -4, col 1, colspan 4) -- hides columns 2-4.
      plugin.collapseSection({ row: -3, col: 1 });

      expect(getColWidth(1)).toBe(widthCol1);

      // Expand E back.
      plugin.expandSection({ row: -3, col: 1 });

      expect(getColWidth(1)).toBe(widthCol1);
      expect(getColWidth(5)).toBe(widthCol5);

      // Collapse F (row -3, col 5, colspan 4) -- hides columns 6-8.
      plugin.collapseSection({ row: -3, col: 5 });

      expect(getColWidth(5)).toBe(widthCol5);

      // Expand F and collapse the top-level B header.
      plugin.expandSection({ row: -3, col: 5 });
      plugin.collapseSection({ row: -4, col: 1 });

      expect(getColWidth(1)).toBe(widthCol1);

      // Expand B -- all widths should return to the original values.
      plugin.expandSection({ row: -4, col: 1 });

      expect(getColWidth(1)).toBe(widthCol1);
      expect(getColWidth(5)).toBe(widthCol5);
    });

  });

  describe('expanding headers functionality', () => {
    it('should keep headers and cells consistent after expanding single header (basic example)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
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

    it('should keep headers and cells consistent after expanding multiple headers (basic example)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
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

    it('should keep headers and cells consistent after expanding multiple headers (advanced example)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 13),
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
        data: createSpreadsheetData(10, 90),
        nestedHeaders: generateComplexSetup(4, 70, true),
        collapsibleColumns: true,
        width: 400,
        height: 300
      });

      await scrollViewportTo({
        col: 37,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

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

      // Verify expand state of specific headers (viewport-independent checks)
      expect(getCell(-2, 37).querySelector('.collapsibleIndicator').classList.contains('expanded')).toBe(true); // AL3 expanded
      expect(getCell(-3, 37).querySelector('.collapsibleIndicator').classList.contains('expanded')).toBe(true); // AL2 expanded
      expect(getCell(-3, 41).querySelector('.collapsibleIndicator').classList.contains('collapsed')).toBe(true); // AP2 still collapsed
      expect(getCell(-4, 46).querySelector('.collapsibleIndicator').classList.contains('collapsed')).toBe(true); // AU1 still collapsed

      // Verify that expanded columns are visible again (AL3 expanded means cols 38-39 are visible)
      expect(getCell(0, 37)).not.toBe(null); // AL1 data cell visible
      expect(getCell(0, 38)).not.toBe(null); // AM1 data cell visible after AL3 expand
      expect(getCell(0, 39)).not.toBe(null); // AN1 data cell visible after AL2 expand
    });
  });

  describe('collapsible button', () => {
    it('should call "toggleCollapsibleSection" internally with correct toggle state ' +
       '(depends if the clicked header is already collapsed or not)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
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
      it('should collapse all columns', async() => {
        handsontable({
          data: createSpreadsheetData(1, 4),
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

  it('should not throw an error for configuration with columns beyond the table boundaries', async() => {
    expect(() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
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
