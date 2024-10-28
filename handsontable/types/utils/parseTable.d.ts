import Core from '../core';
import { GridSettings } from '../settings';

export function instanceToHTML(instance: Core): string;
export function htmlToGridSettings(element: HTMLTableElement | string, rootDocument?: Document): GridSettings;
