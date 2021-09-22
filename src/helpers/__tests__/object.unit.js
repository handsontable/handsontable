import {
  isObjectEqual,
  duckSchema,
  mixin,
  clone,
  deepExtend,
  deepObjectSize,
  createObjectPropListener,
  setProperty,
  extend,
} from 'handsontable/helpers/object';

describe('Object helper', () => {
  //
  // Handsontable.helper.isObjectEqual
  //
  describe('isObjectEqual', () => {
    it('should returns true on equal objects', () => {
      expect(isObjectEqual({}, {})).toBe(true);
      expect(isObjectEqual({ test: 1 }, { test: 1 })).toBe(true);
      expect(isObjectEqual({ test: { test2: [{}] } }, { test: { test2: [{}] } })).toBe(true);

      expect(isObjectEqual([], [])).toBe(true);
      expect(isObjectEqual([33], [33])).toBe(true);
      expect(isObjectEqual([{ test: 1 }], [{ test: 1 }])).toBe(true);
    });

    it('should returns false for not equal objects', () => {
      expect(isObjectEqual({}, [])).toBe(false);

      expect(isObjectEqual({ test: 2 }, { test: 1 })).toBe(false);
      expect(isObjectEqual({ test: { test3: [{}] } }, { test: { test2: [{}] } })).toBe(false);

      expect(isObjectEqual([12], [33])).toBe(false);
      expect(isObjectEqual([{ test: 3 }], [{ test: 1 }])).toBe(false);
    });
  });

  //
  // Handsontable.helper.extend
  //
  describe('extend', () => {
    it('should returns a target object reference', () => {
      const target = {};
      const extension = {};

      expect(extend(target, extension)).toBe(target);
    });

    it('should extend a target object a overwrite existed values', () => {
      expect(extend({})).toEqual({});
      expect(extend({}, { a: 1, b: 2, 5: 5 })).toEqual({ a: 1, b: 2, 5: 5 });
      expect(extend({ a: 'z', 5: 1 }, { a: 1, b: 2, 5: 5 })).toEqual({ a: 1, b: 2, 5: 5 });
      expect(extend({ a: 'z', foo: 'bar' }, { a: 1, b: 2, 5: 5 })).toEqual({ a: 1, b: 2, 5: 5, foo: 'bar' });
    });

    it('should extend a target object only for keys which are declared as writable', () => {
      expect(extend({}, { a: 1 }, ['a'])).toEqual({ a: 1 });
      expect(extend({}, { a: 1, b: 2, c: 2 }, ['a'])).toEqual({ a: 1 });
      expect(extend({ a: 'z' }, { a: 1, b: 2, c: 2 }, ['a'])).toEqual({ a: 1 });
      expect(extend({ c: 'z' }, { a: 1, b: 2, c: 2 }, ['b', 'a', 'd'])).toEqual({ c: 'z', b: 2, a: 1 });
      expect(extend({}, { a: 1, b: 2, c: 2 }, [])).toEqual({});
    });
  });

  //
  // Handsontable.helper.duckSchema
  //
  describe('duckSchema', () => {
    it('should returns valid schema object', () => {
      expect(duckSchema({})).toEqual({});
      expect(duckSchema({ test: 1 })).toEqual({ test: null });
      expect(duckSchema({ test: 'foo' })).toEqual({ test: null });
      expect(duckSchema({ test: undefined })).toEqual({ test: null });
      expect(duckSchema({ test: null })).toEqual({ test: null });
      expect(duckSchema({ test: [] })).toEqual({ test: [] });
      expect(duckSchema({ test: [1, 2, 3] })).toEqual({ test: [] });
    });

    it('should returns valid schema object (deeply)', () => {
      expect(duckSchema({ test: { a: { b: 11 } } })).toEqual({ test: { a: { b: null } } });
      expect(duckSchema({ test: { a: { b: [] } } })).toEqual({ test: { a: { b: [] } } });
      expect(duckSchema({ test: { a: { b: [{ q: 1, w: 2 }] } } }))
        .toEqual({ test: { a: { b: [{ q: null, w: null }] } } });
    });
  });

  //
  // Handsontable.helper.mixin
  //
  describe('mixin', () => {
    it('should mix base object from one object', () => {
      const Base = function() {};
      const MixinFoo = {
        local: 'value',
        myFunction() {
          return this.local;
        },
        mySetterFunction(value) {
          this.local = value;
        }
      };

      mixin(Base, MixinFoo);

      const instance = new Base();

      expect(instance.myFunction()).toBe('value');
      expect(instance.local).toBe('value');

      instance.local = 123;

      expect(instance.myFunction()).toBe(123);
      expect(instance.local).toBe(123);

      const initialObject = { a: 1 };

      instance.mySetterFunction(initialObject);

      expect(instance.myFunction()).toBe(initialObject);
      expect(instance.local).toBe(initialObject);
    });

    it('should mix base object from multiple objects', () => {
      const Base = function() {};
      const MixinFoo = {
        local: 'value',
        myFunction() {
          return this.local;
        },
        mySetterFunction(value) {
          this.local = value;
        }
      };
      const MixinBar = {
        test: { zzz: 2 }
      };
      const MixinBaz = {
        getTest() {
          return this.test;
        }
      };

      mixin(Base, MixinFoo, MixinBar, MixinBaz);

      const instance = new Base();

      expect(instance.myFunction()).toBe('value');
      expect(instance.local).toBe('value');
      expect(instance.test).not.toBe(MixinBar.test);
      expect(instance.test).toEqual(MixinBar.test);
      expect(instance.test.zzz).toBe(2);
      expect(instance.getTest()).not.toBe(MixinBar.test);
      expect(instance.getTest()).toEqual(MixinBar.test);
    });

    it('mixed object should not interfere with properties from another mixed objects', () => {
      const Base = function() {};
      const Base1 = function() {};
      const MixinFoo = {
        local: {},
        myFunction() {
          this.local.test = 1;

          return this.local.test;
        }
      };

      mixin(Base, MixinFoo);
      mixin(Base1, MixinFoo);

      const instance = new Base();
      const instance1 = new Base1();

      instance.myFunction();

      expect(instance.local.test).toEqual(1);
      expect(instance1.local.test).not.toBeDefined();
    });
  });

  //
  // Handsontable.helper.clone
  //
  describe('clone', () => {
    it('should returns cloned object', () => {
      const function1 = function() {};
      const object1 = {};
      const object2 = {
        foo: false,
        und: void 0,
        bar: 0,
        baz: object1,
        func: function1,
      };

      expect(clone(object1)).toEqual({});
      expect(clone(object1)).not.toBe(object1);
      expect(clone(object2)).toEqual(object2);
      expect(clone(object2)).not.toBe(object2);
      expect(clone(object2).baz).toBe(object2.baz);
      expect(clone(object2).func).toBe(function1);
    });
  });

  //
  // Handsontable.helper.deepExtend
  //
  describe('deepExtend', () => {
    it('should extend an object with all the properties of another object (recursively)', () => {
      const baseObject = {
        test: 'one',
        anotherTest: ['one, two']
      };
      const date = new Date();
      const partial = {
        prop1: 'prop1',
        prop2: 34,
        prop3: [
          12,
          'test',
          {
            prop: 'one'
          },
          [0, 1]
        ],
        prop4: {
          p1: 0,
          p2: [0, 1],
          p3: {
            a: 'b'
          }
        },
        prop5: date
      };

      deepExtend(baseObject, partial);

      expect(baseObject.test).toEqual('one');
      expect(baseObject.anotherTest).toEqual(['one, two']);
      expect(baseObject.prop1).toEqual('prop1');
      expect(baseObject.prop2).toEqual(34);
      expect(baseObject.prop3[0]).toEqual(12);
      expect(baseObject.prop3[1]).toEqual('test');
      expect(baseObject.prop3[2].prop).toEqual('one');
      expect(baseObject.prop3[3]).toEqual([0, 1]);
      expect(baseObject.prop4.p1).toEqual(0);
      expect(baseObject.prop4.p2).toEqual([0, 1]);
      expect(baseObject.prop4.p3.a).toEqual('b');
      expect(baseObject.prop5).toEqual(date);
    });
  });

  //
  // Handsontable.helper.deepObjectSize
  //
  describe('deepObjectSize', () => {
    it('should return false if a variable is not an object', () => {
      const toCount = [
        1,
        2,
        3
      ];

      expect(deepObjectSize(toCount)).toBeFalsy();
    });

    it('should return an object keys length (recursively and only these keys, which contain value)', () => {
      const toCount = {
        prop1: 1,
        prop2: 2,
        prop3: {
          prop31: {
            prop311: 311,
            prop312: 312
          },
          prop32: 32,
          prop33: 33
        },
        prop4: 4,
        prop5: 5
      };

      expect(deepObjectSize(toCount)).toEqual(8);
    });

    it('should ignore the `__children` key, when calculating the object size', () => {
      const toCount = {
        prop1: 1,
        prop2: 2,
        prop3: {
          prop31: {
            prop311: 311,
            prop312: 312
          },
          prop32: 32,
          prop33: 33
        },
        prop4: 4,
        prop5: 5,
        __children: [
          {
            prop1: 1,
            prop2: 2,
          },
          {
            prop1: 1,
            prop2: 2,
          }
        ]
      };

      expect(deepObjectSize(toCount)).toEqual(8);
    });
  });

  //
  // Handsontable.helper.createObjectPropListener
  //
  describe('createObjectPropListener', () => {
    it('should returns object listener and listen default property', () => {
      const propListener = createObjectPropListener('foo');

      expect(propListener.isTouched()).toBe(false);
      expect(propListener.value).toBe('foo');

      propListener.test = 'bar';

      expect(propListener.isTouched()).toBe(false);
      expect(propListener.value).toBe('foo');

      propListener.value = 'bar';

      expect(propListener.isTouched()).toBe(true);
      expect(propListener.value).toBe('bar');
      expect(propListener.test).toBe('bar');
    });

    it('should returns object listener and listen defined by user property', () => {
      const propListener = createObjectPropListener('foo', 'me');

      expect(propListener.isTouched()).toBe(false);
      expect(propListener.me).toBe('foo');

      propListener.value = 'bar';

      expect(propListener.isTouched()).toBe(false);
      expect(propListener.me).toBe('foo');
      expect(propListener.value).toBe('bar');

      propListener.me = 'bar';

      expect(propListener.isTouched()).toBe(true);
      expect(propListener.value).toBe('bar');
      expect(propListener.me).toBe('bar');
    });

    it('should detect change value to undefined', () => {
      const propListener = createObjectPropListener('foo');

      propListener.value = void 0;

      expect(propListener.isTouched()).toBe(true);
      expect(propListener.value).toBe(void 0);
    });
  });

  //
  // Handsontable.helper.setProperty
  //
  describe('setProperty', () => {
    it('should set a property value on a given object', () => {
      const testObject = {};
      const testObject2 = { prop1: 0 };

      setProperty(testObject, 'prop1', 'value1');
      expect(testObject.prop1).toEqual('value1');

      setProperty(testObject2, 'prop1', 'value1');
      expect(testObject2.prop1).toEqual('value1');
    });

    it('should set a nested property value on a given object', () => {
      const testObject = {};
      const testObject2 = { prop1: { subprop1: 0 } };

      setProperty(testObject, 'prop1.subprop1', 'value1');
      expect(testObject.prop1.subprop1).toEqual('value1');

      setProperty(testObject2, 'prop1.subprop1', 'value1');
      expect(testObject2.prop1.subprop1).toEqual('value1');
    });
  });
});
