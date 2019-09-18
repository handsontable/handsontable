import { MakerJs, getPathDataByLayer } from '../../../../makerjs/index';

/**
 * Converts a 2D array of paths into a 1D array of SVG path commands.
 *
 * @param {Array.<Array.<number>>>} lines SVG Path data in format `[[x1, y1, x2, y2, ...], ...]`
 * @returns {Array.<string>} SVG Path data in format `['M x1 y1 x2 y2 ... Z', ...]`
 */
export default function svgOptimizePath(lines) {
  // copied from https://observablehq.com/@forresto/maker-js-svg-path-simplify
  const makerModel = {
    paths: {}
  };

  for (let ii = 0; ii < lines.length; ii++) {
    const [x1, y1, x2, y2] = lines[ii];

    makerModel.paths[`p_${ii}`] = {
      end: [x2, -y2],
      origin: [x1, -y1],
    };
  }
  MakerJs.model.simplify(makerModel); // remove redundant points

  const pathDatas = getPathDataByLayer(makerModel); // remove redundant move commands
  let optimizedPathString = pathDatas.join(' ');

  if (optimizedPathString[optimizedPathString.length - 1] !== 'Z') {
    const allPositions = optimizedPathString.split(' ').filter(x => x !== '' && isFinite(x)); // isFinite returns true if value is numeric

    optimizedPathString += ` M ${allPositions[allPositions.length - 4]} ${allPositions[allPositions.length - 3]} Z`;
  }

  return optimizedPathString;
}
