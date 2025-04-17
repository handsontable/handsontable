describe('Core.clear', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('#rootWrapper');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should start listening table after call method', () => {
    handsontable({});

    expect(isListening()).toBe(false);

    clear();

    expect(isListening()).toBe(true);
  });
});
