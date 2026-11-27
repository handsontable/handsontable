import Handsontable, { ChangeSource } from 'handsontable';
// TODO(handsontable-codemod 18.0.0/common-imports): Foo: Find a replacement for this name by hand: 18.0 removed the `handsontable/common` entry... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-handsontablecommon-imports
import { Foo } from 'handsontable/common';

export const origin: ChangeSource = 'edit';

export type Mine = Foo;

export const hot = new Handsontable(document.body, { data: [] });
