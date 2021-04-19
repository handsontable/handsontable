describe('TextRenderer', () => {
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

  it('should render string', () => {
    handsontable();
    setDataAtCell(2, 2, 'string');

    expect(getCell(2, 2).innerHTML).toEqual('string');
  });

  it('should render number', () => {
    handsontable();
    setDataAtCell(2, 2, 13);

    expect(getCell(2, 2).innerHTML).toEqual('13');
  });

  it('should render boolean true', () => {
    handsontable();
    setDataAtCell(2, 2, true);

    expect(getCell(2, 2).innerHTML).toEqual('true');
  });

  it('should render boolean false', () => {
    handsontable();
    setDataAtCell(2, 2, false);

    expect(getCell(2, 2).innerHTML).toEqual('false');
  });

  it('should render null', () => {
    handsontable();
    setDataAtCell(2, 2, null);

    expect(getCell(2, 2).innerHTML).toEqual('');
  });

  it('should render undefined', () => {
    handsontable();
    /* eslint-disable wrap-iife */
    setDataAtCell(2, 2, (function() {})());

    expect(getCell(2, 2).innerHTML).toEqual('');
  });

  it('should add class name `htDimmed` to a read only cell', () => {
    const DIV = document.createElement('DIV');
    const instance = new Handsontable.Core(DIV, {});

    const TD = document.createElement('TD');

    TD.className = 'someClass';
    Handsontable.renderers.TextRenderer(instance, TD, 0, 0, 0, '', {
      readOnly: true,
      readOnlyCellClassName: 'htDimmed',
    });
    expect(TD.className).toEqual('someClass htDimmed');

    instance.destroy();
  });

  it('should render a multiline string', () => {
    handsontable();
    setDataAtCell(1, 2, 'a b');
    setDataAtCell(2, 2, 'a\nb');

    expect($(getCell(2, 2)).height()).toBeGreaterThan($(getCell(1, 2)).height());
  });

  it('should wrap text when column width is limited', () => {
    handsontable({
      colWidths: [100]
    });
    setDataAtCell(0, 0, 'short text');
    setDataAtCell(1, 0, 'long long long long long long long text');

    expect($(getCell(1, 0)).height()).toBeGreaterThan($(getCell(0, 0)).height());
  });

  it('should wrap text when trimWhitespace option is false', () => {
    const HOT = handsontable({
      trimWhitespace: false,
      wordWrap: true,
      data: [
        ['text', 'long long long long long text']
      ],
      colWidths: [100, 500]
    });

    const oldRowHeight = $(getCell(0, 1)).height();

    HOT.updateSettings({
      colWidths: [100, 100]
    });

    const newRowHeight = $(getCell(0, 1)).height();

    expect(newRowHeight).toBeGreaterThan(oldRowHeight);
  });
});
