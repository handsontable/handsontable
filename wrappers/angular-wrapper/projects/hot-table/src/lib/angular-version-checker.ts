import { VERSION, Version } from '@angular/core';

const SUPPORTED_MIN_MAJOR = 16;
const SUPPORTED_MAX_MAJOR = 22; // exclusive upper bound matching peer dependency <22.0.0

export const UNSUPPORTED_ANGULAR_VERSION_WARNING =
  '@handsontable/angular-wrapper: Angular %%VERSION%% is not supported. ' +
  `Supported range: >=${SUPPORTED_MIN_MAJOR}.0.0 <${SUPPORTED_MAX_MAJOR}.0.0. ` +
  'Unexpected behavior may occur.';

/**
 * Warns to the console if the installed Angular version falls outside the supported range.
 * Accepts an optional version object to allow injecting a mock in tests.
 */
export function verifyAngularVersion(version: Pick<Version, 'major' | 'full'> = VERSION): void {
  const major = parseInt(version.major, 10);

  if (isNaN(major) || major < SUPPORTED_MIN_MAJOR || major >= SUPPORTED_MAX_MAJOR) {
    console.warn(UNSUPPORTED_ANGULAR_VERSION_WARNING.replace('%%VERSION%%', version.full));
  }
}
