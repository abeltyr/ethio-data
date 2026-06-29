import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native Node addon — keep it out of the bundle so the server loads the
  // real binary at runtime when reading the warehouse databases.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
