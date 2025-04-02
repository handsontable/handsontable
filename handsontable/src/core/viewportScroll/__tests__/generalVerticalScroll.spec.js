describe('Vertical scroll', () => {
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

  it('should correctly scroll the viewport when the partially visible row is clicked and there is no fully visible column (#dev-1705)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 5),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
      rowHeights: (index) => {
        return index === 9 ? 500 : undefined;
      }
    });

    // make sure that the `9` row is partially visible
    await scrollOverlay(topOverlay(), 195);

    // select the `9` row
    selectCell(8, 0);

    await sleep(10);

    // expect that the viewport is scrolled to the beginning of the `9` row
    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(184);
      main.toBe(195);
      horizon.toBe(195);
    });
  });

  it('should not render all rows when the viewport height is set to `0` and the trimming container is scrolled programmatically (#dev-2211)', async() => {
    spec().$container.css('height', '0').css('overflow', 'hidden');

    const hot = handsontable({
      data: createSpreadsheetData(100, 5),
    });

    expect(hot.rootElement.querySelector('.ht_master tbody').childNodes.length).toBe(0);

    await scrollOverlay(topOverlay(), 100);

    expect(hot.rootElement.querySelector('.ht_master tbody').childNodes.length).toBe(0);
    expect(hot.view.getWorkspaceHeight()).not.toBe(Infinity);
  });
});
