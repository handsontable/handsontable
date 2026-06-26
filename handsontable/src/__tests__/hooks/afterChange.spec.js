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

  describe('afterChange', () => {
    it('should be possible to read normalized value passed to the dataset setter (numeric cell type)', async() => {
      let dataChanges = null;

      handsontable({
        data: [[1, 2]],
        type: 'numeric',
        numericFormat: {
          minimumFractionDigits: 5,
          maximumFractionDigits: 5,
        },
        afterChange(changes, source) {
          if (source !== 'loadData') {
            dataChanges = structuredClone(changes);
          }
        },
      });

      await setDataAtCell(0, 0, '3,45');

      await waitForNextAnimationFrames();

      expect(dataChanges).toEqual([[0, 0, 1, 3.45]]);
    });

    using('keyboard key', ['delete', 'backspace'], (keyCode) => {
      it('should trigger the hook with `null`', async() => {
        let called = false;

        handsontable({
          afterChange(changes, source) {
            if (source === 'loadData') {
              return;
            }

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
        afterChange(changes, source) {
          if (source === 'loadData') {
            return;
          }

          changes.forEach((change) => {
            props.push(change[1]);
          });
        }
      });

      await setDataAtCell(0, 1, 'Updated');

      await waitForNextAnimationFrames();

      expect(props.length).toBe(1);
      expect(typeof props[0]).toBe('function');
      expect(propToCol(props[0])).toBe(1);
    });
  });
});
