import Handsontable from 'handsontable';
import { HotTableModule } from '@handsontable/angular-wrapper';

// A file of an Angular application: the wrapper reads the key from the application configuration.
export const modules = [HotTableModule];

const container = document.querySelector<HTMLElement>('#grid')!;

new Handsontable(container, {
  data: [['b']],
});
