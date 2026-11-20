import { VERSIONS_DIR, loadManifests } from '../../src/manifest.mjs';

/**
 * The manifests a run selects by default: the released ones. A draft migration runs only with `--include-draft`, so
 * a test about the behavior of a released migration range leaves the drafts out.
 *
 * @param {string} [versionsDir] Directory with one subdirectory per version.
 * @returns {Promise<import('../../src/types.mjs').Manifest[]>} The released manifests in ascending version order.
 */
export async function loadReleasedManifests(versionsDir = VERSIONS_DIR) {
  return (await loadManifests(versionsDir)).filter(manifest => manifest.status === 'released');
}
