import isMac from './isMac';

export default function getModifier(workerInfo) {
  return isMac(workerInfo) ? 'Meta' : 'Control';
}
