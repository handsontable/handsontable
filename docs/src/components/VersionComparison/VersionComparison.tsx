import { useMemo } from 'react';
import type { VersionComparisonData } from './types';

function readData(): VersionComparisonData {
  const el = document.getElementById('version-comparison-data');
  if (!el) throw new Error('version-comparison-data script tag not found');
  return JSON.parse(el.textContent || '{}') as VersionComparisonData;
}

export function VersionComparison() {
  const data = useMemo(() => readData(), []);
  return (
    <div className="version-comparison">
      <p data-testid="entry-count">{data.entries.length} entries loaded</p>
      <p data-testid="release-count">{data.releases.length} releases</p>
    </div>
  );
}
