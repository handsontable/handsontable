describe('settings', () => {
  describe('colWidths', () => {
    const id = 'testContainer';

    beforeEach(function() {
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('defined in constructor', () => {
      it('should consider colWidths provided as number', () => {
        handsontable({
          colWidths: 123
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidths provided as string', () => {
        handsontable({
          colWidths: '123'
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidths provided as array of numbers', () => {
        handsontable({
          colWidths: [123]
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidths provided as array of strings', () => {
        handsontable({
          colWidths: ['123']
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidth provided as function that returns number', () => {
        handsontable({
          colWidths(index) {
            if (index === 0) {
              return 123;
            }
            return 50;
          }
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidth provided as function that returns string', () => {
        handsontable({
          colWidths(index) {
            if (index === 0) {
              return '123';
            }
            return '50';
          }
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });
    });

    describe('defined in updateSettings', () => {
      it('should consider colWidths provided as number', () => {
        handsontable();
        updateSettings({
          colWidths: 123
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidths provided as string', () => {
        handsontable();
        updateSettings({
          colWidths: '123'
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidths provided as array of numbers', () => {
        handsontable();
        updateSettings({
          colWidths: [123]
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidths provided as array of strings', () => {
        handsontable();
        updateSettings({
          colWidths: ['123']
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidth provided as function that returns number', () => {
        handsontable();
        updateSettings({
          colWidths(index) {
            if (index === 0) {
              return 123;
            }
            return 50;
          }
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidth provided as function that returns string', () => {
        handsontable();
        updateSettings({
          colWidths(index) {
            if (index === 0) {
              return '123';
            }
            return '50';
          }
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });
    });

    describe('defined in columns', () => {
      it('should consider width provided as number', () => {
        handsontable({
          columns: [
            {
              width: 123
            }
          ]
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider width provided as string', () => {
        handsontable({
          columns: [
            {
              width: '123'
            }
          ]
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider width provided as array of numbers', () => {
        handsontable({
          columns: [
            {
              width: [123]
            }
          ]
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider width provided as array of strings', () => {
        handsontable({
          columns: [
            {
              width: ['123']
            }
          ]
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider width provided as function that returns number', () => {
        handsontable({
          columns: [
            {
              width(index) {
                if (index === 0) {
                  return 123;
                }
                return 50;
              }
            }
          ]
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider width provided as function that returns string', () => {
        handsontable({
          columns: [
            {
              width(index) {
                if (index === 0) {
                  return '123';
                }
                return '50';
              }
            }
          ]
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });
    });

    describe('defined in cells', () => {
      it('should consider width provided as number', () => {
        handsontable({
          cells(row, col) {
            if (col === 0) {
              this.width = 123;
            }
          }
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider width provided as string', () => {
        handsontable({
          cells(row, col) {
            if (col === 0) {
              this.width = '123';
            }
          }
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });
    });
  });
});
