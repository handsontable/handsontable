describe('CheckboxRenderer', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}" style="width: 300px; height: 200px;"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should render values as checkboxes', () => {
    handsontable({
      data: [[true], [false], [true]],
      columns: [
        { type: 'checkbox' }
      ]
    });

    expect($(getRenderedValue(0, 0)).is(':checkbox')).toBe(true);
    expect($(getRenderedValue(1, 0)).is(':checkbox')).toBe(true);
    expect($(getRenderedValue(2, 0)).is(':checkbox')).toBe(true);
  });

  it('should render check checkboxes for cell which value is true', () => {
    handsontable({
      data: [[true], [false], [true]],
      columns: [
        { type: 'checkbox' }
      ]
    });

    expect($(getRenderedContent(0, 0)).prop('checked')).toBe(true);
    expect($(getRenderedContent(1, 0)).prop('checked')).toBe(false);
    expect($(getRenderedContent(2, 0)).prop('checked')).toBe(true);
  });

  it('should use templates to check appropriate checkboxes', () => {
    handsontable({
      data: [['yes'], ['no'], ['yes']],
      columns: [
        {
          type: 'checkbox',
          checkedTemplate: 'yes',
          uncheckedTemplate: 'no'
        }
      ]
    });

    expect($(getRenderedContent(0, 0)).prop('checked')).toBe(true);
    expect($(getRenderedContent(1, 0)).prop('checked')).toBe(false);
    expect($(getRenderedContent(2, 0)).prop('checked')).toBe(true);
  });

  it('should select cell after checkbox click', async() => {
    const spy = jasmine.createSpyObj('error', ['test']);

    window.onerror = function() {
      spy.test();

      return false;
    };

    const hot = handsontable({
      data: [[true], [false], [true]],
      columns: [
        { type: 'checkbox' }
      ]
    });

    hot.selectCell(0, 0);

    spec().$container.find(':checkbox').eq(2).simulate('mousedown');
    spec().$container.find(':checkbox').eq(2).simulate('mouseup');
    spec().$container.find(':checkbox').eq(2).simulate('click');

    await sleep(100);

    expect(spy.test.calls.count()).toBe(0);
    expect(hot.getSelected()).toEqual([[2, 0, 2, 0]]);
  });

  it('should select cell after label click', () => {
    const hot = handsontable({
      data: [[true], [false], [true]],
      columns: [
        { type: 'checkbox', label: { position: 'before', value: 'Sure? ' } }
      ]
    });

    hot.selectCell(0, 0);

    spec().$container.find('td label').eq(2).simulate('mousedown');

    expect(hot.getSelected()).toEqual([[2, 0, 2, 0]]);
  });

  it('should reverse selection in checkboxes', () => {
    handsontable({
      data: [[true], [false], [true]],
      columns: [
        { type: 'checkbox' }
      ]
    });

    spec().$container.find(':checkbox').eq(0).simulate('click');
    spec().$container.find(':checkbox').eq(1).simulate('click');
    spec().$container.find(':checkbox').eq(2).simulate('click');

    expect(getData()).toEqual([[false], [true], [false]]);
  });

  it('shouldn\'t uncheck checkboxes', () => {
    handsontable({
      data: [[true], [true], [true]],
      columns: [
        { type: 'checkbox', readOnly: true }
      ]
    });

    spec().$container.find(':checkbox').trigger('click');

    expect(getData()).toEqual([[true], [true], [true]]);
  });

  it('should change checkboxes values properly when data contains null or/and undefined', () => {
    handsontable({
      data: [[null], [undefined]],
      colHeaders: true,
      columns: [
        {
          type: 'checkbox'
        }
      ]
    });

    selectCell(0, 0, 1, 0);
    keyDownUp(' ');

    expect(getDataAtCol(0)).toEqual([true, true]);

    selectCell(0, 0, 1, 0);
    keyDownUp(' ');

    expect(getDataAtCol(0)).toEqual([false, false]);
  });

  it('should change checkboxes values for cells below the viewport (hot initialized by startRows) #4037', () => {
    handsontable({
      startRows: 200,
      colHeaders: true,
      columns: [
        {
          type: 'checkbox'
        }
      ]
    });

    selectCell(0, 0, 199, 0);
    keyDownUp(' ');

    expect(getDataAtCell(199, 0)).toEqual(true);
  });

  it('should toggle checkbox even if cell value is in another datatype', () => {
    // TODO: we MUST add additional layer in data transport, to filter stored data types into their defined data type (cellMeta.type)
    handsontable({
      data: [['true']],
      columns: [
        { type: 'checkbox' },
      ]
    });

    selectCell(0, 0);

    expect(getDataAtCell(0, 0)).toBe('true');

    keyDownUp(' ');

    expect(getDataAtCell(0, 0)).toBe(false);
  });

  it('double click on checkbox cell should invert the value', () => {
    handsontable({
      data: [
        [true],
        [false],
        [true]
      ],
      columns: [
        { type: 'checkbox' }
      ]
    });

    selectCell(0, 0);

    mouseDoubleClick(getCell(0, 0));
    expect(getDataAtCell(0, 0)).toBe(false);

    mouseDoubleClick(getCell(0, 0));
    expect(getDataAtCell(0, 0)).toBe(true);

    mouseDoubleClick(getCell(0, 0));
    expect(getDataAtCell(0, 0)).toBe(false);
  });

  it('double click on input[type=checkbox] element inside checkbox cell should not invert the value', () => {
    handsontable({
      data: [
        [true],
        [false],
        [true]
      ],
      columns: [
        { type: 'checkbox' }
      ]
    });

    selectCell(0, 0);

    mouseDoubleClick($(getCell(0, 0)).find('input[type=checkbox]'));
    expect(getDataAtCell(0, 0)).toBe(true);

    mouseDoubleClick($(getCell(1, 0)).find('input[type=checkbox]'));
    expect(getDataAtCell(1, 0)).toBe(false);
  });

  it('should not change checkbox state after hitting other keys then DELETE or BACKSPACE (from #bad-value# state)', () => {
    handsontable({
      data: [['foo'], ['bar']],
      columns: [
        { type: 'checkbox' }
      ]
    });

    const afterChangeCallback = jasmine.createSpy('afterChangeCallback');

    addHook('afterChange', afterChangeCallback);

    expect(getDataAtCell(0, 0)).toBe('foo');

    selectCell(0, 0);
    keyDownUp(' ');
    selectCell(0, 0);
    keyDownUp('c');

    expect(getDataAtCell(0, 0)).toBe('foo');
    expect(getData()).toEqual([['foo'], ['bar']]);

    expect(afterChangeCallback.calls.count()).toEqual(0);
  });

  it('should not change checkbox state after hitting F2 key', () => {
    const onAfterChange = jasmine.createSpy('afterChangeCallback');

    handsontable({
      data: [[false], [true], [true]],
      columns: [
        { type: 'checkbox' }
      ],
      onAfterChange
    });

    selectCell(0, 0);
    keyDownUp('f2');

    expect(getDataAtCell(0, 0)).toBe(false);

    expect(onAfterChange.calls.count()).toEqual(0);
  });

  it('should not change checkbox state after hitting other keys then SPACE, ENTER, DELETE or BACKSPACE', () => {
    handsontable({
      data: [[false], [true], [true]],
      columns: [
        { type: 'checkbox' }
      ]
    });

    const afterChangeCallback = jasmine.createSpy('afterChangeCallback');

    addHook('afterChange', afterChangeCallback);

    selectCell(0, 0);
    keyDownUp(' ');

    expect(getDataAtCell(0, 0)).toBe(true);

    selectCell(0, 0);
    keyDownUp('c');

    expect(getDataAtCell(0, 0)).toBe(true);
    expect(afterChangeCallback.calls.count()).toEqual(1);
  });

  it('should add label on the beginning of a checkbox element', () => {
    handsontable({
      data: [{ checked: true, label: 'myLabel' }, { checked: false, label: 'myLabel' }],
      columns: [
        { type: 'checkbox', data: 'checked', label: { position: 'before', property: 'label' } }
      ]
    });

    const afterChangeCallback = jasmine.createSpy('afterChangeCallback');

    addHook('afterChange', afterChangeCallback);

    selectCell(0, 0);
    keyDownUp(' ');

    expect(getDataAtCell(0, 0)).toBe(false);
    expect(getDataAtCell(1, 0)).toBe(false);
    expect(afterChangeCallback.calls.count()).toEqual(1);
    expect(getCell(0, 0).querySelector('label').firstChild.textContent).toEqual('myLabel');
  });

  it('should expand label to the cell size when it is not separated from input', () => {
    handsontable({
      data: [
        [true, false, true, false, false, false]
      ],
      columns: [
        { type: 'checkbox', label: { position: 'before', value: 'label1', separated: true } },
        { type: 'checkbox', label: { position: 'after', value: 'label2', separated: true } },
        { type: 'checkbox', label: { position: 'before', value: 'label3', separated: false } },
        { type: 'checkbox', label: { position: 'after', value: 'label4', separated: false } },
        { type: 'checkbox', label: { position: 'before', value: 'label5' } },
        { type: 'checkbox', label: { position: 'after', value: 'label6' } },
      ]
    });

    // 2 x 4px padding + 1px border === 9px calculated by the `offsetWidth`
    expect(getCell(0, 0).querySelector('label').offsetWidth).not.toBe(getCell(0, 0).offsetWidth - 9);
    expect(getCell(0, 1).querySelector('label').offsetWidth).not.toBe(getCell(0, 1).offsetWidth - 9);
    expect(getCell(0, 2).querySelector('label').offsetWidth).forThemes(({ classic, main }) => {
      classic.toBe(getCell(0, 2).offsetWidth - 9);
      main.toBe(getCell(0, 2).offsetWidth - 17);
    });
    expect(getCell(0, 3).querySelector('label').offsetWidth).forThemes(({ classic, main }) => {
      classic.toBe(getCell(0, 3).offsetWidth - 9);
      main.toBe(getCell(0, 3).offsetWidth - 17);
    });
    expect(getCell(0, 4).querySelector('label').offsetWidth).forThemes(({ classic, main }) => {
      classic.toBe(getCell(0, 4).offsetWidth - 9);
      main.toBe(getCell(0, 4).offsetWidth - 17);
    });
    expect(getCell(0, 5).querySelector('label').offsetWidth).forThemes(({ classic, main }) => {
      classic.toBe(getCell(0, 5).offsetWidth - 9);
      main.toBe(getCell(0, 5).offsetWidth - 17);
    });
  });

  it('should add label on the beginning of a checkbox element where checkbox and label are separated', () => {
    handsontable({
      data: [{ checked: true, label: 'myLabel' }, { checked: false, label: 'myLabel' }],
      columns: [
        { type: 'checkbox', data: 'checked', label: { position: 'before', property: 'label', separated: true } }
      ]
    });

    const afterChangeCallback = jasmine.createSpy('afterChangeCallback');

    addHook('afterChange', afterChangeCallback);

    selectCell(0, 0);
    keyDownUp(' ');

    expect(getDataAtCell(0, 0)).toBe(false);
    expect(getDataAtCell(1, 0)).toBe(false);
    expect(afterChangeCallback.calls.count()).toEqual(1);
    expect(getCell(0, 0).querySelector('label').firstChild.textContent).toEqual('myLabel');
    expect(getCell(0, 0).querySelector('label').nextSibling.type).toEqual('checkbox');
  });

  it('should add label on the end of a checkbox element', () => {
    handsontable({
      data: [{ checked: true, label: 'myLabel' }, { checked: false, label: 'myLabel' }],
      columns: [
        { type: 'checkbox', data: 'checked', label: { position: 'after', property: 'label' } }
      ]
    });

    const afterChangeCallback = jasmine.createSpy('afterChangeCallback');

    addHook('afterChange', afterChangeCallback);

    selectCell(0, 0);
    keyDownUp(' ');

    expect(getDataAtCell(0, 0)).toBe(false);
    expect(getDataAtCell(1, 0)).toBe(false);
    expect(afterChangeCallback.calls.count()).toEqual(1);
    expect(getCell(0, 0).querySelector('label').lastChild.textContent).toEqual('myLabel');
  });

  it('should add label on the end of a checkbox element where checkbox and label are separated', () => {
    handsontable({
      data: [{ checked: true, label: 'myLabel' }, { checked: false, label: 'myLabel' }],
      columns: [
        { type: 'checkbox', data: 'checked', label: { position: 'after', property: 'label', separated: true } }
      ]
    });

    const afterChangeCallback = jasmine.createSpy('afterChangeCallback');

    addHook('afterChange', afterChangeCallback);

    selectCell(0, 0);
    keyDownUp(' ');

    expect(getDataAtCell(0, 0)).toBe(false);
    expect(getDataAtCell(1, 0)).toBe(false);
    expect(afterChangeCallback.calls.count()).toEqual(1);
    expect(getCell(0, 0).querySelector('label').lastChild.textContent).toEqual('myLabel');
    expect(getCell(0, 0).querySelector('label').previousSibling.type).toEqual('checkbox');
  });

  it('should not add label when value is incorrect (#bad-value)', () => {
    handsontable({
      data: [{ checked: 1, label: 'myLabel' }, { checked: 0, label: 'myLabel' }],
      columns: [
        { type: 'checkbox', data: 'checked', label: { position: 'after', property: 'label' } }
      ]
    });

    expect(getCell(0, 0).querySelector('label')).toBe(null);
  });

  it('by default should add label on the end of a checkbox element', () => {
    handsontable({
      data: [{ checked: true, label: { test: 'Baz' } }, { checked: false, label: { test: 'Baz' } }],
      columns: [
        { type: 'checkbox', data: 'checked', label: { property: 'label.test' } }
      ]
    });

    expect(getCell(0, 0).querySelector('label').lastChild.textContent).toEqual('Baz');
  });

  it('should add label with text filled from `value` label setting (passed as string)', () => {
    handsontable({
      data: [{ checked: true }, { checked: false }],
      columns: [
        { type: 'checkbox', data: 'checked', label: { value: 'myLabel' } }
      ]
    });

    expect(getCell(0, 0).querySelector('label').lastChild.textContent).toEqual('myLabel');
  });

  it('should add label with text filled from `value` label setting (passed as function)', () => {
    const labelFunction = jasmine.createSpy();

    labelFunction.and.returnValue('myLabel');
    handsontable({
      autoRowSize: false,
      autoColumnSize: false,
      data: [{ checked: true }, { checked: false }],
      columns: [
        { type: 'checkbox', data: 'checked', label: { value: labelFunction } }
      ]
    });

    expect(labelFunction.calls.count()).toBe(2);
    expect(labelFunction.calls.argsFor(0)).toEqual([0, 0, 'checked', true]);
    expect(labelFunction.calls.argsFor(1)).toEqual([1, 0, 'checked', false]);
    expect(getCell(0, 0).querySelector('label').lastChild.textContent).toEqual('myLabel');
  });

  it('should remove checkbox and do not add #bad-value# content after cut action', () => {
    const hot = handsontable({
      data: [
        { car: 'Mercedes A 160', available: true, comesInBlack: 'yes' },
        { car: 'Citroen C4 Coupe', available: false, comesInBlack: '' },
        { car: 'Audi A4 Avant', available: true, comesInBlack: 'no' },
      ],
      colHeaders: ['Car model', 'Accepted', 'Comes in black'],
      columns: [
        {
          data: 'car'
        },
        {
          data: 'available',
          type: 'checkbox',
          label: {
            position: 'after',
            property: 'car'
          },
        },
        {
          data: 'comesInBlack',
          type: 'checkbox',
          checkedTemplate: 'yes',
          uncheckedTemplate: 'no',
        },
      ],
    });
    const cutEvent = getClipboardEvent('cut');
    const plugin = hot.getPlugin('CopyPaste');
    const td = hot.getCell(0, 1);
    const td2 = hot.getCell(0, 2);
    const td3 = hot.getCell(1, 1);
    const td4 = hot.getCell(1, 2);
    const td5 = hot.getCell(2, 1);
    const td6 = hot.getCell(2, 2);

    selectCell(0, 0, 2, 2);

    plugin.onCut(cutEvent);

    expect(td.textContent).toBe('');
    expect(td2.textContent).toBe('');
    expect(td3.textContent).toBe('');
    expect(td4.textContent).toBe('');
    expect(td5.textContent).toBe('');
    expect(td6.textContent).toBe('');

    expect(getDataAtCell(0, 0)).toEqual(null);
    expect(getDataAtCell(0, 1)).toEqual(null);
    expect(getDataAtCell(0, 2)).toEqual(null);
    expect(getDataAtCell(1, 0)).toEqual(null);
    expect(getDataAtCell(1, 1)).toEqual(null);
    expect(getDataAtCell(1, 2)).toEqual(null);
    expect(getDataAtCell(2, 0)).toEqual(null);
    expect(getDataAtCell(2, 1)).toEqual(null);
    expect(getDataAtCell(2, 2)).toEqual(null);
  });

  it('should remove #bad-value# content after cut action', () => {
    const hot = handsontable({
      data: [
        { car: 'Mercedes A 160', available: true, comesInBlack: 'yes' },
        { car: 'Citroen C4 Coupe', available: false, comesInBlack: '' },
        { car: 'Audi A4 Avant', available: true, comesInBlack: 'no' },
      ],
      colHeaders: ['Car model', 'Accepted', 'Comes in black'],
      columns: [
        {
          data: 'car'
        },
        {
          data: 'available',
          type: 'checkbox',
          label: {
            position: 'after',
            property: 'car'
          },
        },
        {
          data: 'comesInBlack',
          type: 'checkbox',
          checkedTemplate: 'yes',
          uncheckedTemplate: 'no',
        },
      ],
    });
    const cutEvent = getClipboardEvent('cut');
    const plugin = hot.getPlugin('CopyPaste');
    const td = hot.getCell(1, 2);

    selectCell(1, 2);

    plugin.onCut(cutEvent);

    expect(td.textContent).toBe('');
  });

  it('should allow to change state of checkboxes in column headers', () => {
    const spy = jasmine.createSpyObj('error', ['test']);
    const prevError = window.onerror;

    window.onerror = function() {
      spy.test();
    };

    handsontable({
      data: [[true]],
      type: 'checkbox',
      colHeaders: ['<input type="checkbox"/> A'],
    });

    const headerCheckbox = getTopClone().find('input[type="checkbox"]')[0];

    expect(headerCheckbox.checked).toBe(false);

    headerCheckbox.click();

    expect(headerCheckbox.checked).toBe(true);
    expect(spy.test.calls.count()).toBe(0);

    window.onerror = prevError;
  });

  it('should allow to change state of checkboxes in row headers', () => {
    const spy = jasmine.createSpyObj('error', ['test']);
    const prevError = window.onerror;

    window.onerror = function() {
      spy.test();
    };

    handsontable({
      data: [[true]],
      type: 'checkbox',
      rowHeaders: ['<input type="checkbox"/> 1'],
    });

    const headerCheckbox = getInlineStartClone().find('input[type="checkbox"]')[0];

    expect(headerCheckbox.checked).toBe(false);

    headerCheckbox.click();

    expect(headerCheckbox.checked).toBe(true);
    expect(spy.test.calls.count()).toBe(0);

    window.onerror = prevError;
  });

  it('should render the cell without messing with "dir" attribute', () => {
    handsontable({
      data: [['foo']],
      renderer: 'checkbox'
    });

    expect(getCell(0, 0).getAttribute('dir')).toBeNull();
  });

  describe('CheckboxRenderer with ContextMenu', () => {
    it('should add class name `htRight` after set align in contextMenu', (done) => {
      handsontable({
        startRows: 1,
        startCols: 1,
        contextMenu: ['alignment'],
        cells() {
          return {
            type: 'checkbox'
          };
        },
        height: 100
      });

      selectCell(0, 0);

      contextMenu();

      const menu = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator');

      menu.simulate('mouseover');

      setTimeout(() => {
        const contextSubMenu = $(`.htContextMenuSub_${menu.text()}`).find('tbody td').eq(2);

        contextSubMenu.simulate('mousedown');
        contextSubMenu.simulate('mouseup');

        expect($('.handsontable.ht_master .htRight').length).toBe(1);
        done();
      }, 500);
    });
  });
});
