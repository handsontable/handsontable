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
      removeRowPlugin: true,
      height: 400,
      width: 400,
      rowHeaders: true,
      colHeaders: true
    });

    expect($('.htRemoveRow .btn:visible').length).toBe(0);

    this.$container.find('tr:eq(1) td:eq(0)').simulate('mouseover');

    expect($('.htRemoveRow .btn:visible').length).toBe(1);
  });

  it('should show X when mouse is over cell (Handsontable in a table)', function () {
    var $table = $('<table><tr><td></td></tr></table>').appendTo('body');
    this.$container.appendTo($table.find('td'));

    handsontable({
      removeRowPlugin: true,
      height: 400,
      width: 400,
      rowHeaders: true,
      colHeaders: true
    });

    expect($('.htRemoveRow .btn:visible').length).toBe(0);

    this.$container.find('tr:eq(1) td:eq(0)').simulate('mouseover');

    expect($('.htRemoveRow .btn:visible').length).toBe(1);

    destroy();
    $table.remove();
  });

  it("should be possible to enable plugin using updateSettings", function () {
    handsontable({
      rowHeaders: true,
      colHeaders: true
    });

    expect(this.$container.find('tbody th.htRemoveRow').length).toBe(0);

    updateSettings({
      removeRowPlugin: true
    });

    expect(this.$container.find('.wtHolder').first().find('tbody th.htRemoveRow').length).toBe(5);
  });

  it("should be possible to disable plugin using updateSettings", function () {
    handsontable({
      removeRowPlugin: true,
      rowHeaders: true,
      colHeaders: true
    });

    expect(this.$container.find('.wtHolder').first().find('tbody th.htRemoveRow').length).toBe(5);

    updateSettings({
      removeRowPlugin: false
    });

    expect(this.$container.find('tbody th.htRemoveRow').length).toBe(0);
  });

  it('should apply enablig/disabling plugin only to particular HOT instance', function(){
    this.$container2 = $('<div id="' + id + '-2"></div>').appendTo('body');

    var hot1 = handsontable({
      removeRowPlugin: true,
      rowHeaders: true,
      colHeaders: true
    });

    this.$container2.handsontable({
      removeRowPlugin: true
    });

    var hot2 = this.$container2.handsontable('getInstance');

    expect(this.$container.find('.wtHolder').first().find('tbody th.htRemoveRow').length).toBe(5);
    expect(this.$container2.find('.wtHolder').first().find('tbody th.htRemoveRow').length).toBe(5);

    hot2.updateSettings({
      removeRowPlugin: false
    });

    expect(this.$container.find('.wtHolder').first().find('tbody th.htRemoveRow').length).toBe(5);
    expect(this.$container2.find('tbody th.htRemoveRow').length).toBe(0);

    this.$container2.handsontable('destroy');
    this.$container2.remove();

  });
});
