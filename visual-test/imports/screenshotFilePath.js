export default function screenshotFilePath(fileName, workerInfo) {
  // slash fix for windows
  const titlePath = workerInfo.titlePath[0].split('.spec.js')[0];

  return `./tests/screenshots/${titlePath}/${workerInfo.project.name}/${fileName}.png`;
}
