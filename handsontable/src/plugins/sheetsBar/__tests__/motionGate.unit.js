import { MotionGate } from '../ui/motionGate';

/**
 * Builds a window stand-in whose animation frames run only when the test calls `runFrame()`.
 *
 * @returns {object}
 */
function createFrameWindow() {
  let nextId = 1;
  const pending = new Map();

  return {
    requested: 0,
    requestAnimationFrame(callback) {
      const id = nextId;

      nextId += 1;
      this.requested += 1;
      pending.set(id, callback);

      return id;
    },
    cancelAnimationFrame(id) {
      pending.delete(id);
    },
    pendingFrames() {
      return pending.size;
    },
    runFrame() {
      const callbacks = Array.from(pending.values());

      pending.clear();
      callbacks.forEach(callback => callback());
    },
  };
}

describe('SheetsBar MotionGate', () => {
  it('starts closed and opens in the second frame after it is armed, not before', () => {
    const rootWindow = createFrameWindow();
    const gate = new MotionGate();

    expect(gate.isOpen()).toBe(false);

    gate.arm(rootWindow, () => true);

    expect(gate.isOpen()).toBe(false);

    rootWindow.runFrame();

    expect(gate.isOpen()).toBe(false);
    expect(rootWindow.pendingFrames()).toBe(1);

    rootWindow.runFrame();

    expect(gate.isOpen()).toBe(true);
  });

  it('requests one chain of two frames however often it is armed, and none once open', () => {
    const rootWindow = createFrameWindow();
    const gate = new MotionGate();

    gate.arm(rootWindow, () => true);
    gate.arm(rootWindow, () => true);

    expect(rootWindow.requested).toBe(1);

    rootWindow.runFrame();
    gate.arm(rootWindow, () => true);

    expect(rootWindow.requested).toBe(2);

    rootWindow.runFrame();
    gate.arm(rootWindow, () => true);

    expect(rootWindow.requested).toBe(2);
    expect(rootWindow.pendingFrames()).toBe(0);
  });

  it('stays closed when the second frame finds it may not open', () => {
    const rootWindow = createFrameWindow();
    const gate = new MotionGate();
    let canOpen = true;

    gate.arm(rootWindow, () => canOpen);
    rootWindow.runFrame();
    canOpen = false;
    rootWindow.runFrame();

    expect(gate.isOpen()).toBe(false);

    gate.arm(rootWindow, () => true);
    rootWindow.runFrame();
    rootWindow.runFrame();

    expect(gate.isOpen()).toBe(true);
  });

  it('closes an open gate and cancels whichever of its frames is pending', () => {
    const rootWindow = createFrameWindow();
    const gate = new MotionGate();

    gate.arm(rootWindow, () => true);
    rootWindow.runFrame();
    rootWindow.runFrame();
    gate.close();

    expect(gate.isOpen()).toBe(false);

    gate.arm(rootWindow, () => true);
    gate.close();

    expect(rootWindow.pendingFrames()).toBe(0);

    gate.arm(rootWindow, () => true);
    rootWindow.runFrame();

    expect(rootWindow.pendingFrames()).toBe(1);

    gate.close();

    expect(rootWindow.pendingFrames()).toBe(0);

    rootWindow.runFrame();

    expect(gate.isOpen()).toBe(false);

    gate.arm(rootWindow, () => true);

    expect(rootWindow.requested).toBe(6);
  });
});
