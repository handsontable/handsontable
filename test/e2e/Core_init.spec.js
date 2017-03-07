describe('Core_init', () => {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should respect startRows and startCols when no data is provided', function() {
    this.$container.remove();
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    handsontable();

    expect(countRows()).toEqual(5); // as given in README.md
    expect(countCols()).toEqual(5); // as given in README.md
  });

  it('should respect width provided in inline style', function() {
    this.$container.css({
      overflow: 'auto',
      width: '200px'
    });
    handsontable({
      data: [
        ['ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC']
      ]
    });

    expect(this.$container.width()).toEqual(200);
  });

  it('should respect width provided in CSS class', function() {
    $('<style>.myTable {overflow: auto; width: 200px}</style>').appendTo('head');
    this.$container.addClass('myTable');
    handsontable({
      data: [
        ['ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC']
      ]
    });

    expect(this.$container.width()).toEqual(200);
  });

  it('should construct when container is not appended to document', function() {
    this.$container.remove();
    handsontable();
    expect(getData()).toBeTruthy();
  });

  it('Handsontable.Dom should be available as a helper to the plugins', () => {
    // all public methods of Handsontable.Dom should be exposed here
    expect(Handsontable.dom.closest).toBeDefined();
    expect(Handsontable.dom.isChildOf).toBeDefined();
    expect(Handsontable.dom.index).toBeDefined();
    expect(Handsontable.dom.hasClass).toBeDefined();
    expect(Handsontable.dom.addClass).toBeDefined();
    expect(Handsontable.dom.removeClass).toBeDefined();
    expect(Handsontable.dom.removeTextNodes).toBeDefined();
    expect(Handsontable.dom.empty).toBeDefined();
    expect(Handsontable.dom.fastInnerHTML).toBeDefined();
    expect(Handsontable.dom.fastInnerText).toBeDefined();
    expect(Handsontable.dom.isVisible).toBeDefined();
    expect(Handsontable.dom.offset).toBeDefined();
    expect(Handsontable.dom.getComputedStyle).toBeDefined();
    expect(Handsontable.dom.outerWidth).toBeDefined();
    expect(Handsontable.dom.outerHeight).toBeDefined();
    expect(Handsontable.dom.getCaretPosition).toBeDefined();
    expect(Handsontable.dom.setCaretPosition).toBeDefined();
  });
});
