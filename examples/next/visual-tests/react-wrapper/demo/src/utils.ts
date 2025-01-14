export function getThemeName(): string | undefined {
  const urlParams = new URLSearchParams(window.location.search);

  return urlParams.get("theme") ? `ht-theme-${urlParams.get("theme")}` : undefined;
}
