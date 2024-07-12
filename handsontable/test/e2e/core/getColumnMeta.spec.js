describe('Core.getColumnMeta', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should get the column meta', () => {
    handsontable({
      testMeta: true,
      columns: [
        { testMeta: false },
        {},
        { testMeta: 'test' }
      ]
    });

    expect(getColumnMeta(0).testMeta).toBe(false);
    expect(getColumnMeta(1).testMeta).toBe(true);
    expect(getColumnMeta(2).testMeta).toBe('test');
  });

  it('should utilize the visual column indexes as arguments', () => {
    handsontable({
      testMeta: true,
      columns: [
        { testMeta: false },
        {},
        { testMeta: 'test' }
      ],
      manualColumnMove: [2, 1, 0]
    });

    expect(getColumnMeta(0).testMeta).toBe('test');
    expect(getColumnMeta(1).testMeta).toBe(true);
    expect(getColumnMeta(2).testMeta).toBe(false);
  });
});
