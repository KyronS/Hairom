import "swiper/css";
import "../public/assets/css/styles.css";
import "jarallax/dist/jarallax.min.css";
import "swiper/css/effect-fade";
import "react-modal-video/css/modal-video.css";
import "photoswipe/dist/photoswipe.css";
import "tippy.js/dist/tippy.css";
import ClientEffects from "@/components/common/ClientEffects";
import { BUSINESS_NAME, BUSINESS_TITLE } from "@/lib/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://hairom.vercel.app";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: BUSINESS_TITLE,
    template: `%s | ${BUSINESS_NAME}`,
  },
  description:
    "Professional barbershop and loctician salon in San Fernando, Trinidad. Book appointments for haircuts, loc retwists, loc styles, natural styling, and more.",
  keywords: ["barbershop", "loctician", "haircuts", "loc retwist", "natural hair", "San Fernando", "Trinidad"],
  openGraph: {
    title: BUSINESS_TITLE,
    description:
      "Professional barbershop and loctician salon in San Fernando, Trinidad. Book online today.",
    url: SITE_URL,
    siteName: BUSINESS_NAME,
    images: [
      {
        url: "/assets/images/about-image.jpg",
        width: 1200,
        height: 630,
        alt: BUSINESS_NAME,
      },
    ],
    locale: "en_TT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: BUSINESS_TITLE,
    description:
      "Professional barbershop and loctician salon in San Fernando, Trinidad.",
    images: ["/assets/images/about-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="no-mobile no-touch">
      <head>
        {/* Consolidated Google Fonts — single request instead of six */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Epilogue:wght@400;500&family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Poppins&family=Roboto:ital,wght@0,400;0,500;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="appear-animate body">
        <ClientEffects />
        {children}
      </body>
    </html>
  );
}
