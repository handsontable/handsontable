describe('`ariaTags` setting option', () => {
  const id = 'testContainer';
  const getAccessibilityEnabledElements = (rootElement) => {
    return [...rootElement.querySelectorAll('*')].filter((el) => {
      return [...el.getAttributeNames()].filter(attr => (attr === 'role' || attr.startsWith('aria-'))).length > 0;
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

  it('should NOT prevent any accessibility-related attributes from being added to the table (enabled on init)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
      ariaTags: true
    });

    expect(getAccessibilityEnabledElements(hot.rootElement).length).toBeGreaterThan(0);
  });

  it('should NOT prevent any accessibility-related attributes from being added to the table (not defined)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
      fixedRowsTop: 2,
      fixedColumnsStart: 2
    });

    expect(getAccessibilityEnabledElements(hot.rootElement).length).toBeGreaterThan(0);
  });

  it('should prevent any accessibility-related attributes from being added to the table (disabled on init)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
      ariaTags: false
    });

    expect(getAccessibilityEnabledElements(hot.rootElement).length).toBe(0);
  });

  // TODO: known issue: the ariaTags option is not compatible with `updateSettings`.
  xit('should prevent any accessibility-related attributes from being added to the table (changing using' +
    ' `updateSettings`)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
    });

    expect(getAccessibilityEnabledElements(hot.rootElement).length).toBeGreaterThan(0);

    await updateSettings({
      ariaTags: false
    });

    expect(getAccessibilityEnabledElements(hot.rootElement).length).toBe(0);
  });

  // TODO: known issue: the ariaTags option is not compatible with `updateSettings`.
  xit('should NOT prevent any accessibility-related attributes from being added to the table (changing using' +
    ' `updateSettings`)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
      ariaTags: false,
    });

    expect(getAccessibilityEnabledElements(hot.rootElement).length).toBe(0);

    await updateSettings({
      ariaTags: true
    });

    expect(getAccessibilityEnabledElements(hot.rootElement).length).toBeGreaterThan(0);
  });

  it('should not be possible to change the `ariaTags` option after the table is initialized', async() => {
    const hot = handsontable({
      ariaTags: true
    });

    expect(() => {
      // eslint-disable-next-line handsontable/require-await
      updateSettings({
        ariaTags: false
      });
    }).toThrowError();

    expect(getAccessibilityEnabledElements(hot.rootElement).length).toBeGreaterThan(0);
  });
});
