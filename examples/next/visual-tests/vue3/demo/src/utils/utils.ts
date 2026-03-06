export function getThemeName(): string | undefined {
  const urlParams = new URLSearchParams(location.search);

  return urlParams.get("theme") ? `ht-theme-${urlParams.get("theme")}` : undefined;
}
