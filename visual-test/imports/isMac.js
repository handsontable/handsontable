export default function isMac(workerInfo) {
  return workerInfo.project.name === 'webkit';
}
