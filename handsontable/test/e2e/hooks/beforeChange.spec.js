describe('Hook', () => {
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

  describe('beforeChange', () => {
    it('should be possible to remove change from the stack', () => {
      let output = null;

      handsontable({
        data: [['a', 'b'], ['c', 'd']],
        beforeChange(changes) {
          changes[1] = null;
        },
        afterChange(changes) {
          output = changes;
        }
      });

      setDataAtCell([[0, 0, 'test'], [1, 0, 'test'], [1, 1, 'test']]);

      expect(getDataAtCell(0, 0)).toEqual('test');
      expect(getDataAtCell(1, 0)).toEqual('c');
      expect(getDataAtCell(1, 1)).toEqual('test');
      expect(output).toEqual([[0, 0, 'a', 'test'], [1, 1, 'd', 'test']]);
    });

    it('should be possible to read original value passed to the dataset setter (numeric cell type)', () => {
      let dataChanges = null;

      handsontable({
        data: [[1, 2]],
        type: 'numeric',
        numericFormat: {
          pattern: '0,0.00000'
        },
        beforeChange(changes) {
          dataChanges = structuredClone(changes);
        },
      });

      setDataAtCell(0, 0, '3,45');

      expect(dataChanges).toEqual([[0, 0, 1, '3,45']]);
    });

    it('should drop all changes when it returns false', () => {
      handsontable({
        data: [['a', 'b'], ['c', 'd']],
        beforeChange() {
          return false;
        }
      });

      setDataAtCell([[0, 0, 'test'], [1, 0, 'test'], [1, 1, 'test']]);

      expect(getDataAtCell(0, 0)).toBe('a');
      expect(getDataAtCell(1, 0)).toBe('c');
      expect(getDataAtCell(1, 1)).toBe('d');
    });

    it('should drop change and close the autocomplete editor', () => {
      handsontable({
        data: [['a', 'b'], ['c', 'd']],
        columns: [
          {
            type: 'autocomplete',
            source: ['Audi', 'BMW', 'Chrysler', 'Citroen', 'Mercedes', 'Nissan', 'Opel', 'Suzuki', 'Toyota', 'Volvo'],
            strict: false
          },
          {
            // 2nd cell is simple text, no special options here
          },
        ],
        beforeChange(changes) {
          changes[0] = null;
        }
      });

      setDataAtCell([[0, 0, 'test']]);

      expect(getDataAtCell(0, 0)).toBe('a');

      selectCell(0, 0);
      keyDownUp('enter');
      keyDownUp('enter');

      expect(isEditorVisible()).toBe(false);
    });

    it('should drop change and close the date editor', () => {
      handsontable({
        data: [['a', 'b'], ['c', 'd']],
        columns: [
          {
            type: 'date',
            dateFormat: 'MM/DD/YYYY',
            correctFormat: true,
            defaultDate: '01/01/1900',
          },
          {
            // 2nd cell is simple text, no special options here
          },
        ],
        beforeChange(changes) {
          changes.splice(0, 1);
        }
      });

      setDataAtCell([[0, 0, 'test']]);

      expect(getDataAtCell(0, 0)).toBe('a');

      selectCell(0, 0);
      keyDownUp('enter');
      keyDownUp('enter');

      expect(isEditorVisible()).toBe(false);
    });

    it('should drop change when allowInvalid is `false` without closing an editor (which has validator)', () => {
      handsontable({
        data: [['a', 'b'], ['c', 'd']],
        columns: () => ({
          validator: (_, callback) => callback(false),
          allowInvalid: false
        }),
        beforeChange: () => true
      });

      setDataAtCell([[0, 0, 'test']]);

      expect(getDataAtCell(0, 0)).toBe('a');

      selectCell(0, 0);
      keyDownUp('enter');
      keyDownUp('enter');

      expect(isEditorVisible()).toBe(true);
    });

    it('should not drop change when allowInvalid is `false` but close an editor (which has validator)', () => {
      handsontable({
        data: [['a', 'b'], ['c', 'd']],
        columns: () => ({
          validator: (_, callback) => callback(false),
          allowInvalid: false
        }),
        beforeChange: () => false
      });

      setDataAtCell([[0, 0, 'test']]);

      expect(getDataAtCell(0, 0)).toBe('a');

      selectCell(0, 0);
      keyDownUp('enter');
      keyDownUp('enter');

      expect(isEditorVisible()).toBe(false);
    });

    using('keyboard key', ['delete', 'backspace'], (keyCode) => {
      it('should trigger the hook with `null`', () => {
        let called = false;

        handsontable({
          beforeChange(changes) {
            if (changes[0][2] === 'test' && changes[0][3] === null) {
              called = true;
            }
          }
        });

        setDataAtCell(0, 0, 'test');
        selectCell(0, 0);
        keyDownUp([keyCode]);

        expect(called).toBe(true);
      });
    });
  });
});
