describe('CustomBorders style', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    const wrapper = $('<div></div>').css({
      width: 400,
      height: 200,
      overflow: 'scroll'
    });

    this.$wrapper = this.$container.wrap(wrapper).parent();
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
    this.$wrapper.remove();
  });

  it('should add an appropriate class name to border elements when a "style" setting was assigned to border config', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      customBorders: [
        {
          range: {
            from: {
              row: 1,
              col: 1,
            },
            to: {
              row: 3,
              col: 4,
            },
          },
          top: {
            width: 2,
            color: '#5292F7',
            style: 'dashed',
          },
          bottom: {
            width: 2,
            color: 'red',
            style: 'dashed',

          },
          start: {
            width: 2,
            color: 'orange',
            style: 'dashed',
          },
          end: {
            width: 2,
            color: 'magenta',
            style: 'dashed',
          },
        },
      ],
    });

    expect(getCellMeta(1, 1).borders.top).toEqual({ width: 2, color: '#5292F7', style: 'dashed' });
    expect(getCellMeta(1, 2).borders.top).toEqual({ width: 2, color: '#5292F7', style: 'dashed' });
    expect(getCellMeta(1, 3).borders.top).toEqual({ width: 2, color: '#5292F7', style: 'dashed' });
    expect(getCellMeta(1, 4).borders.top).toEqual({ width: 2, color: '#5292F7', style: 'dashed' });
    expect(getCellMeta(1, 1).borders.start).toEqual({ width: 2, color: 'orange', style: 'dashed' });
    expect(getCellMeta(2, 1).borders.start).toEqual({ width: 2, color: 'orange', style: 'dashed' });
    expect(getCellMeta(3, 1).borders.start).toEqual({ width: 2, color: 'orange', style: 'dashed' });
    expect(getCellMeta(1, 4).borders.end).toEqual({ width: 2, color: 'magenta', style: 'dashed' });
    expect(getCellMeta(2, 4).borders.end).toEqual({ width: 2, color: 'magenta', style: 'dashed' });
    expect(getCellMeta(3, 4).borders.end).toEqual({ width: 2, color: 'magenta', style: 'dashed' });
    expect(getCellMeta(3, 1).borders.bottom).toEqual({ width: 2, color: 'red', style: 'dashed' });
    expect(getCellMeta(3, 2).borders.bottom).toEqual({ width: 2, color: 'red', style: 'dashed' });
    expect(getCellMeta(3, 3).borders.bottom).toEqual({ width: 2, color: 'red', style: 'dashed' });
    expect(getCellMeta(3, 4).borders.bottom).toEqual({ width: 2, color: 'red', style: 'dashed' });

    expect($('.ht-border-style-dashed-horizontal').length).toBe(8);
    expect($('.ht-border-style-dashed-vertical').length).toBe(6);
  });

  it('should not add a style class name if the provided style is "solid"', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      customBorders: [{
        range: {
          from: {
            row: 1,
            col: 1,
          },
          to: {
            row: 3,
            col: 4,
          },
        },
        top: {
          width: 2,
          color: '#5292F7',
          style: 'solid',
        },
        bottom: {
          width: 2,
          color: 'red',
          style: 'solid',
        },
        start: {
          width: 2,
          color: 'orange',
          style: 'solid',
        },
        end: {
          width: 2,
          color: 'magenta',
          style: 'solid',
        },
      }]
    });

    expect($('.ht-border-style-solid-horizontal').length).toBe(0);
    expect($('.ht-border-style-solid-vertical').length).toBe(0);
  });

  it('should thow a warning if the style value is not supported', async() => {
    spyOn(console, 'warn');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      customBorders: [{
        range: {
          from: {
            row: 1,
            col: 1,
          },
          to: {
            row: 3,
            col: 4,
          },
        },
        top: {
          width: 2,
          color: '#5292F7',
          style: 'dotted',
        },
      }]
    });

    // eslint-disable-next-line no-console, max-len
    expect(console.warn).toHaveBeenCalledWith(`The "dotted" border style is not supported. Please use one of the following styles: dashed, solid.
The border style will be ignored.`);
  });
});
