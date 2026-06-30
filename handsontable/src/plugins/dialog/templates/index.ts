import type { DialogTemplateResult } from '../ui';
import { baseTemplate } from './base';
import { confirmTemplate } from './confirm';

type TemplateFactory = (...args: unknown[]) => DialogTemplateResult;

// eslint-disable-next-line no-spaced-func, func-call-spacing
const TEMPLATES = new Map<string, TemplateFactory>([
  ['base', baseTemplate as TemplateFactory],
  ['confirm', confirmTemplate as unknown as TemplateFactory],
]);

export { TEMPLATES };
