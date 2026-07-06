describe('Table.draw() lifecycle hooks (characterization for the drawCycle refactor)', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(100).height(201);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore');
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(100, 4);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  it('should fire `beforeDraw` then `onDraw` exactly once each on a master full draw', async() => {
    const order = [];
    const beforeDraw = jasmine.createSpy('beforeDraw').and.callFake(() => order.push('beforeDraw'));
    const onDraw = jasmine.createSpy('onDraw').and.callFake(() => order.push('onDraw'));

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      beforeDraw,
      onDraw,
    });

    wt.draw();

    expect(beforeDraw).toHaveBeenCalledTimes(1);
    expect(onDraw).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['beforeDraw', 'onDraw']);
  });

  it('should NOT fire `beforeDraw` / `onDraw` on a fast (reposition-only) draw', async() => {
    const beforeDraw = jasmine.createSpy('beforeDraw');
    const onDraw = jasmine.createSpy('onDraw');

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      beforeDraw,
      onDraw,
    });

    wt.draw(); // full draw first

    beforeDraw.calls.reset();
    onDraw.calls.reset();

    wt.draw(true); // fast draw, no viewport change -> stays fast

    expect(beforeDraw).toHaveBeenCalledTimes(0);
    expect(onDraw).toHaveBeenCalledTimes(0);
  });

  it('should fire `beforeDraw` but SKIP `onDraw` when beforeDraw sets skipRender', async() => {
    const beforeDraw = jasmine.createSpy('beforeDraw').and.callFake((_, skip) => {
      skip.skipRender = true;
    });
    const onDraw = jasmine.createSpy('onDraw');

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      beforeDraw,
      onDraw,
    });

    wt.draw();

    expect(beforeDraw).toHaveBeenCalledTimes(1);
    expect(onDraw).toHaveBeenCalledTimes(0); // render (and its onDraw) is gated off
  });
});
