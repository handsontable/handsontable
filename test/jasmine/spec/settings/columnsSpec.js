describe('settings', function() {
  describe('columns', function() {
    var id = 'testContainer';
    var arrayOfArrays = function () {
      return [
        ["", "Kia", "Nissan", "Toyota", "Honda"],
        ["2008", 10, 11, 12, 13],
        ["2009", 20, 11, 14, 13],
        ["2010", 30, 15, 12, 13]
      ];
    };
    var arrayOfObjects = function () {
      return [
        {id: 1, name: "Ted", lastName: "Right", date: "01/01/2015"},
        {id: 2, name: "Frank", lastName: "Honest", date: "01/01/15"},
        {id: 3, name: "Joan", lastName: "Well", date: "41/01/2015"},
        {id: 4, name: "Sid", lastName: "Strong", date: "01/51/2015"},
        {id: 5, name: "Jane", lastName: "Neat", date: "01/01/2015"},
        {id: 6, name: "Chuck", lastName: "Jackson", date: "01/01/15"},
        {id: 7, name: "Meg", lastName: "Jansen", date: "41/01/2015"},
        {id: 8, name: "Rob", lastName: "Norris", date: "01/51/2015"},
        {id: 9, name: "Sean", lastName: "O'Hara", date: "01/01/2015"},
        {id: 10, name: "Eve", lastName: "Branson", date: "01/01/15"}
      ];
    };

    beforeEach(function () {
      this.$container = $('<div id="' + id + '"></div>').appendTo('body');
    });

    afterEach(function () {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('as an array of objects', function() {
      it('should not throw exception when passed columns array is empty (data source as array of arrays)', function () {
        var hot = handsontable({
          data: arrayOfArrays(),
          columns: [
            {data: 0},
            {data: 1},
            {data: 2}
          ]
        });

        expect(function () {
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

    describe('as a function', function() {
      describe('init', function() {
        it('should render only these columns which are not `null`', function() {
          var hot = handsontable({
            data: arrayOfArrays(),
            columns: function (column) {
              return [1, 2].indexOf(column) > -1 ? {} : null;
            }
          });

          expect(hot.getData()[0].length).toEqual(2);
        });

        it('should properly bind default data when is not defined (data source as array of arrays)', function() {
          var hot = handsontable({
            data: arrayOfArrays(),
            columns: function (column) {
              return [1, 2].indexOf(column) > -1 ? {} : null;
            }
          });

          expect(hot.getDataAtCell(0, 0)).toEqual('');
          expect(hot.getDataAtCell(0, 1)).toEqual('Kia');
        });

        it('should properly bind default data when is not defined (data source as array of objects)', function() {
          var hot = handsontable({
            data: arrayOfObjects(),
            columns: function (column) {
              return [1, 2].indexOf(column) > -1 ? {} : null;
            }
          });

          expect(hot.getDataAtCell(0, 0)).toEqual(null);
          expect(hot.getDataAtCell(0, 1)).toEqual(null);
        });

        it('should properly bind defined data (data source as array of arrays)', function() {
          var hot = handsontable({
            data: arrayOfArrays(),
            columns: function (column) {
              return [1, 2].indexOf(column) > -1 ? {data: column + 1} : null;
            }
          });

          expect(hot.getDataAtCell(0, 0)).toEqual('Nissan');
          expect(hot.getDataAtCell(0, 1)).toEqual('Toyota');
        });

        it('should properly bind defined data (data source as array of objects)', function() {
          var hot = handsontable({
            data: arrayOfObjects(),
            columns: function (column) {
              var keys = ['id', 'name', 'lastName'];

              return [1, 2].indexOf(column) > -1 ? {data: keys[column -1]} : null;
            }
          });

          expect(hot.getDataAtCell(0, 0)).toEqual(1);
          expect(hot.getDataAtCell(0, 1)).toEqual('Ted');
        });
      });

      describe('updateSettings', function() {
        it('should not throw exception when passed columns function without return anything (data source as array of arrays) when columns is a function', function () {
          var hot = handsontable({
            data: arrayOfArrays(),
            columns: function (column) {
              return [0, 1, 2].indexOf(column) > -1 ? {data: column} : null;
            }
          });

          expect(function () {
            hot.updateSettings({columns: function () {}});
          }).not.toThrow();
        });

        it('should not throw exception when passed columns function without return anything (data source as array of objects) when columns is a function', function() {
          var hot = handsontable({
            data: arrayOfObjects(),
            columns: function(column) {
              var keys = ['id', 'name', 'lasName'];

              return [0,1,2].indexOf(column) > -1 ? {data: keys[column]} : null;
            }
          });

          expect(function() {
            hot.updateSettings({columns: function() {}});
          }).not.toThrow();
        });
      });

      describe('editors', function() {
        it('should properly bind defined editors', function() {
          handsontable({
            data: [
              ['Joe'],
              ['Timothy'],
              ['Margaret'],
              ['Jerry']
            ],
            columns: function(column) {
              return column === 0 ? { editor: Handsontable.editors.PasswordEditor } : null;
            }
          });

          selectCell(0, 0);
          keyDown('enter');

          var editor = $('.handsontableInput');

          expect(editor.is(':visible')).toBe(true);
          expect(editor.is(':password')).toBe(true);
        });
      });

      describe('renderers', function() {
        it('should properly bind defined renderer', function() {
          handsontable({
            data:  [[true],[false],[true]],
            columns: function(column) {
              return column === 0 ? { type: 'checkbox' } : null;
            }
          });

          expect($(getRenderedValue(0, 0)).is(':checkbox')).toBe(true);
          expect($(getRenderedValue(1, 0)).is(':checkbox')).toBe(true);
          expect($(getRenderedValue(2, 0)).is(':checkbox')).toBe(true);
        });
      });

      describe('validators', function() {
        it('should properly bind defined validator', function() {
          var onAfterValidate = jasmine.createSpy('onAfterValidate');

          handsontable({
            data: arrayOfObjects(),
            columns: function(column) {
              var settings = [
                {data: 'date', type: 'date'},
                {data: 'name'},
                {data: 'lastName'}
              ];
              return [0, 1, 2].indexOf(column) > -1 ? settings[column] : null;
            },
            afterValidate: onAfterValidate
          });

          setDataAtCell(0, 0, '');

          waitsFor(function () {
            return onAfterValidate.calls.length > 0;
          }, 'Cell validation', 1000);

          runs(function () {
            expect(onAfterValidate).toHaveBeenCalledWith(true, '', 0, 'date', undefined, undefined);
          });
        });
      });
    });
  });
});
