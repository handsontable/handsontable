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

  it('should render formatted number', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      cells() {
        return {
          type: 'numeric',
          numericFormat: { pattern: '$0,0.00' }
        };
      },
      afterValidate: onAfterValidate
    });
    setDataAtCell(2, 2, '1000.234');

    setTimeout(() => {
      expect(getCell(2, 2).innerHTML).toEqual('$1,000.23');
      done();
    }, 200);
  });

  it('should render signed number', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      cells() {
        return {
          type: 'numeric',
          numericFormat: { pattern: '$0,0.00' }
        };
      },
      afterValidate: onAfterValidate
    });

    setDataAtCell(2, 2, '-1000.234');

    setTimeout(() => {
      expect(getCell(2, 2).innerHTML).toEqual('-$1,000.23');
      done();
    }, 200);
  });

  it('should not try to render string as numeral', (done) => {
    handsontable({
      cells() {
        return {
          type: 'numeric',
          numericFormat: { pattern: '$0,0.00' }
        };
      },
    });

    setDataAtCell(2, 2, '123 simple test');

    setTimeout(() => {
      expect(getCell(2, 2).innerHTML).toEqual('123 simple test');
      done();
    }, 100);
  });

  it('should add class names `htNumeric` and `htRight` to the cell if it renders a number', () => {
    const DIV = document.createElement('DIV');
    const instance = new Handsontable(DIV, {});
    const TD = document.createElement('TD');

    TD.className = 'someClass';
    Handsontable.renderers.NumericRenderer(instance, TD, 0, 0, 0, 123, {});
    expect(TD.className).toEqual('someClass htRight htNumeric');
    instance.destroy();
  });

  it('should add class names `htNumeric` and `htRight` to the cell if it renders a numeric string', () => {
    const DIV = document.createElement('DIV');
    const instance = new Handsontable(DIV, {});
    const TD = document.createElement('TD');

    TD.className = 'someClass';
    Handsontable.renderers.NumericRenderer(instance, TD, 0, 0, 0, '123', {});
    expect(TD.className).toEqual('someClass htRight htNumeric');
    instance.destroy();
  });

  it('should not add class name `htNumeric` to the cell if it renders a text', () => {
    const DIV = document.createElement('DIV');
    const instance = new Handsontable(DIV, {});
    const TD = document.createElement('TD');

    TD.className = 'someClass';
    Handsontable.renderers.NumericRenderer(instance, TD, 0, 0, 0, 'abc', {});
    expect(TD.className).toEqual('someClass');
    instance.destroy();
  });

  it('should add class name `htDimmed` to a read only cell', () => {
    const DIV = document.createElement('DIV');
    const instance = new Handsontable(DIV, {});
    const TD = document.createElement('TD');

    Handsontable.renderers.NumericRenderer(instance, TD, 0, 0, 0, 123, {
      readOnly: true,
      readOnlyCellClassName: 'htDimmed',
    });
    expect(TD.className).toContain('htDimmed');
    instance.destroy();
  });

  describe('NumericRenderer with ContextMenu', () => {
    it('should change class name from default `htRight` to `htLeft` after set align in contextMenu', (done) => {
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

      setTimeout(() => {
        const contextSubMenu = $(`.htContextMenuSub_${menu.text()}`).find('tbody td').eq(0);

        contextSubMenu.simulate('mousedown');
        contextSubMenu.simulate('mouseup');

        expect($('.handsontable.ht_master .htLeft:not(.htRight)').length).toBe(1);
        done();
      }, 500);
    });
  });
});
