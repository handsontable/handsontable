import { MakerJs, getPathDataByLayer } from '../../../makerjs/index';

export default function svgOptimizePath(unoptimizedPathString) {
  // copied from https://observablehq.com/@forresto/maker-js-svg-path-simplify
  const makerModel = MakerJs.importer.fromSVGPathData(unoptimizedPathString); // TODO remove the need to import from SVGPathData
  const pathDataByLayer = getPathDataByLayer(makerModel, [0, 0], { byLayers: true }, 0.001);
  let optimizedPathString = pathDataByLayer[''].join(' ');

  if (optimizedPathString[optimizedPathString.length - 1] !== 'Z') {
    const allPositions = optimizedPathString.split(' ').filter(x => isFinite(x)); // isFinite returns true if value is numeric
    optimizedPathString += ` L ${allPositions[allPositions.length - 4]} ${allPositions[allPositions.length - 3]}`;
  }

  return optimizedPathString;
}
