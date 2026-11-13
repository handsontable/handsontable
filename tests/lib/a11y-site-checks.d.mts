export interface SiteCheck {
  title: string;
  spec: string;
  criteria: string[];
  pullRequest: false;
  site: string;
  kind: string;
}

export const SITES: readonly string[];
export const SITE_TITLES: Readonly<Record<string, string>>;
export const SITE_CHECK_KINDS: Readonly<Record<string, { title: string; spec: string; criteria: string[]; sites: string[] }>>;
export const SITE_CHECKS: Readonly<Record<string, SiteCheck>>;
export function siteCheckId(site: string, kind: string): string;
export function siteOf(value: string | undefined): string;
export function siteChecks(site: string): Record<string, SiteCheck>;
export function siteOutputDir(site: string): string;
export function siteEvidenceArtifact(site: string): string;
