describe('Cell state-related a11y config', () => {
  const id = 'testContainer';

  const filterElementsByAttribute = (rootElement, elementSelector, attributeName, attributeValue, negation = false) => {
    return [...rootElement.querySelectorAll(elementSelector || '*')].filter((el) => {
      return [...el.getAttributeNames()].filter(
        (attr) => {
          return negation ?
            (attr !== attributeName || el.getAttribute(attr) !== attributeValue) :
            (attr === attributeName && el.getAttribute(attr) === attributeValue);
        }
      ).length > 0;
    });
  };

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('cell states', () => {
    it('should add a `aria-selection` attribute to the currently selected cell', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(15, 15),
        rowHeaders: true,
        colHeaders: true,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsStart: 2,
        navigableHeaders: true,
        viewportRowRenderingOffset: Infinity,
        viewportColumnRenderingOffset: Infinity
      });

      selectCell(0, 0);

      expect(filterElementsByAttribute(
        getMaster().get(0),
        'td',
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getMaster().get(0),
        'th',
        'aria-selected',
        'true'
      ).length).toEqual(2);

      expect(filterElementsByAttribute(
        getTopClone().get(0),
        'td',
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getTopClone().get(0),
        'th',
        'aria-selected',
        'true'
      ).length).toEqual(2);

      expect(filterElementsByAttribute(
        getInlineStartClone().get(0),
        'td',
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getInlineStartClone().get(0),
        'th',
        'aria-selected',
        'true'
      ).length).toEqual(2);

      expect(filterElementsByAttribute(
        getTopInlineStartClone().get(0),
        'td',
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getTopInlineStartClone().get(0),
        'th',
        'aria-selected',
        'true'
      ).length).toEqual(2);

      expect(getCell(0, 0).getAttribute('aria-selected')).toEqual('true');

      selectCell(5, 5);

      expect(filterElementsByAttribute(
        getMaster().get(0),
        'td',
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getMaster().get(0),
        'th',
        'aria-selected',
        'true'
      ).length).toEqual(2);

      expect(filterElementsByAttribute(
        getTopClone().get(0),
        'td',
        'aria-selected',
        'true'
      ).length).toEqual(0);

      expect(filterElementsByAttribute(
        getTopClone().get(0),
        'th',
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getInlineStartClone().get(0),
        'td',
        'aria-selected',
        'true'
      ).length).toEqual(0);

      expect(filterElementsByAttribute(
        getInlineStartClone().get(0),
        'th',
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getTopInlineStartClone().get(0),
        'td',
        'aria-selected',
        'true'
      ).length).toEqual(0);

      expect(filterElementsByAttribute(
        getTopInlineStartClone().get(0),
        'th',
        'aria-selected',
        'true'
      ).length).toEqual(0);

      expect(getCell(5, 5).getAttribute('aria-selected')).toEqual('true');

      selectCell(-1, 1);

      expect(filterElementsByAttribute(
        getMaster().get(0),
        null,
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getTopClone().get(0),
        null,
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getInlineStartClone().get(0),
        null,
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getTopInlineStartClone().get(0),
        null,
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(getCell(-1, 1).getAttribute('aria-selected')).toEqual('true');
    });

    it('should add a `aria-readonly` attribute to the read-only cells', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
      });

      setCellMeta(1, 1, 'readOnly', true);
      setCellMeta(2, 2, 'readOnly', true);

      render();

      expect(getCell(1, 1).getAttribute('aria-readonly')).toEqual('true');
      expect(getCell(2, 2).getAttribute('aria-readonly')).toEqual('true');

      setCellMeta(1, 1, 'readOnly', false);
      setCellMeta(2, 2, 'readOnly', false);

      render();

      expect(getCell(1, 1).getAttribute('aria-readonly')).toEqual(null);
      expect(getCell(2, 2).getAttribute('aria-readonly')).toEqual(null);
    });
  });
});
