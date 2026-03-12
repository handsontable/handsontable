describe('Walkontable scroll performance', () => {
  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore');
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
  });

  afterEach(function() {
    $('.wtHolder').remove();
    this.$wrapper.remove();

    if (this.wotInstance) {
      this.wotInstance.destroy();
    }
  });

  it('should avoid per-row height lookup for large uniform ranges', async function() {
    const totalRows = 100001;
    const wt = walkontable({
      data: () => 'x',
      totalRows: () => totalRows,
      totalColumns: () => 5,
      uniformRowHeight: 23,
    });

    this.wotInstance = wt;
    wt.draw();

    spyOn(wt.wtTable, 'getRowHeight').and.callThrough();
    wt.wtTable.getRowHeight.calls.reset();

    const sum = wt.wtOverlays.topOverlay.sumCellSizes(0, totalRows);

    expect(sum).toBe(totalRows * 23);
    expect(wt.wtTable.getRowHeight).not.toHaveBeenCalled();
  });
});
