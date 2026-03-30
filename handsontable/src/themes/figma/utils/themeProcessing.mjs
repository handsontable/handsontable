import {
  THEME_KEY,
  MODE_KEY,
  VARIANTS,
  COLORS_KEY,
  TOKENS_KEY,
  DENSITY_KEY,
  SIZING_KEY,
  EXCEPTION_KEYS,
} from "./constants.mjs";
import { tokensKeys } from "../tokensKeys.mjs";
import {
  getReferencePath,
  findValueByPath,
  findValueRecursively,
  extractNestedValues,
  transformReferencePath,
  transformReferencePathFirstLast,
} from "./helpers/tokenReference.mjs";

/**
 * Processes a reference value based on its type
 */
function processReference(value, themes, refType) {
  const path = getReferencePath(value.value);
  if (!path) return null;

  switch (refType) {
    case MODE_KEY: {
      const result = [];
      VARIANTS.forEach((variant) => {
        const variantPath = path
          .split(".")
          .map((p, i) => (i === 1 ? variant : p))
          .join(".");
        const tokenValue = findValueByPath(themes, variantPath);
        if (tokenValue?.value) {
          const colorPath = getReferencePath(tokenValue.value);
          result.push(transformReferencePath(colorPath, [1, 2]));
        }
      });
      return result.length === 2 ? result : null;
    }
    case COLORS_KEY:
    case THEME_KEY:
      return transformReferencePathFirstLast(path);
    case DENSITY_KEY:
    case SIZING_KEY:
      return transformReferencePath(path, [1]);
    default:
      return null;
  }
}

/**
 * Formats a value based on its type and key
 */
function formatValue(key, value) {
  // Return original string value for exception keys without any processing
  if (EXCEPTION_KEYS.includes(key) && typeof value === "string") {
    return value;
  }

  // Format numbers with appropriate units
  if (typeof value === "number") {
    if (key.includes("opacity")) {
      return `${value}%`;
    }
    if (key.includes("transition")) {
      return `${value}s`;
    }
    return `${value}px`;
  }

  return value;
}

/**
 * Processes a single token value, handling references and formatting
 */
function processTokenValue(key, value, themes) {
  if (!value) {
    return null;
  }

  const valueStr = value.value;

  // Handle non-string values directly
  if (typeof valueStr !== "string") {
    return formatValue(key, valueStr);
  }

  // Check for reference types in order of specificity
  const refTypes = [MODE_KEY, COLORS_KEY, DENSITY_KEY, SIZING_KEY, THEME_KEY];
  for (const refType of refTypes) {
    if (valueStr.includes(`{${refType}.`)) {
      const referenceResult = processReference(value, themes, refType);
      if (referenceResult) {
        return referenceResult;
      }
    }
  }

  // Format as regular value if no reference found
  return formatValue(key, valueStr);
}

/**
 * Processes a reference string value (e.g., density references to sizing)
 */
function processReferenceString(value, variableKey) {
  if (variableKey === DENSITY_KEY && typeof value === "string" && value.includes(`{${SIZING_KEY}.`)) {
    const path = getReferencePath(value);
    return path ? transformReferencePath(path, [1]) : null;
  }
  return null;
}

/**
 * Recursively formats values in a nested object structure
 */
function formatNestedValues(obj, variableKey) {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return obj;
  }

  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    // Check for reference strings first (e.g., density -> sizing)
    const referenceResult = processReferenceString(value, variableKey);
    if (referenceResult !== null) {
      result[key] = referenceResult;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      // Recursively process nested objects (like colors.primary.100)
      result[key] = formatNestedValues(value, variableKey);
    } else {
      // Format primitive values
      result[key] = formatValue(key, value);
    }
  }

  return result;
}

/**
 * Processes a single variable value, handling references and formatting
 */
function processVariableValue(key, value, variableKey) {
  const extracted = extractNestedValues(value);

  // Handle nested objects (like density or colors with nested structure)
  if (typeof extracted === "object" && extracted !== null && !Array.isArray(extracted)) {
    return formatNestedValues(extracted, variableKey);
  }

  // Handle primitive values
  return formatValue(key, extracted);
}

/**
 * Processes variables for a given key (sizing, density, colors)
 */
function processVariables(variables, variableKey) {
  const result = {};

  for (const [key, value] of Object.entries(variables)) {
    result[key] = processVariableValue(key, value, variableKey);
  }

  return result;
}

/**
 * Processes tokens for a specific theme
 */
function processThemeTokens(themeValues, themes) {
  const result = {};

  for (const key of tokensKeys) {
    const value = findValueRecursively(themeValues, key);
    const processed = processTokenValue(key, value, themes);

    if (processed !== null) {
      result[key] = processed;
    }
  }

  return result;
}

/**
 * Generates all theme variables from the tokens
 */
function generateAllVariables(themes) {
  const themeVariables = {
    [SIZING_KEY]: processVariables(themes[SIZING_KEY], SIZING_KEY),
    [DENSITY_KEY]: processVariables(themes[DENSITY_KEY], DENSITY_KEY),
    [COLORS_KEY]: processVariables(themes[COLORS_KEY], COLORS_KEY),
    [TOKENS_KEY]: {},
  };

  // Process tokens for each theme
  Object.entries(themes[THEME_KEY]).forEach(([themeKey, themeValues]) => {
    themeVariables[TOKENS_KEY][themeKey] = processThemeTokens(themeValues, themes);
  });

  return { themeVariables: themeVariables };
}

export { generateAllVariables };
