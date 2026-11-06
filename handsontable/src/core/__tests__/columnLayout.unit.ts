import {
  isColumnLayoutAppend,
  isColumnLayoutKept,
  isColumnLayoutTruncation,
  isSameColumnLayout,
} from '../columnLayout';

describe('isSameColumnLayout', () => {
  it('should report the same layout for the same count and properties', () => {
    expect(isSameColumnLayout({ count: 2, props: ['a', 'b'] }, { count: 2, props: ['a', 'b'] })).toBe(true);
    expect(isSameColumnLayout({ count: 0, props: [] }, { count: 0, props: [] })).toBe(true);
  });

  it('should report a different layout when the count differs', () => {
    expect(isSameColumnLayout({ count: 2, props: ['a', 'b'] }, { count: 3, props: ['a', 'b'] })).toBe(false);
  });

  it('should report a different layout when a property is renamed', () => {
    expect(isSameColumnLayout({ count: 2, props: ['a', 'b'] }, { count: 2, props: ['a', 'x'] })).toBe(false);
  });

  it('should report a different layout when the properties are reordered', () => {
    expect(isSameColumnLayout({ count: 2, props: ['a', 'b'] }, { count: 2, props: ['b', 'a'] })).toBe(false);
  });

  it('should report a different layout when the number of properties differs', () => {
    expect(isSameColumnLayout({ count: 2, props: ['a'] }, { count: 2, props: ['a', 'b'] })).toBe(false);
  });

  it('should compare the properties by identity', () => {
    const accessor = () => 'a';

    expect(isSameColumnLayout({ count: 1, props: [accessor] }, { count: 1, props: [accessor] })).toBe(true);
    expect(isSameColumnLayout({ count: 1, props: [accessor] }, { count: 1, props: [() => 'a'] })).toBe(false);
  });
});

describe('isSameColumnLayout with sparse properties', () => {
  it('should report a different layout when a hole in one is a property in the other', () => {
    // A column that declares no `data` leaves a hole in the property cache.
    const sparse: unknown[] = ['a', , 'c']; // eslint-disable-line no-sparse-arrays

    expect(isSameColumnLayout({ count: 3, props: sparse }, { count: 3, props: ['a', 'b', 'c'] })).toBe(false);
    expect(isSameColumnLayout({ count: 3, props: ['a', 'b', 'c'] }, { count: 3, props: sparse })).toBe(false);
  });

  it('should report the same layout for two equal sparse properties', () => {
    // eslint-disable-next-line no-sparse-arrays
    expect(isSameColumnLayout({ count: 3, props: ['a', , 'c'] }, { count: 3, props: ['a', , 'c'] })).toBe(true);
  });
});

describe('isColumnLayoutAppend', () => {
  it('should accept an unchanged layout', () => {
    expect(isColumnLayoutAppend({ count: 2, props: ['a', 'b'] }, { count: 2, props: ['a', 'b'] })).toBe(true);
  });

  it('should accept columns added after the existing ones', () => {
    expect(isColumnLayoutAppend({ count: 2, props: ['a', 'b'] }, { count: 3, props: ['a', 'b', 'c'] })).toBe(true);
  });

  it('should reject a removed column', () => {
    expect(isColumnLayoutAppend({ count: 3, props: ['a', 'b', 'c'] }, { count: 2, props: ['a', 'b'] })).toBe(false);
    expect(isColumnLayoutAppend({ count: 3, props: ['a', 'b', 'c'] }, { count: 2, props: ['b', 'c'] })).toBe(false);
  });

  it('should reject a column inserted before the existing ones', () => {
    expect(isColumnLayoutAppend({ count: 2, props: ['b', 'c'] }, { count: 3, props: ['a', 'b', 'c'] })).toBe(false);
  });

  it('should reject a renamed or reordered property', () => {
    expect(isColumnLayoutAppend({ count: 2, props: ['a', 'b'] }, { count: 3, props: ['a', 'x', 'c'] })).toBe(false);
    expect(isColumnLayoutAppend({ count: 2, props: ['a', 'b'] }, { count: 2, props: ['b', 'a'] })).toBe(false);
  });

  it('should not read a hole as a match for a property that took its place', () => {
    // eslint-disable-next-line no-sparse-arrays
    expect(isColumnLayoutAppend({ count: 3, props: ['a', , 'c'] }, { count: 3, props: ['a', 'b', 'c'] })).toBe(false);
  });

  it('should read the columns without a property of the old layout as unchanged when they stay without one', () => {
    // The old layout has 3 columns but its property cache only reaches the first one.
    expect(isColumnLayoutAppend({ count: 3, props: ['a'] }, { count: 4, props: ['a'] })).toBe(true);
  });

  it('should reject a column that gained a property', () => {
    expect(isColumnLayoutAppend({ count: 3, props: ['a'] }, { count: 3, props: ['a', 'b'] })).toBe(false);
  });

  it('should read two accessor functions at one index as the same property', () => {
    // A `columns` array written inline holds a new accessor on every render.
    expect(isColumnLayoutAppend(
      { count: 2, props: [() => 'a', 'b'] },
      { count: 2, props: [() => 'a', 'b'] }
    )).toBe(true);
  });

  it('should not read an accessor function as the same property as a name', () => {
    expect(isColumnLayoutAppend({ count: 1, props: [() => 'a'] }, { count: 1, props: ['a'] })).toBe(false);
    expect(isColumnLayoutAppend({ count: 1, props: ['a'] }, { count: 1, props: [() => 'a'] })).toBe(false);
  });
});

describe('isColumnLayoutTruncation', () => {
  it('should accept columns dropped from the end', () => {
    expect(isColumnLayoutTruncation({ count: 3, props: ['a', 'b', 'c'] }, { count: 2, props: ['a', 'b'] })).toBe(true);
  });

  it('should accept an unchanged layout', () => {
    expect(isColumnLayoutTruncation({ count: 2, props: ['a', 'b'] }, { count: 2, props: ['a', 'b'] })).toBe(true);
  });

  it('should reject columns added to the end', () => {
    expect(isColumnLayoutTruncation({ count: 2, props: ['a', 'b'] }, { count: 3, props: ['a', 'b', 'c'] })).toBe(false);
  });

  it('should reject a column dropped from the front or the middle', () => {
    expect(isColumnLayoutTruncation({ count: 3, props: ['a', 'b', 'c'] }, { count: 2, props: ['b', 'c'] })).toBe(false);
    expect(isColumnLayoutTruncation({ count: 3, props: ['a', 'b', 'c'] }, { count: 2, props: ['a', 'c'] })).toBe(false);
  });

  it('should reject a remaining column that gained a property where it had a hole', () => {
    // eslint-disable-next-line no-sparse-arrays
    expect(isColumnLayoutTruncation({ count: 3, props: ['a', , 'c'] }, { count: 2, props: ['a', 'b'] })).toBe(false);
  });

  it('should count two accessor functions at one index as the same property', () => {
    expect(isColumnLayoutTruncation(
      { count: 2, props: [() => 'a', 'b'] },
      { count: 1, props: [() => 'a'] }
    )).toBe(true);
  });
});

describe('isColumnLayoutKept', () => {
  it('should accept an append and a truncation, and reject a change of a shared column', () => {
    expect(isColumnLayoutKept({ count: 2, props: ['a', 'b'] }, { count: 3, props: ['a', 'b', 'c'] })).toBe(true);
    expect(isColumnLayoutKept({ count: 3, props: ['a', 'b', 'c'] }, { count: 2, props: ['a', 'b'] })).toBe(true);
    expect(isColumnLayoutKept({ count: 3, props: ['a', 'b', 'c'] }, { count: 3, props: ['a', 'x', 'c'] })).toBe(false);
  });
});
