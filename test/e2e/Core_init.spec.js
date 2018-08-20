describe('Core_init', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should respect startRows and startCols when no data is provided', () => {
    spec().$container.remove();
    spec().$container = $(`<div id="${id}"></div>`).appendTo('body');
    handsontable();

    expect(countRows()).toEqual(5); // as given in README.md
    expect(countCols()).toEqual(5); // as given in README.md
  });

  it('should respect width provided in inline style', () => {
    spec().$container.css({
      overflow: 'auto',
      width: '200px'
    });
    handsontable({
      data: [
        ['ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC']
      ]
    });

    expect(spec().$container.width()).toEqual(200);
  });

  it('should respect width provided in CSS class', () => {
    $('<style>.myTable {overflow: auto; width: 200px}</style>').appendTo('head');
    spec().$container.addClass('myTable');
    handsontable({
      data: [
        ['ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC', 'ABC']
      ]
    });

    expect(spec().$container.width()).toEqual(200);
  });

  it('should construct when container is not appended to document', () => {
    spec().$container.remove();
    handsontable();
    expect(getData()).toBeTruthy();
  });

  xit('should create table even if is launched inside custom element', () => {
    // TODO: When we'll update phantomjs, then we should try to run this test case.
    spec().$container = $(`<hot-table><div id="${id}"></div></hot-table>`).appendTo('body');
    handsontable();

    expect(() => {
      mouseOver(spec().$container.find('tr:eq(0) td:eq(1)'));
    }).not.toThrow();
  });
});
