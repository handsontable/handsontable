describe('CollapsibleColumns API', () => {
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

  describe('collapseSection()', () => {
    it('should call "toggleCollapsibleSection" internally', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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
        data: Handsontable.helper.createSpreadsheetData(10, 20),
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

    it('should collapse only headers which are renderable (trimmed by dataset)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 5), // Trimmed to 5 columns
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
        { row: -2, col: 1 },
        { row: -2, col: 3 },
      ], 'collapse');
    });

    it('should collapse only "collapsible" headers', () => {
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
          </tr>
        </tbody>
        `);
    });

    it('should collapse all headers (complicated nested headers settings)', async() => {
      const $wrapper = $('<div></div>').css({
        width: 400,
        height: 300,
        overflow: 'hidden',
      });

      spec().$wrapper = spec().$container.wrap($wrapper).parent();

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 100),
        nestedHeaders: generateComplexSetup(5, 100, true),
        collapsibleColumns: true,
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
            <th class="">S1</th>
            <th class="collapsibleIndicator collapsed">T1</th>
            <th class="">AB1</th>
            <th class="collapsibleIndicator collapsed">AC1</th>
            <th class="">AK1</th>
            <th class="collapsibleIndicator collapsed">AL1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator collapsed">B2</th>
            <th class="">J2</th>
            <th class="collapsibleIndicator collapsed">K2</th>
            <th class="">S2</th>
            <th class="collapsibleIndicator collapsed">T2</th>
            <th class="">AB2</th>
            <th class="collapsibleIndicator collapsed">AC2</th>
            <th class="">AK2</th>
            <th class="collapsibleIndicator collapsed">AL2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator collapsed">B3</th>
            <th class="">J3</th>
            <th class="collapsibleIndicator collapsed">K3</th>
            <th class="">S3</th>
            <th class="collapsibleIndicator collapsed">T3</th>
            <th class="">AB3</th>
            <th class="collapsibleIndicator collapsed">AC3</th>
            <th class="">AK3</th>
            <th class="collapsibleIndicator collapsed">AL3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
            <th class="">J4</th>
            <th class="">K4</th>
            <th class="">S4</th>
            <th class="">T4</th>
            <th class="">AB4</th>
            <th class="">AC4</th>
            <th class="">AK4</th>
            <th class="">AL4</th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="">J5</th>
            <th class="">K5</th>
            <th class="">S5</th>
            <th class="">T5</th>
            <th class="">AB5</th>
            <th class="">AC5</th>
            <th class="">AK5</th>
            <th class="">AL5</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">J1</td>
            <td class="">K1</td>
            <td class="">S1</td>
            <td class="">T1</td>
            <td class="">AB1</td>
            <td class="">AC1</td>
            <td class="">AK1</td>
            <td class="">AL1</td>
          </tr>
        </tbody>
        `);

      scrollViewportTo({
        row: 0,
        col: 63,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await sleep(20);

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="collapsibleIndicator collapsed">B1</th>
            <th class="">J1</th>
            <th class="collapsibleIndicator collapsed">K1</th>
            <th class="">S1</th>
            <th class="collapsibleIndicator collapsed">T1</th>
            <th class="">AB1</th>
            <th class="collapsibleIndicator collapsed">AC1</th>
            <th class="">AK1</th>
            <th class="collapsibleIndicator collapsed">AL1</th>
            <th class="">AT1</th>
            <th class="collapsibleIndicator collapsed">AU1</th>
            <th class="">BC1</th>
            <th class="collapsibleIndicator collapsed">BD1</th>
            <th class="">BL1</th>
            <th class="collapsibleIndicator collapsed">BM1</th>
            <th class="">BU1</th>
            <th class="collapsibleIndicator collapsed">BV1</th>
            <th class="">CD1</th>
            <th class="collapsibleIndicator collapsed">CE1</th>
            <th class="">CM1</th>
            <th class="collapsibleIndicator collapsed">CN1</th>
            <th class="">CV1</th>
          </tr>
          <tr>
            <th class="collapsibleIndicator collapsed">B2</th>
            <th class="">J2</th>
            <th class="collapsibleIndicator collapsed">K2</th>
            <th class="">S2</th>
            <th class="collapsibleIndicator collapsed">T2</th>
            <th class="">AB2</th>
            <th class="collapsibleIndicator collapsed">AC2</th>
            <th class="">AK2</th>
            <th class="collapsibleIndicator collapsed">AL2</th>
            <th class="">AT2</th>
            <th class="collapsibleIndicator collapsed">AU2</th>
            <th class="">BC2</th>
            <th class="collapsibleIndicator collapsed">BD2</th>
            <th class="">BL2</th>
            <th class="collapsibleIndicator collapsed">BM2</th>
            <th class="">BU2</th>
            <th class="collapsibleIndicator collapsed">BV2</th>
            <th class="">CD2</th>
            <th class="collapsibleIndicator collapsed">CE2</th>
            <th class="">CM2</th>
            <th class="collapsibleIndicator collapsed">CN2</th>
            <th class="">CV2</th>
          </tr>
          <tr>
            <th class="collapsibleIndicator collapsed">B3</th>
            <th class="">J3</th>
            <th class="collapsibleIndicator collapsed">K3</th>
            <th class="">S3</th>
            <th class="collapsibleIndicator collapsed">T3</th>
            <th class="">AB3</th>
            <th class="collapsibleIndicator collapsed">AC3</th>
            <th class="">AK3</th>
            <th class="collapsibleIndicator collapsed">AL3</th>
            <th class="">AT3</th>
            <th class="collapsibleIndicator collapsed">AU3</th>
            <th class="">BC3</th>
            <th class="collapsibleIndicator collapsed">BD3</th>
            <th class="">BL3</th>
            <th class="collapsibleIndicator collapsed">BM3</th>
            <th class="">BU3</th>
            <th class="collapsibleIndicator collapsed">BV3</th>
            <th class="">CD3</th>
            <th class="collapsibleIndicator collapsed">CE3</th>
            <th class="">CM3</th>
            <th class="collapsibleIndicator collapsed">CN3</th>
            <th class="">CV3</th>
          </tr>
          <tr>
            <th class="">B4</th>
            <th class="">J4</th>
            <th class="">K4</th>
            <th class="">S4</th>
            <th class="">T4</th>
            <th class="">AB4</th>
            <th class="">AC4</th>
            <th class="">AK4</th>
            <th class="">AL4</th>
            <th class="">AT4</th>
            <th class="">AU4</th>
            <th class="">BC4</th>
            <th class="">BD4</th>
            <th class="">BL4</th>
            <th class="">BM4</th>
            <th class="">BU4</th>
            <th class="">BV4</th>
            <th class="">CD4</th>
            <th class="">CE4</th>
            <th class="">CM4</th>
            <th class="">CN4</th>
            <th class="">CV4</th>
          </tr>
          <tr>
            <th class="">B5</th>
            <th class="">J5</th>
            <th class="">K5</th>
            <th class="">S5</th>
            <th class="">T5</th>
            <th class="">AB5</th>
            <th class="">AC5</th>
            <th class="">AK5</th>
            <th class="">AL5</th>
            <th class="">AT5</th>
            <th class="">AU5</th>
            <th class="">BC5</th>
            <th class="">BD5</th>
            <th class="">BL5</th>
            <th class="">BM5</th>
            <th class="">BU5</th>
            <th class="">BV5</th>
            <th class="">CD5</th>
            <th class="">CE5</th>
            <th class="">CM5</th>
            <th class="">CN5</th>
            <th class="">CV5</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">B1</td>
            <td class="">J1</td>
            <td class="">K1</td>
            <td class="">S1</td>
            <td class="">T1</td>
            <td class="">AB1</td>
            <td class="">AC1</td>
            <td class="">AK1</td>
            <td class="">AL1</td>
            <td class="">AT1</td>
            <td class="">AU1</td>
            <td class="">BC1</td>
            <td class="">BD1</td>
            <td class="">BL1</td>
            <td class="">BM1</td>
            <td class="">BU1</td>
            <td class="">BV1</td>
            <td class="">CD1</td>
            <td class="">CE1</td>
            <td class="">CM1</td>
            <td class="">CN1</td>
            <td class="">CV1</td>
          </tr>
        </tbody>
        `);
    });
  });

  describe('expandSection()', () => {
    it('should call "toggleCollapsibleSection" internally', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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
        data: Handsontable.helper.createSpreadsheetData(10, 20),
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

      expect(plugin.toggleCollapsibleSection).toHaveBeenCalledWith([], 'expand');
    });

    it('should expand all collapsed headers', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1'],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, { label: 'F3', colspan: 2 },
            { label: 'H3', colspan: 2 }, 'J3']
        ],
        collapsibleColumns: true
      });

      const plugin = getPlugin('collapsibleColumns');

      plugin.collapseAll();
      plugin.expandAll();

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
            <th class="collapsibleIndicator expanded" colspan="4">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="4">F2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator expanded" colspan="2">B3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">D3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">H3</th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
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
  });

  describe('toggleAllCollapsibleSections()', () => {
    it('should call "toggleCollapsibleSection" internally while collapsing', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 20),
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
        data: Handsontable.helper.createSpreadsheetData(10, 20),
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

      expect(plugin.toggleCollapsibleSection).toHaveBeenCalledWith([], 'expand');
    });
  });

  describe('toggleCollapsibleSection()', () => {
    it('should collapse collapsible headers', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });

    it('should expand collapsible headers', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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

    it('should not throw an error when trying collapsing header which does not have the ability to collapse', () => {
      const beforeColumnCollapse = jasmine.createSpy('beforeColumnCollapse');
      const afterColumnCollapse = jasmine.createSpy('afterColumnCollapse');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
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
      expect(beforeColumnCollapse).toHaveBeenCalledWith([], [], false);
      expect(afterColumnCollapse).toHaveBeenCalledWith([], [], false, false);

      expect(() => {
        // row out of range
        collapsibleColumnsPlugin.toggleCollapsibleSection([{ row: 0, col: 1 }], 'collapse');
      }).not.toThrow();
      expect(beforeColumnCollapse).toHaveBeenCalledWith([], [], false);
      expect(afterColumnCollapse).toHaveBeenCalledWith([], [], false, false);

      expect(() => {
        // column out of range
        collapsibleColumnsPlugin.toggleCollapsibleSection([{ row: -1, col: 200 }], 'collapse');
      }).not.toThrow();
      expect(beforeColumnCollapse).toHaveBeenCalledWith([], [], false);
      expect(afterColumnCollapse).toHaveBeenCalledWith([], [], false, false);
    });

    it('should trigger "beforeColumnCollapse" and "afterColumnCollapse" hooks', () => {
      const beforeColumnCollapse = jasmine.createSpy('beforeColumnCollapse');
      const afterColumnCollapse = jasmine.createSpy('afterColumnCollapse');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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

      expect(beforeColumnCollapse).toHaveBeenCalledWith([], [3, 4], true);
      expect(afterColumnCollapse).toHaveBeenCalledWith([], [3, 4], true, true);

      plugin.toggleCollapsibleSection([{ row: -1, col: 1 }], 'collapse'); // header "B2"

      expect(beforeColumnCollapse).toHaveBeenCalledWith([3, 4], [3, 4, 2], true);
      expect(afterColumnCollapse).toHaveBeenCalledWith([3, 4], [3, 4, 2], true, true);

      plugin.toggleCollapsibleSection([{ row: -1, col: 1 }], 'collapse'); // header "B2"

      expect(beforeColumnCollapse).toHaveBeenCalledWith([2, 3, 4], [2, 3, 4], false);
      expect(afterColumnCollapse).toHaveBeenCalledWith([2, 3, 4], [2, 3, 4], false, false);
    });

    it('should trigger "beforeColumnExpand" and "afterColumnExpand" hooks', () => {
      const beforeColumnExpand = jasmine.createSpy('beforeColumnExpand');
      const afterColumnExpand = jasmine.createSpy('afterColumnExpand');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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

      expect(beforeColumnExpand).toHaveBeenCalledWith([2, 3, 4], [3, 4], true);
      expect(afterColumnExpand).toHaveBeenCalledWith([2, 3, 4], [3, 4], true, true);

      plugin.toggleCollapsibleSection([{ row: -2, col: 1 }], 'expand'); // header "B1"

      expect(beforeColumnExpand).toHaveBeenCalledWith([3, 4], [], true);
      expect(afterColumnExpand).toHaveBeenCalledWith([3, 4], [], true, true);

      plugin.toggleCollapsibleSection([{ row: -2, col: 1 }], 'expand'); // header "B1"

      expect(beforeColumnExpand).toHaveBeenCalledWith([], [], false);
      expect(afterColumnExpand).toHaveBeenCalledWith([], [], false, false);
    });
  });
});
