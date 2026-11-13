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
    // TODO(handsontable-codemod 18.1.0/column-move-hooks): Move header-click logic from this hook to afterColumnSort or afterOnCellMouseUp. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-code-that-reacts-to-a-column-header-click
    this.addHook(HOOKS.moved, () => undefined);
    this.addHook(HOOKS.changed, () => undefined);
    // TODO(handsontable-codemod 18.1.0/column-move-hooks): Move header-click logic from this hook to afterColumnSort or afterOnCellMouseUp. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-code-that-reacts-to-a-column-header-click
    this.addHook(NAME, () => undefined);
    this.addHook(dynamic, () => undefined);
  }
}

const globalHooks = Handsontable.hooks;

// TODO(handsontable-codemod 18.1.0/column-move-hooks): Move header-click logic from this hook to afterColumnSort or afterOnCellMouseUp. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-code-that-reacts-to-a-column-header-click
globalHooks.add('beforeColumnMove', () => true);
// TODO(handsontable-codemod 18.1.0/column-move-hooks): Move header-click logic from this hook to afterColumnSort or afterOnCellMouseUp. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-code-that-reacts-to-a-column-header-click
globalHooks.once('afterColumnMove', () => undefined);
globalHooks.add('afterChange', () => undefined);

const registry = new Set<string>();

registry.add('beforeColumnMove');

const layout: Partial<Events> = {
  // TODO(handsontable-codemod 18.1.0/column-move-hooks): Move header-click logic from this hook to afterColumnSort or afterOnCellMouseUp. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-code-that-reacts-to-a-column-header-click
  afterColumnMove: () => undefined,
  afterColumnSort: () => undefined,
};

const plain = {
  afterColumnMove: () => undefined,
};

export { Audit, layout, plain };
