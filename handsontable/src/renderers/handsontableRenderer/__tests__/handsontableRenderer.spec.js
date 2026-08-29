describe('HandsontableRenderer', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}" style="width: 300px; height: 200px;"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should internally call base renderer once', async() => {
    const originalBaseRenderer = Handsontable.renderers.BaseRenderer;

    const renderedCellCalls = [];

    spyOn(Handsontable.renderers, 'BaseRenderer').and.callFake((...args) => {
      const TD = args[1];

      // The GhostTable that AutoColumnSize measures in renders its own cells, flagged with the
      // `ghost-table` attribute, and those go through the same renderer contract. They are a
      // separate render pass, not a second call on the rendered cell this spec is about.
      if (!TD.hasAttribute('ghost-table')) {
        renderedCellCalls.push(TD);
      }
    });

    Handsontable.renderers.registerRenderer('base', Handsontable.renderers.BaseRenderer);
    handsontable({
      data: [['test']],
      renderer: 'handsontable',
    });

    expect(renderedCellCalls.length).toBe(1);

    Handsontable.renderers.registerRenderer('base', originalBaseRenderer);
  });
});
