describe('validators', () => {
  const id = 'testContainer';
  const {
    registerValidator,
    getValidator,
  } = Handsontable.validators;

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should register custom validator', async() => {
    registerValidator('myValidator', (value, cb) => {
      cb(value === 10);
    });

    const onAfterValidate = jasmine.createSpy('onAfterValidate');
    const hot = handsontable({
      data: [
        [1, 6, 10],
      ],
      columns: [{
        validator: 'myValidator',
      }],
      afterValidate: onAfterValidate
    });

    hot.setDataAtCell(1, 0, 10);

    await sleep(100);

    expect(onAfterValidate).toHaveBeenCalledWith(true, 10, 1, 0, undefined, undefined);

    hot.setDataAtCell(2, 0, 2);

    await sleep(100);

    expect(onAfterValidate).toHaveBeenCalledWith(false, 2, 2, 0, undefined, undefined);
  });

  it('should retrieve predefined validators by its names', () => {
    expect(getValidator('autocomplete')).toBeFunction();
    expect(getValidator('date')).toBeFunction();
    expect(getValidator('numeric')).toBeFunction();
    expect(getValidator('time')).toBeFunction();
  });

  it('should retrieve custom validator by its names', () => {
    registerValidator('myValidator', (value, cb) => {
      cb(value === 10);
    });

    getValidator('myValidator')(2, (isValid) => {
      expect(isValid).toBe(false);
    });

    getValidator('myValidator')('10', (isValid) => {
      expect(isValid).toBe(false);
    });

    getValidator('myValidator')(10, (isValid) => {
      expect(isValid).toBe(true);
    });
  });
});
