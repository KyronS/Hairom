import { NextResponse } from "next/server";

/**
 * HTTP Basic Auth middleware protecting /admin and /owner routes.
 * Uses atob() for base64 decoding — Edge Runtime compatible (no Buffer).
 */
function checkBasicAuth(request, username, password) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  const [scheme, encoded] = authHeader.split(" ");
  if (scheme !== "Basic" || !encoded) return false;

  const decoded    = atob(encoded);
  const colonIndex = decoded.indexOf(":");
  const user       = decoded.substring(0, colonIndex);
  const pass       = decoded.substring(colonIndex + 1);

  return user === username && pass === password;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (checkBasicAuth(request, process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD)) {
      return NextResponse.next();
    }
    return new NextResponse("Authentication required.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Hairom Admin", charset="UTF-8"' },
    });
  }

  if (pathname.startsWith("/owner")) {
    if (checkBasicAuth(request, process.env.OWNER_USERNAME, process.env.OWNER_PASSWORD)) {
      return NextResponse.next();
    }
    return new NextResponse("Authentication required.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Hairom Owner", charset="UTF-8"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/owner", "/owner/:path*"],
};
