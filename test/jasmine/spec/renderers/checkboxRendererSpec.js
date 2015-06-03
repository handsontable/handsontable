describe('CheckboxRenderer', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '" style="width: 300px; height: 200px;"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should render values as checkboxes', function () {
    handsontable({
      data  :  [[true],[false],[true]],
      columns : [
        { type: 'checkbox' }
      ]
    });

    expect($(getRenderedValue(0, 0)).is(':checkbox')).toBe(true);
    expect($(getRenderedValue(1, 0)).is(':checkbox')).toBe(true);
    expect($(getRenderedValue(2, 0)).is(':checkbox')).toBe(true);
  });

  it('should render check checkboxes for cell which value is true', function () {
    handsontable({
      data  :  [[true],[false],[true]],
      columns : [
        { type: 'checkbox' }
      ]
    });

    expect($(getRenderedContent(0, 0)).prop('checked')).toBe(true);
    expect($(getRenderedContent(1, 0)).prop('checked')).toBe(false);
    expect($(getRenderedContent(2, 0)).prop('checked')).toBe(true);
  });

  it('should use templates to check appropriate checkboxes', function () {
    handsontable({
      data  :  [['yes'],['no'],['yes']],
      columns : [
        {
          type: 'checkbox',
          checkedTemplate: 'yes',
          uncheckedTemplate: 'no'
        }
      ]
    });

    expect($(getRenderedContent(0, 0)).prop('checked')).toBe(true);
    expect($(getRenderedContent(1, 0)).prop('checked')).toBe(false);
    expect($(getRenderedContent(2, 0)).prop('checked')).toBe(true);
  });

  it('should reverse selection in checkboxes', function () {
    handsontable({
      data  :  [[true],[false],[true]],
      columns : [
        { type: 'checkbox' }
      ]
    });

    this.$container.find(':checkbox').eq(0).simulate('click');
    this.$container.find(':checkbox').eq(1).simulate('click');
    this.$container.find(':checkbox').eq(2).simulate('click');

    expect(getData()).toEqual([[false],[true],[false]]);
  });

  it('shouldn\'t uncheck checkboxes', function () {
    handsontable({
      data  :  [[true],[true],[true]],
      columns : [
        { type: 'checkbox', readOnly : true }
      ]
    });

    this.$container.find(':checkbox').trigger('click');

    expect(getData()).toEqual([[true],[true],[true]]);
  });

  it("should check single box after hitting space", function () {
    handsontable({
      data  :  [[true],[true],[true]],
      columns : [
        { type: 'checkbox'}
      ]
    });



    var afterChangeCallback = jasmine.createSpy('afterChangeCallback');
    addHook('afterChange', afterChangeCallback);

    var checkboxes = this.$container.find(':checkbox');

    expect(checkboxes.eq(0).prop('checked')).toBe(true);
    expect(checkboxes.eq(1).prop('checked')).toBe(true);
    expect(checkboxes.eq(2).prop('checked')).toBe(true);
    expect(getData()).toEqual([[true], [true], [true]]);

    selectCell(0, 0);

//    this.$container.find(':checkbox').eq(0).simulate('click');
//    this.$container.simulate('keydown',{
//      keyCode: 32
//    });
    keyDown('space');

    expect(checkboxes.eq(0).prop('checked')).toBe(false);
    expect(checkboxes.eq(1).prop('checked')).toBe(true);
    expect(checkboxes.eq(2).prop('checked')).toBe(true);
    expect(getData()).toEqual([[false], [true], [true]]);
    expect(afterChangeCallback.calls.length).toEqual(1);
    expect(afterChangeCallback).toHaveBeenCalledWith([[0, 0, true, false]], 'edit', undefined, undefined, undefined, undefined);


  });

  it("should not check single box after hitting space, if cell is readOnly", function () {
    handsontable({
      data  :  [[true],[true],[true]],
      columns : [
        { type: 'checkbox', readOnly: true}
      ]
    });

    var afterChangeCallback = jasmine.createSpy('afterChangeCallback');
    addHook('afterChange', afterChangeCallback);

    var checkboxes = this.$container.find(':checkbox');

    expect(checkboxes.eq(0).prop('checked')).toBe(true);
    expect(checkboxes.eq(1).prop('checked')).toBe(true);
    expect(checkboxes.eq(2).prop('checked')).toBe(true);
    expect(getData()).toEqual([[true], [true], [true]]);

    selectCell(0, 0);

    keyDown('space');

    expect(checkboxes.eq(0).prop('checked')).toBe(true);
    expect(checkboxes.eq(1).prop('checked')).toBe(true);
    expect(checkboxes.eq(2).prop('checked')).toBe(true);
    expect(getData()).toEqual([[true], [true], [true]]);
    expect(afterChangeCallback).not.toHaveBeenCalled();


  });

  it("should reverse checkboxes state after hitting space, when multiple cells are selected", function () {
    var hot = handsontable({
      data  :  [[true],[false],[true]],
      columns : [
        { type: 'checkbox'}
      ]
    });

    var afterChangeCallback = jasmine.createSpy('afterChangeCallback');
    addHook('afterChange', afterChangeCallback);

    var checkboxes = this.$container.find(':checkbox');

    expect(checkboxes.eq(0).prop('checked')).toBe(true);
    expect(checkboxes.eq(1).prop('checked')).toBe(false);
    expect(checkboxes.eq(2).prop('checked')).toBe(true);
    expect(getData()).toEqual([[true],[false],[true]]);

    selectCell(0, 0, 2, 0);

    keyDown('space');

    checkboxes = this.$container.find(':checkbox');

    expect(checkboxes.eq(0).prop('checked')).toBe(false);
    expect(checkboxes.eq(1).prop('checked')).toBe(true);
    expect(checkboxes.eq(2).prop('checked')).toBe(false);
    expect(getData()).toEqual([[false],[true],[false]]);
    expect(afterChangeCallback.calls.length).toEqual(3);
    expect(afterChangeCallback.calls[0].args[0]).toEqual([[0, 0, true, false]], 'edit', undefined, undefined, undefined);
    expect(afterChangeCallback.calls[1].args[0]).toEqual([[1, 0, false, true]], 'edit', undefined, undefined, undefined);
    expect(afterChangeCallback.calls[2].args[0]).toEqual([[2, 0, true, false]], 'edit', undefined, undefined, undefined);


  });

  it("should reverse checkboxes state after hitting space, when multiple cells are selected and selStart > selEnd", function () {
    handsontable({
      data  :  [[true],[false],[true]],
      columns : [
        { type: 'checkbox'}
      ]
    });


    var afterChangeCallback = jasmine.createSpy('afterChangeCallback');
    addHook('afterChange', afterChangeCallback);

    var checkboxes = this.$container.find(':checkbox');

    expect(checkboxes.eq(0).prop('checked')).toBe(true);
    expect(checkboxes.eq(1).prop('checked')).toBe(false);
    expect(checkboxes.eq(2).prop('checked')).toBe(true);
    expect(getData()).toEqual([[true],[false],[true]]);

    selectCell(2, 0, 0, 0); //selStart = [2,0], selEnd = [0,0]

    keyDown('space');

    checkboxes = this.$container.find(':checkbox');

    expect(checkboxes.eq(0).prop('checked')).toBe(false);
    expect(checkboxes.eq(1).prop('checked')).toBe(true);
    expect(checkboxes.eq(2).prop('checked')).toBe(false);
    expect(getData()).toEqual([[false],[true],[false]]);
    expect(afterChangeCallback.calls.length).toEqual(3);
    expect(afterChangeCallback.calls[0].args[0]).toEqual([[0, 0, true, false]], 'edit', undefined, undefined, undefined);
    expect(afterChangeCallback.calls[1].args[0]).toEqual([[1, 0, false, true]], 'edit', undefined, undefined, undefined);
    expect(afterChangeCallback.calls[2].args[0]).toEqual([[2, 0, true, false]], 'edit', undefined, undefined, undefined);


  });

  it("should open cell editors of cell that does not have checkboxRenderer (#1199)", function () {
    var hot = handsontable({
      data  :  [[true, 'B0'],[true, 'B1'],[true, 'B2']],
      columns : [
        { type: 'checkbox'},
        { type: 'text'}
      ]
    });

    selectCell(0, 1);

    expect(hot.getActiveEditor().isOpened()).toBe(false);

    keyDown('space');

    expect(hot.getActiveEditor().isOpened()).toBe(true);
  });

  it("double click on checkbox cell should invert the value", function () {
    handsontable({
      data: [
        [true],
        [false],
        [true]
      ],
      columns: [
        { type: 'checkbox'}
      ]
    });

    selectCell(0, 0);

    mouseDoubleClick(getCell(0, 0));
    expect(getDataAtCell(0, 0)).toBe(false);

    mouseDoubleClick(getCell(0, 0));
    expect(getDataAtCell(0, 0)).toBe(true);

    mouseDoubleClick(getCell(0, 0));
    expect(getDataAtCell(0, 0)).toBe(false);
  });

  it("should change checkbox state from checked to unchecked after hitting ENTER", function () {
    handsontable({
      data  :  [[true],[true],[true]],
      columns : [
        { type: 'checkbox'}
      ]
    });

    var afterChangeCallback = jasmine.createSpy('afterChangeCallback');
    addHook('afterChange', afterChangeCallback);

    var checkboxes = this.$container.find(':checkbox');

    expect(checkboxes.eq(0).prop('checked')).toBe(true);
    expect(checkboxes.eq(1).prop('checked')).toBe(true);
    expect(checkboxes.eq(2).prop('checked')).toBe(true);
    expect(getData()).toEqual([[true], [true], [true]]);

    selectCell(0, 0);

    keyDown('enter');

    expect(checkboxes.eq(0).prop('checked')).toBe(false);
    expect(checkboxes.eq(1).prop('checked')).toBe(true);
    expect(checkboxes.eq(2).prop('checked')).toBe(true);
    expect(getData()).toEqual([[false], [true], [true]]);
    expect(afterChangeCallback.calls.length).toEqual(1);
    expect(afterChangeCallback).toHaveBeenCalledWith([[0, 0, true, false]], 'edit', undefined, undefined, undefined, undefined);

  });

  it("should change checkbox state from checked to unchecked after hitting ENTER using custom check/uncheck templates", function () {
    handsontable({
      data  :  [['yes'],['yes'],['no']],
      columns : [
        {
          type: 'checkbox',
          checkedTemplate: 'yes',
          uncheckedTemplate: 'no'
        }
      ]
    });

    var afterChangeCallback = jasmine.createSpy('afterChangeCallback');
    addHook('afterChange', afterChangeCallback);

    var checkboxes = this.$container.find(':checkbox');

    expect(checkboxes.eq(0).prop('checked')).toBe(true);
    expect(checkboxes.eq(1).prop('checked')).toBe(true);
    expect(checkboxes.eq(2).prop('checked')).toBe(false);
    expect(getData()).toEqual([['yes'], ['yes'], ['no']]);

    selectCell(0, 0);

    keyDown('enter');

    expect(checkboxes.eq(0).prop('checked')).toBe(false);
    expect(checkboxes.eq(1).prop('checked')).toBe(true);
    expect(checkboxes.eq(2).prop('checked')).toBe(false);
    expect(getData()).toEqual([['no'], ['yes'], ['no']]);
    expect(afterChangeCallback.calls.length).toEqual(1);
    expect(afterChangeCallback).toHaveBeenCalledWith([[0, 0, 'yes', 'no']], 'edit', undefined, undefined, undefined, undefined);

  });

  it("should change checkbox state to unchecked after hitting DELETE", function () {
    handsontable({
      data  :  [[true], [false], [true]],
      columns : [
        { type: 'checkbox'}
      ]
    });

    var afterChangeCallback = jasmine.createSpy('afterChangeCallback');
    addHook('afterChange', afterChangeCallback);

    var checkboxes = this.$container.find(':checkbox');

    expect(checkboxes.eq(0).prop('checked')).toBe(true);
    expect(checkboxes.eq(1).prop('checked')).toBe(false);
    expect(checkboxes.eq(2).prop('checked')).toBe(true);
    expect(getData()).toEqual([[true], [false], [true]]);

    selectCell(0, 0);
    keyDown('delete');
    selectCell(0, 1);
    keyDown('delete');

    expect(checkboxes.eq(0).prop('checked')).toBe(false);
    expect(checkboxes.eq(1).prop('checked')).toBe(false);
    expect(checkboxes.eq(2).prop('checked')).toBe(true);
    expect(getData()).toEqual([[false], [false], [true]]);

    expect(afterChangeCallback.calls.length).toEqual(2);
    expect(afterChangeCallback).toHaveBeenCalledWith([[0, 0, true, false]], 'edit', undefined, undefined, undefined, undefined);
  });

  it("should change checkbox state to unchecked after hitting BACKSPACE", function () {
    handsontable({
      data  :  [[true], [false], [true]],
      columns : [
        { type: 'checkbox'}
      ]
    });

    var afterChangeCallback = jasmine.createSpy('afterChangeCallback');
    addHook('afterChange', afterChangeCallback);

    var checkboxes = this.$container.find(':checkbox');

    expect(checkboxes.eq(0).prop('checked')).toBe(true);
    expect(checkboxes.eq(1).prop('checked')).toBe(false);
    expect(checkboxes.eq(2).prop('checked')).toBe(true);
    expect(getData()).toEqual([[true], [false], [true]]);

    selectCell(0, 0);
    keyDown('backspace');
    selectCell(0, 1);
    keyDown('backspace');

    expect(checkboxes.eq(0).prop('checked')).toBe(false);
    expect(checkboxes.eq(1).prop('checked')).toBe(false);
    expect(checkboxes.eq(2).prop('checked')).toBe(true);
    expect(getData()).toEqual([[false], [false], [true]]);

    expect(afterChangeCallback.calls.length).toEqual(2);
    expect(afterChangeCallback).toHaveBeenCalledWith([[0, 0, true, false]], 'edit', undefined, undefined, undefined, undefined);
  });
});
