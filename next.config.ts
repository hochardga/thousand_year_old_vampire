import type { NextConfig } from "next";

const isE2EMockMode = process.env.TYOV_E2E_MOCKS === "1";

const nextConfig: NextConfig = {
  devIndicators: isE2EMockMode ? false : undefined,
};

export default nextConfig;
