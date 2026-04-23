import type { NextConfig } from "next";

const isE2EMockMode = process.env.TYOV_E2E_MOCKS === "1";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  devIndicators: isE2EMockMode ? false : undefined,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
