import Handsontable from 'handsontable';
import type { FreezeBarSettings, FreezeEdge, FreezeSource } from 'handsontable/plugins/freezeBar';

const edges: FreezeEdge[] = ['top', 'bottom', 'start', 'end'];
const sources: FreezeSource[] = ['drag', 'keyboard', 'api'];

const hot = new Handsontable(document.createElement('div'), {
  freezeBar: true,
  beforeFreezeChange(edge, newCount, oldCount, source) {
    const typedEdge: FreezeEdge = edge;
    const typedNewCount: number = newCount;
    const typedOldCount: number = oldCount;
    const typedSource: FreezeSource = source;

    return typedEdge === 'top' && typedNewCount > typedOldCount && typedSource !== 'api' ? false : undefined;
  },
  afterFreezeChange(edge, newCount, oldCount, source) {
    const typedEdge: FreezeEdge = edge;
    const typedNewCount: number = newCount;
    const typedOldCount: number = oldCount;
    const typedSource: FreezeSource = source;

    return [typedEdge, typedNewCount, typedOldCount, typedSource];
  },
});
const freezeBar = hot.getPlugin('freezeBar');

edges.forEach((edge) => {
  const count: number = freezeBar.getFreezeCount(edge);
  const changed: boolean = freezeBar.setFreezeCount(edge, count + 1);

  return changed;
});
sources.forEach((source) => {
  const typedSource: FreezeSource = source;

  return typedSource;
});

hot.addHook('beforeFreezeChange', (edge, newCount, oldCount, source) => {
  return edge === 'start' && newCount === oldCount && source === 'drag' ? false : undefined;
});
hot.addHook('afterFreezeChange', (edge, newCount, oldCount, source) => {
  return `${edge}${newCount}${oldCount}${source}`;
});

const settings: FreezeBarSettings = {
  rows: true,
  columns: false,
};

new Handsontable(document.createElement('div'), {
  freezeBar: settings,
});
new Handsontable(document.createElement('div'), {
  freezeBar: {},
});
new Handsontable(document.createElement('div'), {
  freezeBar: false,
});

// @ts-expect-error an edge outside the four is rejected
freezeBar.getFreezeCount('middle');
// @ts-expect-error the count is a number
freezeBar.setFreezeCount('top', '2');
