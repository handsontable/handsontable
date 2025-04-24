export const getFrameworkFromCookie = (cookie_value: string) => {
  if (cookie_value == "react") {
    return "react-data-grid";
  }
  if (cookie_value == "angular") {
    return "angular-data-grid";
  }
  return "javascript-data-grid";
};
