describe('CheckboxRenderer', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should reverse selection in checkboxes', function () {
    handsontable({
      data  :  [[true],[false],[true]],
      columns : [
        { type: 'checkbox' }
      ]
    });

    this.$container.find(':checkbox').eq(0).trigger('click');
    this.$container.find(':checkbox').eq(1).trigger('click');
    this.$container.find(':checkbox').eq(2).trigger('click');

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

    keyDown('space');

    expect(checkboxes.eq(0).prop('checked')).toBe(false);
    expect(checkboxes.eq(1).prop('checked')).toBe(true);
    expect(checkboxes.eq(2).prop('checked')).toBe(true);
    expect(getData()).toEqual([[false], [true], [true]]);
    expect(afterChangeCallback.calls.length).toEqual(1);
    expect(afterChangeCallback).toHaveBeenCalledWith([[0, 0, true, false]], 'edit', undefined, undefined, undefined);


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
});