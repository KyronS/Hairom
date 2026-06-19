export default function robots() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://hairom.vercel.app";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/owner"] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
