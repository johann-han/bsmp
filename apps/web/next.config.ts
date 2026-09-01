import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: [
        "@repo/ui",
        "@bsmp/shared",
        "@bsmp/bible",
        "@bsmp/inductive",
        "@bsmp/study",
    ],
};

export default nextConfig;
