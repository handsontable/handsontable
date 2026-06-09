import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  dragToScroll: true,
});

new Handsontable(document.createElement('div'), {
  dragToScroll: {
    interval: { min: 20, max: 500 },
    rampDistance: 120,
  },
});

new Handsontable(document.createElement('div'), {
  dragToScroll: {
    interval: { min: 50 },
  },
});

new Handsontable(document.createElement('div'), {
  dragToScroll: {
    rampDistance: 80,
  },
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
