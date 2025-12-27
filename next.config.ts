import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pino', 'thread-stream', '@stacks/connect', 'pino-pretty'],
  turbopack: {},
};

export default nextConfig;
