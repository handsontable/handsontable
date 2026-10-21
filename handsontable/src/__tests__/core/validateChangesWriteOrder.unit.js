import Handsontable from 'handsontable';

/**
 * Two writes to one cell that wait on an async validator land in the order the writes were made,
 * not in the order the validators answer: the last write wins.
 */
describe('Core validation of writes to the same cell', () => {
  let container;
  let hot;
  let pending;
  let edits;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = null;
    pending = [];
    edits = [];
  });

  afterEach(() => {
    hot?.destroy();
    container.remove();
  });

  /**
   * Creates a grid whose validator holds every answer until the test releases it.
   *
   * @param {object} settings Extra grid settings.
   * @returns {Handsontable}
   */
  function createGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: [['a', 'b'], ['c', 'd']],
      columns: [
        {
          validator: (value, callback) => {
            pending.push({ value, answer: callback });
          },
        },
        {
          validator: (value, callback) => {
            pending.push({ value, answer: callback });
          },
        },
      ],
      afterChange: (changes, source) => {
        if (source === 'edit') {
          edits.push(changes);
        }
      },
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot;
  }

  /**
   * Flushes the microtasks that defer the validation.
   */
  async function settle() {
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }
  }

  /**
   * Answers the held validator of the given value.
   *
   * @param {string} value The value the validator was asked about.
   * @param {boolean} [result=true] The validation result.
   */
  function answer(value, result = true) {
    const index = pending.findIndex(item => item.value === value);

    if (index === -1) {
      throw new Error(`No validator is waiting on "${value}"`);
    }

    pending.splice(index, 1)[0].answer(result);
  }

  it('should keep the newer value when the validators answer out of order', async() => {
    createGrid();

    hot.setDataAtCell(0, 0, 'first');
    hot.setDataAtCell(0, 0, 'second');
    await settle();
    answer('second');
    answer('first');
    await settle();

    expect(hot.getDataAtCell(0, 0)).toBe('second');
    expect(edits).toEqual([[[0, 0, 'a', 'second']]]);
  });

  it('should apply both values when the validators answer in order', async() => {
    createGrid();

    hot.setDataAtCell(0, 0, 'first');
    hot.setDataAtCell(0, 0, 'second');
    await settle();
    answer('first');
    answer('second');
    await settle();

    expect(hot.getDataAtCell(0, 0)).toBe('second');
    expect(edits).toEqual([[[0, 0, 'a', 'first']], [[0, 0, 'a', 'second']]]);
  });

  it('should apply writes to different cells whatever the answer order', async() => {
    createGrid();

    hot.setDataAtCell(0, 0, 'first');
    hot.setDataAtCell(0, 1, 'second');
    await settle();
    answer('second');
    answer('first');
    await settle();

    expect(hot.getDataAtCell(0, 0)).toBe('first');
    expect(hot.getDataAtCell(0, 1)).toBe('second');
  });

  it('should skip a stale write from a call that also carries other cells', async() => {
    createGrid();

    hot.setDataAtCell([[0, 0, 'first'], [1, 0, 'x']]);
    hot.setDataAtCell(0, 0, 'second');
    await settle();
    answer('second');
    answer('first');
    answer('x');
    await settle();

    expect(hot.getDataAtCell(0, 0)).toBe('second');
    expect(hot.getDataAtCell(1, 0)).toBe('x');
  });

  it('should keep the older value when the newer write is rejected', async() => {
    createGrid({
      columns: [{
        allowInvalid: false,
        validator: (value, callback) => {
          pending.push({ value, answer: callback });
        },
      }],
    });

    hot.setDataAtCell(0, 0, 'first');
    hot.setDataAtCell(0, 0, 'second');
    await settle();
    answer('second', false);
    answer('first');
    await settle();

    expect(hot.getDataAtCell(0, 0)).toBe('first');
  });

  it('should keep the newest of three writes whatever the answer order', async() => {
    createGrid();

    hot.setDataAtCell(0, 0, 'first');
    hot.setDataAtCell(0, 0, 'second');
    hot.setDataAtCell(0, 0, 'third');
    await settle();
    answer('third');
    answer('first');
    answer('second');
    await settle();

    expect(hot.getDataAtCell(0, 0)).toBe('third');
    expect(edits).toEqual([[[0, 0, 'a', 'third']]]);
  });

  it('should keep the newer value when one call carries two writes to the stale cell', async() => {
    createGrid();

    hot.setDataAtCell([[0, 0, 'x'], [0, 0, 'y']]);
    hot.setDataAtCell(0, 0, 'second');
    await settle();
    answer('second');
    answer('x');
    answer('y');
    await settle();

    expect(hot.getDataAtCell(0, 0)).toBe('second');
  });

  it('should keep the newer value of a row that does not exist yet', async() => {
    createGrid();

    hot.setDataAtCell(4, 0, 'first');
    hot.setDataAtCell(4, 0, 'second');
    await settle();
    answer('second');
    answer('first');
    await settle();

    expect(hot.countRows()).toBe(5);
    expect(hot.getDataAtCell(4, 0)).toBe('second');
  });

  it('should apply a write made after the earlier ones settled', async() => {
    createGrid();

    hot.setDataAtCell(0, 0, 'first');
    hot.setDataAtCell(0, 0, 'second');
    await settle();
    answer('second');
    answer('first');
    await settle();
    hot.setDataAtCell(0, 0, 'third');
    await settle();
    answer('third');
    await settle();

    expect(hot.getDataAtCell(0, 0)).toBe('third');
  });

  it('should keep the validity of the newer write when the stale validator answers invalid later', async() => {
    createGrid();

    hot.setDataAtCell(0, 0, 'first');
    hot.setDataAtCell(0, 0, 'second');
    await settle();
    answer('second', true);
    await settle();
    answer('first', false);
    await settle();

    expect(hot.getDataAtCell(0, 0)).toBe('second');
    expect(hot.getCellMeta(0, 0).valid).toBe(true);
  });

  it('should keep the invalid mark of the newer write when the stale validator answers valid later', async() => {
    createGrid();

    hot.setDataAtCell(0, 0, 'first');
    hot.setDataAtCell(0, 0, 'second');
    await settle();
    answer('second', false);
    await settle();
    answer('first', true);
    await settle();

    expect(hot.getDataAtCell(0, 0)).toBe('second');
    expect(hot.getCellMeta(0, 0).valid).toBe(false);
  });

  it('should mark the cell with the result of the write it holds when both calls apply', async() => {
    createGrid();

    hot.setDataAtCell(0, 0, 'first');
    hot.setDataAtCell([[0, 0, 'second'], [1, 0, 'z']]);
    await settle();
    answer('second', false);
    await settle();
    answer('first', true);
    await settle();
    answer('z');
    await settle();

    expect(hot.getDataAtCell(0, 0)).toBe('second');
    expect(hot.getCellMeta(0, 0).valid).toBe(false);
  });

  it('should still apply a change that a validator corrects through a nested write', async() => {
    createGrid();

    hot.setDataAtCell(0, 0, 'bad');
    await settle();
    hot.setDataAtCell(0, 0, 'fixed', 'correctionValidator');
    await settle();
    answer('fixed');
    await settle();
    answer('bad');
    await settle();

    expect(hot.getDataAtCell(0, 0)).toBe('fixed');
    expect(edits).toEqual([[[0, 0, 'a', 'fixed']]]);
  });

  describe('with `allowInvalid: false` and several changes in one call', () => {
    /**
     * Writes two invalid values and one valid one in a single call, then answers the validators in
     * the given order.
     *
     * @param {string[]} answerOrder The values in the order their validators answer.
     */
    async function writeAndAnswer(answerOrder) {
      createGrid({
        data: [['a'], ['b'], ['c']],
        columns: [{
          allowInvalid: false,
          validator: (value, callback) => {
            pending.push({ value, answer: callback });
          },
        }],
      });

      hot.setDataAtCell([[0, 0, 'bad0'], [1, 0, 'bad1'], [2, 0, 'ok']]);
      await settle();
      answerOrder.forEach(value => answer(value, value === 'ok'));
      await settle();
    }

    [
      ['ascending index order', ['bad0', 'bad1', 'ok']],
      ['descending index order', ['ok', 'bad1', 'bad0']],
      ['an order with a valid answer between two rejections', ['bad0', 'ok', 'bad1']],
    ].forEach(([name, answerOrder]) => {
      it(`should drop every rejected change when the validators answer in ${name}`, async() => {
        await writeAndAnswer(answerOrder);

        expect(hot.getDataAtCol(0)).toEqual(['a', 'b', 'ok']);
        expect(edits).toEqual([[[2, 0, 'c', 'ok']]]);
        expect(hot.getCellMeta(0, 0).valid).toBe(true);
        expect(hot.getCellMeta(1, 0).valid).toBe(true);
      });
    });
  });
});
