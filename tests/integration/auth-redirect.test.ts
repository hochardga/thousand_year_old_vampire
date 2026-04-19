import {
  buildSignInRedirectUrl,
  isProtectedAppPath,
} from "@/lib/supabase/middleware";

describe("supabase auth middleware helpers", () => {
  it("preserves the destination when redirecting protected routes", () => {
    const url = new URL("https://example.com/chronicles?view=active");

    expect(buildSignInRedirectUrl(url).toString()).toBe(
      "https://example.com/sign-in?next=%2Fchronicles%3Fview%3Dactive",
    );
  });

  it("treats chronicle routes as protected app paths", () => {
    expect(isProtectedAppPath("/chronicles")).toBe(true);
    expect(isProtectedAppPath("/chronicles/123")).toBe(true);
    expect(isProtectedAppPath("/sign-in")).toBe(false);
  });
});
