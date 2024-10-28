import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const buildPathsDeterminants = ({ pathToSource, pathToDist }) => {
  const source = (files) => {
    const sourceArray = [];

    files.forEach(file => sourceArray.push(path.join(__dirname, pathToSource, file)));

    return sourceArray;
  };

  const flat = file => file.split('/').pop();

  const distFileName = file => flat(file
    .replace(/(.*)\.js/, '$1.md') // set md extension
    .replace(/^([A-Z])/, (_, upper) => upper.toLowerCase()) // enforce camelCase
  );
  const dist = file => path.join(__dirname, pathToDist, distFileName(file));

  return { source, dist };
};
