import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  dragToScroll: true,
});
const dragToScroll = hot.getPlugin('dragToScroll');
const element = document.createElement('div');

dragToScroll.setBoundaries(element.getBoundingClientRect());
dragToScroll.setCallback(() => {});
dragToScroll.check(0, 0);
