import childProcess from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const applyLinkToSource = (data) => {
  const sha = childProcess
    .execSync('git rev-parse HEAD')
    .toString().trim();

  return data.map((x) => {
    if (x.meta && x.meta.path && x.meta.filename && x.meta.lineno) {
      const filepath = path.relative(path.join(__dirname, '../../../../../'), x.meta.path);
      const filename = x.meta.filename;
      const line = x.meta.lineno;

      x.sourceLink = `https://github.com/handsontable/handsontable/blob/${sha}/${filepath}/${filename}#L${line}`;
    }

    return x;
  });
};
