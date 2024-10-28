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
});
