import Handsontable from 'handsontable';

declare const shared: HotGlobalConfig;

// The key comes from a shared HotGlobalConfig object, so this grid sets none of its own.
const container = document.querySelector<HTMLElement>('#grid')!;

new Handsontable(container, {
  data: [[shared.license ?? '']],
});
