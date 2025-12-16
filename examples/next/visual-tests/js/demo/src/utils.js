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

  // Return 'ht-theme-classic' as default to ensure external CSS is used
  // instead of the inline ThemeAPI (which activates when themeName is undefined)
  return theme ? `ht-theme-${theme}` : 'ht-theme-classic';
}

export function generateExampleData() {
  return getDirectionFromURL() === "rtl" ? generateArabicData() : data;
}
