export default async (req, { cookies, geo }) => {
  if (
    geo.city === "Paris" &&
    cookies.get("promo-code") === "baguette"
  ) {
    return new URL("/docs/next/javascript-data-grid/", request.url);
  }
};

export const config = {
  path: "/"
};
