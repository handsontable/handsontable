describe('Core_reCreate', () => {
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

  it('should correctly re-render corner header when there is multiline content', () => {
    const settings = {
      rowHeaders: true,
      colHeaders(col) {
        return `Line<br>${col}`;
      }
    };

    handsontable(settings);
    destroy();
    handsontable(settings);

    expect(getTopLeftClone().width()).toBeAroundValue(50); // default column width
    // th > div.relative > span.colHeader has line-height: 1.1 [rem]
    // 14.3px (13px x 1.1 - line height) x 2 => 28.6px (Chrome will round it to 28px)
    // Additional space has roots in the way how browsers resolves inline-block elements and theirs' parents line-height
    // you can find more information here: https://www.w3.org/TR/CSS1/#the-height-of-lines
    // div.relative adds 4px of vertical padding
    // div.relative has 35px in Chrome and 35.95px (rounded to 36px) in Firefox and IE
    // th adds 1px of top border
    expect(getTopLeftClone().height()).toBeAroundValue(36);
  });
});
