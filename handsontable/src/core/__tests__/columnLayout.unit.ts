import { isSameColumnLayout } from '../columnLayout';

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
