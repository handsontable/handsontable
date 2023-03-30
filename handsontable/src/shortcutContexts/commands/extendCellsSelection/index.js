import { command as down } from './down';
import { command as downByViewportHeight } from './downByViewportHeight';
import { command as left } from './left';
import { command as right } from './right';
import { command as toMostBottom } from './toMostBottom';
import { command as toMostInlineEnd } from './toMostInlineEnd';
import { command as toMostInlineStart } from './toMostInlineStart';
import { command as toMostLeft } from './toMostLeft';
import { command as toMostRight } from './toMostRight';
import { command as toMostTop } from './toMostTop';
import { command as up } from './up';
import { command as upByViewportHeight } from './upByViewportHeight';

/**
 * Returns complete list of the shortcut commands for the cells selection extending feature.
 *
 * @returns {Function[]}
 */
export function getAllCommands() {
  return [
    down,
    downByViewportHeight,
    left,
    right,
    toMostBottom,
    toMostInlineEnd,
    toMostInlineStart,
    toMostLeft,
    toMostRight,
    toMostTop,
    up,
    upByViewportHeight,
  ];
}
