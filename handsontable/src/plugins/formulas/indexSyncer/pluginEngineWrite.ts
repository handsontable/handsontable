/**
 * What the plugin writes to one engine right now: how deep the writes nest and which grids the
 * engine's `valuesUpdated` events named meanwhile.
 *
 * HyperFormula emits `valuesUpdated` before the mutating call returns. Inside `batch()` the emit
 * happens after the callback, still before `batch()` returns, so a scope wraps that call.
 */
interface EngineWrite {
  depth: number;
  grids: Set<() => void>;
  held: boolean;
}

const writesByEngine = new WeakMap<object, EngineWrite>();
const heldPaintsByEngine = new WeakMap<object, Set<() => void>>();

/**
 * Runs an engine mutation this plugin owns. The grids the engine's events name while it runs are
 * painted once, when the outermost mutation on that engine ends, whether it returns or throws. A paint
 * that throws does not stop the others. The first such error reaches the caller once all have run,
 * unless the mutation threw itself. A write to one engine does not count as a write to another. Paints
 * a previous write held back join them.
 *
 * @param {object} engine The engine being written.
 * @param {Function} fn The mutation.
 * @returns {*} What `fn` returns.
 */
export function withPluginEngineWrite<T>(engine: object, fn: () => T): T {
  let write = writesByEngine.get(engine);

  if (write === undefined) {
    write = { depth: 0, grids: new Set(), held: false };
    writesByEngine.set(engine, write);
  }

  write.depth += 1;

  let result: T;

  try {
    result = fn();
  } catch (e) {
    endPluginEngineWrite(engine, write);

    throw e;
  }

  const paintErrors = endPluginEngineWrite(engine, write);

  if (paintErrors.length > 0) {
    throw paintErrors[0];
  }

  return result;
}

/**
 * Closes one level of a write. The outermost level paints the grids the write collected.
 *
 * @param {object} engine The engine being written.
 * @param {EngineWrite} write The scope of that engine.
 * @returns {unknown[]} What the paints threw, in order.
 */
function endPluginEngineWrite(engine: object, write: EngineWrite): unknown[] {
  const paintErrors: unknown[] = [];

  write.depth -= 1;

  if (write.depth > 0) {
    return paintErrors;
  }

  // Gone before the paints run, so an engine write a paint's `afterRender` makes is an external one.
  writesByEngine.delete(engine);
  heldPaintsByEngine.get(engine)?.forEach(paint => write.grids.add(paint));

  if (write.held) {
    heldPaintsByEngine.set(engine, write.grids);

    return paintErrors;
  }

  heldPaintsByEngine.delete(engine);
  write.grids.forEach((paint) => {
    try {
      paint();
    } catch (e) {
      paintErrors.push(e);
    }
  });

  return paintErrors;
}

/**
 * Hands a grid's paint to the plugin write on the stack, when there is one.
 *
 * @param {object|null} engine The engine whose event named the grid.
 * @param {Function} paint Paints the grid. The same function for the same grid, so it runs once.
 * @returns {boolean} `false` when no plugin write is on the stack, and the caller paints itself.
 */
export function deferPaintToPluginEngineWrite(engine: object | null | undefined, paint: () => void): boolean {
  const write = engine === null || engine === undefined ? undefined : writesByEngine.get(engine);

  if (write === undefined) {
    return false;
  }

  write.grids.add(paint);

  return true;
}

/**
 * Keeps the grids the outermost plugin write on the stack names from painting when it ends. They paint
 * when the next outermost write on that engine ends, so a write that continues in a later turn (a sheet
 * filled at the next render) paints them once, after the data is in. Does nothing inside a nested write.
 *
 * @param {object} engine The engine being written.
 */
export function holdPluginEngineWritePaints(engine: object): void {
  const write = writesByEngine.get(engine);

  if (write !== undefined && write.depth === 1) {
    write.held = true;
  }
}
