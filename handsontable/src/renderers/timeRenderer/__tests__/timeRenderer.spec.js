describe('TimeRenderer', () => {
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

  it('should render string', async() => {
    handsontable({
      renderer: 'time',
    });
    await setDataAtCell(2, 2, 'string');

    expect(getCell(2, 2).innerHTML).toEqual('string');
  });

  it('should render number', async() => {
    handsontable({
      renderer: 'time',
    });
    await setDataAtCell(2, 2, 13);

    expect(getCell(2, 2).innerHTML).toEqual('13');
  });

  it('should render boolean true', async() => {
    handsontable({
      renderer: 'time',
    });
    await setDataAtCell(2, 2, true);

    expect(getCell(2, 2).innerHTML).toEqual('true');
  });

  it('should render boolean false', async() => {
    handsontable({
      renderer: 'time',
    });
    await setDataAtCell(2, 2, false);

    expect(getCell(2, 2).innerHTML).toEqual('false');
  });

  it('should render null', async() => {
    handsontable({
      renderer: 'time',
    });
    await setDataAtCell(2, 2, null);

    expect(getCell(2, 2).innerHTML).toEqual('');
  });

  it('should render undefined', async() => {
    handsontable({
      renderer: 'time',
    });
    await setDataAtCell(2, 2, undefined);

    expect(getCell(2, 2).innerHTML).toEqual('');
  });

  it('should render the cell without messing with "dir" attribute', async() => {
    handsontable({
      data: [['foo']],
      renderer: 'time'
    });

    expect(getCell(0, 0).getAttribute('dir')).toBe('ltr');
  });

  it('should add class name `htDimmed` to a read only cell', async() => {
    const DIV = document.createElement('DIV');
    const instance = new Handsontable.Core(DIV, {
      renderer: 'time',
    });

    const TD = document.createElement('TD');

    TD.className = 'someClass';
    Handsontable.renderers.TimeRenderer(instance, TD, 0, 0, 0, '', {
      readOnly: true,
      readOnlyCellClassName: 'htDimmed',
    });
    expect(TD.className).toEqual('someClass htDimmed');

    instance.destroy();
  });

  it('should render a multiline string', async() => {
    handsontable({
      renderer: 'time',
    });
    await setDataAtCell(1, 2, 'a b');
    await setDataAtCell(2, 2, 'a\nb');

    expect($(getCell(2, 2)).height()).toBeGreaterThan($(getCell(1, 2)).height());
  });

  it('should wrap text when column width is limited', async() => {
    handsontable({
      renderer: 'time',
      colWidths: [100],
    });
    await setDataAtCell(0, 0, 'short text');
    await setDataAtCell(1, 0, 'long long long long long long long text');

    expect($(getCell(1, 0)).height()).toBeGreaterThan($(getCell(0, 0)).height());
  });

  it('should wrap text when trimWhitespace option is false', async() => {
    handsontable({
      renderer: 'time',
      trimWhitespace: false,
      wordWrap: true,
      data: [
        ['text', 'long long long long long text']
      ],
      colWidths: [100, 500],
    });

    const oldRowHeight = $(getCell(0, 1)).height();

    await updateSettings({
      colWidths: [100, 100]
    });

    const newRowHeight = $(getCell(0, 1)).height();

    expect(newRowHeight).toBeGreaterThan(oldRowHeight);
  });
});
