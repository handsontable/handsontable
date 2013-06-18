describe('NumericRenderer', function () {
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

  it('should render formatted number', function () {
    handsontable({
      cells: function () {
        return {
          type: 'numeric',
          format: '$0,0.00'
        }
      }
    });
    setDataAtCell(2, 2, '1000.234');

    expect(getCell(2, 2).innerHTML).toEqual('$1,000.23');
  });

  it('should render signed number', function () {
    handsontable({
      cells: function () {
        return {
          type: 'numeric',
          format: '$0,0.00'
        }
      }
    });

    setDataAtCell(2, 2, '-1000.234');
    expect(getCell(2, 2).innerHTML).toEqual('-$1,000.23');
  });

  it('should render string as it is', function () {
    handsontable({
      cells: function () {
        return {
          type: 'numeric',
          format: '$0,0.00'
        }
      }
    });

    setDataAtCell(2, 2, '123 simple test');
    expect(getCell(2, 2).innerHTML).toEqual('123 simple test');
  });

  it('should add class name `htNumeric` to the cell if it renders a number', function () {
    var DIV = document.createElement('DIV');
    var instance = new Handsontable.Core($(DIV), {});
    instance.init(); //unfortunately these 3 lines are currently needed to satisfy renderer arguments (as of v0.8.21)

    var TD = document.createElement('TD');
    TD.className = 'someClass';
    Handsontable.NumericRenderer(instance, TD, 0, 0, 0, 123, {});
    expect(TD.className).toEqual('someClass htNumeric');
  });

  it('should add class name `htNumeric` to the cell if it renders a numeric string', function () {
    var DIV = document.createElement('DIV');
    var instance = new Handsontable.Core($(DIV), {});
    instance.init(); //unfortunately these 3 lines are currently needed to satisfy renderer arguments (as of v0.8.21)

    var TD = document.createElement('TD');
    TD.className = 'someClass';
    Handsontable.NumericRenderer(instance, TD, 0, 0, 0, '123', {});
    expect(TD.className).toEqual('someClass htNumeric');
  });

  it('should not add class name `htNumeric` to the cell if it renders a text', function () {
    var DIV = document.createElement('DIV');
    var instance = new Handsontable.Core($(DIV), {});
    instance.init(); //unfortunately these 3 lines are currently needed to satisfy renderer arguments (as of v0.8.21)

    var TD = document.createElement('TD');
    TD.className = 'someClass';
    Handsontable.NumericRenderer(instance, TD, 0, 0, 0, 'abc', {});
    expect(TD.className).toEqual('someClass');
  });

  it('should add class name `htDimmed` to a read only cell', function () {
    var DIV = document.createElement('DIV');
    var instance = new Handsontable.Core($(DIV), {});
    instance.init(); //unfortunately these 3 lines are currently needed to satisfy renderer arguments (as of v0.8.21)

    var TD = document.createElement('TD');
    Handsontable.NumericRenderer(instance, TD, 0, 0, 0, 123, {readOnly: true});
    expect(TD.className).toContain('htDimmed');
  });
});