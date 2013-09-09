describe('selectEditor', function () {

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

  it("should populate select with given options", function () {
    var options = [
      'Misubishi', 'Chevrolet', 'Lamborgini'
    ];

    handsontable({
      columns: [
        {
          editor: 'select',
          options: options
        }
      ]
    });

    selectCell(0, 0);

    var editor = $('.htSelectEditor');

    keyDown('enter');

    expect(editor.find('option').length).toEqual(options.length);
  });

  it("should mark option maching cell value as selected", function () {
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
          options: options
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



});