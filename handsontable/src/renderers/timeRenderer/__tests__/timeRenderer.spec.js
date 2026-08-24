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

  it('should internally call base renderer once', async() => {
    const originalBaseRenderer = Handsontable.renderers.BaseRenderer;

    const renderedCellCalls = [];

    spyOn(Handsontable.renderers, 'BaseRenderer').and.callFake((...args) => {
      const TD = args[1];

      // The GhostTable that AutoColumnSize measures in renders its own cells, flagged with the
      // `ghost-table` attribute, and those go through the same renderer contract. They are a
      // separate render pass, not a second call on the rendered cell this spec is about.
      if (!TD.hasAttribute('ghost-table')) {
        renderedCellCalls.push(TD);
      }
    });

    Handsontable.renderers.registerRenderer('base', Handsontable.renderers.BaseRenderer);
    handsontable({
      data: [['test']],
      type: 'time',
    });

    expect(renderedCellCalls.length).toBe(1);

    Handsontable.renderers.registerRenderer('base', originalBaseRenderer);
  });

  it('should render #bad-value# for a non-time string', async() => {
    handsontable({
      renderer: 'time',
    });
    await setDataAtCell(2, 2, 'string');

    expect(getCell(2, 2).innerHTML).toEqual('#bad-value#');
  });

  it('should render #bad-value# for a number', async() => {
    handsontable({
      renderer: 'time',
    });
    await setDataAtCell(2, 2, 13);

    expect(getCell(2, 2).innerHTML).toEqual('#bad-value#');
  });

  it('should render #bad-value# for boolean true', async() => {
    handsontable({
      renderer: 'time',
    });
    await setDataAtCell(2, 2, true);

    expect(getCell(2, 2).innerHTML).toEqual('#bad-value#');
  });

  it('should render #bad-value# for boolean false', async() => {
    handsontable({
      renderer: 'time',
    });
    await setDataAtCell(2, 2, false);

    expect(getCell(2, 2).innerHTML).toEqual('#bad-value#');
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
    handsontable({
      data: [['foo']],
      renderer: 'time',
      readOnly: true,
      readOnlyCellClassName: 'htDimmed',
      className: 'someClass',
    });

    expect(getCell(0, 0).className).toEqual('someClass htDimmed');
  });

  it('should format a valid ISO time string using valueFormatter', async() => {
    handsontable({
      data: [['14:30']],
      type: 'time',
      timeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    });

    expect(getCell(0, 0).innerText).toBe('14:30');
  });

});
