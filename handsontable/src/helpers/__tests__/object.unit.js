import {
  isObjectEqual,
  isKeyValueObject,
  duckSchema,
  mixin,
  clone,
  deepExtend,
  deepObjectSize,
  createObjectPropListener,
  setProperty,
  extend,
  assignObjectDefaults,
  deepMerge,
  deepClone,
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

    it('should return true when objects have same keys with undefined values in different insertion order', () => {
      expect(isObjectEqual({ a: 1, b: undefined }, { b: undefined, a: 1 })).toBe(true);
      expect(isObjectEqual({ x: undefined, y: 2, z: 3 }, { z: 3, x: undefined, y: 2 })).toBe(true);
    });

    it('should return false when array contains undefined vs empty array', () => {
      expect(isObjectEqual([undefined], [])).toBe(false);
      expect(isObjectEqual([], [undefined])).toBe(false);
    });

    it('should return true for arrays containing undefined at same positions', () => {
      expect(isObjectEqual([undefined], [undefined])).toBe(true);
      expect(isObjectEqual([1, undefined, 3], [1, undefined, 3])).toBe(true);
    });

    it('should return false when array undefined vs null differ', () => {
      expect(isObjectEqual([undefined], [null])).toBe(false);
    });

    it('should correctly compare Date objects', () => {
      const d1 = new Date('2024-01-01T00:00:00.000Z');
      const d2 = new Date('2024-01-01T00:00:00.000Z');
      const d3 = new Date('2025-06-15T12:00:00.000Z');

      expect(isObjectEqual(d1, d2)).toBe(true);
      expect(isObjectEqual(d1, d3)).toBe(false);
      expect(isObjectEqual(d1, {})).toBe(false);
    });
  });

  //
  // Handsontable.helper.deepClone
  //
  describe('deepClone', () => {
    it('should deep clone a plain object preserving undefined-valued properties', () => {
      const obj = { id: 1, label: undefined };
      const cloned = deepClone(obj);

      expect(cloned).not.toBe(obj);
      expect(Object.prototype.hasOwnProperty.call(cloned, 'label')).toBe(true);
      expect(cloned.label).toBeUndefined();
      expect(cloned.id).toBe(1);
    });

    it('should deep clone nested objects preserving undefined', () => {
      const obj = { a: { b: undefined, c: 3 } };
      const cloned = deepClone(obj);

      expect(cloned).not.toBe(obj);
      expect(cloned.a).not.toBe(obj.a);
      expect(Object.prototype.hasOwnProperty.call(cloned.a, 'b')).toBe(true);
      expect(cloned.a.b).toBeUndefined();
    });

    it('should deep clone arrays', () => {
      const arr = [1, undefined, { x: 2 }];
      const cloned = deepClone(arr);

      expect(cloned).not.toBe(arr);
      expect(cloned[0]).toBe(1);
      expect(cloned[1]).toBeUndefined();
      expect(cloned[2]).not.toBe(arr[2]);
      expect(cloned[2].x).toBe(2);
    });

    it('should clone Date objects as new Date instances with the same time', () => {
      const d = new Date('2024-03-15T10:00:00.000Z');
      const cloned = deepClone(d);

      expect(cloned).not.toBe(d);
      expect(cloned).toBeInstanceOf(Date);
      expect(cloned.getTime()).toBe(d.getTime());
    });

    it('should return primitives as-is', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(null)).toBeNull();
      expect(deepClone(undefined)).toBeUndefined();
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
    it('should return a valid schema object', () => {
      expect(duckSchema({})).toEqual({});
      expect(duckSchema({ test: 1 })).toEqual({ test: null });
      expect(duckSchema({ test: 'foo' })).toEqual({ test: null });
      expect(duckSchema({ test: undefined })).toEqual({ test: null });
      expect(duckSchema({ test: null })).toEqual({ test: null });
      expect(duckSchema({ test: [] })).toEqual({ test: [] });
      expect(duckSchema({ test: [1, 2, 3] })).toEqual({ test: [] });
    });

    it('should return a valid schema object (deeply)', () => {
      expect(duckSchema({ test: { a: { b: 11 } } })).toEqual({ test: { a: { b: null } } });
      expect(duckSchema({ test: { a: { b: [] } } })).toEqual({ test: { a: { b: [] } } });
      expect(duckSchema({ test: { a: { b: [{ q: 1, w: 2 }] } } }))
        .toEqual({ test: { a: { b: [{ q: null, w: null }] } } });
    });

    it('should return a valid schema object for an array of array', () => {
      expect(duckSchema([])).toEqual([]);
      expect(duckSchema([[]])).toEqual([null]);
      expect(duckSchema([1, 2, 3])).toEqual([null, null, null]);
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
        und: undefined,
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

      propListener.value = undefined;

      expect(propListener.isTouched()).toBe(true);
      expect(propListener.value).toBe(undefined);
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

    it('should not set object if name is not a string', () => {
      const testObject = { prop1: 0 };

      setProperty(
        testObject,
        (row, value) => {
          return row.attr(attr, value);
        },
        'value1'
      );

      expect(testObject).toEqual({ prop1: 0 });
    });
  });

  describe('assignObjectDefaults', () => {
    it('should return defaults if target is not an object', () => {
      expect(assignObjectDefaults({}, { test: 1 })).toEqual({ test: 1 });
    });

    it('should return target object values if target is an object', () => {
      expect(assignObjectDefaults({ test: 1 }, { test: 2 })).toEqual({ test: 1 });
    });

    it('should return object with defaults and plugin settings', () => {
      expect(assignObjectDefaults({ test: 1 }, { test: 2, test2: 3 })).toEqual({ test: 1, test2: 3 });
    });

    it('should return target object values if defaults is null', () => {
      expect(assignObjectDefaults({ test: 1 }, null)).toEqual({ test: 1 });
    });

    it('should return target object values if defaults is undefined', () => {
      expect(assignObjectDefaults({ test: 1 }, undefined)).toEqual({ test: 1 });
    });

    it('should return target object values if defaults is a string', () => {
      expect(assignObjectDefaults({ test: 1 }, 'test')).toEqual({ test: 1 });
    });

    it('should return defaults object values if target is null', () => {
      expect(assignObjectDefaults(null, { test: 2 })).toEqual({ test: 2 });
    });

    it('should return defaults object values if target is undefined', () => {
      expect(assignObjectDefaults(undefined, { test: 2 })).toEqual({ test: 2 });
    });

    it('should return defaults object values if target is a string', () => {
      expect(assignObjectDefaults('test', { test: 2 })).toEqual({ test: 2 });
    });

    it('should return null if target is null and defaults is null', () => {
      expect(assignObjectDefaults(null, null)).toEqual(null);
    });

    it('should return object with defaults for nested objects', () => {
      expect(assignObjectDefaults(
        { test: { test2: 1 } }, { test: { test2: 2, test3: 3 } })
      ).toEqual({ test: { test2: 1, test3: 3 } });
    });

    it('should return empty object when target and defaults are empty objects', () => {
      expect(assignObjectDefaults({}, {})).toEqual({});
    });
  });

  describe('deepMerge', () => {
    it('should merge objects and deeply merge nested objects', () => {
      expect(deepMerge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
      expect(deepMerge({ a: 1, b: 2 }, { b: 20 })).toEqual({ a: 1, b: 20 });
      expect(deepMerge(
        { nested: { a: 1, b: 2 } },
        { nested: { b: 20, c: 3 } }
      )).toEqual({ nested: { a: 1, b: 20, c: 3 } });
    });

    it('should replace arrays and handle type changes', () => {
      expect(deepMerge({ arr: [1, 2, 3] }, { arr: [4, 5] })).toEqual({ arr: [4, 5] });
      expect(deepMerge({ prop: { a: 1 } }, { prop: [1, 2] })).toEqual({ prop: [1, 2] });
      expect(deepMerge({ prop: 'string' }, { prop: { a: 1 } })).toEqual({ prop: { a: 1 } });
      expect(deepMerge({ nested: { a: 1 } }, { nested: null })).toEqual({ nested: null });
    });

    it('should handle empty and undefined arguments', () => {
      expect(deepMerge({}, {})).toEqual({});
      expect(deepMerge({ a: 1 }, {})).toEqual({ a: 1 });
      expect(deepMerge(undefined, { a: 1 })).toEqual({ a: 1 });
      expect(deepMerge({ a: 1 }, undefined)).toEqual({ a: 1 });
    });

    it('should return a new object without modifying inputs', () => {
      const target = { a: 1, nested: { b: 2 } };
      const source = { a: 10, nested: { c: 3 } };
      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 10, nested: { b: 2, c: 3 } });
      expect(target).toEqual({ a: 1, nested: { b: 2 } });
      expect(result).not.toBe(target);
    });

    it('should prevent prototype pollution', () => {
      const malicious = JSON.parse('{"__proto__": {"polluted": true}}');

      deepMerge({}, malicious);

      expect({}.polluted).toBeUndefined();

      const result = deepMerge({}, { constructor: { prototype: { bad: true } } });

      expect(Object.prototype.hasOwnProperty.call(result, 'constructor')).toBe(false);
    });

    it('should handle special object types as values', () => {
      const fn = () => 'test';
      const date = new Date('2025-01-01');

      const result = deepMerge({ a: 1 }, { fn, date });

      expect(result.fn).toBe(fn);
      expect(result.date).toBe(date);
    });
  });

  //
  // Handsontable.helper.isKeyValueObject
  //
  describe('isKeyValueObject', () => {
    it('should return true if the object is a key/value object', () => {
      expect(isKeyValueObject({ key: 'value', value: 'value' })).toBe(true);
    });

    it('should return false if the object is not a key/value object', () => {
      expect(isKeyValueObject({ value: 'value' })).toBe(false);
    });

    it('should return false if the object is not an object', () => {
      expect(isKeyValueObject('value')).toBe(false);
    });

    it('should return false if the object is null', () => {
      expect(isKeyValueObject(null)).toBe(false);
    });

    it('should return false if the object is undefined', () => {
      expect(isKeyValueObject(undefined)).toBe(false);
    });
  });
});
