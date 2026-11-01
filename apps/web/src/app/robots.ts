import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/conta", "/admin", "/api/", "/assinar", "/entrar", "/recuperar-senha", "/redefinir-senha"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
