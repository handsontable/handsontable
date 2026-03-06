export const getFrameworkFromCookie = (cookieValue: string) => {
  if (cookieValue === 'react') {
    return 'react-data-grid';
  }
  if (cookieValue === 'angular') {
    return 'angular-data-grid';
  }

  return 'javascript-data-grid';
};
