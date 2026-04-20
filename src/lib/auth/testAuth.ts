const TEST_AUTH_DISABLED_MESSAGE = "Testing-only sign-in is unavailable here.";
const PREVIEW_TEST_AUTH_EMAIL = "e2e@example.com";
const PREVIEW_TEST_AUTH_PASSWORD = "nightfall";

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

export function usesPreviewTestAuthCredentials({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  return (
    email.trim().toLowerCase() === PREVIEW_TEST_AUTH_EMAIL &&
    password === PREVIEW_TEST_AUTH_PASSWORD
  );
}

export {
  PREVIEW_TEST_AUTH_EMAIL,
  PREVIEW_TEST_AUTH_PASSWORD,
  TEST_AUTH_DISABLED_MESSAGE,
};
