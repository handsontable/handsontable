describe('SelectEditor', function () {

  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it("should display select", function () {
     handsontable({
       columns: [
         {
           editor: 'select'
         }
       ]
     });

    selectCell(0, 0);

    var editor = $('.htSelectEditor');

    expect(editor.length).toEqual(1);
    expect(editor.is('select')).toBe(true);
    expect(editor.is(':visible')).toBe(false);

    keyDown('enter');

    expect(editor.is(':visible')).toBe(true);
    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it("should display and correctly reposition select editor while scrolling", function () {
     var hot = handsontable({
       width: 200,
       height: 200,
       data: Handsontable.helper.createSpreadsheetData(100, 100),
       columns: [
         {
           editor: 'select'
         }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {editor: 'select'}
       ]
     });
    var mainHolder = hot.view.wt.wtTable.holder;

    selectCell(0, 0);
    keyDown('enter');
    keyUp('enter');

    mainHolder.scrollTop = 10;
    mainHolder.scrollLeft = 20;
    var editor = $('.htSelectEditor');

    waits(200);

    runs(function() {
      expect(editor.css('top')).toEqual('-10px');
      expect(editor.css('left')).toEqual('-20px');
    });
  });

  it("should populate select with given options (array)", function () {
    var options = [
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

    var editor = $('.htSelectEditor');

    keyDown('enter');

    var $options = editor.find('option');

    expect($options.length).toEqual(options.length);
    expect($options.eq(0).val()).toMatch(options[0]);
    expect($options.eq(0).html()).toMatch(options[0]);
    expect($options.eq(1).val()).toMatch(options[1]);
    expect($options.eq(1).html()).toMatch(options[1]);
    expect($options.eq(2).val()).toMatch(options[2]);
    expect($options.eq(2).html()).toMatch(options[2]);
  });

  it("should populate select with given options (object)", function () {
    var options = {
      'mit' : 'Misubishi',
      'che' : 'Chevrolet',
      'lam' : 'Lamborgini'
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

    var editor = $('.htSelectEditor');

    keyDown('enter');

    var $options = editor.find('option');

    expect($options.eq(0).val()).toMatch('mit');
    expect($options.eq(0).html()).toMatch(options['mit']);
    expect($options.eq(1).val()).toMatch('che');
    expect($options.eq(1).html()).toMatch(options['che']);
    expect($options.eq(2).val()).toMatch('lam');
    expect($options.eq(2).html()).toMatch(options['lam']);
  });

  it("should populate select with given options (function:array)", function () {
    var options = function () {
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

    var editor = $('.htSelectEditor');

    keyDown('enter');

    var $options = editor.find('option');

    expect($options.length).toEqual(options().length);
    expect($options.eq(0).val()).toMatch(options()[0]);
    expect($options.eq(0).html()).toMatch(options()[0]);
    expect($options.eq(1).val()).toMatch(options()[1]);
    expect($options.eq(1).html()).toMatch(options()[1]);
    expect($options.eq(2).val()).toMatch(options()[2]);
    expect($options.eq(2).html()).toMatch(options()[2]);
  });

  it("should populate select with given options (function:object)", function () {
    var options = function () {
      return {
        'mit' : 'Misubishi',
        'che' : 'Chevrolet',
        'lam' : 'Lamborgini'
      }
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

    var editor = $('.htSelectEditor');

    keyDown('enter');

    var $options = editor.find('option');

    expect($options.eq(0).val()).toMatch('mit');
    expect($options.eq(0).html()).toMatch(options()['mit']);
    expect($options.eq(1).val()).toMatch('che');
    expect($options.eq(1).html()).toMatch(options()['che']);
    expect($options.eq(2).val()).toMatch('lam');
    expect($options.eq(2).html()).toMatch(options()['lam']);
  });

  it("should mark option matching cell value as selected", function () {
    var options = [
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

    var editor = $('.htSelectEditor');

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

  it("should not prevent the default event action when select is clicked", function () {

    var options = function () {
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

    var editor = $('.htSelectEditor');

    keyDown('enter');
    var select = editor.find('select');

    var selectMouseDownListener = jasmine.createSpy('selectMouseDownListener');
    $('body').on('mousedown', selectMouseDownListener);

    editor.mousedown();

    expect(selectMouseDownListener.calls.length).toEqual(1);

    var event = selectMouseDownListener.calls[0].args[0];

    expect(event).toBeDefined();
    expect(event.isDefaultPrevented()).toBe(false);
  });
});
