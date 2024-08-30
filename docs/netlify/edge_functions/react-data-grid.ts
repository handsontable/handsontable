import type { Config, Context } from "https://edge.netlify.com";


export default async (req: Request, context: Context) => {
    Response.redirect('/docs/next/react-data-grid');
  };

export const config: Config = {
  path: "/docs/react-data-grid",
};
