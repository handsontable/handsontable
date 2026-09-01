import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const utilsPath = fileURLToPath(new URL('../../scripts/a11y-utils.ts', import.meta.url));
const utilsSource = readFileSync(utilsPath, 'utf8');
const transpiledUtils = ts.transpileModule(utilsSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const { attachTocKeyboardNav } = await import(
  `data:text/javascript;charset=utf-8,${encodeURIComponent(transpiledUtils)}`
);

class FakeEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.key = options.key;
    this.target = options.target ?? null;
    this.defaultPrevented = false;
  }

  preventDefault() {
    this.defaultPrevented = true;
  }
}

class FakeLink {
  constructor(href) {
    this.href = href;
    this.visible = true;
    this.focusOptions = [];
    this.listeners = new Map();
  }

  get offsetParent() {
    return this.visible ? {} : null;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatchEvent(event) {
    event.target = event.target ?? this;
    for (const listener of this.listeners.get(event.type) ?? []) {
      listener(event);
    }
  }

  focus(options) {
    globalThis.document.activeElement = this;
    this.focusOptions.push(options);
  }

  closest(selector) {
    return selector === 'a[href^="#"]' && this.href.startsWith('#') ? this : null;
  }
}

class FakeToc {
  constructor(links) {
    this.links = links;
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatchEvent(event) {
    for (const listener of this.listeners.get(event.type) ?? []) {
      listener(event);
    }
  }

  querySelectorAll(selector) {
    assert.equal(selector, 'a[href^="#"]');

    return this.links;
  }
}

function setup() {
  const previousDocument = globalThis.document;
  const previousRaf = globalThis.requestAnimationFrame;
  const rafCallbacks = [];
  const links = [
    new FakeLink('#beforeundostackchange'),
    new FakeLink('#beforeunhidecolumns'),
    new FakeLink('#afterchange'),
  ];
  const toc = new FakeToc(links);

  globalThis.document = { activeElement: null };
  globalThis.requestAnimationFrame = (callback) => {
    rafCallbacks.push(callback);
    return rafCallbacks.length;
  };

  attachTocKeyboardNav(toc);

  return {
    links,
    toc,
    rafCallbacks,
    cleanup() {
      globalThis.document = previousDocument;
      globalThis.requestAnimationFrame = previousRaf;
    },
  };
}

test('TOC ArrowDown and ArrowUp keys move focus between links with wrapping', () => {
  const { links, toc, cleanup } = setup();

  try {
    links[0].focus();

    const arrowDown = new FakeEvent('keydown', { key: 'ArrowDown', target: links[0] });
    toc.dispatchEvent(arrowDown);

    assert.equal(arrowDown.defaultPrevented, true);
    assert.equal(globalThis.document.activeElement, links[1]);

    const arrowUp = new FakeEvent('keydown', { key: 'ArrowUp', target: links[1] });
    toc.dispatchEvent(arrowUp);

    assert.equal(arrowUp.defaultPrevented, true);
    assert.equal(globalThis.document.activeElement, links[0]);

    const wrapUp = new FakeEvent('keydown', { key: 'ArrowUp', target: links[0] });
    toc.dispatchEvent(wrapUp);

    assert.equal(globalThis.document.activeElement, links[2]);
  } finally {
    cleanup();
  }
});

test('TOC Home and End keys move focus to boundary links', () => {
  const { links, toc, cleanup } = setup();

  try {
    links[1].focus();

    const end = new FakeEvent('keydown', { key: 'End', target: links[1] });
    toc.dispatchEvent(end);

    assert.equal(end.defaultPrevented, true);
    assert.equal(globalThis.document.activeElement, links[2]);

    const home = new FakeEvent('keydown', { key: 'Home', target: links[2] });
    toc.dispatchEvent(home);

    assert.equal(home.defaultPrevented, true);
    assert.equal(globalThis.document.activeElement, links[0]);
  } finally {
    cleanup();
  }
});

test('TOC click restores focus to the clicked link without scrolling again', () => {
  const { links, toc, rafCallbacks, cleanup } = setup();

  try {
    const click = new FakeEvent('click', { target: links[0] });
    toc.dispatchEvent(click);

    assert.equal(rafCallbacks.length, 1);

    rafCallbacks[0]();

    assert.equal(globalThis.document.activeElement, links[0]);
    assert.deepEqual(links[0].focusOptions, [{ preventScroll: true }]);
  } finally {
    cleanup();
  }
});
