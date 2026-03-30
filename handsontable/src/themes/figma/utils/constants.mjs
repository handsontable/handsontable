import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import iconsMain from "../icons/main.mjs";
import iconsHorizon from "../icons/horizon.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIGMA_ROOT = resolve(__dirname, "..");

// Constants
export const PREFIX = "ht";
export const THEME_KEY = "themes";
export const MODE_KEY = "mode";
export const TOKENS_KEY = "tokens";
export const COLORS_KEY = "colors";
export const DENSITY_KEY = "density";
export const SIZING_KEY = "sizing";
export const TOKENS_PATH = resolve(FIGMA_ROOT, "tokens.json");
export const OUTPUT_PATH = resolve(FIGMA_ROOT, "..", "static");
export const ICONS_MAP_SOURCE = resolve(FIGMA_ROOT, "utils", "helpers", "iconsMap.mjs");
export const VARIANTS = ["light", "dark"];
export const OTHER_VARIABLES = ["density"];
export const EXCEPTION_KEYS = ["font-family"];
export const ICONS_SET = {
  main: iconsMain,
  horizon: iconsHorizon,
};
