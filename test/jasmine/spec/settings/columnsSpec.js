describe('settings', function() {
  describe('columns', function() {
    var id = 'testContainer';

    var arrayOfArrays = function() {
      return [
        ["", "Kia", "Nissan", "Toyota", "Honda"],
        ["2008", 10, 11, 12, 13],
        ["2009", 20, 11, 14, 13],
        ["2010", 30, 15, 12, 13]
      ];
    };

    var arrayOfObjects = function() {
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

    beforeEach(function() {
      this.$container = $('<div id="' + id + '"></div>').appendTo('body');
    });

    afterEach(function() {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    it('should not throw exception when passed columns array is empty (data source as array of arrays)', function() {
      var hot = handsontable({
        data: arrayOfArrays(),
        columns: [
          {data: 0},
          {data: 1},
          {data: 2}
        ],
      });

      expect(function() {
        hot.updateSettings({columns: []});
      }).not.toThrow();
    });

    it('should not throw exception when passed columns array is empty (data source as array of objects)', function() {
      var hot = handsontable({
        data: arrayOfObjects(),
        columns: [
          {data: 'id'},
          {data: 'name'},
          {data: 'lastName'}
        ],
      });

      expect(function() {
        hot.updateSettings({columns: []});
      }).not.toThrow();
    });
  });
});
