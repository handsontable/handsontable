import { countPluginEngineWrites, withPluginEngineWrite } from '../../indexSyncer/pluginEngineWrite';

describe('countPluginEngineWrites', () => {
  it('should count every plugin write started on the engine, nested ones and throwing ones included', () => {
    const engine = {};
    const other = {};

    expect(countPluginEngineWrites(engine)).toBe(0);

    withPluginEngineWrite(engine, () => withPluginEngineWrite(engine, () => {}));

    expect(() => withPluginEngineWrite(engine, () => {
      throw new Error('write failed');
    })).toThrow('write failed');
    expect(countPluginEngineWrites(engine)).toBe(3);
    expect(countPluginEngineWrites(other)).toBe(0);
    expect(countPluginEngineWrites(null)).toBe(0);
  });
});
