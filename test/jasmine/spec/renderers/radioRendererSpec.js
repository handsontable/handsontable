describe('RadioRenderer', function () {
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

  it('should use radioValues to check appropriate radio buttons', function () {
    handsontable({
      data  :  [['yes'],['no'],['yes']],
      columns : [
        {
          type: 'radio',
          radioValues: ['yes', 'no']
        }
      ]
    });

    var radios = this.$container.find(':radio');

    expect(radios.eq(0).prop('checked')).toBe(true);
    expect(radios.eq(1).prop('checked')).toBe(false);
    expect(radios.eq(2).prop('checked')).toBe(false);
    expect(radios.eq(3).prop('checked')).toBe(true);
    expect(radios.eq(4).prop('checked')).toBe(true);
    expect(radios.eq(5).prop('checked')).toBe(false);
  });

  it('should reverse selection of radio buttons', function () {
    handsontable({
      data  :  [['yes'],['no'],['yes']],
      columns : [
        {
          type: 'radio',
          radioValues:  ['yes', 'no']
        }
      ]
    });

    this.$container.find(':radio').eq(1).simulate('click');
    this.$container.find(':radio').eq(2).simulate('click');
    this.$container.find(':radio').eq(5).simulate('click');

    expect(getData()).toEqual([['no'],['yes'],['no']]);
  });

  it('shouldn\'t change radio selection', function () {
    handsontable({
      data  :  [['yes'],['no'],['yes']],
      columns : [
        {
          type: 'radio',
          radioValues:  ['yes', 'no'],
          readOnly: true
        }
      ]
    });

    this.$container.find(':radio').trigger('click');

    expect(getData()).toEqual([['yes'],['no'],['yes']]);
  });

  it("should change radio selection after hitting space", function () {
    handsontable({
      data  :  [['yes'],['no'],['yes']],
      columns : [
        {
          type: 'radio',
          radioValues:  ['yes', 'no'],
        }
      ]
    });

    var afterChangeCallback = jasmine.createSpy('afterChangeCallback');
    addHook('afterChange', afterChangeCallback);

    var radios = this.$container.find(':radio');

    expect(radios.eq(0).prop('checked')).toBe(true);
    expect(radios.eq(1).prop('checked')).toBe(false);
    expect(radios.eq(2).prop('checked')).toBe(false);
    expect(radios.eq(3).prop('checked')).toBe(true);
    expect(radios.eq(4).prop('checked')).toBe(true);
    expect(radios.eq(5).prop('checked')).toBe(false);
    expect(getData()).toEqual([['yes'], ['no'], ['yes']]);

    selectCell(0, 0);
    keyDown('space');

    expect(radios.eq(0).prop('checked')).toBe(false);
    expect(radios.eq(1).prop('checked')).toBe(true);
    expect(getData()).toEqual([['no'], ['no'], ['yes']]);
  });

  it("should not change radio selection after hitting space when readonly", function () {
    handsontable({
      data  :  [['yes'],['no'],['yes']],
      columns : [
        {
          type: 'radio',
          radioValues:  ['yes', 'no'],
          readOnly: true
        }
      ]
    });

    var afterChangeCallback = jasmine.createSpy('afterChangeCallback');
    addHook('afterChange', afterChangeCallback);

    var radios = this.$container.find(':radio');

    expect(radios.eq(0).prop('checked')).toBe(true);
    expect(radios.eq(1).prop('checked')).toBe(false);
    expect(radios.eq(2).prop('checked')).toBe(false);
    expect(radios.eq(3).prop('checked')).toBe(true);
    expect(radios.eq(4).prop('checked')).toBe(true);
    expect(radios.eq(5).prop('checked')).toBe(false);
    expect(getData()).toEqual([['yes'], ['no'], ['yes']]);

    selectCell(0, 0);
    keyDown('space');

    expect(radios.eq(0).prop('checked')).toBe(true);
    expect(radios.eq(1).prop('checked')).toBe(false);
    expect(radios.eq(2).prop('checked')).toBe(false);
    expect(radios.eq(3).prop('checked')).toBe(true);
    expect(radios.eq(4).prop('checked')).toBe(true);
    expect(radios.eq(5).prop('checked')).toBe(false);
    expect(getData()).toEqual([['yes'], ['no'], ['yes']]);
  });

  it("should change radio selection after hitting enter", function () {
    handsontable({
      data  :  [['yes'],['no'],['yes']],
      columns : [
        {
          type: 'radio',
          radioValues:  ['yes', 'no'],
        }
      ]
    });

    var afterChangeCallback = jasmine.createSpy('afterChangeCallback');
    addHook('afterChange', afterChangeCallback);

    var radios = this.$container.find(':radio');

    expect(radios.eq(0).prop('checked')).toBe(true);
    expect(radios.eq(1).prop('checked')).toBe(false);
    expect(radios.eq(2).prop('checked')).toBe(false);
    expect(radios.eq(3).prop('checked')).toBe(true);
    expect(radios.eq(4).prop('checked')).toBe(true);
    expect(radios.eq(5).prop('checked')).toBe(false);
    expect(getData()).toEqual([['yes'], ['no'], ['yes']]);

    selectCell(0, 0);
    keyDown('space');

    expect(radios.eq(0).prop('checked')).toBe(false);
    expect(radios.eq(1).prop('checked')).toBe(true);
    expect(getData()).toEqual([['no'], ['no'], ['yes']]);
  });

  it("should not change radio selection after hitting enter when readonly", function () {
    handsontable({
      data  :  [['yes'],['no'],['yes']],
      columns : [
        {
          type: 'radio',
          radioValues:  ['yes', 'no'],
          readOnly: true
        }
      ]
    });

    var afterChangeCallback = jasmine.createSpy('afterChangeCallback');
    addHook('afterChange', afterChangeCallback);

    var radios = this.$container.find(':radio');

    expect(radios.eq(0).prop('checked')).toBe(true);
    expect(radios.eq(1).prop('checked')).toBe(false);
    expect(radios.eq(2).prop('checked')).toBe(false);
    expect(radios.eq(3).prop('checked')).toBe(true);
    expect(radios.eq(4).prop('checked')).toBe(true);
    expect(radios.eq(5).prop('checked')).toBe(false);
    expect(getData()).toEqual([['yes'], ['no'], ['yes']]);

    selectCell(0, 0);
    keyDown('space');

    expect(radios.eq(0).prop('checked')).toBe(true);
    expect(radios.eq(1).prop('checked')).toBe(false);
    expect(radios.eq(2).prop('checked')).toBe(false);
    expect(radios.eq(3).prop('checked')).toBe(true);
    expect(radios.eq(4).prop('checked')).toBe(true);
    expect(radios.eq(5).prop('checked')).toBe(false);
    expect(getData()).toEqual([['yes'], ['no'], ['yes']]);
  });

  it("should open cell editors of cell that does not have radioRenderer (#1199)", function () {
    var hot = handsontable({
      data  :  [['yes', 'B0'],['no', 'B1'],['yes', 'B2']],
      columns : [
        {
          type: 'radio',
          radioValues: ['yes', 'no']
        },
        { type: 'text'}
      ]
    });

    selectCell(0, 1);

    expect(hot.getActiveEditor().isOpened()).toBe(false);

    keyDown('space');

    expect(hot.getActiveEditor().isOpened()).toBe(true);
  });
});
