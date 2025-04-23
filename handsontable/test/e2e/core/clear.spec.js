describe('Core.clear', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find(`#${id}`).remove();
    }
  });

  it('should start listening table after call method', async() => {
    handsontable({});

    expect(isListening()).toBe(false);

    await clear();

    expect(isListening()).toBe(true);
  });
});
