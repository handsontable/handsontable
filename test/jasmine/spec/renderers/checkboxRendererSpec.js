describe('CheckboxRenderer', function () {
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

  it('should reverse selection in checkboxes', function () {
    handsontable({
      data  :  [[true],[false],[true]],
      columns : [
        { type: 'checkbox' }
      ]
    });

    this.$container.find('input[type="checkbox"]').trigger('mousedown');

    expect(getData(0,0,2,0)).toEqual([[false],[true],[false]]);
  });

  it('shouldn\'t uncheck checkboxes', function () {
    handsontable({
      data  :  [[true],[true],[true]],
      columns : [
        { type: 'checkbox', readOnly : true }
      ]
    });

    this.$container.find('input[type="checkbox"]').trigger('mousedown');

    expect(getData(0,0,2,0)).toEqual([[true],[true],[true]]);
  });
});