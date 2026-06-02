/**
 * DAG-based parallel task scheduler.
 *
 * Runs tasks concurrently where the dependency graph allows, serializes
 * where it does not.  Caller supplies a `runTask(name)` callback that
 * returns a Promise; the scheduler handles ordering, progress tracking,
 * and critical-path reporting.
 *
 * @param {object} tasks       Task definitions from tasks.json (name → {cmd, deps, …}).
 * @param {Function} runTask   `(name: string) => Promise<void>` — spawn and resolve.
 * @param {boolean} [isTTY]    When false (CI), prints critical-path summary after build.
 * @returns {Promise<void>}    Resolves when all tasks complete; rejects on first failure.
 */
export async function runScheduled(tasks, runTask, isTTY = process.stdout.isTTY) {
  const taskNames = Object.keys(tasks);

  // Validate: every dep must reference a known task.
  const unknownDeps = [];

  taskNames.forEach((name) => {
    (tasks[name].deps ?? []).forEach((dep) => {
      if (!Object.prototype.hasOwnProperty.call(tasks, dep)) {
        unknownDeps.push(`${name} -> "${dep}"`);
      }
    });
  });

  if (unknownDeps.length > 0) {
    throw new Error(
      `Unknown task dependency(ies): ${unknownDeps.join(', ')}. `
      + `Known tasks: ${taskNames.join(', ')}.`
    );
  }

  const completed = new Set();
  const running = new Map(); // name → Promise
  const taskTimes = {};

  while (completed.size < taskNames.length) {
    const ready = taskNames.filter(name =>
      !completed.has(name) &&
      !running.has(name) &&
      (tasks[name].deps ?? []).every(dep => completed.has(dep))
    );

    ready.forEach((name) => {
      const promise = runTask(name).then(
        (elapsed) => {
          taskTimes[name] = typeof elapsed === 'number' ? elapsed : 0;
          completed.add(name);
          running.delete(name);
        },
        (err) => {
          running.delete(name);
          throw err;
        }
      );

      running.set(name, promise);
    });

    if (running.size === 0) {
      const pending = taskNames.filter(n => !completed.has(n));

      throw new Error(
        `Build stalled: ${pending.length} task(s) never ran (${pending.join(', ')}). `
        + 'Check the dependency graph for cycles or unresolved deps.'
      );
    }

    await Promise.race(running.values());
  }

  // Critical-path analysis — CI-only diagnostic.
  if (!isTTY) {
    /**
     * Total wall-clock time for a task including its longest dependency chain.
     *
     * @param {string} name Task name.
     * @returns {number} Accumulated path time in milliseconds.
     */
    const pathTime = (name) => {
      const deps = tasks[name].deps ?? [];
      const depMax = deps.length > 0 ? Math.max(...deps.map(pathTime)) : 0;

      return (taskTimes[name] || 0) + depMax;
    };

    let maxTask = '';
    let maxTime = 0;

    taskNames.forEach((name) => {
      const t = pathTime(name);

      if (t > maxTime) {
        maxTime = t; maxTask = name;
      }
    });

    const critPath = [];
    let current = maxTask;

    critPath.push(current);

    while ((tasks[current].deps ?? []).length > 0) {
      const deps = tasks[current].deps;

      current = deps.reduce((a, b) => (pathTime(a) > pathTime(b) ? a : b));
      critPath.unshift(current);
    }

    // eslint-disable-next-line no-console
    console.log(`Critical path: ${critPath.join(' -> ')} (${maxTime}ms theoretical minimum)`);
  }
}
