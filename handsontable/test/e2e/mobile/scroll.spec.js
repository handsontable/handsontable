const id = 'testContainer';

describe('Scrolling', () => {
  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should load cells below the viewport on scroll down (dimensions of the table was set)', async() => {
    handsontable({
      width: 400,
      height: 400,
      data: createSpreadsheetObjectData(100, 15)
    });

    const $htCore = $(getHtCore());

    let TRs = $htCore.find('tr');
    let lastTR = [...TRs.toArray()].pop();
    const lastTRTextAtStart = $(lastTR).text();

    await scrollViewportVertically(400);

    TRs = $htCore.find('tr');
    lastTR = [...TRs.toArray()].pop();
    const lastTRTextLater = $(lastTR).text();

    expect(lastTRTextLater).not.toEqual(lastTRTextAtStart);
  });

  it('should load cells below the viewport on scroll down (dimensions of the table was not set)', async() => {
    handsontable({
      data: createSpreadsheetObjectData(100, 15)
    });

    const $htCore = $(getHtCore());

    let TRs = $htCore.find('tr');
    let lastTR = [...TRs.toArray()].pop();
    const lastTRTextAtStart = $(lastTR).text();

    await sleep(300);

    $(window).scrollTop(window.innerHeight);

    await sleep(300);

    TRs = $htCore.find('tr');
    lastTR = [...TRs.toArray()].pop();
    const lastTRTextLater = $(lastTR).text();

    expect(lastTRTextLater).not.toEqual(lastTRTextAtStart);
  });
});
