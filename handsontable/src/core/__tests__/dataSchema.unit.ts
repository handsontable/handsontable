import { isDataSchemaChanged } from '../dataSchema';

describe('isDataSchemaChanged', () => {
  it('should not report a change when the payload does not carry a schema', () => {
    expect(isDataSchemaChanged({ a: null }, undefined)).toBe(false);
    expect(isDataSchemaChanged(undefined, undefined)).toBe(false);
  });

  it('should not report a change for the same reference', () => {
    const schema = { a: null, b: null };
    const schemaFn = () => ({});

    expect(isDataSchemaChanged(schema, schema)).toBe(false);
    expect(isDataSchemaChanged(schemaFn, schemaFn)).toBe(false);
  });

  it('should compare an object or an array schema by content', () => {
    expect(isDataSchemaChanged({ a: null, b: null }, { a: null, b: null })).toBe(false);
    expect(isDataSchemaChanged([{ a: null }], [{ a: null }])).toBe(false);

    expect(isDataSchemaChanged({ a: null }, { a: null, b: null })).toBe(true);
    expect(isDataSchemaChanged({ a: null }, { x: null })).toBe(true);
    // The columns follow the key order, so a reordered schema is a different schema.
    expect(isDataSchemaChanged({ a: null, b: null }, { b: null, a: null })).toBe(true);
    expect(isDataSchemaChanged([{ a: null }], [{ a: null }, { b: null }])).toBe(true);
  });

  it('should report a change from and to an undefined schema', () => {
    expect(isDataSchemaChanged(undefined, { a: null })).toBe(true);
    expect(isDataSchemaChanged({ a: null }, null)).toBe(true);
  });

  it('should report a change for a schema that cannot be serialized', () => {
    const circular: Record<string, unknown> = { a: null };

    circular.self = circular;

    expect(isDataSchemaChanged({ a: null }, circular)).toBe(true);
  });

  it('should compare a function schema by reference', () => {
    // `isObjectEqual()` reads two different functions as equal, which is what this guards against.
    expect(isDataSchemaChanged(() => ({}), () => ({}))).toBe(true);
    expect(isDataSchemaChanged({ a: null }, () => ({}))).toBe(true);
    expect(isDataSchemaChanged(() => ({}), { a: null })).toBe(true);
  });
});
