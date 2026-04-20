const DEFAULT_RETURN_PATH = "/chronicles";
const LOCALHOST_SITE_URL = "http://localhost:3000";

function normalizeSiteUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol =
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
      ? trimmed
      : trimmed.startsWith("localhost") || trimmed.startsWith("127.0.0.1")
        ? `http://${trimmed}`
        : `https://${trimmed}`;

  return withProtocol.endsWith("/") ? withProtocol : `${withProtocol}/`;
}

export function normalizeReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_RETURN_PATH;
  }

  return value;
}

export function resolveSiteUrl() {
  return (
    normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeSiteUrl(process.env.NEXT_PUBLIC_VERCEL_URL) ??
    `${LOCALHOST_SITE_URL}/`
  );
}
