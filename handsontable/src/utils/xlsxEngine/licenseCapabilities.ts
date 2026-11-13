/**
 * The XLSX feature ids the license gates read. The features themselves (names, descriptions, plugins,
 * requirements, tiers) are declared in `features.json` next to this file, the feature manifest's
 * source. The id lists, the flag each id drives, and the tiers of each id are generated from it into
 * `licenseCapabilities.generated.ts` (`npm run generate:feature-manifest`); this module re-exports
 * them. It imports nothing but that module, so any other module can depend on it.
 */
export {
  XLSX_CAPABILITY_IDS,
  IMPORT_FILE_CAPABILITY_IDS,
  EXPORT_FILE_CAPABILITY_IDS,
  XLSX_FLAG_BY_ID,
  XLSX_TIERS_BY_ID,
} from './licenseCapabilities.generated';
