import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@stream-io/node-sdk",
    "jsonwebtoken",
    "resend",
    "officeparser",
  ],
};

export default nextConfig;
