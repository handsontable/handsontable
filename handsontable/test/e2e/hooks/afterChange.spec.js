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
          pattern: '0,0.00000'
        },
        afterChange(changes, source) {
          if (source !== 'loadData') {
            dataChanges = structuredClone(changes);
          }
        },
      });

      setDataAtCell(0, 0, '3,45');

      await sleep(50);

      expect(dataChanges).toEqual([[0, 0, 1, 3.45]]);
    });

    using('keyboard key', ['delete', 'backspace'], (keyCode) => {
      it('should trigger the hook with `null`', () => {
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

        setDataAtCell(0, 0, 'test');
        selectCell(0, 0);
        keyDownUp([keyCode]);

        expect(called).toBe(true);
      });
    });
  });
});
