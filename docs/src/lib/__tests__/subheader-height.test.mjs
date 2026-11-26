import assert from 'node:assert/strict';
import test from 'node:test';
import { SUBHEADER_HEIGHT_PROPERTY, syncSubheaderHeight } from '../subheader-height.mjs';

const fakeRoot = () => {
  const values = new Map();

  return {
    values,
    style: {
      setProperty: (name, value) => values.set(name, value),
      removeProperty: name => values.delete(name),
    },
  };
};

const fakeSubheader = (height) => {
  const subheader = { height };

  subheader.getBoundingClientRect = () => ({ height: subheader.height });

  return subheader;
};

const fakeObserverClass = () => {
  const instances = [];

  class FakeObserver {
    constructor(callback) {
      this.callback = callback;
      this.observed = [];
      this.disconnected = false;
      instances.push(this);
    }

    observe(target, options) {
      this.observed.push([target, options]);
    }

    disconnect() {
      this.disconnected = true;
    }
  }

  return { FakeObserver, instances };
};

test('writes the rendered height of the sub-bar to the root at once', () => {
  const root = fakeRoot();
  const { FakeObserver } = fakeObserverClass();

  syncSubheaderHeight(fakeSubheader(44), root, { ResizeObserver: FakeObserver });

  assert.equal(root.values.get(SUBHEADER_HEIGHT_PROPERTY), '44px');
});

test('follows the sub-bar when its breadcrumbs wrap to a second line', () => {
  const root = fakeRoot();
  const subheader = fakeSubheader(44);
  const { FakeObserver, instances } = fakeObserverClass();

  syncSubheaderHeight(subheader, root, { ResizeObserver: FakeObserver });
  subheader.height = 61.5;
  instances[0].callback();

  assert.deepEqual(instances[0].observed, [[subheader, { box: 'border-box' }]]);
  assert.equal(root.values.get(SUBHEADER_HEIGHT_PROPERTY), '61.5px');
});

test('leaves the stylesheet value in place while the sub-bar renders no box', () => {
  const root = fakeRoot();
  const subheader = fakeSubheader(44);
  const { FakeObserver, instances } = fakeObserverClass();

  syncSubheaderHeight(subheader, root, { ResizeObserver: FakeObserver });
  subheader.height = 0;
  instances[0].callback();

  assert.equal(root.values.has(SUBHEADER_HEIGHT_PROPERTY), false);
});

test('the returned function stops the observer and removes the property', () => {
  const root = fakeRoot();
  const { FakeObserver, instances } = fakeObserverClass();

  const stop = syncSubheaderHeight(fakeSubheader(44), root, { ResizeObserver: FakeObserver });

  stop();

  assert.equal(instances[0].disconnected, true);
  assert.equal(root.values.has(SUBHEADER_HEIGHT_PROPERTY), false);
});

test('without ResizeObserver it still writes the height once and does not throw', () => {
  const root = fakeRoot();

  const stop = syncSubheaderHeight(fakeSubheader(52), root, { ResizeObserver: undefined });

  assert.equal(root.values.get(SUBHEADER_HEIGHT_PROPERTY), '52px');
  stop();
  assert.equal(root.values.has(SUBHEADER_HEIGHT_PROPERTY), false);
});
