/**
 * The DEFLATE level an export falls back to when the `compression` option names none (unset, `null`
 * or `true`). Declared here, on the engine-neutral layer, because both sides of the xlsx boundary
 * have to agree on it: `exportFile`'s `#getCompressionLevel` normalizes the option to this level
 * before a snapshot exists, and the built-in engine treats exactly this level as "the caller asked
 * for nothing" when deciding whether to report `compressionLevel` as a dropped feature.
 */
export const DEFAULT_COMPRESSION_LEVEL = 6;
