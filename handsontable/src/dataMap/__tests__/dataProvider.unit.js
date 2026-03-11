import metaSchemaFactory from '../metaManager/metaSchema';

describe('dataProvider option', () => {
  it('should be defined in the meta schema with a default value of `undefined`', () => {
    const schema = metaSchemaFactory();

    expect(schema.dataProvider).toBeUndefined();
  });

  it('should accept a function value', () => {
    const schema = metaSchemaFactory();
    const provider = () => [];

    schema.dataProvider = provider;

    expect(schema.dataProvider).toBe(provider);
  });
});
