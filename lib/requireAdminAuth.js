/**
 * Basic Auth helper for API route handlers (Node.js runtime).
 * Middleware only protects page routes (/admin, /owner) — API routes
 * that return sensitive data need their own auth check.
 */

export function isAdminAuthed(request) {
  return checkBasicAuth(request, process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD);
}

export function isOwnerAuthed(request) {
  return checkBasicAuth(request, process.env.OWNER_USERNAME, process.env.OWNER_PASSWORD);
}

function checkBasicAuth(request, username, password) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !username || !password) return false;

  const [scheme, encoded] = authHeader.split(" ");
  if (scheme !== "Basic" || !encoded) return false;

  let decoded;
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return false;
  }

  const colonIndex = decoded.indexOf(":");
  const user       = decoded.substring(0, colonIndex);
  const pass       = decoded.substring(colonIndex + 1);

  return user === username && pass === password;
}

export function unauthorizedJson() {
  return Response.json({ error: "Unauthorized." }, {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Hairom Admin", charset="UTF-8"' },
  });
}
