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
      it('should consider colWidths provided as number', async() => {
        handsontable({
          colWidths: 123
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidths provided as string', async() => {
        handsontable({
          colWidths: '123'
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidths provided as array of numbers', async() => {
        handsontable({
          colWidths: [123]
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidths provided as array of strings', async() => {
        handsontable({
          colWidths: ['123']
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidth provided as function that returns number', async() => {
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

      it('should consider colWidth provided as function that returns string', async() => {
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
      it('should consider colWidths provided as number', async() => {
        handsontable();
        await updateSettings({
          colWidths: 123
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidths provided as string', async() => {
        handsontable();
        await updateSettings({
          colWidths: '123'
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidths provided as array of numbers', async() => {
        handsontable();
        await updateSettings({
          colWidths: [123]
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidths provided as array of strings', async() => {
        handsontable();
        await updateSettings({
          colWidths: ['123']
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidth provided as function that returns number', async() => {
        handsontable();
        await updateSettings({
          colWidths(index) {
            if (index === 0) {
              return 123;
            }

            return 50;
          }
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider colWidth provided as function that returns string', async() => {
        handsontable();
        await updateSettings({
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
      it('should consider width provided as number', async() => {
        handsontable({
          columns: [
            {
              width: 123
            }
          ]
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider width provided as string', async() => {
        handsontable({
          columns: [
            {
              width: '123'
            }
          ]
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider width provided as array of numbers', async() => {
        handsontable({
          columns: [
            {
              width: [123]
            }
          ]
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider width provided as array of strings', async() => {
        handsontable({
          columns: [
            {
              width: ['123']
            }
          ]
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider width provided as function that returns number', async() => {
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

      it('should consider width provided as function that returns string', async() => {
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
      it('should consider width provided as number', async() => {
        handsontable({
          cells(row, col) {
            if (col === 0) {
              this.width = 123;
            }
          }
        });

        expect(colWidth(spec().$container, 0)).toBe(123);
      });

      it('should consider width provided as string', async() => {
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
