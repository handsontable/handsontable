import { createWriteLedger, getCellWriteKey } from '../writeLedger';
import type { CellChange } from '../../settings';

describe('getCellWriteKey', () => {
  it('should name a cell by its row and property', () => {
    expect(getCellWriteKey(2, 'name', 1)).toBe(getCellWriteKey(2, 'name', 5));
    expect(getCellWriteKey(2, 'name', 1)).not.toBe(getCellWriteKey(3, 'name', 1));
    expect(getCellWriteKey(2, 'name', 1)).not.toBe(getCellWriteKey(2, 'age', 1));
  });

  it('should name a data accessor column by the function, not by its visual column', () => {
    const firstAccessor = () => 'a';
    const secondAccessor = () => 'b';

    expect(getCellWriteKey(0, firstAccessor, 2)).toBe(getCellWriteKey(0, firstAccessor, 0));
    expect(getCellWriteKey(0, firstAccessor, 2)).not.toBe(getCellWriteKey(0, secondAccessor, 2));
  });

  it('should fall back to the visual column for an unbound column', () => {
    expect(getCellWriteKey(0, null, 1)).not.toBe(getCellWriteKey(0, null, 2));
  });
});

describe('createWriteLedger', () => {
  const meta = () => ({ valid: undefined as boolean | undefined });
  const change = (value: string): CellChange => [0, 0, 'a', value];

  it('should drop the change of a call that a newer applied call overtook', () => {
    const open = createWriteLedger();
    const older = open();
    const newer = open();
    const olderChange = change('first');
    const newerChange = change('second');

    older.register(olderChange, '0:p0', meta(), 1);
    newer.register(newerChange, '0:p0', meta(), 1);

    const newerChanges = [newerChange];

    newer.claim(newerChanges, jest.fn());
    newer.settle(newerChanges);

    const olderChanges = [olderChange];

    older.claim(olderChanges, jest.fn());

    expect(newerChanges).toEqual([newerChange]);
    expect(olderChanges).toEqual([]);
  });

  it('should not drop the change of a call when the newer call has not applied yet', () => {
    const open = createWriteLedger();
    const older = open();
    const newer = open();
    const olderChange = change('first');

    older.register(olderChange, '0:p0', meta(), 1);
    newer.register(change('second'), '0:p0', meta(), 1);

    const olderChanges = [olderChange];

    older.claim(olderChanges, jest.fn());

    expect(olderChanges).toEqual([olderChange]);
  });

  it('should forget a cell once every call holding it released it', () => {
    const open = createWriteLedger();
    const first = open();
    const firstChange = change('first');

    first.register(firstChange, '0:p0', meta(), 1);
    first.settle([firstChange]);
    first.release();

    const second = open();
    const secondChange = change('second');

    second.register(secondChange, '0:p0', meta(), 1);

    const secondChanges = [secondChange];

    second.claim(secondChanges, jest.fn());

    expect(secondChanges).toEqual([secondChange]);
  });

  it('should hand each applied change its own validity, whatever the shared meta holds', () => {
    const open = createWriteLedger();
    const call = open();
    const sharedMeta = { valid: true as boolean | undefined };
    const restoreValidity = jest.fn();
    const callChange = change('second');

    call.register(callChange, '0:p0', sharedMeta, 7);
    call.answered(callChange, false);
    call.claim([callChange], restoreValidity);

    expect(restoreValidity).toHaveBeenCalledWith(sharedMeta, false, 7);
  });
});
