const DEFAULT_RETURN_PATH = "/chronicles";

export function normalizeReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_RETURN_PATH;
  }

  return value;
}
