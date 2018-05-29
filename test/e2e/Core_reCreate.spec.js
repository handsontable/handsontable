describe('Core_reCreate', () => {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should correctly re-render corner header when there is multiline content', () => {
    var settings = {
      rowHeaders: true,
      colHeaders(col) {
        return `Column<br>${col}`;
      }
    };
    handsontable(settings);
    destroy();
    handsontable(settings);

    expect(getTopLeftClone().width()).toBe(54);
    expect(getTopLeftClone().height()).toBe(51);
  });
});
