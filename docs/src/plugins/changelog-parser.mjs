const MONTHS = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12',
};

function parseReleaseDate(line) {
  const match = line.match(/Released on\s+([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,\s+(\d{4})/i);
  if (!match) return null;
  const [, monthName, day, year] = match;
  const month = MONTHS[monthName.toLowerCase()];
  if (!month) return null;
  return `${year}-${month}-${String(day).padStart(2, '0')}`;
}

function findFirstReleaseDate(lines, startIdx) {
  for (let i = startIdx; i < Math.min(lines.length, startIdx + 8); i += 1) {
    const date = parseReleaseDate(lines[i]);
    if (date) return date;
  }
  return null;
}

export function parseChangelogContent(markdown) {
  const lines = markdown.split('\n');
  const entries = [];

  for (let i = 0; i < lines.length; i += 1) {
    const versionMatch = lines[i].match(/^## (\d+\.\d+\.\d+)\s*$/);
    if (!versionMatch) continue;

    const version = versionMatch[1];
    const releaseDate = findFirstReleaseDate(lines, i + 1);
    entries.push({ version, releaseDate });
  }

  return entries;
}
