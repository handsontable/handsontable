import Handsontable from 'handsontable/base';
import type { Events } from 'handsontable';
import { BasePlugin } from 'handsontable/plugins';

const HOOKS = {
  moved: 'afterColumnMove',
  changed: 'afterChange',
} as const;

const NAME = 'beforeColumnMove';
let dynamic = 'afterColumnMove';

class Audit extends BasePlugin {
  enablePlugin() {
    this.addHook(HOOKS.moved, () => undefined);
    this.addHook(HOOKS.changed, () => undefined);
    this.addHook(NAME, () => undefined);
    this.addHook(dynamic, () => undefined);
  }
}

const globalHooks = Handsontable.hooks;

globalHooks.add('beforeColumnMove', () => true);
globalHooks.once('afterColumnMove', () => undefined);
globalHooks.add('afterChange', () => undefined);

const registry = new Set<string>();

registry.add('beforeColumnMove');

const layout: Partial<Events> = {
  afterColumnMove: () => undefined,
  afterColumnSort: () => undefined,
};

const plain = {
  afterColumnMove: () => undefined,
};

export { Audit, layout, plain };
