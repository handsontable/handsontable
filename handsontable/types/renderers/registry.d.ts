import { BaseRenderer } from './base';
import { Renderers } from './index';

declare function _register(name: string, renderer: BaseRenderer): void;
declare function _register(renderer: BaseRenderer): void;
declare function _getItem<T extends keyof Renderers>(name: T): Renderers[T];
declare function _getItem(name: string): BaseRenderer;
declare function hasItem(name: string): boolean;
declare function getNames(): string[];
declare function getValues(): BaseRenderer[];

export {
  _register as registerRenderer,
  _getItem as getRenderer,
  hasItem as hasRenderer,
  getNames as getRegisteredRendererNames,
  getValues as getRegisteredRenderers
};
