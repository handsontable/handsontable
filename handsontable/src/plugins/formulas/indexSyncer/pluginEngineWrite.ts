/**
 * Depth of plugin-owned writes, per engine.
 *
 * HyperFormula emits `valuesUpdated` before the mutating call returns. Inside `batch()` the
 * emit happens after the callback, still before `batch()` returns, so the counter wraps that
 * call. A write to one engine does not count as a write to another.
 */
const writeDepthByEngine = new WeakMap<object, number>();

/**
 * Runs an engine mutation this plugin owns.
 *
 * @param {object} engine The engine being written.
 * @param {Function} fn The mutation.
 * @returns {*} What `fn` returns.
 */
export function withPluginEngineWrite<T>(engine: object, fn: () => T): T {
  writeDepthByEngine.set(engine, (writeDepthByEngine.get(engine) ?? 0) + 1);

  try {
    return fn();
  } finally {
    const depth = (writeDepthByEngine.get(engine) ?? 1) - 1;

    if (depth > 0) {
      writeDepthByEngine.set(engine, depth);
    } else {
      writeDepthByEngine.delete(engine);
    }
  }
}

/**
 * @param {object|null} engine The engine to check.
 * @returns {boolean} `true` while a plugin write to this engine is on the stack.
 */
export function isPluginEngineWrite(engine: object | null | undefined): boolean {
  if (engine === null || engine === undefined) {
    return false;
  }

  return (writeDepthByEngine.get(engine) ?? 0) > 0;
}
