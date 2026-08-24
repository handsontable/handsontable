import { command as down } from './down';
import { command as downByViewportHeight } from './downByViewportHeight';
import { command as inlineEnd } from './inlineEnd';
import { command as inlineStart } from './inlineStart';
import { command as left } from './left';
import { command as right } from './right';
import { command as toMostBottom } from './toMostBottom';
import { command as toMostBottomInlineEnd } from './toMostBottomInlineEnd';
import { command as toMostInlineEnd } from './toMostInlineEnd';
import { command as toMostInlineStart } from './toMostInlineStart';
import { command as toMostLeft } from './toMostLeft';
import { command as toMostRight } from './toMostRight';
import { command as toMostTop } from './toMostTop';
import { command as toMostTopInlineStart } from './toMostTopInlineStart';
import { command as up } from './up';
import { command as upByViewportHeight } from './upByViewportHeight';

/**
 * Returns complete list of the shortcut commands for the cells moving feature.
 *
 * @returns {Function[]}
 */
export function getAllCommands() {
  return [
    down,
    downByViewportHeight,
    inlineEnd,
    inlineStart,
    left,
    right,
    toMostBottom,
    toMostBottomInlineEnd,
    toMostInlineEnd,
    toMostInlineStart,
    toMostLeft,
    toMostRight,
    toMostTop,
    toMostTopInlineStart,
    up,
    upByViewportHeight,
  ];
}
