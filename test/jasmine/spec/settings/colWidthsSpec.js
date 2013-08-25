describe('settings', function () {
  describe('colWidths', function () {
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

    describe('defined in constructor', function () {
      it('should consider colWidths provided as number', function () {
        handsontable({
          colWidths: 123
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });

      it('should consider colWidths provided as string', function () {
        handsontable({
          colWidths: "123"
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });

      it('should consider colWidths provided as array of numbers', function () {
        handsontable({
          colWidths: [123]
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });

      it('should consider colWidths provided as array of strings', function () {
        handsontable({
          colWidths: ["123"]
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });

      it('should consider colWidth provided as function that returns number', function () {
        handsontable({
          colWidths: function (index) {
            if (index === 0) {
              return 123;
            }
            return 50;
          }
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });

      it('should consider colWidth provided as function that returns string', function () {
        handsontable({
          colWidths: function (index) {
            if (index === 0) {
              return "123";
            }
            return "50";
          }
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });
    });

    describe('defined in updateSettings', function () {
      it('should consider colWidths provided as number', function () {
        handsontable();
        updateSettings({
          colWidths: 123
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });

      it('should consider colWidths provided as string', function () {
        handsontable();
        updateSettings({
          colWidths: "123"
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });

      it('should consider colWidths provided as array of numbers', function () {
        handsontable();
        updateSettings({
          colWidths: [123]
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });

      it('should consider colWidths provided as array of strings', function () {
        handsontable();
        updateSettings({
          colWidths: ["123"]
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });

      it('should consider colWidth provided as function that returns number', function () {
        handsontable();
        updateSettings({
          colWidths: function (index) {
            if (index === 0) {
              return 123;
            }
            return 50;
          }
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });

      it('should consider colWidth provided as function that returns string', function () {
        handsontable();
        updateSettings({
          colWidths: function (index) {
            if (index === 0) {
              return "123";
            }
            return "50";
          }
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });
    });

    describe('defined in columns', function () {
      it('should consider width provided as number', function () {
        handsontable({
          columns: [
            {
              width: 123
            }
          ]
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });

      it('should consider width provided as string', function () {
        handsontable({
          columns: [
            {
              width: "123"
            }
          ]
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });

      it('should consider width provided as array of numbers', function () {
        handsontable({
          columns: [
            {
              width: [123]
            }
          ]
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });

      it('should consider width provided as array of strings', function () {
        handsontable({
          columns: [
            {
              width: ["123"]
            }
          ]
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });

      it('should consider width provided as function that returns number', function () {
        handsontable({
          columns: [
            {
              width: function (index) {
                if (index === 0) {
                  return 123;
                }
                return 50;
              }
            }
          ]
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });

      it('should consider width provided as function that returns string', function () {
        handsontable({
          columns: [
            {
              width: function (index) {
                if (index === 0) {
                  return "123";
                }
                return "50";
              }
            }
          ]
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });
    });

    describe('defined in cells', function () {
      it('should consider width provided as number', function () {
        handsontable({
          cells: function (row, col) {
            if (col === 0) {
              this.width = 123;
            }
          }
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });

      it('should consider width provided as string', function () {
        handsontable({
          cells: function (row, col) {
            if (col === 0) {
              this.width = "123";
            }
          }
        });

        expect(colWidth(this.$container, 0)).toBe(123);
      });
    });
  });
});