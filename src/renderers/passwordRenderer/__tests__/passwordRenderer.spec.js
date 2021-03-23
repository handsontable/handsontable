describe('passwordRenderer', () => {
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

  it('should render strings as a sequence of asterisks', () => {
    handsontable({
      data: [
        ['Joe'],
        ['Timothy'],
        ['Margaret'],
        ['Jerry']
      ],
      columns: [
        {
          renderer: Handsontable.renderers.PasswordRenderer
        }
      ]
    });

    expect(getRenderedValue(0, 0)).toMatch(/^[*]+$/ig);
    expect(getRenderedValue(1, 0)).toMatch(/^[*]+$/ig);
    expect(getRenderedValue(2, 0)).toMatch(/^[*]+$/ig);
    expect(getRenderedValue(3, 0)).toMatch(/^[*]+$/ig);
  });

  it('should render numbers as a sequence of asterisks ', () => {
    handsontable({
      data: [
        [1],
        [1234],
        [9090],
        [0]
      ],
      columns: [
        {
          renderer: Handsontable.renderers.PasswordRenderer
        }
      ]
    });

    expect(getRenderedValue(0, 0)).toMatch(/^[*]+$/ig);
    expect(getRenderedValue(1, 0)).toMatch(/^[*]+$/ig);
    expect(getRenderedValue(2, 0)).toMatch(/^[*]+$/ig);
    expect(getRenderedValue(3, 0)).toMatch(/^[*]+$/ig);
  });

  it('should be possible to set passwordRenderer with column \'type\' parameter', () => {
    handsontable({
      data: [
        ['Joe'],
        ['Timothy'],
        ['Margaret'],
        ['Jerry']
      ],
      columns: [
        {
          type: 'password'
        }
      ]
    });

    expect(getRenderedValue(0, 0)).toMatch(/^[*]+$/ig);
    expect(getRenderedValue(1, 0)).toMatch(/^[*]+$/ig);
    expect(getRenderedValue(2, 0)).toMatch(/^[*]+$/ig);
    expect(getRenderedValue(3, 0)).toMatch(/^[*]+$/ig);
  });

  it('should be possible to set passwordRenderer using alias \'password\'', () => {
    handsontable({
      data: [
        ['Joe'],
        ['Timothy'],
        ['Margaret'],
        ['Jerry']
      ],
      columns: [
        {
          renderer: 'password'
        }
      ]
    });

    expect(getRenderedValue(0, 0)).toMatch(/^[*]+$/ig);
    expect(getRenderedValue(1, 0)).toMatch(/^[*]+$/ig);
    expect(getRenderedValue(2, 0)).toMatch(/^[*]+$/ig);
    expect(getRenderedValue(3, 0)).toMatch(/^[*]+$/ig);
  });

  it('should render strings as a sequence of asterisks, of width matching the original value width', () => {
    handsontable({
      data: [
        ['Joe'],
        ['Timothy'],
        ['Margaret'],
        ['Jerry']
      ],
      columns: [
        {
          renderer: Handsontable.renderers.PasswordRenderer
        }
      ]
    });

    expect(getRenderedValue(0, 0).length).toEqual(getDataAtCell(0, 0).length);
    expect(getRenderedValue(1, 0).length).toEqual(getDataAtCell(1, 0).length);
    expect(getRenderedValue(2, 0).length).toEqual(getDataAtCell(2, 0).length);
    expect(getRenderedValue(3, 0).length).toEqual(getDataAtCell(3, 0).length);
  });

  it('should render strings as a sequence of asterisks, of fixed width', () => {
    handsontable({
      data: [
        ['Joe'],
        ['Timothy'],
        ['Margaret'],
        ['Jerry']
      ],
      columns: [
        {
          renderer: Handsontable.renderers.PasswordRenderer,
          hashLength: 10
        }
      ]
    });

    expect(getRenderedValue(0, 0).length).toEqual(10);
    expect(getRenderedValue(1, 0).length).toEqual(10);
    expect(getRenderedValue(2, 0).length).toEqual(10);
    expect(getRenderedValue(3, 0).length).toEqual(10);
  });

  it('should render strings as a sequence of custom symbols', () => {
    handsontable({
      data: [
        [1, 'Joe'],
        [2, 'Timothy'],
        [3, 'Margaret'],
        [4, 'Jerry']
      ],
      columns: [
        {
          renderer: Handsontable.renderers.PasswordRenderer,
          hashSymbol: '#'
        },
        {
          renderer: Handsontable.renderers.PasswordRenderer,
          hashSymbol: 'x'
        }
      ]
    });

    expect(getRenderedValue(0, 0)).toMatch(/^[#]+$/ig);
    expect(getRenderedValue(1, 0)).toMatch(/^[#]+$/ig);
    expect(getRenderedValue(2, 0)).toMatch(/^[#]+$/ig);
    expect(getRenderedValue(3, 0)).toMatch(/^[#]+$/ig);

    expect(getRenderedValue(0, 1)).toMatch(/^[x]+$/ig);
    expect(getRenderedValue(1, 1)).toMatch(/^[x]+$/ig);
    expect(getRenderedValue(2, 1)).toMatch(/^[x]+$/ig);
    expect(getRenderedValue(3, 1)).toMatch(/^[x]+$/ig);
  });
});
