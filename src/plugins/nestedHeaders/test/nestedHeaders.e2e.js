describe('NestedHeaders', () => {
  const id = 'testContainer';

  function extractDOMStructure(element) {
    const clone = (element instanceof jQuery ? element[0] : element).cloneNode(true);

    Array.from(clone.querySelectorAll('th')).forEach((TH) => {
      // Remove header content
      TH.firstElementChild.parentNode.removeChild(TH.firstElementChild);
      TH.removeAttribute('style');
    });

    return clone.outerHTML;
  }

  /**
   * @param hot
   * @param row
   */
  function nonHiddenTHs(hot, row) {
    const headerRows = hot.view.wt.wtTable.THEAD.querySelectorAll('tr');

    return headerRows[row].querySelectorAll('th:not(.hiddenHeader)');
  }

  /**
   * @param rows
   * @param cols
   * @param obj
   */
  function generateComplexSetup(rows, cols, obj) {
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
  }

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('initialization', () => {
    it('should be possible to disable the plugin using the disablePlugin method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', { label: 'b', colspan: 3 }, 'c', 'd'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g']
        ]
      });

      const plugin = hot.getPlugin('nestedHeaders');

      expect(extractDOMStructure(getTopClone().find('thead'))).toMatchHTML(`
        <thead>
          <tr>
            <th class=""></th>
            <th class="" colspan="3"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
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
        `);

      plugin.disablePlugin();
      hot.render();

      expect(extractDOMStructure(getTopClone().find('thead'))).toMatchHTML(`
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
        `);
    });

    it('should be possible to re-enable the plugin using the enablePlugin method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', { label: 'b', colspan: 3 }, 'c', 'd'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g']
        ]
      });

      const plugin = hot.getPlugin('nestedHeaders');

      plugin.disablePlugin();
      hot.render();
      plugin.enablePlugin();
      hot.render();

      expect(extractDOMStructure(getTopClone().find('thead'))).toMatchHTML(`
        <thead>
          <tr>
            <th class=""></th>
            <th class="" colspan="3"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
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
        `);
    });

    it('should be possible to initialize the plugin using the updateSettings method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true
      });

      hot.updateSettings({
        nestedHeaders: [
          ['a', { label: 'b', colspan: 3 }, 'c', 'd'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g']
        ]
      });

      expect(extractDOMStructure(getTopClone().find('thead'))).toMatchHTML(`
        <thead>
          <tr>
            <th class=""></th>
            <th class="" colspan="3"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
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
        `);
    });

    it('should warn the developer when the settings contains overlaping headers', () => {
      console.warn = jasmine.createSpy('warn'); // eslint-disable-line no-console

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        colHeaders: true,
        nestedHeaders: [
          ['a', { label: 'b', colspan: 2 }, 'c'],
          ['a', { label: 'b', colspan: 3 }, 'c']
        ],
      });

      expect(console.warn).toHaveBeenCalledWith('Your Nested Headers plugin setup contains overlapping headers. This kind of configuration is currently not supported.'); // eslint-disable-line no-console
      expect(extractDOMStructure(getTopClone().find('thead'))).toMatchHTML(`
        <thead></thead>
        `);
      expect(extractDOMStructure(getMaster().find('thead'))).toMatchHTML(`
        <thead></thead>
        `);
    });
  });

  describe('Basic functionality:', () => {
    it('should add as many header levels as the \'colHeaders\' property suggests', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', 'b', 'c', 'd'],
          ['a', 'b', 'c', 'd']
        ]
      });

      expect(hot.view.wt.wtTable.THEAD.querySelectorAll('tr').length).toEqual(2);
    });

    it('should adjust headers widths', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', { label: 'b', colspan: 2 }, 'c', 'd'],
          ['a', 'Long column header', 'c', 'd']
        ]
      });

      const headers = hot.view.wt.wtTable.THEAD.querySelectorAll('tr:first-of-type th');

      expect(hot.getColWidth(1)).toBeGreaterThan(50);
      expect(headers[1].offsetWidth).toBeGreaterThan(100);
    });
  });

  describe('The \'colspan\' property', () => {
    it('should create nested headers, when using the \'colspan\' property', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', { label: 'b', colspan: 2 }, 'c', 'd'],
          ['a', 'b', 'c', 'd', 'e']
        ]
      });

      const headerRows = hot.view.wt.wtTable.THEAD.querySelectorAll('tr');

      expect(headerRows[0].querySelector('th:nth-child(1)').getAttribute('colspan')).toEqual(null);
      expect(headerRows[0].querySelector('th:nth-child(2)').getAttribute('colspan')).toEqual('2');
      expect(headerRows[0].querySelector('th:nth-child(3)').getAttribute('colspan')).toEqual(null);

      expect(headerRows[1].querySelector('th:nth-child(1)').getAttribute('colspan')).toEqual(null);
      expect(headerRows[1].querySelector('th:nth-child(2)').getAttribute('colspan')).toEqual(null);
      expect(headerRows[1].querySelector('th:nth-child(3)').getAttribute('colspan')).toEqual(null);

    });

    it('should allow creating a more complex nested setup when fixedColumnsLeft option is enabled', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        fixedColumnsLeft: 2,
        nestedHeaders: [
          ['a', { label: 'b', colspan: 4 }, 'c', 'd'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e']
        ]
      });

      expect(extractDOMStructure(getTopLeftClone().find('thead'))).toMatchHTML(`
        <thead>
          <tr>
            <th class=""></th>
            <th class="" colspan="1"></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="" colspan="1"></th>
          </tr>
        </thead>
        `);

      updateSettings({ fixedColumnsLeft: 3 });

      expect(extractDOMStructure(getTopLeftClone().find('thead'))).toMatchHTML(`
        <thead>
          <tr>
            <th class=""></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
          </tr>
        </thead>
        `);

      updateSettings({ fixedColumnsLeft: 6 });

      expect(extractDOMStructure(getTopLeftClone().find('thead'))).toMatchHTML(`
        <thead>
          <tr>
            <th class=""></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th
          </tr>
        </thead>
        `);
    });

    it('should return a relevant nested header element in hot.getCell()', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 90),
        colHeaders: true,
        nestedHeaders: generateComplexSetup(4, 70, true),
        width: 400,
        height: 300,
        viewportColumnRenderingOffset: 15
      });

      const allTHs = function allTHs(row) {
        const headerRows = hot.view.wt.wtTable.THEAD.querySelectorAll('tr');
        return headerRows[row].querySelectorAll('th');
      };
      const levels = [nonHiddenTHs(hot, 0), nonHiddenTHs(hot, 1), nonHiddenTHs(hot, 2), nonHiddenTHs(hot, 3)];

      expect(levels[0][0]).toEqual(getCell(-4, 0));
      expect(levels[0][1]).toEqual(getCell(-4, 1));
      expect(allTHs(0)[2]).toEqual(getCell(-4, 2));
      expect(allTHs(0)[3]).toEqual(getCell(-4, 3));
      expect(levels[0][2]).toEqual(getCell(-4, 9));
      expect(levels[0][3]).toEqual(getCell(-4, 10));
      expect(levels[0][4]).toEqual(getCell(-4, 18));
      expect(levels[0][5]).toEqual(getCell(-4, 19));

      expect(levels[1][0]).toEqual(getCell(-3, 0));
      expect(levels[1][1]).toEqual(getCell(-3, 1));
      expect(levels[1][2]).toEqual(getCell(-3, 5));
      expect(levels[1][3]).toEqual(getCell(-3, 9));

      expect(levels[2][0]).toEqual(getCell(-2, 0));
      expect(levels[2][1]).toEqual(getCell(-2, 1));
      expect(levels[2][2]).toEqual(getCell(-2, 3));
      expect(levels[2][3]).toEqual(getCell(-2, 5));

      expect(levels[3][0]).toEqual(getCell(-1, 0));
      expect(levels[3][1]).toEqual(getCell(-1, 1));
      expect(levels[3][2]).toEqual(getCell(-1, 2));
      expect(levels[3][3]).toEqual(getCell(-1, 3));
    });

    it('should render the setup properly after the table being scrolled', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 90),
        colHeaders: true,
        nestedHeaders: generateComplexSetup(4, 70, true),
        width: 400,
        height: 300,
        viewportColumnRenderingOffset: 15
      });

      // not scrolled
      expect(extractDOMStructure(getTopClone().find('thead'))).toMatchHTML(`
        <thead>
          <tr>
            <th class=""></th>
            <th class="" colspan="8"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class="" colspan="8"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class="" colspan="8"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
          </tr>
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
        </thead>
        `);

      hot.scrollViewportTo(void 0, 40);
      hot.render();

      // scrolled
      expect(extractDOMStructure(getTopClone().find('thead'))).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="8"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class="" colspan="8"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class="" colspan="8"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class="" colspan="8"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class="" colspan="8"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
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
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
        </thead>
        `);
    });
  });

  describe('Selection:', () => {
    it('should generate class names based on "currentHeaderClassName" and "activeHeaderClassName" settings', function() {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        currentHeaderClassName: 'my-current-header',
        activeHeaderClassName: 'my-active-header',
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)')
        .simulate('mousedown')
        .simulate('mouseup');

      expect(extractDOMStructure(getTopClone().find('thead'))).toMatchHTML(`
        <thead>
          <tr>
            <th class=""></th>
            <th class="" colspan="8"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="my-active-header my-current-header" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="my-active-header my-current-header"></th>
            <th class="my-active-header my-current-header"></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
        </thead>
        `);
    });

    it('should select every column under the extended header', function() {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)')
        .simulate('mousedown')
        .simulate('mouseup');

      expect(extractDOMStructure(getTopClone().find('thead'))).toMatchHTML(`
        <thead>
          <tr>
            <th class=""></th>
            <th class="" colspan="8"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="ht__active_highlight ht__highlight" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="ht__active_highlight ht__highlight"></th>
            <th class="ht__active_highlight ht__highlight"></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
        </thead>
        `);

      expect(hot.getSelected()).toEqual([[0, 1, hot.countRows() - 1, 2]]);

      this.$container.find('.ht_clone_top thead tr:eq(1) th:eq(1)')
        .simulate('mousedown')
        .simulate('mouseup');

      expect(extractDOMStructure(getTopClone().find('thead'))).toMatchHTML(`
        <thead>
          <tr>
            <th class=""></th>
            <th class="" colspan="8"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="ht__active_highlight ht__highlight" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="ht__active_highlight ht__highlight" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="ht__active_highlight ht__highlight" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="ht__active_highlight ht__highlight"></th>
            <th class="ht__active_highlight ht__highlight"></th>
            <th class="ht__active_highlight ht__highlight"></th>
            <th class="ht__active_highlight ht__highlight"></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
        </thead>
        `);

      expect(hot.getSelected()).toEqual([[0, 1, hot.countRows() - 1, 4]]);

      this.$container.find('.ht_clone_top thead tr:eq(0) th:eq(1)')
        .simulate('mousedown')
        .simulate('mouseup');

      expect(extractDOMStructure(getTopClone().find('thead'))).toMatchHTML(`
        <thead>
          <tr>
            <th class=""></th>
            <th class="ht__highlight ht__active_highlight" colspan="8"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="ht__active_highlight ht__highlight" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="ht__active_highlight ht__highlight" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="ht__active_highlight ht__highlight" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="ht__active_highlight ht__highlight" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="ht__active_highlight ht__highlight" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="ht__active_highlight ht__highlight" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="ht__active_highlight ht__highlight"></th>
            <th class="ht__active_highlight ht__highlight"></th>
            <th class="ht__active_highlight ht__highlight"></th>
            <th class="ht__active_highlight ht__highlight"></th>
            <th class="ht__active_highlight ht__highlight"></th>
            <th class="ht__active_highlight ht__highlight"></th>
            <th class="ht__active_highlight ht__highlight"></th>
            <th class="ht__active_highlight ht__highlight"></th>
            <th class=""></th>
          </tr>
        </thead>
        `);

      expect(hot.getSelected()).toEqual([[0, 1, hot.countRows() - 1, 8]]);
    });

    it('should select every column under the extended headers, when changing the selection by dragging the cursor', function() {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(3)')
        .simulate('mousedown');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(5)')
        .simulate('mouseover')
        .simulate('mouseup');

      expect(hot.getSelected()).toEqual([[0, 3, hot.countRows() - 1, 6]]);

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(3)')
        .simulate('mousedown');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)')
        .simulate('mouseover')
        .simulate('mouseup');

      expect(hot.getSelected()).toEqual([[0, 4, hot.countRows() - 1, 1]]);

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(3)').simulate('mousedown');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)').simulate('mouseover');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(3)').simulate('mouseover');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(5)').simulate('mouseover');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(5)').simulate('mouseup');

      expect(hot.getSelected()).toEqual([[0, 3, hot.countRows() - 1, 6]]);
    });

    it('should highlight only last line of headers on cell selection', function() {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      this.$container.find('.ht_master tbody tr:eq(2) td:eq(1)')
        .simulate('mousedown')
        .simulate('mouseup');

      expect(extractDOMStructure(getTopClone().find('thead'))).toMatchHTML(`
        <thead>
          <tr>
            <th class=""></th>
            <th class="" colspan="8"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="ht__highlight"></th>
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
        `);
    });

    it('should highlight colspaned header on cell selection even when the selection doesn\'t cover the whole header', function() {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'A1', colspan: 4 }, 'A2'],
          [{ label: 'B1', colspan: 3 }, 'B2'],
          [{ label: 'C1', colspan: 2 }, 'C2', 'C3'],
        ]
      });

      this.$container.find('.ht_master tbody tr:eq(2) td:eq(1)')
        .simulate('mousedown')
        .simulate('mouseup');

      expect(extractDOMStructure(getTopClone().find('thead'))).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class="" colspan="3"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class="ht__highlight" colspan="2"></th>
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
        </thead>
        `);
    });

    it('should highlight every header which was in selection on headers selection', function() {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)')
        .simulate('mousedown')
        .simulate('mouseup');

      expect(extractDOMStructure(getTopClone().find('thead'))).toMatchHTML(`
        <thead>
          <tr>
            <th class=""></th>
            <th class="" colspan="8"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="ht__active_highlight ht__highlight" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2"></th>
            <th class="hiddenHeader"></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class=""></th>
            <th class="ht__active_highlight ht__highlight"></th>
            <th class="ht__active_highlight ht__highlight"></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
        </thead>
        `);
    });

    it('should add selection borders in the expected positions, when selecting multi-columned headers', function() {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)')
        .simulate('mousedown')
        .simulate('mouseup');

      const $headerLvl3 = this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)');
      const $firstRow = this.$container.find('.ht_master tbody tr:eq(0)');
      const $lastRow = this.$container.find('.ht_master tbody tr:eq(3)');
      const $tbody = this.$container.find('.ht_master tbody');

      const $topBorder = this.$container.find('.wtBorder.area').eq(0);
      const $bottomBorder = this.$container.find('.wtBorder.area').eq(2);
      const $leftBorder = this.$container.find('.wtBorder.area').eq(1);
      const $rightBorder = this.$container.find('.wtBorder.area').eq(3);

      expect($topBorder.offset().top).toEqual($firstRow.offset().top - 1);
      expect($bottomBorder.offset().top).toEqual($lastRow.offset().top + $lastRow.height() - 1);
      expect($topBorder.width()).toEqual($headerLvl3.width());
      expect($bottomBorder.width()).toEqual($headerLvl3.width());

      expect($leftBorder.offset().left).toEqual($headerLvl3.offset().left);
      expect($rightBorder.offset().left).toEqual($headerLvl3.offset().left + $headerLvl3.width());
      expect($leftBorder.height()).toEqual($tbody.height());
      expect($rightBorder.height()).toEqual($tbody.height() + 1);
    });
  });
});
