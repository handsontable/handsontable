export default function snapshotFilePath(fileName, workerInfo) {
  return `tests/${workerInfo.titlePath[0].split('\\')[0]}/snapshots/${workerInfo.project.name}/${fileName}-.png`;
}
