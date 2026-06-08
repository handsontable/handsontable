describe('NumericRenderer', () => {
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

  it('should not try to render string as numeral', async() => {
    handsontable({
      cells() {
        return {
          renderer: 'numeric',
          numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }
        };
      },
    });

    await setDataAtCell(2, 2, '123 simple test');

    await waitForNextAnimationFrames(2);

    expect(getCell(2, 2).innerHTML).toEqual('123 simple test');
  });

  it('should render the cell with "dir" attribute set as "ltr" as long as the value is of a numeric-like type', async() => {
    handsontable({
      data: [[1, '1', '1.1']],
      renderer: 'numeric'
    });

    expect(getCell(0, 0).getAttribute('dir')).toBe('ltr');
    expect(getCell(0, 1).getAttribute('dir')).toBe('ltr');
    expect(getCell(0, 2).getAttribute('dir')).toBe('ltr');
  });

  it('should render the cell without messing "dir" attribute as long as the value is not of a numeric-like type', async() => {
    handsontable({
      data: [['1z', 'z', true]],
      renderer: 'numeric'
    });

    expect(getCell(0, 0).getAttribute('dir')).toBeNull();
    expect(getCell(0, 1).getAttribute('dir')).toBeNull();
    expect(getCell(0, 2).getAttribute('dir')).toBeNull();
  });

  it('should add class names `htNumeric` and `htRight` to the cell if it is a number', async() => {
    handsontable({
      data: [[123]],
      renderer: 'numeric',
    });

    expect(getCell(0, 0).className).toEqual('htRight htNumeric');
  });

  it('should add class names `htNumeric` and `htRight` to the cell if it is a number passed as string', async() => {
    handsontable({
      data: [['123']],
      renderer: 'numeric',
    });

    expect(getCell(0, 0).className).toEqual('htRight htNumeric');
  });

  it('should not add class name `htNumeric` to the cell if it is string (text)', async() => {
    handsontable({
      data: [['abc']],
      renderer: 'numeric',
    });

    expect(getCell(0, 0).className).toEqual('');
  });

  it('should add class name `htDimmed` to the cell', async() => {
    handsontable({
      data: [[123]],
      renderer: 'numeric',
      readOnly: true,
      readOnlyCellClassName: 'htDimmed',
    });

    expect(getCell(0, 0).className).toEqual('htRight htNumeric htDimmed');
  });

  it('should add custom class as string to the cell if it is a number', async() => {
    handsontable({
      data: [[123]],
      renderer: 'numeric',
      className: 'someClass',
    });

    expect(getCell(0, 0).className).toEqual('someClass htRight htNumeric');
  });

  it('should add custom class as an array to the cell if it is a number', async() => {
    handsontable({
      data: [[123]],
      renderer: 'numeric',
      className: ['someClass', 'someClass2'],
    });

    expect(getCell(0, 0).className).toEqual('someClass someClass2 htRight htNumeric');
  });

  it('should print warn message if unsupported numericFormat.pattern is used', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [[123]],
      renderer: 'numeric',
      numericFormat: { pattern: '$0,0.00' }
    });

    expect(warnSpy).toHaveBeenCalledWith(
      'The numericFormat.pattern and numericFormat.culture options are not supported. ' +
      'Use Intl.NumberFormat options instead (numericFormat: { style, currency, ... }).'
    );
  });

  it('should print warn message if unsupported numericFormat.culture is used', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [[123]],
      renderer: 'numeric',
      numericFormat: { culture: '$0,0.00' }
    });

    expect(warnSpy).toHaveBeenCalledWith(
      'The numericFormat.pattern and numericFormat.culture options are not supported. ' +
      'Use Intl.NumberFormat options instead (numericFormat: { style, currency, ... }).'
    );
  });

  it('should not print warn message if supported Intl.NumberFormat object format is used', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [[123]],
      renderer: 'numeric',
      numericFormat: {
        useGrouping: false,
        maximumFractionDigits: 20,
      }
    });

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should internally call base renderer once', async() => {
    const originalBaseRenderer = Handsontable.renderers.BaseRenderer;

    spyOn(Handsontable.renderers, 'BaseRenderer');

    Handsontable.renderers.registerRenderer('base', Handsontable.renderers.BaseRenderer);
    handsontable({
      data: [['test']],
      renderer: 'numeric',
    });

    expect(Handsontable.renderers.BaseRenderer).toHaveBeenCalledTimes(1);

    Handsontable.renderers.registerRenderer('base', originalBaseRenderer);
  });
});
