import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@stream-io/node-sdk",
    "jsonwebtoken",
    "resend",
    "officeparser",
    "postgres",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      const postgresExternal = { postgres: "commonjs postgres" };
      if (Array.isArray(config.externals)) {
        config.externals.push(postgresExternal);
      } else if (config.externals) {
        config.externals = [config.externals, postgresExternal];
      } else {
        config.externals = [postgresExternal];
      }
    }
    return config;
  },
};

export default nextConfig;
