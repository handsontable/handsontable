import { baseTemplate } from './base';
import { confirmTemplate } from './confirm';

const TEMPLATES = new Map<string, Function>([
  ['base', baseTemplate],
  ['confirm', confirmTemplate],
]);

export { TEMPLATES };
