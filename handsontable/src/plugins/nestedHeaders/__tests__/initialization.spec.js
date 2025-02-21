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

  describe('initialization', () => {
    it('should be possible to initialize the plugin with minimal setup', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
      });

      hot.updateSettings({
        nestedHeaders: [[]],
      });

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
            <th class=""></th>
            <th class=""></th>
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
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });

    it('should be possible to disable the plugin using the disablePlugin method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 3 }, 'E1', 'F1', 'G1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2']
        ],
      });

      const plugin = hot.getPlugin('nestedHeaders');

      plugin.disablePlugin();
      hot.render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="">B</th>
            <th class="">C</th>
            <th class="">D</th>
            <th class="">E</th>
            <th class="">F</th>
            <th class="">G</th>
            <th class="">H</th>
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

    it('should be possible to re-enable the plugin using the enablePlugin method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 3 }, 'E1', 'F1', 'G1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2']
        ],
      });

      const plugin = hot.getPlugin('nestedHeaders');

      plugin.disablePlugin();
      hot.render();
      plugin.enablePlugin();
      hot.render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="3">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E1</th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
            <th class="">C2</th>
            <th class="">D2</th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class=""></th>
            <th class=""></th>
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
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });

    it('should be possible to initialize the plugin using the updateSettings method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
      });

      hot.updateSettings({
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 3 }, 'E1', 'F1', 'G1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2']
        ],
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="3">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E1</th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
            <th class="">C2</th>
            <th class="">D2</th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class=""></th>
            <th class=""></th>
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
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });

    it('should be possible to disable the plugin using updateSettings method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 3 }, 'E1', 'F1', 'G1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2']
        ],
      });

      hot.updateSettings({
        nestedHeaders: false,
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="">B</th>
            <th class="">C</th>
            <th class="">D</th>
            <th class="">E</th>
            <th class="">F</th>
            <th class="">G</th>
            <th class="">H</th>
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

    it('should be possible to update the plugin settings using the updateSettings method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 3 }, 'E1', 'F1', 'G1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2']
        ],
      });

      hot.updateSettings({
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 3 }, 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 2 }, 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
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
            <th class="" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">B3</th>
            <th class="" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="">E3</th>
            <th class="">F3</th>
            <th class="">G3</th>
            <th class="">H3</th>
            <th class="">I3</th>
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

    it('should warn the developer when the settings contains overlaping headers', () => {
      const warnSpy = spyOn(console, 'warn');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        colHeaders: true,
        nestedHeaders: [
          ['a', { label: 'b', colspan: 2 }, 'c'],
          ['a', { label: 'b', colspan: 3 }, 'c']
        ],
      });

      expect(warnSpy).toHaveBeenCalledWith('Your Nested Headers plugin setup contains overlapping headers. ' +
                                           'This kind of configuration is currently not supported.');
      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
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
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
          </tr>
        </tbody>
        `);
      expect(extractDOMStructure(getMaster(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
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
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
          </tr>
        </tbody>
        `);
    });

    it('should warn the developer when the settings are invalid', () => {
      const warnSpy = spyOn(console, 'warn');
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
      });

      hot.updateSettings({
        nestedHeaders: true,
      });

      /* eslint-disable quotes */
      const expectedWarn = `Your Nested Headers plugin configuration is invalid. The ` +
                           `settings has to be passed as an array of arrays e.q. ` +
                           `[['A1', { label: 'A2', colspan: 2 }]]`;
      /* eslint-enable quotes */

      expect(warnSpy).toHaveBeenCalledWith(expectedWarn);
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
            <th class=""></th>
            <th class=""></th>
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
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);

      hot.updateSettings({
        nestedHeaders: [],
      });

      expect(warnSpy).toHaveBeenCalledWith(expectedWarn);
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
            <th class=""></th>
            <th class=""></th>
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
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);

      hot.updateSettings({
        nestedHeaders: {},
      });

      expect(warnSpy).toHaveBeenCalledWith(expectedWarn);
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
            <th class=""></th>
            <th class=""></th>
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
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);

      hot.updateSettings({
        nestedHeaders: '',
      });

      expect(warnSpy).toHaveBeenCalledWith(expectedWarn);
      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="">B</th>
            <th class="">C</th>
            <th class="">D</th>
            <th class="">E</th>
            <th class="">F</th>
            <th class="">G</th>
            <th class="">H</th>
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
  });
});
