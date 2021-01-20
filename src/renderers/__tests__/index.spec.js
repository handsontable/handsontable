describe('renderers', () => {
  const id = 'testContainer';
  const {
    registerRenderer,
    getRenderer,
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

  it('should register custom renderer', () => {
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

  it('should retrieve predefined renderers by its names', () => {
    expect(getRenderer('autocomplete')).toBeFunction();
    expect(getRenderer('base')).toBeFunction();
    expect(getRenderer('checkbox')).toBeFunction();
    expect(getRenderer('html')).toBeFunction();
    expect(getRenderer('numeric')).toBeFunction();
    expect(getRenderer('password')).toBeFunction();
    expect(getRenderer('text')).toBeFunction();
  });

  it('should retrieve custom renderer by its names', () => {
    const spy = jasmine.createSpy();

    registerRenderer('myRenderer', spy);
    getRenderer('myRenderer')(1, 2, 3, 4, 5, 6);

    expect(spy).toHaveBeenCalledWith(1, 2, 3, 4, 5, 6);
  });
});
