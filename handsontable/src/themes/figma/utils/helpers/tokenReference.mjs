/**
 * Extracts the reference path from a token value (e.g., "{path.to.value}" -> "path.to.value")
 */
function getReferencePath(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const match = value.match(/^\{(.*)\}/);

  return match ? match[1] : null;
}

/**
 * Finds a value recursively in a nested object
 */
function findValueRecursively(obj, key) {
  if (obj[key]) {
    return obj[key];
  }

  for (const [objKey, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null) {
      const result = findValueRecursively(value, key);

      if (result !== undefined) {
        return result;
      }
    }
  }

  return undefined;
}

/**
 * Finds a value by path in a nested object
 */
function findValueByPath(obj, path) {
  const paths = path.split(".");

  for (const pathItem of paths) {
    if (obj[pathItem] === undefined) {
      return undefined;
    }

    obj = obj[pathItem];
  }

  return obj;
}

/**
 * Recursively extracts values from nested objects
 * If an object has a 'value' property, it returns that value
 * Otherwise, it recursively processes all properties
 */
function extractNestedValues(obj) {
  if (obj && typeof obj === "object" && obj.value !== undefined) {
    return obj.value;
  }

  if (obj && typeof obj === "object" && obj !== null) {
    const result = {};
    Object.entries(obj).forEach(([key, value]) => {
      result[key] = extractNestedValues(value);
    });
    return result;
  }

  return obj;
}

/**
 * Transforms a reference path by removing specific indices
 */
function transformReferencePath(path, indicesToRemove = []) {
  return path
    .split(".")
    .filter((_, index) => !indicesToRemove.includes(index))
    .join(".");
}

/**
 * Transforms a reference path to keep only first and last segments.
 * Replaces 'themes' prefix with 'tokens' for output references.
 */
function transformReferencePathFirstLast(path) {
  const keys = path.split(".");
  const prefix = keys[0] === "themes" ? "tokens" : keys[0];
  return `${prefix}.${keys[keys.length - 1]}`;
}

export {
  getReferencePath,
  findValueRecursively,
  findValueByPath,
  extractNestedValues,
  transformReferencePath,
  transformReferencePathFirstLast,
};
