describe('TimeRenderer', () => {
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

  it('should internally call base renderer once', async() => {
    const originalBaseRenderer = Handsontable.renderers.BaseRenderer;

    spyOn(Handsontable.renderers, 'BaseRenderer');

    Handsontable.renderers.registerRenderer('base', Handsontable.renderers.BaseRenderer);
    handsontable({
      data: [['test']],
      type: 'intlTime',
    });

    expect(Handsontable.renderers.BaseRenderer).toHaveBeenCalledTimes(1);

    Handsontable.renderers.registerRenderer('base', originalBaseRenderer);
  });
});
