describe('manualColumnMove', function () {
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

  it("should change column order at init", function () {
    handsontable({
      data: [
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
      ],
      manualColumnMove: [1, 2, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Right');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('1');
  });

  it("should change the default column order with updateSettings", function () {
    handsontable({
      data: [
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
      ],
      manualColumnMove: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');

    updateSettings({
      manualColumnMove: [2, 1, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Right');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('1');
  });

  it("should change column order with updateSettings", function () {
    handsontable({
      data: [
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
      ],
      manualColumnMove: [1, 2, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Right');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('1');

    updateSettings({
      manualColumnMove: [2, 1, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Right');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('1');
  });

  it("should reset column order", function () {
    handsontable({
      data: [
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
      ],
      manualColumnMove: [1, 2, 0]
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Right');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('1');

    updateSettings({
      manualColumnMove: true
    });

    expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
    expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('Ted');
    expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('Right');
  });
});