import type { MetadataRoute } from "next";

/**
 * Floor is the live production list (commit c61212d). /start stays allowed:
 * it is the CTA in every post and outreach email, and a blocked CTA cannot
 * accrue link equity. It is kept out of the sitemap; that is enough.
 *
 * No blanket AI-crawler block. Being readable by the assistants pastors
 * actually ask is worth more than the content is worth withholding.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Superset of the live list. Do not remove entries without a reason.
        disallow: [
          "/api/",
          "/auth/",
          "/dashboard",
          "/login",
          "/signup",
          "/reset-password",
          "/update-password",
          "/invite/",
          "/mentor/",
          "/unsubscribe",
          "/blog/_template.html",
        ],
      },
    ],
    sitemap: "https://sermoncoach.com/sitemap.xml",
    host: "https://sermoncoach.com",
  };
}
