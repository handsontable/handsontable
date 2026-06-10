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

  it('should contain overscroll only on the horizontal axis when the grid scrolls horizontally only', async() => {
    handsontable({
      data: createSpreadsheetData(3, 10), // few rows → fits vertically
      colWidths: 100, // 10 × 100 = 1000px → wider than the 200px viewport
      width: 200,
      height: 500,
    });

    const holder = getMasterHolder();

    expect(holder.scrollWidth).toBeGreaterThan(holder.clientWidth);
    expect(holder.scrollHeight).toBe(holder.clientHeight);

    expect(holder.classList.contains('htOverscrollContainX')).toBe(true);
    expect(holder.classList.contains('htOverscrollContainY')).toBe(false);

    // The fix: the non-scrollable (vertical) axis keeps `auto` chaining, so a
    // vertical wheel over the grid is not trapped and scrolls the page.
    expect(getComputedStyle(holder).overscrollBehaviorY).not.toBe('none');
    expect(getComputedStyle(holder).overscrollBehaviorX).toBe('none');
  });

  it('should contain overscroll only on the vertical axis when the grid scrolls vertically only', async() => {
    handsontable({
      data: createSpreadsheetData(100, 3),
      colWidths: 50, // 3 × 50 = 150px → narrower than the 500px viewport
      width: 500,
      height: 100,
    });

    const holder = getMasterHolder();

    expect(holder.scrollHeight).toBeGreaterThan(holder.clientHeight);
    expect(holder.scrollWidth).toBe(holder.clientWidth);

    expect(holder.classList.contains('htOverscrollContainY')).toBe(true);
    expect(holder.classList.contains('htOverscrollContainX')).toBe(false);

    expect(getComputedStyle(holder).overscrollBehaviorX).not.toBe('none');
    expect(getComputedStyle(holder).overscrollBehaviorY).toBe('none');
  });

  it('should contain overscroll on both axes when the grid scrolls in both directions', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      colWidths: 100,
      width: 200,
      height: 100,
    });

    const holder = getMasterHolder();

    expect(holder.scrollWidth).toBeGreaterThan(holder.clientWidth);
    expect(holder.scrollHeight).toBeGreaterThan(holder.clientHeight);

    expect(holder.classList.contains('htOverscrollContainX')).toBe(true);
    expect(holder.classList.contains('htOverscrollContainY')).toBe(true);
  });

  it('should not contain overscroll on any axis in window-scroll mode (no width/height)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      // no width / no height → the window is the scroller, holder is not a scroll container
    });

    const holder = getMasterHolder();

    expect(holder.classList.contains('htOverscrollContainX')).toBe(false);
    expect(holder.classList.contains('htOverscrollContainY')).toBe(false);
    expect(getComputedStyle(holder).overscrollBehaviorX).not.toBe('none');
    expect(getComputedStyle(holder).overscrollBehaviorY).not.toBe('none');
  });

  it('should drop the vertical containment after the grid is resized so it no longer scrolls vertically', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(100, 3),
      colWidths: 50,
      width: 500,
      height: 100,
    });

    expect(getMasterHolder().classList.contains('htOverscrollContainY')).toBe(true);

    hot.updateSettings({ height: 5000 }); // tall enough that all 100 rows fit
    await render();

    const holder = getMasterHolder();

    expect(holder.scrollHeight).toBe(holder.clientHeight);
    expect(holder.classList.contains('htOverscrollContainY')).toBe(false);
  });
});
