import { OperationScope } from '../operationScope';

describe('OperationScope', () => {
  let scope;
  let opened;
  let settled;

  beforeEach(() => {
    scope = new OperationScope();
    opened = [];
    settled = [];
    scope.addOpenListener(transaction => opened.push(transaction));
    scope.addSettleListener(transaction => settled.push(transaction));
  });

  it('should open a transaction for the outermost operation and settle it when the operation returns', () => {
    const result = scope.run('change', 'edit', () => {
      expect(scope.isActive()).toBe(true);
      expect(settled.length).toBe(0);

      return 'value';
    });

    expect(result).toBe('value');
    expect(opened.length).toBe(1);
    expect(settled.length).toBe(1);
    expect(settled[0]).toBe(opened[0]);
    expect(settled[0].name).toBe('change');
    expect(settled[0].source).toBe('edit');
    expect(scope.isActive()).toBe(false);
  });

  it('should join nested operations into the outer transaction and keep the outer name', () => {
    scope.run('batch', undefined, () => {
      scope.run('change', 'edit', () => {
        scope.run('insert_row', 'auto', () => {});
      });

      expect(settled.length).toBe(0);
    });

    expect(opened.length).toBe(1);
    expect(settled.length).toBe(1);
    expect(settled[0].name).toBe('batch');
    expect(settled[0].operations).toEqual(['batch', 'change', 'insert_row']);
    expect(settled[0].sources).toEqual([undefined, 'edit', 'auto']);
  });

  it('should open a new transaction for each sequential operation, with increasing ids', () => {
    scope.run('change', undefined, () => {});
    scope.run('remove_row', undefined, () => {});

    expect(settled.map(transaction => transaction.name)).toEqual(['change', 'remove_row']);
    expect(settled[1].id).toBeGreaterThan(settled[0].id);
  });

  it('should settle a transaction whose operation threw, mark it aborted and rethrow', () => {
    expect(() => {
      scope.run('change', undefined, () => {
        scope.run('insert_row', undefined, () => {
          throw new Error('boom');
        });
      });
    }).toThrow('boom');

    expect(settled.length).toBe(1);
    expect(settled[0].aborted).toBe(true);
    expect(scope.isActive()).toBe(false);

    // The scope is not stuck: the next operation opens a transaction of its own.
    scope.run('change', undefined, () => {});

    expect(settled.length).toBe(2);
    expect(settled[1].aborted).toBe(false);
  });

  it('should record journal entries only while journaling is on and a transaction is open', () => {
    scope.record({ type: 'insertRows', physicalIndex: 0, amount: 1 });

    scope.run('change', undefined, () => {
      scope.record({ type: 'insertRows', physicalIndex: 0, amount: 1 });
    });

    expect(settled[0].journal).toEqual([]);

    scope.setJournaling(true);
    scope.record({ type: 'insertRows', physicalIndex: 0, amount: 1 });

    scope.run('change', undefined, () => {
      expect(scope.getRecordingTransaction()).toBe(opened[1]);

      scope.record({ type: 'insertRows', physicalIndex: 2, amount: 3 });
    });

    expect(settled[1].journal).toEqual([{ type: 'insertRows', physicalIndex: 2, amount: 3 }]);
    expect(scope.getRecordingTransaction()).toBe(null);
  });

  it('should keep a held transaction open until the hold is released, recording what its continuation writes', () => {
    let hold;

    scope.setJournaling(true);
    scope.run('change', 'edit', () => {
      hold = scope.hold();
    });

    // The operation returned, but the change it made waits for a validator.
    expect(settled.length).toBe(0);
    expect(scope.isActive()).toBe(false);

    // Another action in between opens a transaction of its own.
    scope.run('remove_row', undefined, () => {
      scope.record({ type: 'removeRows', physicalIndexes: [4], rows: [], accessorValues: [], metas: [] });
    });

    expect(settled.map(transaction => transaction.name)).toEqual(['remove_row']);

    hold.resume(() => {
      expect(scope.current()).toBe(opened[0]);

      scope.record({ type: 'insertRows', physicalIndex: 9, amount: 1 });
    });

    expect(settled.length).toBe(1);
    expect(scope.isActive()).toBe(false);

    hold.release();

    expect(settled.map(transaction => transaction.name)).toEqual(['remove_row', 'change']);
    expect(settled[1].journal).toEqual([{ type: 'insertRows', physicalIndex: 9, amount: 1 }]);
  });

  it('should settle a transaction once, after the operation, when its hold resumes and releases synchronously', () => {
    scope.run('change', undefined, () => {
      const hold = scope.hold();

      hold.resume(() => {
        expect(scope.current()).toBe(opened[0]);
      });
      hold.release();

      expect(settled.length).toBe(0);
    });

    expect(opened.length).toBe(1);
    expect(settled.length).toBe(1);
  });

  it('should ignore a second release of the same hold', () => {
    let firstHold;
    let secondHold;

    scope.run('change', undefined, () => {
      firstHold = scope.hold();
      secondHold = scope.hold();
    });

    firstHold.release();
    firstHold.release();

    expect(settled.length).toBe(0);

    secondHold.release();

    expect(settled.length).toBe(1);
  });

  it('should mark a held transaction aborted when its continuation throws, and still let the hold release it', () => {
    let hold;

    scope.run('change', undefined, () => {
      hold = scope.hold();
    });

    expect(() => hold.resume(() => {
      throw new Error('validator boom');
    })).toThrow('validator boom');

    expect(scope.isActive()).toBe(false);

    hold.release();

    expect(settled.length).toBe(1);
    expect(settled[0].aborted).toBe(true);
  });

  // A validator that throws never leaves the validators queue, so the hold of the change waiting for
  // the queue is never released. The transaction settles without it.
  describe('when a continuation throws', () => {
    let outer;
    let inner;

    beforeEach(() => {
      scope.setJournaling(true);
      scope.run('batch', 'edit', () => {
        outer = scope.hold();
        inner = scope.hold();
        scope.record({ type: 'insertRows', physicalIndex: 0, amount: 1 });
      });

      expect(() => inner.resume(() => {
        throw new Error('validator boom');
      })).toThrow('validator boom');

      inner.release();
    });

    it('should settle the transaction, aborted, without waiting for its other holds', () => {
      expect(settled.length).toBe(1);
      expect(settled[0].aborted).toBe(true);

      outer.release();

      expect(settled.length).toBe(1);
    });

    it('should run a hold resumed afterwards as an operation of its own', () => {
      const late = outer.resume(() => {
        scope.record({ type: 'insertRows', physicalIndex: 5, amount: 1 });

        return scope.current();
      });

      outer.release();

      expect(settled.length).toBe(2);
      expect(settled[1]).toBe(late);
      expect(late.name).toBe('batch');
      expect(late.journal).toEqual([{ type: 'insertRows', physicalIndex: 5, amount: 1 }]);
      expect(settled[0].journal).toEqual([{ type: 'insertRows', physicalIndex: 0, amount: 1 }]);
    });
  });

  it('should open no transaction and record nothing while suppressed', () => {
    scope.setJournaling(true);

    const result = scope.suppress(() => {
      scope.run('change', undefined, () => {
        expect(scope.current()).toBe(null);
        expect(scope.getRecordingTransaction()).toBe(null);

        scope.record({ type: 'insertRows', physicalIndex: 0, amount: 1 });

        const hold = scope.hold();

        expect(hold.resume(() => 'direct')).toBe('direct');
        hold.release();
      });

      return 'suppressed';
    });

    expect(result).toBe('suppressed');
    expect(opened.length).toBe(0);
    expect(settled.length).toBe(0);
    expect(scope.isSuppressed()).toBe(false);
  });

  it('should not journal inside a suppressed call made from within an open transaction', () => {
    scope.setJournaling(true);

    scope.run('change', undefined, () => {
      scope.suppress(() => {
        scope.record({ type: 'insertRows', physicalIndex: 1, amount: 1 });
      });

      scope.record({ type: 'insertRows', physicalIndex: 2, amount: 1 });
    });

    expect(settled.length).toBe(1);
    expect(settled[0].journal).toEqual([{ type: 'insertRows', physicalIndex: 2, amount: 1 }]);
  });

  it('should release its suppression when the suppressed callback throws', () => {
    expect(() => scope.suppress(() => {
      throw new Error('boom');
    })).toThrow('boom');

    expect(scope.isSuppressed()).toBe(false);

    scope.run('change', undefined, () => {});

    expect(settled.length).toBe(1);
  });

  it('should stop notifying listeners that were removed', () => {
    const lateListener = jest.fn();

    scope.addSettleListener(lateListener);
    scope.removeSettleListener(lateListener);
    scope.run('change', undefined, () => {});

    expect(lateListener).not.toHaveBeenCalled();
  });

  it('should settle nothing after destroy, even for a transaction held before it', () => {
    let hold;

    scope.run('change', undefined, () => {
      hold = scope.hold();
    });

    scope.destroy();
    hold.release();

    expect(settled.length).toBe(0);
  });

  // A listener that throws while a transaction opens (UndoRedo captures the grid state there) must not
  // leave the transaction on the stack: every later operation would join it and nothing would settle.
  it('should not leave a transaction open when an open listener throws', () => {
    const callback = jest.fn();
    const failOnce = jest.fn(() => {
      throw new Error('capture boom');
    });

    scope.addOpenListener(failOnce);

    expect(() => scope.run('change', undefined, callback)).toThrow('capture boom');
    expect(callback).not.toHaveBeenCalled();
    expect(scope.isActive()).toBe(false);

    scope.removeOpenListener(failOnce);
    scope.run('alter', undefined, () => {});

    expect(settled.map(transaction => transaction.name)).toEqual(['alter']);
    expect(settled[0].id).toBeGreaterThan(opened[0].id);
  });

  it('should settle once when the last hold is released inside its own continuation', () => {
    let hold;

    scope.run('change', undefined, () => {
      hold = scope.hold();
    });

    hold.resume(() => hold.release());

    expect(settled.length).toBe(1);
    expect(settled[0].holds).toBe(0);
    expect(settled[0].depth).toBe(0);
  });

  it('should settle once, when the outer hold releases, when one hold is released inside another\'s continuation', () => {
    let outer;
    let inner;

    scope.run('change', undefined, () => {
      outer = scope.hold();
      inner = scope.hold();
    });

    outer.resume(() => inner.release());

    expect(settled.length).toBe(0);

    outer.release();

    expect(settled.length).toBe(1);
  });

  it('should settle once, aborted, when a hold is released inside a continuation that throws', () => {
    let hold;

    scope.run('change', undefined, () => {
      hold = scope.hold();
    });

    expect(() => hold.resume(() => {
      hold.release();
      throw new Error('boom');
    })).toThrow('boom');

    expect(settled.length).toBe(1);
    expect(settled[0].aborted).toBe(true);
  });

  it('should resume a hold taken while suppressed inside a suppression, opening nothing', () => {
    let hold;

    scope.run('restore', undefined, () => {
      scope.suppress(() => {
        hold = scope.hold();
      });
    });

    const suppressedInside = hold.resume(() => {
      scope.run('change', undefined, () => {});

      return scope.isSuppressed();
    });

    hold.release();

    expect(suppressedInside).toBe(true);
    expect(settled.map(transaction => transaction.name)).toEqual(['restore']);
  });
});
