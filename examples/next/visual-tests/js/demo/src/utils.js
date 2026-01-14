import { data } from './data';
import { generateArabicData } from './demos/arabicRtl/data';

export function getFromURL(paramName, defaultValue) {
  return new URLSearchParams(location.search).get(paramName) ?? defaultValue;
}

export function getDirectionFromURL() {
  return getFromURL("direction", "ltr");
}

export function getThemeNameFromURL() {
  const theme = getFromURL("theme");

  return theme ? `ht-theme-${theme}` : undefined;
}

export function generateExampleData() {
  return getDirectionFromURL() === "rtl" ? generateArabicData() : data;
}
