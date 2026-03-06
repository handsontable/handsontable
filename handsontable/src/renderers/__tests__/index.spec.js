describe('renderers', () => {
  const id = 'testContainer';
  const {
    registerRenderer,
    getRenderer,
    rendererFactory,
  } = Handsontable.renderers;

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should register custom renderer', async() => {
    registerRenderer('myRenderer', (hot, td, row, col, prop, value) => {
      td.innerHTML = `--${value}--`;
    });

    handsontable({
      data: [
        [1, 6, 10],
      ],
      columns: [{
        renderer: 'myRenderer',
      }],
    });

    expect(getCell(0, 0).innerHTML).toBe('--1--');
  });

  it('should retrieve predefined renderers by its names', async() => {
    expect(getRenderer('autocomplete')).toBeFunction();
    expect(getRenderer('base')).toBeFunction();
    expect(getRenderer('checkbox')).toBeFunction();
    expect(getRenderer('html')).toBeFunction();
    expect(getRenderer('numeric')).toBeFunction();
    expect(getRenderer('password')).toBeFunction();
    expect(getRenderer('text')).toBeFunction();
  });

  it('should return the original renderer function when it was passed directly to the getter', async() => {
    const myRenderer = () => {};

    expect(getRenderer(myRenderer)).toBe(myRenderer);
  });

  it('should retrieve custom renderer by its names', async() => {
    const spy = jasmine.createSpy();

    registerRenderer('myRenderer', spy);
    getRenderer('myRenderer')(1, 2, 3, 4, 5, 6);

    expect(spy).toHaveBeenCalledWith(1, 2, 3, 4, 5, 6);
  });

  it('should create a custom renderer using the rendererFactory', async() => {
    const hotMock = {};
    const tdMock = document.createElement('td');
    const rowMock = 0;
    const columnMock = 0;
    const propMock = 'prop';
    const valueMock = 1.235;
    const cellPropertiesMock = {
      row: 0,
      col: 0,
      instance: hotMock,
    };
    const myRenderer = rendererFactory(({ instance, td, row, column, prop, value, cellProperties }) => {
      expect(instance).toBe(hotMock);
      expect(td).toBe(tdMock);
      expect(value).toBe(valueMock);
      expect(row).toBe(rowMock);
      expect(column).toBe(columnMock);
      expect(prop).toBe(propMock);
      expect(cellProperties).toBe(cellPropertiesMock);
    });

    myRenderer(hotMock, tdMock, rowMock, columnMock, propMock, valueMock, cellPropertiesMock);
  });
});
