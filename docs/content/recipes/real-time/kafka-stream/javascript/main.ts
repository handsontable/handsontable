import { createGrid } from './grid';
import { connectStream } from './stream';
import './styles.css';

const { hot, applySnapshot, applyChanges } = createGrid(document.querySelector('#grid')!);
const status = document.querySelector('#status')!;
const rate = document.querySelector('#rate')!;
const count = document.querySelector('#rows')!;

const stream = connectStream('/api/stream', {
  onSnapshot: applySnapshot,
  onChanges: applyChanges,
  onStatus: (connected) => {
    status.textContent = connected ? 'Live' : 'Reconnecting…';
    status.classList.toggle('is-offline', !connected);
  },
});

setInterval(() => {
  rate.textContent = new Intl.NumberFormat('en-US').format(stream.takeReceived());
  count.textContent = new Intl.NumberFormat('en-US').format(hot.countSourceRows());
}, 1000);

window.addEventListener('beforeunload', () => stream.close());
