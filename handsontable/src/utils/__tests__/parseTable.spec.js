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
      destroy();
      this.$container.remove();
    }
  });

  /**
   * Unfortunately, jsDOM in unit tests doesn't support properly creating StyleSheet's CSSRules.
   * We have to verify it's working as expected in a browser environment.
   */
  describe('matchesCSSRules', () => {
    it('should verify only STYLE_RULE type rules', () => {
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

  describe('instanceToHTML', () => {
    it('should convert clear instance into HTML table', () => {
      const hot = handsontable({});

      /* eslint-disable indent */
      expect(hot.toHTML()).toBe([
        '<table>',
          '<tbody>',
            '<tr><td></td><td></td><td></td><td></td><td></td></tr>',
            '<tr><td></td><td></td><td></td><td></td><td></td></tr>',
            '<tr><td></td><td></td><td></td><td></td><td></td></tr>',
            '<tr><td></td><td></td><td></td><td></td><td></td></tr>',
            '<tr><td></td><td></td><td></td><td></td><td></td></tr>',
          '</tbody>',
        '</table>',
      ].join(''));
      /* eslint-enable */
    });

    it('should convert column headers into HTML table', () => {
      const hot = handsontable({
        colHeaders: true,
        data: [
          ['A1', 'B1'],
          ['A2', 'B2'],
        ],
      });

      /* eslint-disable indent */
      expect(hot.toHTML()).toBe([
        '<table>',
          '<thead>',
            '<tr><th>A</th><th>B</th></tr>',
          '</thead>',
          '<tbody>',
            '<tr><td>A1</td><td>B1</td></tr>',
            '<tr><td>A2</td><td>B2</td></tr>',
          '</tbody>',
        '</table>',
      ].join(''));
      /* eslint-enable */
    });

    it('should convert row headers into HTML table', () => {
      const hot = handsontable({
        rowHeaders: true,
        data: [
          ['A1', 'B1'],
          ['A2', 'B2'],
        ],
      });

      /* eslint-disable indent */
      expect(hot.toHTML()).toBe([
        '<table>',
          '<tbody>',
            '<tr><th>1</th><td>A1</td><td>B1</td></tr>',
            '<tr><th>2</th><td>A2</td><td>B2</td></tr>',
          '</tbody>',
        '</table>',
      ].join(''));
      /* eslint-enable */
    });

    it('should convert column and rows headers into HTML table', () => {
      const hot = handsontable({
        colHeaders: true,
        rowHeaders: true,
        data: [
          ['A1', 'B1'],
          ['A2', 'B2'],
        ],
      });

      /* eslint-disable indent */
      expect(hot.toHTML()).toBe([
        '<table>',
          '<thead>',
            '<tr><th></th><th>A</th><th>B</th></tr>',
          '</thead>',
          '<tbody>',
            '<tr><th>1</th><td>A1</td><td>B1</td></tr>',
            '<tr><th>2</th><td>A2</td><td>B2</td></tr>',
          '</tbody>',
        '</table>',
      ].join(''));
      /* eslint-enable */
    });

    it('should convert merged cells into HTML table', () => {
      const hot = handsontable({
        colHeaders: true,
        rowHeaders: true,
        data: [
          ['A1', 'B1', 'C1'],
          ['A2', 'B2', 'C2'],
          ['A3', 'B3', 'C3'],
        ],
        mergeCells: [
          { row: 0, col: 0, colspan: 2, rowspan: 3 }
        ],
      });

      /* eslint-disable indent */
      expect(hot.toHTML()).toBe([
        '<table>',
          '<thead>',
            '<tr><th></th><th>A</th><th>B</th><th>C</th></tr>',
          '</thead>',
          '<tbody>',
            '<tr><th>1</th><td rowspan="3" colspan="2">A1</td><td>C1</td></tr>',
            '<tr><th>2</th><td>C2</td></tr>',
            '<tr><th>3</th><td>C3</td></tr>',
          '</tbody>',
        '</table>',
      ].join(''));
      /* eslint-enable */
    });
  });
});
