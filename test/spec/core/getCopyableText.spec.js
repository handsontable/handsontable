describe('Core.getCopyableText', function () {
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

  it('should return copyable string when `copyable` option is enabled', function () {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      copyable: true
    });

    expect(getCopyableText(0, 0)).toBe('A1\n');
    expect(getCopyableText(0, 0, 1, 2)).toBe('A1\tB1\tC1\nA2\tB2\tC2\n');
  });

  it('should return empty string as copyable data when `copyable` option is disabled', function () {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      copyable: false
    });

    expect(getCopyableText(0, 0)).toBe('\n');
    expect(getCopyableText(0, 0, 1, 2)).toBe('\t\t\n\t\t\n');
  });
});
