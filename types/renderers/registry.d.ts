import Core from '../core';
import { baseRenderer } from './baseRenderer';

declare function _register(name: string, renderer: typeof baseRenderer): void;
declare function _getItem(name: string): typeof baseRenderer;
declare function hasItem(name: string): boolean;
declare function getNames(): string[];
declare function getValues(): (typeof baseRenderer)[];

export {
  _register as registerRenderer,
  _getItem as getRenderer,
  hasItem as hasRenderer,
  getNames as getRegisteredRendererNames,
  getValues as getRegisteredRenderers
};
