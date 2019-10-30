describe('SelectEditor', () => {

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

  it('should display select', () => {
    handsontable({
      columns: [
        {
          editor: 'select'
        }
      ]
    });

    selectCell(0, 0);

    const editor = $('.htSelectEditor');

    expect(editor.length).toEqual(1);
    expect(editor.is('select')).toBe(true);
    expect(editor.is(':visible')).toBe(false);

    keyDown('enter');

    expect(editor.is(':visible')).toBe(true);
    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it('should display and correctly reposition select editor while scrolling', (done) => {
    const hot = handsontable({
      width: 200,
      height: 200,
      data: Handsontable.helper.createSpreadsheetData(100, 100),
      columns: [
        {
          editor: 'select'
        }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, { editor: 'select' }
      ]
    });
    const mainHolder = hot.view.wt.wtTable.holder;

    selectCell(0, 0);
    keyDown('enter');
    keyUp('enter');

    mainHolder.scrollTop = 10;
    mainHolder.scrollLeft = 20;
    const editor = $('.htSelectEditor');

    setTimeout(() => {
      expect(editor.css('top')).toEqual('-10px');
      expect(editor.css('left')).toEqual('-20px');
      done();
    }, 200);
  });

  it('should populate select with given options (array)', () => {
    const options = [
      'Misubishi', 'Chevrolet', 'Lamborgini'
    ];

    handsontable({
      columns: [
        {
          editor: 'select',
          selectOptions: options
        }
      ]
    });

    selectCell(0, 0);

    const editor = $('.htSelectEditor');

    keyDown('enter');

    const $options = editor.find('option');

    expect($options.length).toEqual(options.length);
    expect($options.eq(0).val()).toMatch(options[0]);
    expect($options.eq(0).html()).toMatch(options[0]);
    expect($options.eq(1).val()).toMatch(options[1]);
    expect($options.eq(1).html()).toMatch(options[1]);
    expect($options.eq(2).val()).toMatch(options[2]);
    expect($options.eq(2).html()).toMatch(options[2]);
  });

  it('should populate select with given options (object)', () => {
    const options = {
      mit: 'Misubishi',
      che: 'Chevrolet',
      lam: 'Lamborgini'
    };

    handsontable({
      columns: [
        {
          editor: 'select',
          selectOptions: options
        }
      ]
    });

    selectCell(0, 0);

    const editor = $('.htSelectEditor');

    keyDown('enter');

    const $options = editor.find('option');

    expect($options.eq(0).val()).toMatch('mit');
    expect($options.eq(0).html()).toMatch(options.mit);
    expect($options.eq(1).val()).toMatch('che');
    expect($options.eq(1).html()).toMatch(options.che);
    expect($options.eq(2).val()).toMatch('lam');
    expect($options.eq(2).html()).toMatch(options.lam);
  });

  it('should populate select with given options (function:array)', () => {
    const options = function() {
      return [
        'Misubishi', 'Chevrolet', 'Lamborgini'
      ];
    };

    handsontable({
      columns: [
        {
          editor: 'select',
          selectOptions: options
        }
      ]
    });

    selectCell(0, 0);

    const editor = $('.htSelectEditor');

    keyDown('enter');

    const $options = editor.find('option');

    expect($options.length).toEqual(options().length);
    expect($options.eq(0).val()).toMatch(options()[0]);
    expect($options.eq(0).html()).toMatch(options()[0]);
    expect($options.eq(1).val()).toMatch(options()[1]);
    expect($options.eq(1).html()).toMatch(options()[1]);
    expect($options.eq(2).val()).toMatch(options()[2]);
    expect($options.eq(2).html()).toMatch(options()[2]);
  });

  it('should populate select with given options (function:object)', () => {
    const options = function() {
      return {
        mit: 'Misubishi',
        che: 'Chevrolet',
        lam: 'Lamborgini'
      };
    };

    handsontable({
      columns: [
        {
          editor: 'select',
          selectOptions: options
        }
      ]
    });

    selectCell(0, 0);

    const editor = $('.htSelectEditor');

    keyDown('enter');

    const $options = editor.find('option');

    expect($options.eq(0).val()).toMatch('mit');
    expect($options.eq(0).html()).toMatch(options().mit);
    expect($options.eq(1).val()).toMatch('che');
    expect($options.eq(1).html()).toMatch(options().che);
    expect($options.eq(2).val()).toMatch('lam');
    expect($options.eq(2).html()).toMatch(options().lam);
  });

  it('should mark option matching cell value as selected', () => {
    const options = [
      'Misubishi', 'Chevrolet', 'Lamborgini'
    ];

    handsontable({
      data: [
        ['Misubishi'],
        ['Lamborgini'],
        ['Chevrolet']
      ],
      columns: [
        {
          editor: 'select',
          selectOptions: options
        }
      ]
    });

    selectCell(0, 0);

    const editor = $('.htSelectEditor');

    keyDown('enter');

    expect(editor.find('option:selected').text()).toEqual(getDataAtCell(0, 0));

    keyDown('enter');

    selectCell(1, 0);
    keyDown('enter');

    expect(editor.find('option:selected').text()).toEqual(getDataAtCell(1, 0));

    keyDown('enter');

    selectCell(2, 0);
    keyDown('enter');

    expect(editor.find('option:selected').text()).toEqual(getDataAtCell(2, 0));

    keyDown('enter');
  });

  it('should not prevent the default event action when select is clicked', () => {

    const options = function() {
      return [
        'Misubishi', 'Chevrolet', 'Lamborgini'
      ];
    };

    handsontable({
      columns: [
        {
          editor: 'select',
          selectOptions: options
        }
      ]
    });

    selectCell(0, 0);

    const editor = $('.htSelectEditor');

    keyDown('enter');

    const selectMouseDownListener = jasmine.createSpy('selectMouseDownListener');
    $('body').on('mousedown', selectMouseDownListener);

    editor.mousedown();

    expect(selectMouseDownListener.calls.count()).toEqual(1);

    const event = selectMouseDownListener.calls.argsFor(0)[0];

    expect(event).toBeDefined();
    expect(event.isDefaultPrevented()).toBe(false);
  });

  describe('IME support', () => {
    it('should focus editable element (from copyPaste plugin) after selecting the cell', async() => {
      handsontable({
        editor: false,
      });
      selectCell(0, 0, 0, 0, true, false);

      await sleep(10);

      expect(document.activeElement).toBe(document.querySelector('.HandsontableCopyPaste'));
    });
  });
});
