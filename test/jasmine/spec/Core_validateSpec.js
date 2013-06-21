describe('Core_validate', function () {
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

  var arrayOfObjects = function () {
    return [
      {id: 1, name: "Ted", lastName: "Right"},
      {id: 2, name: "Frank", lastName: "Honest"},
      {id: 3, name: "Joan", lastName: "Well"},
      {id: 4, name: "Sid", lastName: "Strong"},
      {id: 5, name: "Jane", lastName: "Neat"},
      {id: 6, name: "Chuck", lastName: "Jackson"},
      {id: 7, name: "Meg", lastName: "Jansen"},
      {id: 8, name: "Rob", lastName: "Norris"},
      {id: 9, name: "Sean", lastName: "O'Hara"},
      {id: 10, name: "Eve", lastName: "Branson"}
    ];
  };

  it('should call beforeValidate', function () {
    var fired = null;

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      beforeValidate: function () {
        fired = true;
      }
    });
    setDataAtCell(2, 0, 'test');

    expect(fired).toEqual(true);
  });

  it('should call afterValidate', function () {
    var fired = null;

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: function () {
        fired = true;
      }
    });
    setDataAtCell(2, 0, 'test');

    expect(fired).toEqual(true);
  });

  it('beforeValidate should can manipulate value', function () {
    var result = null;

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', type: 'numeric'},
        {data: 'name'},
        {data: 'lastName'}
      ],
      beforeValidate: function (value) {
        value = 999;
        return value;
      },
      afterValidate: function (valid, value) {
        result = value;
      }
    });
    setDataAtCell(2, 0, 123);

    expect(result).toEqual(999);
  });

  it('should be able to define custom validator function', function () {
    var result = null;

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', validator: function (value, cb) {
          cb(true);
        }},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: function (valid) {
        result = valid;
      }
    });
    setDataAtCell(2, 0, 123);

    expect(result).toEqual(true);
  });

  it('should be able to define custom validator RegExp', function () {
    var lastInvalid = null;

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', validator: /^\d+$/ },
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: function (valid, value) {
        if (valid === false) {
          lastInvalid = value;
        }
      }
    });
    setDataAtCell(2, 0, 'test');

    expect(lastInvalid).toEqual('test');
  });

  it('this in validator should point to cellProperties', function () {
    var result = null
      , fired = false;

    handsontable({
      data: arrayOfObjects(),
      columns: [
        {data: 'id', validator: function (value, cb) {
          result = this;
          cb(true);
        }},
        {data: 'name'},
        {data: 'lastName'}
      ],
      afterValidate: function () {
        fired = true;
      }
    });
    setDataAtCell(2, 0, 123);

    expect(result.instance).toEqual(getInstance());
  });

  it('should add class name `htInvalid` to an cell that does not validate - on data load', function () {
    handsontable({
      data: createSpreadsheetData(2, 2),
      validator: function (value, callb) {
        if (value == "B1") {
          callb(false)
        }
        else {
          callb(true)
        }
      }
    });

    expect(this.$container.find('td.htInvalid').length).toEqual(1);
    expect(this.$container.find('td:not(.htInvalid)').length).toEqual(3);
  });

  it('should add class name `htInvalid` to an cell that does not validate - on edit', function () {
    handsontable({
      data: createSpreadsheetData(2, 2),
      validator: function (value, callb) {
        if (value == 'test') {
          callb(false)
        }
        else {
          callb(true)
        }
      }
    });

    setDataAtCell(0, 0, 'test');

    expect(this.$container.find('td.htInvalid').length).toEqual(1);
    expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
  });

  it('should add class name `htInvalid` to an cell that does not validate - after updateSettings & render', function () {
    handsontable({
      data: createSpreadsheetData(2, 2)
    });

    setDataAtCell(0, 0, 'test');

    expect(this.$container.find('td.htInvalid').length).toEqual(0);

    updateSettings({validator: function (value, callb) {
      if (value == 'test') {
        callb(false)
      }
      else {
        callb(true)
      }
    }});
    render();

    expect(this.$container.find('td.htInvalid').length).toEqual(1);
    expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);
  });

  it('should remove class name `htInvalid` when cell is edited to validate', function () {
    handsontable({
      data: createSpreadsheetData(2, 2),
      validator: function (value, callb) {
        if (value == 'A0') {
          callb(false)
        }
        else {
          callb(true)
        }
      }
    });

    expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(true);

    setDataAtCell(0, 0, 'test');

    expect(this.$container.find('tr:eq(0) td:eq(0)').hasClass('htInvalid')).toEqual(false);
  });

  it('should not allow for changes where data is invalid', function () {
    var changes = 0;

    handsontable({
      data: createSpreadsheetData(2, 2),
      allowInvalid: false,
      validator: function (value, callb) {
          callb(false)
      },
      afterChange: function (nvm, source) {
        if (source !== 'loadData') {
          changes++;
        }
      }
    });

    setDataAtCell(0, 0, 'test');

    expect(changes).toEqual(0);
  });
});