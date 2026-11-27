import Handsontable from 'handsontable';
import { Foo, ChangeSource } from 'handsontable/common';

export const origin: ChangeSource = 'edit';

export type Mine = Foo;

export const hot = new Handsontable(document.body, { data: [] });
