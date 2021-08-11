export const sortJsdocMembers = data => data.sort((m, p) => {
  if (m.kind === 'constructor' || m.kind === 'class') return -1;

  if (p.kind === 'constructor' || p.kind === 'class') return 1;

  return m.name.localeCompare(p.name);
});
