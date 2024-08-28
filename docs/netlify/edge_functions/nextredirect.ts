import type { Config, Context } from "https://edge.netlify.com";

export default async (req: Request, context: Context) => {
    return Response.redirect("/docs/javascript-data-grid/");
  };

  export const config: Config = {
    path: "/docs/next/javascript-data-grid",
  };
