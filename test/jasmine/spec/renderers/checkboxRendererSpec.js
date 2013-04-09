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

    runs(function () {
      handsontable({
        data  :  [[true],[false],[true]],
        columns : [
          { type: 'checkbox' }
        ]
      });
    });

    waits(60);

    runs(function () {
      this.$container.find('input[type="checkbox"]').trigger('mousedown');
    });

    waits(30);

    runs(function () {
      expect(getData(0,0,2,0)).toEqual([[false],[true],[false]]);
    });
  });
});