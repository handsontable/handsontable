describe('Core.validateCell', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  it('should add class name `htInvalid` to an cell that does not validate - when we trigger validateCell', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: createSpreadsheetData(2, 2),
      validator(value, cb) {
        cb(false);
      },
      afterValidate: onAfterValidate
    });

    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(4);

    await validateCell(getDataAtCell(1, 1), getCellMeta(1, 1), () => {});
    await sleep(200);

    expect(spec().$container.find('td.htInvalid').length).toEqual(1);
    expect(spec().$container.find('td:not(.htInvalid)').length).toEqual(3);
  });
});
