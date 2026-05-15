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

const CATEGORY_HEADINGS = {
  '#### Added': 'added',
  '#### Changed': 'changed',
  '#### Deprecated': 'deprecated',
  '#### Removed': 'removed',
  '#### Fixed': 'fixed',
};

const FRAMEWORK_PREFIXES = {
  'React:': 'react',
  'Angular:': 'angular',
  'Vue:': 'vue',
};

function extractPrNumber(text) {
  const match = text.match(/\[#(\d+)\]\(https:\/\/github\.com\/handsontable\/handsontable\/pull\/\d+\)\s*$/);
  if (!match) return { prNumber: null, body: text };
  return { prNumber: Number(match[1]), body: text.slice(0, match.index).trim() };
}

function parseBullet(line) {
  let raw = line.replace(/^- /, '').trim();
  let breaking = false;

  const breakingMatch = raw.match(/^\*\*Breaking change\*\*:\s*(.*)$/);
  if (breakingMatch) {
    breaking = true;
    raw = breakingMatch[1].trim();
  }

  let framework = 'core';
  for (const [prefix, name] of Object.entries(FRAMEWORK_PREFIXES)) {
    if (raw.startsWith(`${prefix} `)) {
      framework = name;
      raw = raw.slice(prefix.length + 1).trim();
      break;
    }
  }

  const { prNumber, body } = extractPrNumber(raw);

  return { breaking, framework, prNumber, body };
}

export function parseChangelogContent(markdown) {
  const lines = markdown.split('\n');
  const entries = [];
  let currentVersion = null;
  let currentDate = null;
  let currentCategory = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    const versionMatch = line.match(/^## (\d+\.\d+\.\d+)\s*$/);
    if (versionMatch) {
      currentVersion = versionMatch[1];
      currentDate = findFirstReleaseDate(lines, i + 1);
      currentCategory = null;
      continue;
    }

    if (CATEGORY_HEADINGS[line.trim()]) {
      currentCategory = CATEGORY_HEADINGS[line.trim()];
      continue;
    }

    if (!currentVersion || !currentCategory) continue;
    if (!line.startsWith('- ')) continue;

    const { breaking, framework, prNumber, body } = parseBullet(line);
    entries.push({
      version: currentVersion,
      releaseDate: currentDate,
      category: currentCategory,
      breaking,
      framework,
      prNumber,
      title: body,
    });
  }

  return entries;
}
