describe('RemoveRowSpec', function () {
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

  it('should show X when mouse is over cell', function () {
    handsontable({
      removeRowPlugin: true
    });

    expect($('.htRemoveRow .btn:visible').length).toBe(0);

    this.$container.find('tr:eq(0) td:eq(0)').trigger('mouseenter');

    expect($('.htRemoveRow .btn:visible').length).toBe(1);
  });

  it('should show X when mouse is over cell (Handsontable in a table)', function () {
    var $table = $('<table><tr><td></td></tr></table>').appendTo('body');
    this.$container.appendTo($table.find('td'));

    handsontable({
      removeRowPlugin: true
    });

    expect($('.htRemoveRow .btn:visible').length).toBe(0);

    this.$container.find('tr:eq(0) td:eq(0)').trigger('mouseenter');

    expect($('.htRemoveRow .btn:visible').length).toBe(1);

    $table.remove();
  });
});