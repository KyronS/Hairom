import Footer5 from "@/components/footers/Footer5";
import Header5 from "@/components/headers/Header5";
import { elegantOnepage } from "@/data/menu";
import Link from "next/link";

export const metadata = {
  title: "Page Not Found | Hairom Barbershop",
};

export default function NotFound() {
  return (
    <div className="theme-elegant">
      <div className="page" id="top">
        <nav className="main-nav dark transparent stick-fixed wow-menubar">
          <Header5 links={elegantOnepage} />
        </nav>
        <main id="main">
          <section
            className="home-section bg-dark-1 bg-dark-alpha-60 light-content"
            style={{
              backgroundImage:
                "url(/assets/images/demo-elegant/section-bg-1.jpg)",
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div className="container">
              <div className="row">
                <div className="col-sm-10 offset-sm-1 col-md-8 offset-md-2 col-lg-6 offset-lg-3 text-center">
                  <h1
                    style={{
                      fontSize: "8rem",
                      fontWeight: 300,
                      color: "#fff",
                      letterSpacing: "0.1em",
                      marginBottom: "1rem",
                    }}
                  >
                    404
                  </h1>
                  <p
                    style={{
                      fontSize: "1.25rem",
                      color: "rgba(255,255,255,0.6)",
                      marginBottom: "2.5rem",
                    }}
                  >
                    This page got a bad cut. Let&apos;s get you back on track.
                  </p>
                  <Link
                    href="/"
                    className="btn btn-mod btn-w btn-round btn-medium btn-hover-anim"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
        <footer className="bg-dark-1 light-content footer z-index-1 position-relative">
          <Footer5 />
        </footer>
      </div>
    </div>
  );
}
