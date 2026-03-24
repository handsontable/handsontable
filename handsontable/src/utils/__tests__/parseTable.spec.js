describe('parseTable', () => {
  function getMatchesMethod(elem) {
    let result = 'matches';

    if (elem.msMatchesSelector) {
      result = 'msMatchesSelector';
    }

    return result;
  }

  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      this.$container.remove();
    }
  });

  /**
   * Unfortunately, jsDOM in unit tests doesn't support properly creating StyleSheet's CSSRules.
   * We have to verify it's working as expected in a browser environment.
   */
  describe('matchesCSSRules', () => {
    it('should verify only STYLE_RULE type rules', async() => {
      const styleElem = $('<style/>').html('@page {} div {} * {} .test {}').appendTo(spec().$container);
      const testElem = $('<div/>').addClass('test').appendTo(spec().$container)[0];
      const { cssRules } = styleElem[0].sheet;
      const matchesMethod = getMatchesMethod(testElem);

      expect(cssRules.length).toBe(4);
      spyOn(testElem, matchesMethod);

      Handsontable.dom.matchesCSSRules(testElem, cssRules[0]);
      Handsontable.dom.matchesCSSRules(testElem, cssRules[1]);
      Handsontable.dom.matchesCSSRules(testElem, cssRules[2]);
      Handsontable.dom.matchesCSSRules(testElem, cssRules[3]);

      expect(testElem[matchesMethod]).toHaveBeenCalledTimes(3);
    });
  });

  describe('htmlToGridSettings', () => {
    it('should parse a simple HTML table', async() => {
      const html = '<table><tbody><tr><td>A1</td><td>B1</td></tr><tr><td>A2</td><td>B2</td></tr></tbody></table>';
      const result = Handsontable.helper.htmlToGridSettings(html);

      expect(result.data).toEqual([
        ['A1', 'B1'],
        ['A2', 'B2']
      ]);
    });

    it('should parse HTML table with column headers', async() => {
      const html = '<table><thead><tr><th>Col A</th><th>Col B</th></tr></thead>' +
        '<tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>';
      const result = Handsontable.helper.htmlToGridSettings(html);

      expect(result.colHeaders).toEqual(['Col A', 'Col B']);
      expect(result.data).toEqual([['A1', 'B1']]);
    });

    it('should handle large datasets without stack overflow (issue #11784)', async() => {
      // Create a large HTML table with many rows to test the fix for the stack overflow issue
      const rowCount = 50000;
      let html = '<table><tbody>';

      for (let i = 0; i < rowCount; i++) {
        html += `<tr><td>Cell${i}-A</td><td>Cell${i}-B</td><td>Cell${i}-C</td></tr>`;
      }
      html += '</tbody></table>';

      // This should not throw "Maximum call stack size exceeded"
      const result = Handsontable.helper.htmlToGridSettings(html);

      expect(result.data.length).toBe(rowCount);
      expect(result.data[0]).toEqual(['Cell0-A', 'Cell0-B', 'Cell0-C']);
      expect(result.data[rowCount - 1]).toEqual([
        `Cell${rowCount - 1}-A`,
        `Cell${rowCount - 1}-B`,
        `Cell${rowCount - 1}-C`
      ]);
    });

    it('should handle very large datasets with multiple tbody sections', async() => {
      // Test with multiple tbody sections to ensure all are processed correctly
      const rowsPerSection = 25000;
      let html = '<table>';

      for (let section = 0; section < 2; section++) {
        html += '<tbody>';

        for (let i = 0; i < rowsPerSection; i++) {
          const rowNum = (section * rowsPerSection) + i;

          html += `<tr><td>S${section}R${rowNum}</td></tr>`;
        }
        html += '</tbody>';
      }
      html += '</table>';

      const result = Handsontable.helper.htmlToGridSettings(html);

      expect(result.data.length).toBe(rowsPerSection * 2);
      expect(result.data[0][0]).toBe('S0R0');
      expect(result.data[rowsPerSection][0]).toBe(`S1R${rowsPerSection}`);
    });

    it('should handle table with thead, tbody, and tfoot', async() => {
      const html = `
        <table>
          <thead><tr><th>Header</th></tr></thead>
          <tbody><tr><td>Body</td></tr></tbody>
          <tfoot><tr><td>Footer</td></tr></tfoot>
        </table>
      `;
      const result = Handsontable.helper.htmlToGridSettings(html);

      expect(result.colHeaders).toEqual(['Header']);
      expect(result.data.length).toBe(2);
      expect(result.data[0][0]).toBe('Body');
      expect(result.data[1][0]).toBe('Footer');
      expect(result.fixedRowsBottom).toBe(1);
    });
  });
});
