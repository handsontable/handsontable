import staticRegister, { collection } from '../staticRegister';

describe('staticRegister', () => {
  describe('.register/.getItem', () => {
    afterEach(() => {
      collection.clear();
    });

    it('should register item to the collection and make it overwritable', () => {
      const sr = staticRegister();
      const testObject = { foo: 'bar' };

      sr.register('name', 'baz');
      sr.register('name', testObject);

      expect(sr.getItem('name')).toBe(testObject);
    });
  });

  describe('.hasItem', () => {
    afterEach(() => {
      collection.clear();
    });

    it('should return `true` when item exists in the collection', () => {
      const sr = staticRegister();
      const testObject = { foo: 'bar' };

      sr.register('name', testObject);

      expect(sr.hasItem('name')).toBe(true);
    });

    it('should return `false` when item not exist in the collection', () => {
      const sr = staticRegister();
      const testObject = { foo: 'bar' };

      sr.register('name', testObject);

      expect(sr.hasItem('wrong_name')).toBe(false);
    });
  });

  describe('.getNames', () => {
    afterEach(() => {
      collection.clear();
    });

    it('should return an empty array when no items was registered', () => {
      const sr = staticRegister();

      expect(sr.getNames()).toEqual([]);
    });

    it('should return an array of string as a list of registered names', () => {
      const sr = staticRegister();

      sr.register('name', { foo: 'bar' });
      sr.register('number', 1);
      sr.register('string', 'baz');

      expect(sr.getNames()).toEqual(['name', 'number', 'string']);
    });
  });

  describe('.getValues', () => {
    afterEach(() => {
      collection.clear();
    });

    it('should return an empty array when no items was registered', () => {
      const sr = staticRegister();

      expect(sr.getValues()).toEqual([]);
    });

    it('should return an array of string as a list of registered items', () => {
      const sr = staticRegister();

      sr.register('name', { foo: 'bar' });
      sr.register('number', 1);
      sr.register('string', 'baz');

      expect(sr.getValues()).toEqual([{ foo: 'bar' }, 1, 'baz']);
    });
  });

  it('should share items between the same namespaces and make them overwritable', () => {
    const sr1 = staticRegister('my-space');
    const sr2 = staticRegister('my-space');
    const sr3 = staticRegister();

    sr1.register('foo', 'bar');
    sr2.register('foo', 'baz');
    sr3.register('foo', 'test');

    expect(sr1.getValues()).toEqual(['baz']);
    expect(sr2.getValues()).toEqual(['baz']);
    expect(sr3.getValues()).toEqual(['test']);
  });
});
