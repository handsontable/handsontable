describe('Overscroll behavior (wheel scroll chaining)', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  const getMasterHolder = () => document.querySelector('#testContainer .ht_master .wtHolder');

  // Regression guard for DEV-1856: a blanket `overscroll-behavior: none` on the master
  // holder (added in #12472, never released) disabled scroll chaining, so a mouse wheel
  // over the grid was trapped and the page never scrolled once the grid reached — or could
  // not reach — its scroll boundary. The holder must keep the default `auto` so the wheel
  // chains to the window.

  it('should not disable scroll chaining on a grid that scrolls both axes', async() => {
    handsontable({
      data: createSpreadsheetData(100, 12),
      colWidths: 100, // wider than the viewport → horizontal scroll
      width: 300,
      height: 200, // shorter than the content → vertical scroll
    });

    const holder = getMasterHolder();

    expect(holder.scrollWidth).toBeGreaterThan(holder.clientWidth);
    expect(holder.scrollHeight).toBeGreaterThan(holder.clientHeight);
    expect(getComputedStyle(holder).overscrollBehaviorX).toBe('auto');
    expect(getComputedStyle(holder).overscrollBehaviorY).toBe('auto');
  });

  it('should not disable scroll chaining on a grid that scrolls horizontally only', async() => {
    handsontable({
      data: createSpreadsheetData(3, 12), // few rows → fits vertically
      colWidths: 100,
      width: 300,
      height: 500,
    });

    const holder = getMasterHolder();

    expect(holder.scrollWidth).toBeGreaterThan(holder.clientWidth);
    expect(getComputedStyle(holder).overscrollBehaviorX).toBe('auto');
    expect(getComputedStyle(holder).overscrollBehaviorY).toBe('auto');
  });

  it('should not disable scroll chaining in window-scroll mode (no width/height)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    const holder = getMasterHolder();

    expect(getComputedStyle(holder).overscrollBehaviorX).toBe('auto');
    expect(getComputedStyle(holder).overscrollBehaviorY).toBe('auto');
  });
});
