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
      $('body').find(`#${id}`).remove();
    }
  });

  describe('cell states', () => {
    it('should add a `aria-selection` attribute to the currently selected cell and not the headers', async() => {
      handsontable({
        data: createSpreadsheetData(15, 15),
        rowHeaders: true,
        colHeaders: true,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsStart: 2,
        navigableHeaders: true,
        viewportRowRenderingOffset: Infinity,
        viewportColumnRenderingOffset: Infinity
      });

      const countElementsWithAriaSelected = (overlay, cellType) => {
        return filterElementsByAttribute(
          overlay.get(0),
          cellType,
          'aria-selected',
          'true'
        ).length;
      };

      await selectCell(0, 0);

      expect(countElementsWithAriaSelected(getMaster(), 'td')).toEqual(1);
      expect(countElementsWithAriaSelected(getMaster(), 'th')).toEqual(0);
      expect(countElementsWithAriaSelected(getTopClone(), 'td')).toEqual(1);
      expect(countElementsWithAriaSelected(getTopClone(), 'th')).toEqual(0);
      expect(countElementsWithAriaSelected(getInlineStartClone(), 'td')).toEqual(1);
      expect(countElementsWithAriaSelected(getInlineStartClone(), 'th')).toEqual(0);
      expect(countElementsWithAriaSelected(getTopInlineStartClone(), 'td')).toEqual(1);
      expect(countElementsWithAriaSelected(getTopInlineStartClone(), 'th')).toEqual(0);
      expect(getCell(0, 0).getAttribute('aria-selected')).toEqual('true');

      await selectCell(0, 0, 1, 1);

      expect(countElementsWithAriaSelected(getMaster(), 'td')).toEqual(4);
      expect(countElementsWithAriaSelected(getMaster(), 'th')).toEqual(0);
      expect(countElementsWithAriaSelected(getTopClone(), 'td')).toEqual(4);
      expect(countElementsWithAriaSelected(getTopClone(), 'th')).toEqual(0);
      expect(countElementsWithAriaSelected(getInlineStartClone(), 'td')).toEqual(4);
      expect(countElementsWithAriaSelected(getInlineStartClone(), 'th')).toEqual(0);
      expect(countElementsWithAriaSelected(getTopInlineStartClone(), 'td')).toEqual(4);
      expect(countElementsWithAriaSelected(getTopInlineStartClone(), 'th')).toEqual(0);

      expect(getCell(0, 0).getAttribute('aria-selected')).toEqual('true');
      expect(getCell(0, 1).getAttribute('aria-selected')).toEqual('true');
      expect(getCell(1, 0).getAttribute('aria-selected')).toEqual('true');
      expect(getCell(1, 1).getAttribute('aria-selected')).toEqual('true');

      await selectCell(5, 5);

      expect(countElementsWithAriaSelected(getMaster(), 'td')).toEqual(1);
      expect(countElementsWithAriaSelected(getMaster(), 'th')).toEqual(0);
      expect(countElementsWithAriaSelected(getTopClone(), 'td')).toEqual(0);
      expect(countElementsWithAriaSelected(getTopClone(), 'th')).toEqual(0);
      expect(countElementsWithAriaSelected(getInlineStartClone(), 'th')).toEqual(0);
      expect(countElementsWithAriaSelected(getTopInlineStartClone(), 'td')).toEqual(0);
      expect(countElementsWithAriaSelected(getTopInlineStartClone(), 'th')).toEqual(0);
      expect(getCell(5, 5).getAttribute('aria-selected')).toEqual('true');

      await selectCell(-1, 1);

      expect(countElementsWithAriaSelected(getMaster(), null)).toEqual(1);
      expect(countElementsWithAriaSelected(getTopClone(), null)).toEqual(1);
      expect(countElementsWithAriaSelected(getInlineStartClone(), null)).toEqual(1);
      expect(countElementsWithAriaSelected(getTopInlineStartClone(), null)).toEqual(1);
      expect(getCell(-1, 1).getAttribute('aria-selected')).toEqual('true');
    });

    it('should add a `aria-readonly` attribute to the read-only cells', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
      });

      await setCellMeta(1, 1, 'readOnly', true);
      await setCellMeta(2, 2, 'readOnly', true);

      await render();

      expect(getCell(1, 1).getAttribute('aria-readonly')).toEqual('true');
      expect(getCell(2, 2).getAttribute('aria-readonly')).toEqual('true');

      await setCellMeta(1, 1, 'readOnly', false);
      await setCellMeta(2, 2, 'readOnly', false);

      await render();

      expect(getCell(1, 1).getAttribute('aria-readonly')).toEqual(null);
      expect(getCell(2, 2).getAttribute('aria-readonly')).toEqual(null);
    });
  });
});
