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

  it('should render strings as a sequence of asterisks', async() => {
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

  it('should render numbers as a sequence of asterisks ', async() => {
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

  it('should be possible to set passwordRenderer with column \'type\' parameter', async() => {
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

  it('should be possible to set passwordRenderer using alias \'password\'', async() => {
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

  it('should render strings as a sequence of asterisks, of width matching the original value width', async() => {
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

  it('should render strings as a sequence of asterisks, of fixed width', async() => {
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

  it('should render strings as a sequence of custom symbols', async() => {
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

  it('should render the cell without messing with "dir" attribute', async() => {
    handsontable({
      data: [['foo']],
      renderer: 'password'
    });

    expect(getCell(0, 0).getAttribute('dir')).toBeNull();
  });

  describe('sanitizer', () => {
    it('should pass the rendered value through a configured sanitizer', async() => {
      const sanitizer = jasmine.createSpy('sanitizer')
        .and
        .callFake(content => content.replace(/<danger\/>/g, ''));

      handsontable({
        data: [['secret']],
        sanitizer,
        columns: [{
          type: 'password',
          // The renderer's own `valueFormatter` masks the value, so a developer-supplied one is
          // the only way markup reaches the sink. That is exactly the case a sanitizer must cover.
          valueFormatter: () => '<danger/>***',
        }],
      });

      expect(sanitizer).toHaveBeenCalledWith('<danger/>***', 'password');
      expect(getRenderedValue(0, 0)).toBe('***');
    });

    it('should name the password renderer in the missing-sanitizer warning', async() => {
      const warnSpy = spyOnConsoleWarn();

      handsontable({
        data: [['secret']],
        columns: [{
          type: 'password',
          valueFormatter: () => '<b>***</b>',
        }],
      });

      expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching(/\("password"\) without a sanitizer/));
    });
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
      renderer: 'password',
    });

    expect(renderedCellCalls.length).toBe(1);

    Handsontable.renderers.registerRenderer('base', originalBaseRenderer);
  });
});
