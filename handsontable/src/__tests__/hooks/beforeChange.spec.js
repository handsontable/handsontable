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
    it('should be possible to remove change from the stack', async() => {
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

      await setDataAtCell([[0, 0, 'test'], [1, 0, 'test'], [1, 1, 'test']]);

      expect(getDataAtCell(0, 0)).toEqual('test');
      expect(getDataAtCell(1, 0)).toEqual('c');
      expect(getDataAtCell(1, 1)).toEqual('test');
      expect(output).toEqual([[0, 0, 'a', 'test'], [1, 1, 'd', 'test']]);
    });

    it('should be possible to read original value passed to the dataset setter (numeric cell type)', async() => {
      let dataChanges = null;

      handsontable({
        data: [[1, 2]],
        type: 'numeric',
        numericFormat: {
          minimumFractionDigits: 5,
          maximumFractionDigits: 5,
        },
        beforeChange(changes) {
          dataChanges = structuredClone(changes);
        },
      });

      await setDataAtCell(0, 0, '3,45');

      expect(dataChanges).toEqual([[0, 0, 1, '3,45']]);
    });

    it('should drop all changes when it returns false', async() => {
      handsontable({
        data: [['a', 'b'], ['c', 'd']],
        beforeChange() {
          return false;
        }
      });

      await setDataAtCell([[0, 0, 'test'], [1, 0, 'test'], [1, 1, 'test']]);

      expect(getDataAtCell(0, 0)).toBe('a');
      expect(getDataAtCell(1, 0)).toBe('c');
      expect(getDataAtCell(1, 1)).toBe('d');
    });

    it('should drop change and close the autocomplete editor', async() => {
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

      await setDataAtCell([[0, 0, 'test']]);

      expect(getDataAtCell(0, 0)).toBe('a');

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp('enter');

      expect(isEditorVisible()).toBe(false);
    });

    it('should drop change and close the date editor', async() => {
      handsontable({
        data: [['a', 'b'], ['c', 'd']],
        columns: [
          {
            type: 'date',
          },
          {
            // 2nd cell is simple text, no special options here
          },
        ],
        beforeChange(changes) {
          changes.splice(0, 1);
        }
      });

      await setDataAtCell([[0, 0, 'test']]);

      expect(getDataAtCell(0, 0)).toBe('a');

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp('enter');

      expect(isEditorVisible()).toBe(false);
    });

    it('should drop change when allowInvalid is `false` without closing an editor (which has validator)', async() => {
      handsontable({
        data: [['a', 'b'], ['c', 'd']],
        columns: () => ({
          validator: (_, callback) => callback(false),
          allowInvalid: false
        }),
        beforeChange: () => true
      });

      await setDataAtCell([[0, 0, 'test']]);

      expect(getDataAtCell(0, 0)).toBe('a');

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp('enter');

      expect(isEditorVisible()).toBe(true);
    });

    it('should not drop change when allowInvalid is `false` but close an editor (which has validator)', async() => {
      handsontable({
        data: [['a', 'b'], ['c', 'd']],
        columns: () => ({
          validator: (_, callback) => callback(false),
          allowInvalid: false
        }),
        beforeChange: () => false
      });

      await setDataAtCell([[0, 0, 'test']]);

      expect(getDataAtCell(0, 0)).toBe('a');

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp('enter');

      expect(isEditorVisible()).toBe(false);
    });

    using('keyboard key', ['delete', 'backspace'], (keyCode) => {
      it('should trigger the hook with `null`', async() => {
        let called = false;

        handsontable({
          beforeChange(changes) {
            if (changes[0][2] === 'test' && changes[0][3] === null) {
              called = true;
            }
          }
        });

        await setDataAtCell(0, 0, 'test');

        await selectCell(0, 0);
        await keyDownUp([keyCode]);

        expect(called).toBe(true);
      });
    });

    it('should pass the column accessor function as prop with function-based data accessor', async() => {
      const props = [];

      function model(opts) {
        const priv = { id: undefined, name: undefined };

        for (const key in opts) {
          if (Object.prototype.hasOwnProperty.call(opts, key)) {
            priv[key] = opts[key];
          }
        }

        return {
          attr(attr, val) {
            if (typeof val === 'undefined') {
              return priv[attr];
            }

            priv[attr] = val;

            return this;
          }
        };
      }

      function property(attr) {
        return (row, value) => row.attr(attr, value);
      }

      handsontable({
        data: [
          model({ id: 1, name: 'Ted' }),
          model({ id: 2, name: 'Frank' }),
        ],
        dataSchema: model,
        columns: [
          { data: property('id'), type: 'numeric' },
          { data: property('name') },
        ],
        beforeChange(changes) {
          changes.forEach((change) => {
            props.push(change[1]);
          });
        }
      });

      await setDataAtCell(0, 1, 'Updated');

      expect(props.length).toBe(1);
      expect(typeof props[0]).toBe('function');
      expect(propToCol(props[0])).toBe(1);
    });
  });
});
