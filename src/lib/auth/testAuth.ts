const TEST_AUTH_DISABLED_MESSAGE = "Testing-only sign-in is unavailable here.";

function isFlagEnabled() {
  return process.env.ENABLE_TEST_AUTH === "1";
}

function isVercelProduction() {
  return process.env.VERCEL_ENV === "production";
}

function isVercelPreviewLike() {
  return (
    process.env.VERCEL_ENV === "preview" ||
    process.env.VERCEL_ENV === "development"
  );
}

function isLocalDevelopment() {
  return !process.env.VERCEL_ENV && process.env.NODE_ENV !== "production";
}

export function isTestAuthEnabled() {
  if (!isFlagEnabled()) {
    return false;
  }

  if (isVercelProduction()) {
    return false;
  }

  return isVercelPreviewLike() || isLocalDevelopment();
}

export function assertTestAuthEnabled() {
  if (!isTestAuthEnabled()) {
    throw new Error(TEST_AUTH_DISABLED_MESSAGE);
  }
}

export { TEST_AUTH_DISABLED_MESSAGE };
