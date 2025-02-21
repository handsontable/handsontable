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

  it('should render formatted number', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      cells() {
        return {
          renderer: 'numeric',
          numericFormat: { pattern: '$0,0.00' }
        };
      },
      afterValidate: onAfterValidate
    });
    setDataAtCell(2, 2, '1000.234');

    await sleep(100);

    expect(getCell(2, 2).innerHTML).toEqual('$1,000.23');
  });

  it('should render signed number', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      cells() {
        return {
          renderer: 'numeric',
          numericFormat: { pattern: '$0,0.00' }
        };
      },
      afterValidate: onAfterValidate
    });

    setDataAtCell(2, 2, '-1000.234');

    await sleep(100);

    expect(getCell(2, 2).innerHTML).toEqual('-$1,000.23');
  });

  it('should not try to render string as numeral', async() => {
    handsontable({
      cells() {
        return {
          renderer: 'numeric',
          numericFormat: { pattern: '$0,0.00' }
        };
      },
    });

    setDataAtCell(2, 2, '123 simple test');

    await sleep(100);

    expect(getCell(2, 2).innerHTML).toEqual('123 simple test');
  });

  it('should render the cell with "dir" attribute set as "ltr" as long as the value is of a numeric-like type', () => {
    handsontable({
      data: [[1, '1', '1.1']],
      renderer: 'numeric'
    });

    expect(getCell(0, 0).getAttribute('dir')).toBe('ltr');
    expect(getCell(0, 1).getAttribute('dir')).toBe('ltr');
    expect(getCell(0, 2).getAttribute('dir')).toBe('ltr');
  });

  it('should render the cell without messing "dir" attribute as long as the value is not of a numeric-like type', () => {
    handsontable({
      data: [['1z', 'z', true]],
      renderer: 'numeric'
    });

    expect(getCell(0, 0).getAttribute('dir')).toBeNull();
    expect(getCell(0, 1).getAttribute('dir')).toBeNull();
    expect(getCell(0, 2).getAttribute('dir')).toBeNull();
  });

  it('should add class names `htNumeric` and `htRight` to the cell if it is a number', () => {
    handsontable({
      data: [[123]],
      renderer: 'numeric',
    });

    expect(getCell(0, 0).className).toEqual('htRight htNumeric');
  });

  it('should add class names `htNumeric` and `htRight` to the cell if it is a number passed as string', () => {
    handsontable({
      data: [['123']],
      renderer: 'numeric',
    });

    expect(getCell(0, 0).className).toEqual('htRight htNumeric');
  });

  it('should not add class name `htNumeric` to the cell if it is string (text)', () => {
    handsontable({
      data: [['abc']],
      renderer: 'numeric',
    });

    expect(getCell(0, 0).className).toEqual('');
  });

  it('should add class name `htDimmed` to the cell', () => {
    handsontable({
      data: [[123]],
      renderer: 'numeric',
      readOnly: true,
      readOnlyCellClassName: 'htDimmed',
    });

    expect(getCell(0, 0).className).toEqual('htRight htNumeric htDimmed');
  });

  it('should add custom class as string to the cell if it is a number', () => {
    handsontable({
      data: [[123]],
      renderer: 'numeric',
      className: 'someClass',
    });

    expect(getCell(0, 0).className).toEqual('someClass htRight htNumeric');
  });

  it('should add custom class as an array to the cell if it is a number', () => {
    handsontable({
      data: [[123]],
      renderer: 'numeric',
      className: ['someClass', 'someClass2'],
    });

    expect(getCell(0, 0).className).toEqual('someClass someClass2 htRight htNumeric');
  });

  describe('NumericRenderer with ContextMenu', () => {
    it('should change class name from default `htRight` to `htLeft` after set align in contextMenu', async() => {
      handsontable({
        startRows: 1,
        startCols: 1,
        contextMenu: ['alignment'],
        cells() {
          return {
            type: 'numeric',
            numericFormat: { pattern: '$0,0.00' }
          };
        },
        height: 100
      });

      setDataAtCell(0, 0, '1000');
      selectCell(0, 0);

      contextMenu();

      const menu = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator');

      menu.simulate('mouseover');

      await sleep(300);

      const contextSubMenu = $(`.htContextMenuSub_${menu.text()}`).find('tbody td').eq(0);

      contextSubMenu.simulate('mousedown');
      contextSubMenu.simulate('mouseup');

      expect($('.handsontable.ht_master .htLeft:not(.htRight)').length).toBe(1);
    });
  });
});
