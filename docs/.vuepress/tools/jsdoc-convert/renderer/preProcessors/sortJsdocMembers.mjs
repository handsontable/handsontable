export const sortJsdocMembers = data => data.sort((m, p) => {
  // NOTE: even if, we keep one class per file I keep full sorting logic for classes - to prevent further mind meddling
  // first classes
  if (m.kind === 'class') {
    if (p.kind === 'class') {
      return m.name.localeCompare(p.name); // if both are classes, compare
    }

    return -1; // if only first is a class
  }
  if (p.kind === 'class') {
    return 1; // if only second is a class
  }

  // then constructors
  if (m.kind === 'constructor') {
    if (p.kind === 'constructor') {
      return m.name.localeCompare(p.name); // if both are constructors, compare
    }

    return -1; // if only first is a constructor
  }
  if (p.kind === 'constructor') {
    return 1; // if only second is a constructor
  }

  // then members
  return m.name.localeCompare(p.name); // compare members by name (ignore their types)
});
