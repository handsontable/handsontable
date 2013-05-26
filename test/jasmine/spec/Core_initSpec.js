describe('Core_init', function () {
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

  it('should respect startRows and startCols when no data is provided', function () {
    this.$container.remove();
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
    handsontable();

    expect(countRows()).toEqual(5); //as given in README.md
    expect(countCols()).toEqual(5); //as given in README.md
  });

  it('should respect width provided in inline style', function () {
    this.$container.css({
      overflow: 'auto',
      width: '200px'
    });
    handsontable({
      data: [
        ["ABC", "ABC", "ABC", "ABC", "ABC", "ABC", "ABC", "ABC", "ABC"]
      ]
    });

    expect(this.$container.width()).toEqual(200);
  });

  it('should respect width provided in CSS class', function () {
    $('<style>.myTable {overflow: auto; width: 200px}</style>').appendTo('head');
    this.$container.addClass('myTable');
    handsontable({
      data: [
        ["ABC", "ABC", "ABC", "ABC", "ABC", "ABC", "ABC", "ABC", "ABC"]
      ]
    });

    expect(this.$container.width()).toEqual(200);
  });

  it('should construct when container is not appended to document', function () {
    this.$container.remove();
    handsontable();
    expect(getData()).toBeTruthy();
  });
});
