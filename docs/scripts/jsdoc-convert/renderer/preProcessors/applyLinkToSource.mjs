import childProcess from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sha = childProcess
  .execSync('git rev-parse HEAD')
  .toString().trim();

export const applyLinkToSource = (data) => {
  return data.map((x) => {
    if (x.meta && x.meta.path && x.meta.filename && x.meta.lineno) {
      let filepath = path.relative(path.join(__dirname, '../../../../../../'), x.meta.path);
      let filename = x.meta.filename;
      const line = x.meta.lineno;

      // Source files are generated in `handsontable/tmp` but public links should point to TypeScript sources.
      if (filepath.startsWith('handsontable/tmp')) {
        filepath = filepath.replace('handsontable/tmp', 'handsontable/src');
      }
      if (filename.endsWith('.js') && !filepath.includes('3rdparty/walkontable') && !filepath.includes('src/core/hooks')) {
        filename = `${filename.slice(0, -3)}.ts`;
      }

      x.sourceLink = `https://github.com/handsontable/handsontable/blob/${sha}/${filepath}/${filename}#L${line}`;
    }

    return x;
  });
};
