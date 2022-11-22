/**
 *
 */
export default function snapshotFilePath(fileName, workerInfo) {
  // slash fix for windows
  const titlePath = workerInfo.titlePath[0].split('\\').join('/').split('/')[0];

  return `tests/${titlePath}/snapshots/${workerInfo.project.name}/${fileName}.png`;
}
