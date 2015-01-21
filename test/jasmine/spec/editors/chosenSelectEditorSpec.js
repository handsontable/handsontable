describe('chosenSelectEditor', function () {

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

  it("should display chosen select", function () {

     handsontable({
       columns: [
         {
           editor: 'chosenselect'
         }
       ]
     });

    selectCell(0, 0);

    var editor = $('.htChosenSelectEditor');

    var chosenContainer = $('.chosen-container');

    expect(editor.length).toEqual(1);
    expect(editor.is('select')).toBe(true);
    expect(editor.is(':visible')).toBe(false);
    expect(chosenContainer.length).toEqual(0);

    keyDown('enter');

    chosenContainer = $('.chosen-container');

    expect(editor.is(':visible')).toBe(false);
    expect(chosenContainer.length).toEqual(1);
    expect(chosenContainer.is('div')).toBe(true);
    expect(chosenContainer.is(':visible')).toBe(true);
    expect(chosenContainer.offset()).toEqual($(getCell(0, 0)).offset());

  });

  it("should populate chosen select with given options (array)", function () {
    var options = [
      'Misubishi', 'Chevrolet', 'Lamborgini'
    ];

    handsontable({
      columns: [
        {
          editor: 'chosenselect',
          selectOptions: options
        }
      ]
    });

    selectCell(0, 0);

    var editor = $('.htChosenSelectEditor');

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

  it("should populate chosen select with given options (object)", function () {
    var options = {
      'mit' : 'Misubishi',
      'che' : 'Chevrolet',
      'lam' : 'Lamborgini'
    };

    handsontable({
      columns: [
        {
          editor: 'chosenselect',
          selectOptions: options
        }
      ]
    });

    selectCell(0, 0);

    var editor = $('.htChosenSelectEditor');

    keyDown('enter');

    var $options = editor.find('option');

    expect($options.eq(0).val()).toMatch('mit');
    expect($options.eq(0).html()).toMatch(options['mit']);
    expect($options.eq(1).val()).toMatch('che');
    expect($options.eq(1).html()).toMatch(options['che']);
    expect($options.eq(2).val()).toMatch('lam');
    expect($options.eq(2).html()).toMatch(options['lam']);
  });

  it("should populate chosen select with given options (function:array)", function () {
    var options = function () {
      return [
        'Misubishi', 'Chevrolet', 'Lamborgini'
      ];
    };

    handsontable({
      columns: [
        {
          editor: 'chosenselect',
          selectOptions: options
        }
      ]
    });

    selectCell(0, 0);

    var editor = $('.htChosenSelectEditor');

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

  it("should populate chosen select with given options (function:object)", function () {
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
          editor: 'chosenselect',
          selectOptions: options
        }
      ]
    });

    selectCell(0, 0);

    var editor = $('.htChosenSelectEditor');

    keyDown('enter');

    var $options = editor.find('option');

    expect($options.eq(0).val()).toMatch('mit');
    expect($options.eq(0).html()).toMatch(options()['mit']);
    expect($options.eq(1).val()).toMatch('che');
    expect($options.eq(1).html()).toMatch(options()['che']);
    expect($options.eq(2).val()).toMatch('lam');
    expect($options.eq(2).html()).toMatch(options()['lam']);
  });

});
