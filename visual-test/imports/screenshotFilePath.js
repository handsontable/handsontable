export default function screenshotFilePath(fileName, workerInfo) {
  // slash fix for windows
  const titlePath = workerInfo.titlePath[0].split('\\').join('/').split('/')[0];

  return `tests/${titlePath}/screenshots/${workerInfo.project.name}/${fileName}.png`;
}
