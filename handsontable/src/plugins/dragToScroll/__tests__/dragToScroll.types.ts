import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  dragToScroll: true,
});
const dragToScroll = hot.getPlugin('dragToScroll');
const element = document.createElement('div');

dragToScroll.setBoundaries(element.getBoundingClientRect());

dragToScroll.setBoundaries({
  top: 100,
  left: 100,
  width: 900,
  height: 900,
  bottom: 1000,
  right: 1000
});

dragToScroll.setCallback(() => {});

dragToScroll.check(0, 0);
